import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

/**
 * OAuth callback handler — receives tokens from URL params after OAuth redirect
 * and stores them in localStorage, then routes appropriately.
 */
export default function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const accessToken = searchParams.get('accessToken');
    const refreshToken = searchParams.get('refreshToken');
    const onboarded = searchParams.get('onboarded');

    if (accessToken && refreshToken) {
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);

      if (onboarded === 'true') {
        navigate('/dashboard');
      } else {
        navigate('/onboarding');
      }
    } else {
      navigate('/login?error=oauth_failed');
    }
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
