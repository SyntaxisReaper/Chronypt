import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { apiFetch } from '../utils/api';
import { usePageMeta } from '../utils/seo';

/**
 * OAuth callback handler — receives tokens from URL params after OAuth redirect
 * and stores them in localStorage, then routes appropriately.
 */
export default function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  usePageMeta({
    title: 'Authenticating',
    description: 'Completing sign-in with your selected provider.',
    path: '/auth/callback',
  });

  useEffect(() => {
    const hasSuccessFlag = searchParams.get('status') === 'success';

    if (!hasSuccessFlag) {
      navigate('/login?error=oauth_failed');
      return;
    }

    apiFetch('/api/auth/me')
      .then(async (res) => {
        if (!res.ok) {
          throw new Error('OAuth session invalid');
        }
        const data = await res.json();
        if (data.onboarded) {
          navigate('/dashboard');
        } else {
          navigate('/onboarding');
        }
      })
      .catch(() => {
        navigate('/login?error=oauth_failed');
      });
  }, [navigate, searchParams]);

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh', background: '#000', color: '#fff', fontSize: '1.1rem',
    }}>
      Authenticating...
    </div>
  );
}
