import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogOut } from 'lucide-react';
import Scene from '../components/Scene';
import { apiFetch } from '../utils/api';
import { usePageMeta } from '../utils/seo';

interface DashboardUser {
  username: string;
  onboarded: boolean;
  profile?: {
    displayName?: string;
  };
  onboarding?: {
    operationalRole: string;
    primaryObjective: string;
    infrastructureState: string;
    deploymentTimeline: string;
  };
}

const pageVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.5 } },
  exit: { opacity: 0, transition: { duration: 0.3 } },
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<DashboardUser | null>(null);

  usePageMeta({
    title: 'Dashboard',
    description: 'View your Chronypt workspace summary and onboarding setup.',
    path: '/dashboard',
  });

  useEffect(() => {
    apiFetch('/api/auth/me')
      .then((res) => {
        if (!res.ok) throw new Error('Unauthorized');
        return res.json();
      })
      .then((data) => {
        if (!data.onboarded) {
          navigate('/onboarding');
        } else {
          setUser(data);
        }
      })
      .catch(() => {
        navigate('/login');
      });
  }, [navigate]);

  function handleLogout() {
    apiFetch('/api/auth/logout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    }).finally(() => {
      navigate('/login');
    });
  }

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      style={{
        position: 'relative',
        minHeight: '100vh',
        width: '100%',
        overflow: 'hidden',
      }}
    >
      {/* 3D Background */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0 }}>
        <Scene page="home" />
      </div>

      {/* Dark overlay */}
      <div style={{
        position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
        background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.92) 100%)',
        zIndex: 1, pointerEvents: 'none',
      }} />

      {/* Content */}
      <div style={{
        position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '2rem',
      }}>
        <div className="glass" style={{
          padding: '3rem', borderRadius: '28px', textAlign: 'center', maxWidth: '550px', width: '100%',
        }}>
          <h1 style={{
            fontSize: '2rem', fontWeight: 700, marginBottom: '1rem',
            background: 'linear-gradient(135deg, #932DC2, #3bb4d2)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            Welcome{user ? `, ${user.profile?.displayName || user.username}` : ''}
          </h1>

          <p style={{ color: '#b0a8be', marginBottom: '2rem', fontSize: '0.95rem', lineHeight: 1.6 }}>
            Your workspace is ready. This dashboard will evolve as you build your projects with Chronypt.
          </p>

          {user?.onboarding && (
            <div style={{
              background: 'rgba(255,255,255,0.03)', borderRadius: '14px', padding: '1.2rem',
              marginBottom: '2rem', border: '1px solid rgba(255,255,255,0.06)', textAlign: 'left',
            }}>
              <div style={{ fontSize: '0.8rem', color: '#888', marginBottom: '0.5rem', letterSpacing: '0.1em' }}>YOUR SETUP</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem', fontSize: '0.85rem', color: '#ccc' }}>
                <div><strong style={{ color: '#932DC2' }}>Role:</strong> {user.onboarding.operationalRole.replace('_', ' ')}</div>
                <div><strong style={{ color: '#932DC2' }}>Objective:</strong> {user.onboarding.primaryObjective.replace('_', ' ')}</div>
                <div><strong style={{ color: '#932DC2' }}>State:</strong> {user.onboarding.infrastructureState.replace('_', ' ')}</div>
                <div><strong style={{ color: '#932DC2' }}>Timeline:</strong> {user.onboarding.deploymentTimeline.replace('_', ' ')}</div>
              </div>
            </div>
          )}

          <button onClick={handleLogout} className="btn-outline" style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
          }}>
            <LogOut size={16} /> Logout
          </button>
        </div>
      </div>
    </motion.div>
  );
}
