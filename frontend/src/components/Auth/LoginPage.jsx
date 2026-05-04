import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mail, ShieldCheck, KeyRound, ArrowRight, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { userAPI } from '../../services/api/userService.js'
import { useAuthStore } from '../../store/authStore.js'
import {
  generateKeyPair,
  encryptPrivateKeyWithPassword,
  storePrivateKey,
} from '../../services/encryption/encryption.js'
import { encodeBase64 } from 'tweetnacl-util'

const STEPS = { EMAIL: 0, OTP: 1, KEYGEN: 2 }

export default function LoginPage() {
  const navigate   = useNavigate()
  const { setAuth, setKeys } = useAuthStore()

  const [step,    setStep]    = useState(STEPS.EMAIL)
  const [email,   setEmail]   = useState('')
  const [otp,     setOtp]     = useState('')
  const [loading, setLoading] = useState(false)
  const [genMsg,  setGenMsg]  = useState('')

  // Step 1 — send OTP
  async function handleSendOTP(e) {
    e.preventDefault()
    if (!email) return
    setLoading(true)
    try {
      await userAPI.sendOTP(email)
      toast.success('OTP sent to your inbox!')
      setStep(STEPS.OTP)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to send OTP')
    } finally {
      setLoading(false)
    }
  }

  // Step 2 — verify OTP → get JWT
  async function handleVerifyOTP(e) {
    e.preventDefault()
    if (!otp) return
    setLoading(true)
    try {
      const { data } = await userAPI.verifyOTP(email, otp)
      const { userinfo, token } = data

      setAuth(userinfo, token)
      setStep(STEPS.KEYGEN)
      await generateKeys(userinfo)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Invalid OTP')
    } finally {
      setLoading(false)
    }
  }

  // Step 3 — generate E2E keys
  async function generateKeys(userinfo) {
    setGenMsg('Generating X25519 key pair…')

    // Generate key pair
    const kp = generateKeyPair()
    const privB64 = encodeBase64(kp.secretKey)
    const pubB64  = encodeBase64(kp.publicKey)

    setGenMsg('Encrypting private key for local storage…')

    // Encrypt private key with user ID as password (deterministic for recovery)
    const enc = await encryptPrivateKeyWithPassword(kp.secretKey, userinfo.id)
    await storePrivateKey(userinfo.id, enc)

    setGenMsg('Uploading public key to server…')
    try {
      await userAPI.uploadPublicKey(pubB64)
    } catch {
      // Non-fatal if endpoint not yet live
    }

    setKeys(kp.secretKey, pubB64)
    setGenMsg('Keys ready!')
    setTimeout(() => navigate('/'), 600)
  }

  return (
    <div className="min-h-screen bg-surface-950 flex items-center justify-center px-4">
      {/* Background mesh */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-accent/8 rounded-full blur-2xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3">
            <div className="w-10 h-10 rounded-xl bg-accent/20 border border-accent/30 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-accent" />
            </div>
            <span className="text-2xl font-bold text-white tracking-tight">CipherChat</span>
          </div>
          <p className="text-surface-200/60 text-sm">End-to-end encrypted messaging</p>
        </div>

        <div className="glass rounded-2xl p-8">
          {/* Step indicators */}
          <div className="flex items-center gap-2 mb-8">
            {[STEPS.EMAIL, STEPS.OTP, STEPS.KEYGEN].map(s => (
              <React.Fragment key={s}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all
                  ${step === s ? 'bg-accent text-white' : step > s ? 'bg-emerald-500 text-white' : 'bg-surface-800 text-surface-200/40'}`}>
                  {step > s ? '✓' : s + 1}
                </div>
                {s < 2 && <div className={`flex-1 h-px ${step > s ? 'bg-emerald-500' : 'bg-surface-800'}`} />}
              </React.Fragment>
            ))}
          </div>

          {/* STEP 0 — Email */}
          {step === STEPS.EMAIL && (
            <form onSubmit={handleSendOTP} className="animate-fade-in">
              <h2 className="text-xl font-semibold text-white mb-1">Sign in</h2>
              <p className="text-surface-200/50 text-sm mb-6">We'll send a one-time code to your email</p>

              <label className="block text-xs font-medium text-surface-200/60 mb-2 uppercase tracking-wider">Email Address</label>
              <div className="relative mb-6">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-200/30" />
                <input
                  type="email" required
                  value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="input-field pl-11"
                />
              </div>

              <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Send OTP <ArrowRight className="w-4 h-4" /></>}
              </button>
            </form>
          )}

          {/* STEP 1 — OTP */}
          {step === STEPS.OTP && (
            <form onSubmit={handleVerifyOTP} className="animate-fade-in">
              <h2 className="text-xl font-semibold text-white mb-1">Enter code</h2>
              <p className="text-surface-200/50 text-sm mb-6">6-digit code sent to <span className="text-accent">{email}</span></p>

              <label className="block text-xs font-medium text-surface-200/60 mb-2 uppercase tracking-wider">OTP Code</label>
              <input
                type="text" required maxLength={6}
                value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g,''))}
                placeholder="000000"
                className="input-field mb-6 text-center text-2xl font-mono tracking-[0.5em]"
              />

              <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Verify & Continue <ArrowRight className="w-4 h-4" /></>}
              </button>
              <button type="button" onClick={() => setStep(STEPS.EMAIL)} className="btn-ghost w-full mt-3 text-sm">
                ← Back
              </button>
            </form>
          )}

          {/* STEP 2 — Key Generation */}
          {step === STEPS.KEYGEN && (
            <div className="animate-fade-in text-center">
              <div className="w-16 h-16 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center mx-auto mb-4">
                <KeyRound className="w-8 h-8 text-accent animate-pulse" />
              </div>
              <h2 className="text-xl font-semibold text-white mb-2">Securing your account</h2>
              <p className="text-surface-200/50 text-sm mb-6">Generating cryptographic keys on your device</p>
              <div className="glass-light rounded-xl p-4 text-left">
                <p className="text-sm font-mono text-accent">{genMsg || 'Initializing…'}</p>
              </div>
              <p className="text-xs text-surface-200/30 mt-4">Your private key never leaves this device</p>
            </div>
          )}
        </div>

        {/* E2EE badge */}
        <div className="text-center mt-6">
          <span className="lock-badge">🔒 End-to-end encrypted</span>
        </div>
      </div>
    </div>
  )
}
