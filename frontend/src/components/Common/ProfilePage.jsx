import React, { useState, useEffect } from 'react'
import { useAuthStore }    from '../../store/authStore.js'
import { userAPI }         from '../../services/api/userService.js'
import { getKeyFingerprint } from '../../services/encryption/encryption.js'
import { User, KeyRound, Mail, Edit2, Check, X, ShieldCheck, Copy, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ProfilePage() {
  const { user, publicKey, setAuth } = useAuthStore()
  const [editing,     setEditing]     = useState(false)
  const [name,        setName]        = useState(user?.name || '')
  const [saving,      setSaving]      = useState(false)
  const [fingerprint, setFingerprint] = useState('')

  useEffect(() => {
    if (publicKey) {
      getKeyFingerprint(publicKey).then(setFingerprint).catch(() => {})
    }
  }, [publicKey])

  async function saveName() {
    if (!name.trim()) return
    setSaving(true)
    try {
      const { data } = await userAPI.updateName(name)
      setAuth(data.user_info, data.token)
      toast.success('Name updated')
      setEditing(false)
    } catch {
      toast.error('Failed to update name')
    }
    setSaving(false)
  }

  function copyFingerprint() {
    navigator.clipboard.writeText(fingerprint).then(() => toast.success('Fingerprint copied'))
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 max-w-lg mx-auto w-full">
      <h2 className="text-lg font-semibold text-white mb-6">Profile</h2>

      {/* Avatar */}
      <div className="flex flex-col items-center mb-8">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-accent/40 to-accent/10 border-2 border-accent/30 flex items-center justify-center text-3xl font-bold text-accent uppercase mb-3">
          {user?.name?.[0] || '?'}
        </div>
        <span className="lock-badge">🔒 E2E Encrypted Account</span>
      </div>

      {/* Name */}
      <div className="glass rounded-2xl p-5 mb-4">
        <div className="flex items-center gap-2 mb-1">
          <User className="w-4 h-4 text-accent" />
          <span className="text-xs font-medium text-surface-200/60 uppercase tracking-wider">Display Name</span>
        </div>
        {editing ? (
          <div className="flex gap-2 mt-2">
            <input value={name} onChange={e => setName(e.target.value)}
              className="input-field flex-1 py-2 text-sm" />
            <button onClick={saveName} disabled={saving}
              className="w-8 h-8 flex items-center justify-center bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-white rounded-lg transition-all">
              <Check className="w-4 h-4" />
            </button>
            <button onClick={() => { setEditing(false); setName(user?.name || '') }}
              className="w-8 h-8 flex items-center justify-center bg-surface-800 text-surface-200/40 hover:text-white rounded-lg transition-all">
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between mt-2">
            <span className="text-white font-medium">{user?.name}</span>
            <button onClick={() => setEditing(true)}
              className="text-surface-200/40 hover:text-accent transition-colors">
              <Edit2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Email */}
      <div className="glass rounded-2xl p-5 mb-4">
        <div className="flex items-center gap-2 mb-2">
          <Mail className="w-4 h-4 text-accent" />
          <span className="text-xs font-medium text-surface-200/60 uppercase tracking-wider">Email</span>
        </div>
        <span className="text-white">{user?.email}</span>
      </div>

      {/* Key info */}
      <div className="glass rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <KeyRound className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-medium text-surface-200/60 uppercase tracking-wider">Encryption Keys</span>
          <span className="ml-auto lock-badge">X25519</span>
        </div>

        <div className="space-y-3">
          <div>
            <p className="text-xs text-surface-200/40 mb-1">Public Key Fingerprint</p>
            <div className="flex items-start gap-2">
              <code className="text-[11px] font-mono text-emerald-400/80 leading-relaxed break-all flex-1">
                {fingerprint || 'Generating…'}
              </code>
              {fingerprint && (
                <button onClick={copyFingerprint} className="flex-shrink-0 text-surface-200/30 hover:text-accent transition-colors">
                  <Copy className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-xl">
            <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <p className="text-xs text-emerald-400/80">
              Your private key is encrypted and stored only on this device. It is never sent to any server.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
