import { useRef, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Lock, Mail, UserPlus } from 'lucide-react';
import anime from 'animejs';
import Scene from '../components/Scene';
import { apiFetch } from '../utils/api';
import { usePageMeta } from '../utils/seo';

const pageVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.5 } },
  exit: { opacity: 0, transition: { duration: 0.3 } },
};

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isSignUp, setIsSignUp] = useState(searchParams.get('mode') === 'signup');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const cardRef = useRef<HTMLDivElement>(null);
  const fieldsRef = useRef<HTMLDivElement>(null);

  usePageMeta({
    title: isSignUp ? 'Create Account' : 'Login',
    description: 'Sign in to Chronypt or create your account to start building and deploying your digital infrastructure.',
    path: '/login',
  });

  useEffect(() => {
    if (cardRef.current) {
      anime({
        targets: cardRef.current,
        translateY: [60, 0],
        scale: [0.92, 1],
        opacity: [0, 1],
        duration: 800,
        easing: 'easeOutExpo',
        delay: 200,
      });
    }
    animateFields();
  }, []);

  function animateFields() {
    if (fieldsRef.current) {
      const children = fieldsRef.current.querySelectorAll('.form-field');
      anime({
        targets: children,
        translateY: [25, 0],
        opacity: [0, 1],
        duration: 500,
        delay: anime.stagger(80, { start: 300 }),
        easing: 'easeOutQuart',
      });
    }
  }

  function handleToggle() {
    setIsSignUp(!isSignUp);
    setError('');
    // Animate the mode switch
    if (cardRef.current) {
      anime({
        targets: cardRef.current,
        scale: [0.97, 1],
        duration: 400,
        easing: 'easeOutExpo',
      });
    }
    setTimeout(animateFields, 50);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (isSignUp && password !== confirmPassword) {
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }

    try {
      const endpoint = isSignUp ? '/api/auth/register' : '/api/auth/login';
      const body = isSignUp
        ? { fullName, email, username, password }
        : { username, password };

      const res = await apiFetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Something went wrong.');
        setLoading(false);
        return;
      }

      // Route based on onboarding status
      if (data.user.onboarded) {
        navigate('/dashboard');
      } else {
        navigate('/onboarding');
      }
    } catch {
      setError('Network error. Is the server running?');
    } finally {
      setLoading(false);
    }
  }

  function handleOAuth(provider: string) {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    window.location.href = `${apiUrl}/api/auth/${provider}`;
  }

  return (
    <motion.div
      className="login-shell"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      style={{
        position: 'relative',
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-start',
        overflow: 'hidden',
      }}
    >
      {/* 3D Background */}
      <div className="login-scene" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0 }}>
        <Scene page="login" />
      </div>

      {/* Gradient overlay */}
      <div className="login-overlay" style={{
        position: 'absolute', top: 0, left: 0, width: '60%', height: '100%',
        background: 'linear-gradient(to right, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.45) 70%, transparent 100%)',
        zIndex: 1, pointerEvents: 'none',
      }} />

      {/* Login / Sign Up Card */}
      <div
        ref={cardRef}
        className="glass login-card"
        style={{
          width: '480px', padding: '2.8rem 2.8rem', borderRadius: '28px',
          zIndex: 2, marginLeft: '12%', marginTop: '4rem', opacity: 0,
          maxHeight: '90vh', overflowY: 'auto',
        }}
      >
        <h2 style={{
          textAlign: 'center', fontSize: '1.5rem', fontWeight: 600,
          letterSpacing: '0.25em', marginBottom: '2rem', color: '#ffffff',
          textShadow: '0 1px 8px rgba(147,45,194,0.2)',
        }}>
          {isSignUp ? 'SIGN UP' : 'LOGIN'}
        </h2>

        {error && (
          <div style={{
            background: 'rgba(220, 50, 50, 0.15)', border: '1px solid rgba(220, 50, 50, 0.3)',
            borderRadius: '10px', padding: '10px 14px', marginBottom: '1.2rem',
            fontSize: '0.85rem', color: '#ff8888',
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div ref={fieldsRef}>
            {/* Sign Up: Full Name */}
            {isSignUp && (
              <div className="form-field" style={{ marginBottom: '1.2rem', opacity: 0 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.6rem', fontSize: '0.9rem', fontWeight: 500, color: '#e0e0e0' }}>
                  <UserPlus size={17} strokeWidth={2} /> Full Name
                </label>
                <input type="text" placeholder="Enter your full name" className="input-field" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
              </div>
            )}

            {/* Sign Up: Email */}
            {isSignUp && (
              <div className="form-field" style={{ marginBottom: '1.2rem', opacity: 0 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.6rem', fontSize: '0.9rem', fontWeight: 500, color: '#e0e0e0' }}>
                  <Mail size={17} strokeWidth={2} /> Email
                </label>
                <input type="email" placeholder="Enter your email" className="input-field" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
            )}

            {/* Login: Username (shared) */}
            {!isSignUp && (
              <div className="form-field" style={{ marginBottom: '1.4rem', opacity: 0 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.6rem', fontSize: '0.9rem', fontWeight: 500, color: '#e0e0e0' }}>
                  <User size={17} strokeWidth={2} /> Username
                </label>
                <input type="text" placeholder="Enter your username" className="input-field" value={username} onChange={(e) => setUsername(e.target.value)} required />
              </div>
            )}

            {/* Sign Up: Username */}
            {isSignUp && (
              <div className="form-field" style={{ marginBottom: '1.2rem', opacity: 0 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.6rem', fontSize: '0.9rem', fontWeight: 500, color: '#e0e0e0' }}>
                  <User size={17} strokeWidth={2} /> Username
                </label>
                <input type="text" placeholder="Choose a username" className="input-field" value={username} onChange={(e) => setUsername(e.target.value)} required />
              </div>
            )}

            {/* Password */}
            <div className="form-field" style={{ marginBottom: '1.2rem', opacity: 0 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.6rem', fontSize: '0.9rem', fontWeight: 500, color: '#e0e0e0' }}>
                <Lock size={17} strokeWidth={2} /> Password
              </label>
              <input type="password" placeholder="Enter your password" className="input-field" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>

            {/* Sign Up: Confirm Password */}
            {isSignUp && (
              <div className="form-field" style={{ marginBottom: '1.2rem', opacity: 0 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.6rem', fontSize: '0.9rem', fontWeight: 500, color: '#e0e0e0' }}>
                  <Lock size={17} strokeWidth={2} /> Confirm Password
                </label>
                <input type="password" placeholder="Confirm your password" className="input-field" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
              </div>
            )}

            {/* Remember / Forgot (Login only) */}
            {!isSignUp && (
              <div className="form-field" style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                marginBottom: '1.5rem', fontSize: '0.85rem', opacity: 0,
              }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: '#ccc' }}>
                  <input type="checkbox" style={{ accentColor: '#932DC2', width: '15px', height: '15px' }} />
                  Remember me
                </label>
                <span style={{ color: '#b468d9', cursor: 'pointer', transition: 'color 0.3s', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 500 }}
                  onMouseOver={(e) => (e.currentTarget.style.color = '#ffffff')}
                  onMouseOut={(e) => (e.currentTarget.style.color = '#b468d9')}>
                  Forgot Password?
                </span>
              </div>
            )}

            {/* Submit Button */}
            <div className="form-field" style={{ opacity: 0 }}>
              <button className="btn-login" type="submit" disabled={loading} style={{ marginBottom: '1.5rem', opacity: loading ? 0.7 : 1 }}>
                {loading ? 'Please wait...' : isSignUp ? 'Create Account' : 'Login'}
              </button>
            </div>

            {/* Divider */}
            <div className="form-field" style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', opacity: 0 }}>
              <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.12)' }} />
              <span style={{ fontSize: '0.75rem', letterSpacing: '0.12em', color: '#888', fontWeight: 500, whiteSpace: 'nowrap' }}>
                OR CONTINUE WITH
              </span>
              <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.12)' }} />
            </div>

            {/* Social OAuth Buttons */}
            <div className="form-field" style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginBottom: '1.5rem', opacity: 0 }}>
              <div className="social-icon" onClick={() => handleOAuth('google')}>
                <svg width="22" height="22" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.9 33.7 29.4 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 5.7 29.2 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.9z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 15.5 18.8 12 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 5.7 29.2 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5 0 9.7-1.6 13.2-4.4l-6.1-5.2c-2 1.5-4.5 2.4-7.1 2.4-5.3 0-9.8-3.6-11.4-8.5l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4 5.5l6.1 5.2c-.4.4 6.6-4.8 6.6-14.7 0-1.3-.1-2.7-.4-3.9z"/></svg>
              </div>
              <div className="social-icon" onClick={() => handleOAuth('microsoft')}>
                <svg width="22" height="22" viewBox="0 0 48 48"><rect x="6" y="6" width="16" height="16" fill="#F25022"/><rect x="26" y="6" width="16" height="16" fill="#7FBA00"/><rect x="6" y="26" width="16" height="16" fill="#00A4EF"/><rect x="26" y="26" width="16" height="16" fill="#FFB900"/></svg>
              </div>
              <div className="social-icon" onClick={() => handleOAuth('github')}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="#ffffff"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.43 9.8 8.21 11.39.6.11.79-.26.79-.58 0-.28-.01-1.04-.02-2.04-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.33-1.76-1.33-1.76-1.09-.74.08-.73.08-.73 1.2.08 1.84 1.24 1.84 1.24 1.07 1.83 2.81 1.3 3.5 1 .11-.78.42-1.3.76-1.6-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.12-.3-.54-1.52.12-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6.02 0c2.28-1.55 3.29-1.23 3.29-1.23.66 1.66.24 2.88.12 3.18.77.84 1.24 1.91 1.24 3.22 0 4.61-2.81 5.63-5.48 5.92.43.37.81 1.1.81 2.22 0 1.6-.01 2.89-.01 3.28 0 .32.18.7.8.58C20.57 21.8 24 17.31 24 12c0-6.63-5.37-12-12-12z"/></svg>
              </div>
            </div>

            {/* Toggle Login / Sign Up */}
            <div className="form-field" style={{ textAlign: 'center', fontSize: '0.85rem', color: '#999', opacity: 0 }}>
              {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
              <span
                onClick={handleToggle}
                style={{ color: '#b468d9', cursor: 'pointer', fontWeight: 600, transition: 'color 0.3s' }}
                onMouseOver={(e) => (e.currentTarget.style.color = '#ffffff')}
                onMouseOut={(e) => (e.currentTarget.style.color = '#b468d9')}
              >
                {isSignUp ? 'Login' : 'Sign Up'}
              </span>
            </div>
          </div>
        </form>
      </div>
    </motion.div>
  );
}
