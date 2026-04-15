import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';

const navItems = [
  { label: 'Home', path: '/' },
  { label: 'About', path: '#' },
  { label: 'Solutions', path: '#' },
  { label: 'Tech partner', path: '#' },
  { label: 'Contact', path: '#' },
];

export default function Navbar() {
  const location = useLocation();

  return (
    <motion.nav
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '1.5rem 4rem',
        position: 'absolute',
        width: '100%',
        top: 0,
        zIndex: 10,
      }}
    >
      <NavLink to="/" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
        <img
          src="/logo.png"
          alt="Chronypt"
          style={{ height: '48px', filter: 'brightness(1.1)' }}
        />
      </NavLink>

      <div style={{
        display: 'flex',
        gap: '2.5rem',
        fontWeight: 500,
        fontSize: '0.95rem',
        alignItems: 'center',
      }}>
        {navItems.map((item) => {
          const isActive = item.path === '/' ? location.pathname === '/' : location.pathname === item.path;

          return item.path !== '#' ? (
            <NavLink
              key={item.label}
              to={item.path}
              style={{
                color: isActive ? '#932DC2' : '#ffffff',
                border: isActive ? '1px solid #932DC2' : '1px solid transparent',
                padding: '6px 22px',
                borderRadius: '22px',
                transition: 'all 0.3s ease',
                letterSpacing: '0.01em',
              }}
            >
              {item.label}
            </NavLink>
          ) : (
            <span
              key={item.label}
              style={{
                color: '#ffffff',
                padding: '6px 0',
                cursor: 'pointer',
                transition: 'color 0.3s ease',
                letterSpacing: '0.01em',
                fontFamily: "'Space Grotesk', 'Inter', sans-serif",
              }}
              onMouseOver={(e) => (e.currentTarget.style.color = '#932DC2')}
              onMouseOut={(e) => (e.currentTarget.style.color = '#ffffff')}
            >
              {item.label}
            </span>
          );
        })}
      </div>
    </motion.nav>
  );
}
