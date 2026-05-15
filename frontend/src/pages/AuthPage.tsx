import React, { useState } from 'react';
import { login, verifyOtp } from '../api';
import { useAuthStore } from '../store';
import toast from 'react-hot-toast';

export const AuthPage: React.FC = () => {
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuthStore();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    try {
      await login(email.trim());
      toast.success('OTP sent to your email!');
      setStep('otp');
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp.trim()) return;
    setLoading(true);
    try {
      const res = await verifyOtp(email, otp.trim());
      const { userinfo, token } = res.data;
      const user = {
        _id: userinfo.id,
        id: userinfo.id,
        name: userinfo.name,
        email: userinfo.email,
      };
      setAuth(user, token);
      toast.success('Welcome back!');
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.logo}>
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
            <circle cx="24" cy="24" r="24" fill="var(--accent)" opacity="0.15"/>
            <path d="M24 8C15.16 8 8 15.16 8 24c0 2.84.74 5.5 2.04 7.82L8 40l8.42-2.01A15.92 15.92 0 0024 40c8.84 0 16-7.16 16-16S32.84 8 24 8z" fill="var(--accent)"/>
            <path d="M32 28.5c-.3-.15-1.77-.87-2.04-.97-.28-.1-.48-.15-.68.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.27-.47-2.42-1.49-.9-.8-1.5-1.78-1.67-2.08-.18-.3 0-.46.13-.6.12-.13.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.38-.02-.52-.07-.15-.68-1.63-.93-2.23-.24-.59-.49-.5-.68-.51l-.58-.01c-.2 0-.52.07-.79.38-.27.3-1.03 1-1.03 2.45s1.06 2.84 1.2 3.04c.15.2 2.08 3.17 5.04 4.45.7.3 1.25.48 1.68.62.7.22 1.34.19 1.85.12.56-.09 1.77-.72 2.02-1.42.25-.7.25-1.3.17-1.42-.07-.12-.27-.19-.57-.34z" fill="white"/>
          </svg>
        </div>

        <h1 style={styles.title}>ChatApp</h1>
        <p style={styles.subtitle}>
          {step === 'email' ? 'Enter your email to get started' : `Enter the OTP sent to ${email}`}
        </p>

        {step === 'email' ? (
          <form onSubmit={handleLogin} style={styles.form}>
            <div style={styles.inputWrapper}>
              <input
                style={styles.input}
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoFocus
              />
            </div>
            <button style={{ ...styles.btn, opacity: loading ? 0.7 : 1 }} type="submit" disabled={loading}>
              {loading ? 'Sending...' : 'Get OTP'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerify} style={styles.form}>
            <div style={styles.inputWrapper}>
              <input
                style={styles.input}
                type="text"
                placeholder="6-digit OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                maxLength={6}
                autoFocus
              />
            </div>
            <button style={{ ...styles.btn, opacity: loading ? 0.7 : 1 }} type="submit" disabled={loading}>
              {loading ? 'Verifying...' : 'Verify OTP'}
            </button>
            <button
              type="button"
              style={styles.backBtn}
              onClick={() => { setStep('email'); setOtp(''); }}
            >
              ← Back
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    height: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--bg-primary)',
    padding: '20px',
  },
  card: {
    background: 'var(--bg-panel)',
    borderRadius: '16px',
    padding: '48px 40px',
    width: '100%',
    maxWidth: '400px',
    boxShadow: '0 8px 40px rgba(0,0,0,0.5)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
    animation: 'fadeIn 0.3s ease',
  },
  logo: { marginBottom: '8px' },
  title: {
    fontSize: '26px',
    fontWeight: '700',
    color: 'var(--text-primary)',
    letterSpacing: '-0.5px',
  },
  subtitle: {
    fontSize: '13px',
    color: 'var(--text-secondary)',
    textAlign: 'center',
    marginBottom: '16px',
  },
  form: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  inputWrapper: { width: '100%' },
  input: {
    width: '100%',
    padding: '13px 16px',
    background: 'var(--bg-input)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    color: 'var(--text-primary)',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  btn: {
    width: '100%',
    padding: '13px',
    background: 'var(--accent)',
    color: 'white',
    borderRadius: 'var(--radius)',
    fontSize: '14px',
    fontWeight: '600',
    transition: 'background 0.2s',
    cursor: 'pointer',
  },
  backBtn: {
    background: 'none',
    color: 'var(--text-secondary)',
    fontSize: '13px',
    cursor: 'pointer',
    textAlign: 'center' as const,
  },
};
