import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Code2, Briefcase, LayoutDashboard, Settings,
  TrendingUp, Server, Rocket, Globe,
  Sparkles, ArrowUpRight, RefreshCw,
  Zap, Calendar, Clock,
  ArrowRight, ArrowLeft, CheckCircle2,
} from 'lucide-react';
import anime from 'animejs';
import Scene from '../components/Scene';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

interface StepOption {
  value: string;
  label: string;
  description: string;
  icon: React.ReactNode;
}

interface StepConfig {
  question: string;
  key: string;
  options: StepOption[];
}

const steps: StepConfig[] = [
  {
    question: 'What is your current operational role?',
    key: 'operationalRole',
    options: [
      { value: 'technical_founder', label: 'Technical Founder / CTO', description: 'Leading technology and architecture decisions', icon: <Code2 size={28} /> },
      { value: 'nontechnical_founder', label: 'Non-Technical Founder / CEO', description: 'Driving business strategy and vision', icon: <Briefcase size={28} /> },
      { value: 'product_manager', label: 'Product Manager', description: 'Shaping product roadmap and user experience', icon: <LayoutDashboard size={28} /> },
      { value: 'operations_lead', label: 'Operations Lead', description: 'Managing infrastructure and team processes', icon: <Settings size={28} /> },
    ],
  },
  {
    question: 'What is the primary objective for this workspace?',
    key: 'primaryObjective',
    options: [
      { value: 'market_validation', label: 'Market Validation', description: 'Testing UI/UX demand and competitor analysis', icon: <TrendingUp size={28} /> },
      { value: 'system_architecture', label: 'System Architecture & Dev', description: 'Building an MVP or scaling a custom backend', icon: <Server size={28} /> },
      { value: 'operational_deployment', label: 'Operational Deployment', description: 'Setting up CI/CD, servers, and workflows', icon: <Rocket size={28} /> },
      { value: 'full_ecosystem', label: 'Full Ecosystem Build', description: 'End-to-end strategy, code, and deployment', icon: <Globe size={28} /> },
    ],
  },
  {
    question: 'What is the current state of your digital infrastructure?',
    key: 'infrastructureState',
    options: [
      { value: 'greenfield', label: 'Starting from Scratch', description: 'Greenfield project with a blank canvas', icon: <Sparkles size={28} /> },
      { value: 'mvp_scaling', label: 'MVP Needs Scaling', description: 'Have an MVP, but it needs architectural growth', icon: <ArrowUpRight size={28} /> },
      { value: 'legacy_modernization', label: 'Legacy Modernization', description: 'Existing code that needs modern architecture', icon: <RefreshCw size={28} /> },
    ],
  },
  {
    question: 'What is your anticipated deployment timeline?',
    key: 'deploymentTimeline',
    options: [
      { value: 'immediate', label: 'Immediate', description: 'Within the next 30 days', icon: <Zap size={28} /> },
      { value: 'q2_q3', label: 'Q2 / Q3 Roadmap', description: '1-3 months planned rollout', icon: <Calendar size={28} /> },
      { value: 'long_term', label: 'Long-term R&D', description: '3-6+ months of research and development', icon: <Clock size={28} /> },
    ],
  },
];

const pageVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.5 } },
  exit: { opacity: 0, transition: { duration: 0.3 } },
};

export default function Onboarding() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const cardsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    animateCards();
  }, [currentStep]);

  function animateCards() {
    if (cardsRef.current) {
      const cards = cardsRef.current.querySelectorAll('.option-card');
      anime({
        targets: cards,
        translateY: [40, 0],
        opacity: [0, 1],
        duration: 500,
        delay: anime.stagger(100, { start: 150 }),
        easing: 'easeOutQuart',
      });
    }
  }

  function selectOption(key: string, value: string) {
    setAnswers((prev) => ({ ...prev, [key]: value }));
    // Subtle card pulse
    anime({
      targets: `.option-card[data-value="${value}"]`,
      scale: [1, 1.03, 1],
      duration: 300,
      easing: 'easeOutQuart',
    });
  }

  function nextStep() {
    if (currentStep < steps.length - 1) {
      // Slide out current
      if (cardsRef.current) {
        anime({
          targets: cardsRef.current,
          translateX: [0, -40],
          opacity: [1, 0],
          duration: 250,
          easing: 'easeInQuart',
          complete: () => {
            setCurrentStep((s) => s + 1);
            if (cardsRef.current) {
              cardsRef.current.style.transform = '';
              cardsRef.current.style.opacity = '1';
            }
          },
        });
      } else {
        setCurrentStep((s) => s + 1);
      }
    }
  }

  function prevStep() {
    if (currentStep > 0) {
      if (cardsRef.current) {
        anime({
          targets: cardsRef.current,
          translateX: [0, 40],
          opacity: [1, 0],
          duration: 250,
          easing: 'easeInQuart',
          complete: () => {
            setCurrentStep((s) => s - 1);
            if (cardsRef.current) {
              cardsRef.current.style.transform = '';
              cardsRef.current.style.opacity = '1';
            }
          },
        });
      } else {
        setCurrentStep((s) => s - 1);
      }
    }
  }

  async function handleLaunch() {
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${API_URL}/api/onboarding`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(answers),
      });
      if (res.ok) {
        navigate('/dashboard');
      } else {
        console.error('Onboarding save failed');
      }
    } catch (err) {
      console.error('Network error:', err);
    } finally {
      setLoading(false);
    }
  }

  const step = steps[currentStep];
  const selectedValue = answers[step.key];
  const isLastStep = currentStep === steps.length - 1;
  const canProceed = !!selectedValue;

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
        background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.9) 100%)',
        zIndex: 1, pointerEvents: 'none',
      }} />

      {/* Content */}
      <div style={{
        position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', minHeight: '100vh',
        padding: '2rem',
      }}>
        {/* Progress Bar */}
        <div style={{
          width: '100%', maxWidth: '600px', marginBottom: '3rem',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.8rem', fontSize: '0.8rem', color: '#999' }}>
            <span>Project Initialization</span>
            <span>Step {currentStep + 1} of {steps.length}</span>
          </div>
          <div style={{
            width: '100%', height: '4px', background: 'rgba(255,255,255,0.08)',
            borderRadius: '2px', overflow: 'hidden',
          }}>
            <motion.div
              animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              style={{
                height: '100%', background: 'linear-gradient(90deg, #932DC2, #3bb4d2)',
                borderRadius: '2px',
              }}
            />
          </div>
        </div>

        {/* Question */}
        <h2 style={{
          fontSize: 'clamp(1.4rem, 2.5vw, 1.8rem)', fontWeight: 700,
          color: '#f0ecf5', marginBottom: '2.5rem', textAlign: 'center',
          maxWidth: '600px', lineHeight: 1.4,
          textShadow: '0 2px 20px rgba(147,45,194,0.15)',
        }}>
          {step.question}
        </h2>

        {/* Option Cards */}
        <div
          ref={cardsRef}
          style={{
            display: 'grid',
            gridTemplateColumns: step.options.length <= 3 ? 'repeat(3, 1fr)' : 'repeat(2, 1fr)',
            gap: '1.2rem',
            maxWidth: step.options.length <= 3 ? '750px' : '650px',
            width: '100%',
          }}
        >
          {step.options.map((option) => {
            const isSelected = selectedValue === option.value;
            return (
              <div
                key={option.value}
                data-value={option.value}
                className="option-card"
                onClick={() => selectOption(step.key, option.value)}
                style={{
                  background: isSelected ? 'rgba(147, 45, 194, 0.15)' : 'rgba(255,255,255,0.03)',
                  border: isSelected ? '1.5px solid #932DC2' : '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '18px',
                  padding: '1.8rem 1.4rem',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  backdropFilter: 'blur(12px)',
                  boxShadow: isSelected ? '0 4px 24px rgba(147,45,194,0.25)' : 'none',
                  opacity: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  gap: '0.8rem',
                }}
                onMouseOver={(e) => {
                  if (!isSelected) e.currentTarget.style.borderColor = 'rgba(147,45,194,0.4)';
                }}
                onMouseOut={(e) => {
                  if (!isSelected) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                }}
              >
                <div style={{ color: isSelected ? '#932DC2' : '#b0a8be', transition: 'color 0.3s' }}>
                  {option.icon}
                </div>
                <div style={{ fontWeight: 600, fontSize: '0.95rem', color: '#f0ecf5' }}>
                  {option.label}
                </div>
                <div style={{ fontSize: '0.78rem', color: '#9a94a8', lineHeight: 1.4 }}>
                  {option.description}
                </div>
                {isSelected && (
                  <CheckCircle2 size={18} style={{ color: '#932DC2', marginTop: '0.3rem' }} />
                )}
              </div>
            );
          })}
        </div>

        {/* Navigation Buttons */}
        <div style={{
          display: 'flex', gap: '1rem', marginTop: '2.5rem', alignItems: 'center',
        }}>
          {currentStep > 0 && (
            <button
              onClick={prevStep}
              className="btn-outline"
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '12px 28px' }}
            >
              <ArrowLeft size={16} /> Back
            </button>
          )}
          {!isLastStep ? (
            <button
              onClick={nextStep}
              className="btn-primary"
              disabled={!canProceed}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '12px 28px',
                opacity: canProceed ? 1 : 0.4, cursor: canProceed ? 'pointer' : 'not-allowed',
              }}
            >
              Next <ArrowRight size={16} />
            </button>
          ) : (
            <button
              onClick={handleLaunch}
              className="btn-primary"
              disabled={!canProceed || loading}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '12px 32px',
                opacity: canProceed ? 1 : 0.4,
                background: 'linear-gradient(135deg, #932DC2, #3bb4d2)',
              }}
            >
              <Rocket size={16} /> {loading ? 'Launching...' : 'Launch Workspace'}
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
