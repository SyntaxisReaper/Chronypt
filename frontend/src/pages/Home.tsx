import { useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import anime from 'animejs';
import Scene from '../components/Scene';

const pageVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0, transition: { duration: 0.3 } },
};

export default function Home() {
  const navigate = useNavigate();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const buttonsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Anime.js staggered text entrance
    if (headingRef.current) {
      anime({
        targets: headingRef.current,
        translateX: [-80, 0],
        opacity: [0, 1],
        duration: 1000,
        easing: 'easeOutExpo',
      });
    }
    if (subtitleRef.current) {
      anime({
        targets: subtitleRef.current,
        translateY: [30, 0],
        opacity: [0, 1],
        duration: 800,
        delay: 500,
        easing: 'easeOutExpo',
      });
    }
    if (buttonsRef.current) {
      anime({
        targets: buttonsRef.current.children,
        translateY: [40, 0],
        opacity: [0, 1],
        duration: 700,
        delay: anime.stagger(150, { start: 700 }),
        easing: 'easeOutExpo',
      });
    }
  }, []);

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
      {/* Full-screen 3D background (globe + particles) */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
      }}>
        <Scene page="home" />
      </div>

      {/* Dark gradient overlay on the left for text readability */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '55%',
        height: '100%',
        background: 'linear-gradient(to right, rgba(0, 0, 0, 0.88) 0%, rgba(0, 0, 0, 0.5) 60%, transparent 100%)',
        zIndex: 1,
        pointerEvents: 'none',
      }} />

      {/* Text Content */}
      <div style={{
        position: 'relative',
        zIndex: 2,
        display: 'flex',
        alignItems: 'center',
        minHeight: '100vh',
        paddingLeft: '8%',
        pointerEvents: 'none',
      }}>
        <div style={{ maxWidth: '600px', pointerEvents: 'auto' }}>
          <h1
            ref={headingRef}
            style={{
              fontSize: 'clamp(2.8rem, 5vw, 5rem)',
              fontWeight: 900,
              lineHeight: 1.1,
              marginBottom: '2rem',
              color: '#f0ecf5',
              letterSpacing: '-0.01em',
              textShadow: '0 2px 30px rgba(147, 45, 194, 0.2)',
              opacity: 0, // anime.js will animate this
            }}
          >
            FROM RAW<br />CODE TO<br />GLOBAL<br />DEPLOYMENT
          </h1>

          <p
            ref={subtitleRef}
            style={{
              fontWeight: 700,
              color: '#b0a8be',
              letterSpacing: '0.2em',
              marginBottom: '2.5rem',
              fontSize: '0.9rem',
              opacity: 0,
            }}
          >
            MULTI - TECH SOLUTIONS
          </p>

          <div ref={buttonsRef} style={{ display: 'flex', gap: '1.5rem' }}>
            <button className="btn-outline" onClick={() => navigate('/login?mode=signup')} style={{ minWidth: '160px', opacity: 0 }}>Get Started</button>
            <button
              className="btn-primary"
              onClick={() => navigate('/login')}
              style={{ minWidth: '160px', opacity: 0 }}
            >
              Login
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
