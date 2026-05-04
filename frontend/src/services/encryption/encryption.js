// E2EE Service — X25519 key exchange + AES-256-GCM message encryption
// Private keys NEVER leave the device. All crypto is client-side only.

import nacl from 'tweetnacl'
import { encodeBase64, decodeBase64, encodeUTF8, decodeUTF8 } from 'tweetnacl-util'
import { openDB } from 'idb'

const DB_NAME  = 'cipherchat-keys'
const DB_VER   = 1
const KEY_STORE = 'keypairs'

// ─── IndexedDB helpers ───────────────────────────────────────────────────────

async function getDB() {
  return openDB(DB_NAME, DB_VER, {
    upgrade(db) { db.createObjectStore(KEY_STORE) }
  })
}

export async function storePrivateKey(userId, encryptedPrivateKey) {
  const db = await getDB()
  await db.put(KEY_STORE, encryptedPrivateKey, `pk:${userId}`)
}

export async function loadPrivateKey(userId) {
  const db = await getDB()
  return db.get(KEY_STORE, `pk:${userId}`)
}

export async function deletePrivateKey(userId) {
  const db = await getDB()
  await db.delete(KEY_STORE, `pk:${userId}`)
}

// ─── Key Generation ───────────────────────────────────────────────────────────

export function generateKeyPair() {
  // X25519 key pair via NaCl box
  return nacl.box.keyPair()
}

// Derive a key from password+salt using PBKDF2 (for encrypting private key at rest)
async function deriveKeyFromPassword(password, salt) {
  const enc     = new TextEncoder()
  const keyMat  = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveKey'])
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 200_000, hash: 'SHA-256' },
    keyMat,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
}

// Encrypt private key with password before storing in IndexedDB
export async function encryptPrivateKeyWithPassword(privateKeyBytes, password) {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const iv   = crypto.getRandomValues(new Uint8Array(12))
  const key  = await deriveKeyFromPassword(password, salt)
  const enc  = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, privateKeyBytes)
  return {
    encrypted: encodeBase64(new Uint8Array(enc)),
    salt:      encodeBase64(salt),
    iv:        encodeBase64(iv),
  }
}

// Decrypt private key with password
export async function decryptPrivateKeyWithPassword(encryptedData, password) {
  const { encrypted, salt, iv } = encryptedData
  const saltBytes = decodeBase64(salt)
  const ivBytes   = decodeBase64(iv)
  const encBytes  = decodeBase64(encrypted)
  const key       = await deriveKeyFromPassword(password, saltBytes)
  const dec       = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: ivBytes }, key, encBytes)
  return new Uint8Array(dec)
}

// ─── Message Encryption ───────────────────────────────────────────────────────

// Hybrid encryption: AES-256-GCM for message, X25519 ephemeral for AES key
export async function encryptMessage(plaintext, recipientPublicKeyBase64) {
  const recipientPub = decodeBase64(recipientPublicKeyBase64)

  // Generate ephemeral key pair
  const ephemeral = nacl.box.keyPair()

  // Generate shared secret with X25519
  const sharedSecret = nacl.box.before(recipientPub, ephemeral.secretKey)

  // Derive AES key from shared secret
  const aesKeyMat = await crypto.subtle.importKey('raw', sharedSecret, 'HKDF', false, ['deriveKey'])
  const aesKey    = await crypto.subtle.deriveKey(
    { name: 'HKDF', hash: 'SHA-256', salt: new Uint8Array(32), info: encodeUTF8('cipherchat-msg') },
    aesKeyMat,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt']
  )

  const iv        = crypto.getRandomValues(new Uint8Array(12))
  const msgBytes  = encodeUTF8(plaintext)
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, aesKey, msgBytes)

  return {
    ciphertext:       encodeBase64(new Uint8Array(encrypted)),
    iv:               encodeBase64(iv),
    ephemeralPubKey:  encodeBase64(ephemeral.publicKey),
    algorithm:        'X25519-AES-256-GCM',
  }
}

// Decrypt a message using own private key
export async function decryptMessage(encryptedPayload, myPrivateKeyBytes) {
  const { ciphertext, iv, ephemeralPubKey } = encryptedPayload
  const ephPub    = decodeBase64(ephemeralPubKey)
  const ivBytes   = decodeBase64(iv)
  const ctBytes   = decodeBase64(ciphertext)

  // Reconstruct shared secret
  const sharedSecret = nacl.box.before(ephPub, myPrivateKeyBytes)

  const aesKeyMat = await crypto.subtle.importKey('raw', sharedSecret, 'HKDF', false, ['deriveKey'])
  const aesKey    = await crypto.subtle.deriveKey(
    { name: 'HKDF', hash: 'SHA-256', salt: new Uint8Array(32), info: encodeUTF8('cipherchat-msg') },
    aesKeyMat,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt']
  )

  const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: ivBytes }, aesKey, ctBytes)
  return decodeUTF8(new Uint8Array(decrypted))
}

// ─── File Encryption ─────────────────────────────────────────────────────────

export async function encryptFile(fileBytes, recipientPublicKeyBase64) {
  const recipientPub = decodeBase64(recipientPublicKeyBase64)
  const ephemeral    = nacl.box.keyPair()
  const sharedSecret = nacl.box.before(recipientPub, ephemeral.secretKey)

  const aesKeyMat = await crypto.subtle.importKey('raw', sharedSecret, 'HKDF', false, ['deriveKey'])
  const aesKey    = await crypto.subtle.deriveKey(
    { name: 'HKDF', hash: 'SHA-256', salt: new Uint8Array(32), info: encodeUTF8('cipherchat-file') },
    aesKeyMat,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt']
  )

  const iv        = crypto.getRandomValues(new Uint8Array(12))
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, aesKey, fileBytes)

  return {
    encryptedData:   new Uint8Array(encrypted),
    iv:              encodeBase64(iv),
    ephemeralPubKey: encodeBase64(ephemeral.publicKey),
  }
}

export async function decryptFile(encryptedBytes, iv, ephemeralPubKey, myPrivateKeyBytes) {
  const ephPub       = decodeBase64(ephemeralPubKey)
  const ivBytes      = decodeBase64(iv)
  const sharedSecret = nacl.box.before(ephPub, myPrivateKeyBytes)

  const aesKeyMat = await crypto.subtle.importKey('raw', sharedSecret, 'HKDF', false, ['deriveKey'])
  const aesKey    = await crypto.subtle.deriveKey(
    { name: 'HKDF', hash: 'SHA-256', salt: new Uint8Array(32), info: encodeUTF8('cipherchat-file') },
    aesKeyMat,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt']
  )

  const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: ivBytes }, aesKey, encryptedBytes)
  return new Uint8Array(decrypted)
}

// ─── Key Fingerprint ─────────────────────────────────────────────────────────

export async function getKeyFingerprint(publicKeyBase64) {
  const bytes  = decodeBase64(publicKeyBase64)
  const hash   = await crypto.subtle.digest('SHA-256', bytes)
  const hex    = Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2,'0')).join('')
  // Format as groups of 4
  return hex.match(/.{1,4}/g).join(' ').toUpperCase()
}

// ─── Signaling Encryption (for WebRTC offer/answer/ICE) ──────────────────────

export function encryptSignal(signalData, sharedKeyBytes) {
  const nonce   = nacl.randomBytes(nacl.secretbox.nonceLength)
  const msg     = encodeUTF8(JSON.stringify(signalData))
  const box     = nacl.secretbox(msg, nonce, sharedKeyBytes)
  return {
    cipher: encodeBase64(box),
    nonce:  encodeBase64(nonce),
  }
}

export function decryptSignal(encryptedSignal, sharedKeyBytes) {
  const box   = decodeBase64(encryptedSignal.cipher)
  const nonce = decodeBase64(encryptedSignal.nonce)
  const msg   = nacl.secretbox.open(box, nonce, sharedKeyBytes)
  if (!msg) throw new Error('Signal decryption failed')
  return JSON.parse(decodeUTF8(msg))
}
