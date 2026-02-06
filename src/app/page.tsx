'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import LoadingDots from './LoadingDots';
import AsciiArt, { AsciiArtRef } from './AsciiArt';

// Types
import { Phase, Language, ActiveSection, ActiveWindow, WelcomeStep } from './types';

// Translations
import { translations, getDotChar } from './translations';

// Constants
import { CONTACT, WIN_FONT, FRAME_INSETS, WIN95_STYLES } from './constants';

// Hooks
import {
  useConfirmScreen,
  useShutdownSequence,
  useMainEntrance,
  useLanguageScramble,
  useDraggable,
} from './hooks';

// Components
import {
  Win95Popup,
  ConfirmScreen,
  ErrorScreen,
  ShutdownScreen,
  Shop,
} from './components';

// Isolated spinner component to prevent re-renders on main component
function Spinner() {
  const [frame, setFrame] = useState(0);
  const chars = ['|', '/', '-', '\\'];

  useEffect(() => {
    const interval = setInterval(() => {
      setFrame((prev) => (prev + 1) % 4);
    }, 150);
    return () => clearInterval(interval);
  }, []);

  return <span>{chars[frame]}</span>;
}

export default function Home() {
  // Core state
  const [phase, setPhase] = useState<Phase>('boot');
  const [showLogo, setShowLogo] = useState(false);
  const [showLoader, setShowLoader] = useState(false);
  const [language, setLanguage] = useState<Language>('ES');
  
  // Auto-detect language from browser on mount
  useEffect(() => {
    const detectLanguage = (): Language => {
      if (typeof navigator === 'undefined') return 'ES';
      
      const browserLang = navigator.language.toLowerCase().slice(0, 2);
      
      switch (browserLang) {
        case 'es': return 'ES';
        case 'en': return 'EN';
        case 'ja': return 'JP';
        default: return 'ES'; // Default to Spanish
      }
    };
    
    setLanguage(detectLanguage());
  }, []);
  
  const t = translations[language];

  // Popup/section states
  const [showWelcomePopup, setShowWelcomePopup] = useState(false);
  const [activeSection, setActiveSection] = useState<ActiveSection>(null);
  const [activeWindow, setActiveWindow] = useState<ActiveWindow>(null);
  const [showNotification, setShowNotification] = useState(false);
  const [welcomeStep, setWelcomeStep] = useState<WelcomeStep>('message');

  // Email/subscribe states
  const [showEmailCopied, setShowEmailCopied] = useState(false);
  const [emailToastPos, setEmailToastPos] = useState({ x: 0, y: 0 });
  const [showEmailError, setShowEmailError] = useState(false);
  const [emailErrorPos, setEmailErrorPos] = useState({ x: 0, y: 0 });
  const [subscribeEmail, setSubscribeEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [showSubscribedPopup, setShowSubscribedPopup] = useState(false);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const lastClickPos = useRef({ x: 0, y: 0 });

  // About panel typing
  const [typedAboutText, setTypedAboutText] = useState('');
  const [aboutTypingComplete, setAboutTypingComplete] = useState(false);
  const [aboutHasTyped, setAboutHasTyped] = useState(false);

  // Menu state
  const [showMenuDropdown, setShowMenuDropdown] = useState(false);

  // Skip and replay state
  const [skipMode, setSkipMode] = useState(false);
  const [isReplaying, setIsReplaying] = useState(false);
  const [replayTrigger, setReplayTrigger] = useState(0);
  const [rebootCount, setRebootCount] = useState(0);

  // Landscape warning
  const [showLandscapeWarning, setShowLandscapeWarning] = useState(false);

  // Ref for ASCII art
  const asciiRef = useRef<AsciiArtRef>(null);

  // Style constants
  const winFont = WIN_FONT;
  const win95Button = WIN95_STYLES.button;
  const frameInset = FRAME_INSETS.frame;
  const frameInsetBottom = FRAME_INSETS.frameBottom;
  const contentInset = FRAME_INSETS.content;
  const contentInsetBottom = FRAME_INSETS.contentBottom;

  // Custom hooks
  const confirmScreen = useConfirmScreen({
    phase,
    language,
    onSelectYes: () => setPhase('main'),
    onSelectNo: () => shutdown.startShutdown(),
  });

  const shutdown = useShutdownSequence({
    phase,
    language,
    onPhaseChange: setPhase,
    onRebootComplete: () => {
      // Reset all state for reboot
      confirmScreen.resetConfirmState();
      entrance.resetEntranceState();
      setShowWelcomePopup(false);
      setActiveSection(null);
      setShowNotification(false);
      setShowMenuDropdown(false);
      setShowLogo(false);
      setShowLoader(false);
      setAboutHasTyped(false);
      setTypedAboutText('');
      setAboutTypingComplete(false);
      setRebootCount((c) => c + 1);
      setPhase('boot');
    },
  });

  const entrance = useMainEntrance({
    phase,
    language,
    skipMode,
    replayTrigger,
    onSkipModeComplete: () => setSkipMode(false),
    onShowWelcomePopup: () => {
      setShowWelcomePopup(true);
      setActiveWindow('welcome');
    },
  });

  const { scrambled } = useLanguageScramble({ phase, language });

  const draggable = useDraggable();

  // Detect problematic aspect ratio (landscape on small screens)
  useEffect(() => {
    const checkAspectRatio = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const aspectRatio = w / h;
      const isProblematic = aspectRatio > 2.0 && h < 380;
      setShowLandscapeWarning(isProblematic);
    };

    checkAspectRatio();
    window.addEventListener('resize', checkAspectRatio);
    window.addEventListener('orientationchange', checkAspectRatio);

    return () => {
      window.removeEventListener('resize', checkAspectRatio);
      window.removeEventListener('orientationchange', checkAspectRatio);
    };
  }, []);

  // Boot sequence
  useEffect(() => {
    if (phase === 'boot') {
      const logoTimer = setTimeout(() => setShowLogo(true), 600);
      const loaderTimer = setTimeout(() => {
        setShowLoader(true);
        setPhase('loading');
      }, 1400);

      return () => {
        clearTimeout(logoTimer);
        clearTimeout(loaderTimer);
      };
    }
  }, [phase, rebootCount]);

  const handleLoadingComplete = () => {
    setPhase('pause');
    setTimeout(() => setPhase('confirm'), 800);
  };

  // Skip handler
  const handleSkip = () => {
    confirmScreen.resetConfirmState();
    setShowLogo(false);
    setShowLoader(false);
    setSkipMode(true);
    setTimeout(() => setPhase('main'), 400);
  };

  // Replay entrance
  const handleReplayEntrance = () => {
    setIsReplaying(true);
    setActiveSection(null);
    setShowWelcomePopup(false);
    setShowNotification(false);
    setShowMenuDropdown(false);
    entrance.resetEntranceState();
    setAboutHasTyped(false);
    setTypedAboutText('');
    setAboutTypingComplete(false);

    setTimeout(() => {
      setReplayTrigger((prev) => prev + 1);
      setIsReplaying(false);
    }, 150);
  };

  // Welcome popup handlers
  const handleWelcomeOk = () => {
    if (welcomeStep === 'message') {
      setWelcomeStep('subscribe');
    } else {
      setShowWelcomePopup(false);
      setShowNotification(true);
      setWelcomeStep('message');
    }
  };

  const handleCloseWelcome = () => {
    setShowWelcomePopup(false);
    setShowNotification(true);
    setWelcomeStep('message');
  };

  // Email handlers
  const handleCopyEmail = async (e: React.MouseEvent | React.TouchEvent) => {
    const clientX = 'touches' in e ? e.touches[0]?.clientX || 0 : e.clientX;
    const clientY = 'touches' in e ? e.touches[0]?.clientY || 0 : e.clientY;

    try {
      await navigator.clipboard.writeText(CONTACT.email);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = CONTACT.email;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }

    setEmailToastPos({ x: clientX, y: clientY });
    setShowEmailCopied(true);
    setTimeout(() => setShowEmailCopied(false), 2000);
  };

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(subscribeEmail)) {
      setEmailErrorPos({ x: lastClickPos.current.x, y: lastClickPos.current.y });
      setShowEmailError(true);
      setTimeout(() => setShowEmailError(false), 2000);
      return;
    }

    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: subscribeEmail }),
      });
      const data = await res.json();

      if (data.success) {
        setSubscribeEmail('');
        setShowWelcomePopup(false);
        setWelcomeStep('message');
        setShowSubscribedPopup(true);
      } else {
        setEmailErrorPos({ x: lastClickPos.current.x, y: lastClickPos.current.y });
        setShowEmailError(true);
        setTimeout(() => setShowEmailError(false), 2000);
      }
    } catch {
      setEmailErrorPos({ x: lastClickPos.current.x, y: lastClickPos.current.y });
      setShowEmailError(true);
      setTimeout(() => setShowEmailError(false), 2000);
    }
  };

  // Escape key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowWelcomePopup(false);
        setActiveSection(null);
        setShowMenuDropdown(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // About typing effect
  useEffect(() => {
    if (activeSection === 'about' && !aboutHasTyped) {
      const fullText = t.aboutText;
      setTypedAboutText('');
      setAboutTypingComplete(false);

      let currentIndex = 0;
      const typeNextChar = () => {
        if (currentIndex < fullText.length) {
          setTypedAboutText(fullText.substring(0, currentIndex + 1));
          currentIndex++;
          setTimeout(typeNextChar, 50);
        } else {
          setAboutTypingComplete(true);
          setAboutHasTyped(true);
        }
      };

      const startDelay = setTimeout(typeNextChar, 300);
      return () => clearTimeout(startDelay);
    }
  }, [activeSection, aboutHasTyped, t]);

  const showMainContent = phase === 'main';

  return (
    <main
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100dvh',
        minHeight: '-webkit-fill-available',
        backgroundColor: phase === 'off' ? '#000' : '#0000FF',
        margin: 0,
        padding: 0,
        transition: shutdown.fadeFromBlack ? 'background-color 0.8s ease-out' : 'none',
      }}
    >
      {/* Frame border */}
      <div
        style={{
          position: 'absolute',
          top: frameInset,
          left: frameInset,
          right: frameInset,
          bottom: frameInsetBottom,
          display: showMainContent ? 'block' : 'none',
          pointerEvents: 'none',
          border: '1px solid rgba(255,255,255,0.4)',
          opacity: entrance.showFrame ? 1 : 0,
          transition: 'opacity 0.6s ease-in-out',
        }}
      />

      {/* === BOOT / LOADING PHASE === */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: '31vmin',
          display: phase === 'boot' || phase === 'loading' ? 'flex' : 'none',
        }}
      >
        <div
          style={{
            marginBottom: '1rem',
            width: '86%',
            aspectRatio: '1',
            position: 'relative',
            opacity: showLogo ? 1 : 0,
          }}
        >
          <Image src="/superself-logo-wh.png" alt="superself" fill style={{ objectFit: 'contain' }} priority />
        </div>
        <div
          style={{
            opacity: showLoader ? 1 : 0,
            height: '1.2rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {(phase === 'boot' || phase === 'loading') && (
            <LoadingDots key={rebootCount} onComplete={handleLoadingComplete} />
          )}
        </div>
      </div>

      {/* === CONFIRM PHASE === */}
      {phase === 'confirm' && (
        <ConfirmScreen
          language={language}
          typedWelcome={confirmScreen.typedWelcome}
          welcomeDots={confirmScreen.welcomeDots}
          typedConfirm={confirmScreen.typedConfirm}
          typedYes={confirmScreen.typedYes}
          typedNo={confirmScreen.typedNo}
          showSelector={confirmScreen.showSelector}
          showConfirmCursor={confirmScreen.showConfirmCursor}
          selectedOption={confirmScreen.selectedOption}
          showLoadingDots={confirmScreen.showLoadingDots}
          loadingDots={confirmScreen.loadingDots}
          onSelect={confirmScreen.handleConfirmSelect}
        />
      )}

      {/* === SHUTDOWN PHASE === */}
      {phase === 'shutdown' && (
        <ShutdownScreen shutdownText={shutdown.shutdownText} shutdownDots={shutdown.shutdownDots} />
      )}

      {/* === ERROR PHASE === */}
      {phase === 'error' && <ErrorScreen language={language} errorCode={shutdown.errorCode} />}

      {/* === MAIN CONTENT === */}

      {/* Top Left - CLI Logo */}
      <div
        style={{
          position: 'absolute',
          top: `calc(${contentInset} - 10px)`,
          left: contentInset,
          display: showMainContent ? 'block' : 'none',
          fontFamily: winFont,
          fontSize: 'clamp(3rem, 9vw, 5rem)',
          color: 'white',
          visibility: entrance.showTitlePrompt ? 'visible' : 'hidden',
          cursor: 'pointer',
          zIndex: 10,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          maxWidth: `calc(100vw - ${contentInset} - ${contentInset} - 60px)`,
        }}
        onClick={handleReplayEntrance}
      >
        <span style={{ opacity: entrance.showTitlePrompt ? 1 : 0 }}>&gt; </span>
        {entrance.typedTitle}
        <span className={entrance.showTitleCursor ? 'blink' : ''} style={{ opacity: entrance.showTitleCursor ? 1 : 0 }}>
          _
        </span>
      </div>

      {/* Center - ASCII Art */}
      <div
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            asciiRef.current?.createRipple(e.clientX, e.clientY);
          }
        }}
        onTouchStart={(e) => {
          if (e.target === e.currentTarget && e.touches.length > 0) {
            e.preventDefault();
            asciiRef.current?.createRipple(e.touches[0].clientX, e.touches[0].clientY);
          }
        }}
        style={{
          position: 'absolute',
          top: frameInset,
          left: frameInset,
          right: frameInset,
          bottom: frameInsetBottom,
          display: showMainContent ? 'block' : 'none',
          opacity: entrance.showFooter ? 1 : 0,
          transition: 'opacity 1.5s ease-in-out',
          overflow: 'hidden',
          zIndex: 1,
          cursor: 'crosshair',
        }}
      >
        <AsciiArt ref={asciiRef} color="white" isVisible={entrance.showFooter} />
      </div>

      {/* Social icons */}
      <div
        className="social-icons-container"
        style={{
          position: 'absolute',
          bottom: contentInsetBottom,
          right: contentInset,
          display: showMainContent ? 'flex' : 'none',
          flexDirection: 'column',
          gap: '12px',
          opacity: entrance.showFooter ? 1 : 0,
          transition: 'opacity 0.6s ease-in-out',
          zIndex: 10,
        }}
      >
        <a href={CONTACT.instagram} target="_blank" rel="noopener noreferrer" className="social-icon" title="Instagram">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
          </svg>
        </a>
        <a href={CONTACT.soundcloud} target="_blank" rel="noopener noreferrer" className="social-icon" title="SoundCloud">
          <svg width="18" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M7 17.939h-1v-8.068c.308-.231.639-.429 1-.566v8.634zm3 0h1v-9.224c-.229.265-.443.548-.621.857l-.379-.184v8.551zm-2 0h1v-8.848c-.508-.079-.623-.05-1-.01v8.858zm-4 0h1v-7.02c-.312.458-.555.971-.692 1.535l-.308-.182v5.667zm-3-5.25c-.606.547-1 1.354-1 2.268 0 .914.394 1.721 1 2.268v-4.536zm18.879-.671c-.204-2.837-2.404-5.079-5.117-5.079-1.022 0-1.964.328-2.762.877v10.123h9.089c1.607 0 2.911-1.393 2.911-3.106 0-2.233-2.168-3.772-4.121-2.815zm-16.879-.027c-.302-.024-.526-.03-1 .122v5.689h1v-5.811z" />
          </svg>
        </a>
        <span onClick={handleCopyEmail} className="social-icon" title={CONTACT.email}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M0 3v18h24v-18h-24zm21.518 2l-9.518 7.713-9.518-7.713h19.036zm-19.518 14v-11.817l10 8.104 10-8.104v11.817h-20z" />
          </svg>
        </span>
      </div>

      {/* Burger Menu */}
      <div
        style={{
          position: 'absolute',
          right: contentInset,
          top: contentInset,
          display: showMainContent ? 'flex' : 'none',
          flexDirection: 'column',
          alignItems: 'flex-end',
          opacity: entrance.burgerVisible ? 1 : 0,
          transition: 'opacity 0.6s ease-in-out',
          zIndex: 10,
        }}
      >
        <span
          onClick={() => setShowMenuDropdown(!showMenuDropdown)}
          style={{
            backgroundColor: '#c0c0c0',
            color: '#000080',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: 'clamp(46px, 10vw, 54px)',
            width: 'clamp(46px, 10vw, 54px)',
            boxShadow: showMenuDropdown
              ? 'inset 1px 1px 0 #0a0a0a, inset -1px -1px 0 #ffffff, inset 2px 2px 0 #808080, inset -2px -2px 0 #dfdfdf, inset 3px 3px 0 #404040'
              : 'inset -1px -1px 0 #0a0a0a, inset 1px 1px 0 #ffffff, inset -2px -2px 0 #808080, inset 2px 2px 0 #dfdfdf, inset -3px -3px 0 #404040',
          }}
        >
          {showMenuDropdown ? (
            <svg style={{ width: '60%', height: '60%' }} viewBox="0 0 20 20" fill="none">
              <path d="M4 4L16 16M16 4L4 16" stroke="#000080" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          ) : (
            <svg style={{ width: '60%', height: '60%' }} viewBox="0 0 20 20" fill="none">
              <path d="M3 5H17M3 10H17M3 15H17" stroke="#000080" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          )}
        </span>

        {showMenuDropdown && (
          <div style={{ marginTop: '28px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '20px' }}>
            <span
              className={activeSection === 'about' ? '' : 'nav-cli'}
              onClick={() => setActiveSection(activeSection === 'about' ? null : 'about')}
              style={{
                fontFamily: winFont,
                fontSize: 'clamp(1.1rem, 4vw, 1.4rem)',
                color: activeSection === 'about' ? '#000080' : 'white',
                backgroundColor: activeSection === 'about' ? '#c0c0c0' : undefined,
                cursor: 'pointer',
                padding: '4px 8px',
              }}
            >
              {scrambled.about || t.about}
              <span className="nav-cursor" style={{ color: activeSection === 'about' ? '#000080' : undefined }}>
                _
              </span>
            </span>
            <span
              className={activeSection === 'shop' ? '' : 'nav-cli'}
              onClick={() => setActiveSection(activeSection === 'shop' ? null : 'shop')}
              style={{
                fontFamily: winFont,
                fontSize: 'clamp(1.1rem, 4vw, 1.4rem)',
                color: activeSection === 'shop' ? '#000080' : 'white',
                backgroundColor: activeSection === 'shop' ? '#c0c0c0' : undefined,
                cursor: 'pointer',
                padding: '4px 8px',
              }}
            >
              {scrambled.shop || t.shop}
              <span className="nav-cursor" style={{ color: activeSection === 'shop' ? '#000080' : undefined }}>
                _
              </span>
            </span>
          </div>
        )}
      </div>

      {/* Welcome Popup */}
      {showWelcomePopup && (
        <Win95Popup
          title={t.welcomeTitle}
          onClose={handleCloseWelcome}
          position={draggable.welcomePos}
          width="250px"
          windowId="welcome"
          activeWindow={activeWindow}
          onActivate={() => setActiveWindow('welcome')}
          onDragStart={(e) => draggable.handleDragStart(e, 'welcome')}
          isDragging={draggable.isDragging === 'welcome'}
        >
          {welcomeStep === 'message' ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px', minWidth: '200px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%' }}>
                <Image src="/smiley.svg" alt=":)" width={48} height={48} style={{ flexShrink: 0 }} />
                <span style={{ fontFamily: '"MS Sans Serif", Arial, sans-serif', fontSize: '11px', color: '#000', lineHeight: '1.4', minWidth: '140px' }}>
                  {scrambled.welcomeMsg || t.welcomeMessage}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', width: '100%' }}>
                <button
                  onClick={handleWelcomeOk}
                  onMouseDown={(e) => e.stopPropagation()}
                  onTouchStart={(e) => e.stopPropagation()}
                  onTouchEnd={(e) => { e.stopPropagation(); e.preventDefault(); handleWelcomeOk(); }}
                  className="win-btn"
                  style={{ fontFamily: '"MS Sans Serif", Arial, sans-serif', fontSize: '11px', color: '#000', padding: '8px 0', width: '75px', minWidth: '75px', maxWidth: '75px', textAlign: 'center', cursor: 'pointer', ...win95Button }}
                >
                  {scrambled.ok || t.ok}
                </button>
                <button
                  onClick={handleCloseWelcome}
                  onMouseDown={(e) => e.stopPropagation()}
                  onTouchStart={(e) => e.stopPropagation()}
                  onTouchEnd={(e) => { e.stopPropagation(); e.preventDefault(); handleCloseWelcome(); }}
                  className="win-btn"
                  style={{ fontFamily: '"MS Sans Serif", Arial, sans-serif', fontSize: '11px', color: '#000', padding: '8px 0', width: '75px', minWidth: '75px', maxWidth: '75px', textAlign: 'center', cursor: 'pointer', ...win95Button }}
                >
                  {scrambled.close || t.close}
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }} onMouseDown={(e) => e.stopPropagation()} onTouchStart={(e) => e.stopPropagation()}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%' }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
                  <rect x="2" y="5" width="20" height="14" fill="#ffffcc" stroke="#808080" strokeWidth="1" />
                  <path d="M2 5 L12 13 L22 5" stroke="#808080" strokeWidth="1" fill="none" />
                  <rect x="3" y="6" width="18" height="12" fill="none" stroke="#fff" strokeWidth="0.5" />
                </svg>
                <span style={{ fontFamily: '"MS Sans Serif", Arial, sans-serif', fontSize: '11px', color: '#000', textAlign: 'left', lineHeight: '1.5' }}>
                  {scrambled.subscribePrompt || t.subscribePrompt}
                </span>
              </div>
              <form onSubmit={handleSubscribe} style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
                <input
                  ref={emailInputRef}
                  type="email"
                  value={subscribeEmail}
                  onChange={(e) => setSubscribeEmail(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                  onTouchStart={(e) => e.stopPropagation()}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && emailInputRef.current) {
                      const rect = emailInputRef.current.getBoundingClientRect();
                      lastClickPos.current = { x: rect.left + rect.width / 2, y: rect.top };
                    }
                  }}
                  placeholder={t.emailPlaceholder}
                  autoFocus
                  style={{
                    backgroundColor: '#fff',
                    border: '2px inset #808080',
                    color: '#000',
                    padding: '8px 12px',
                    fontFamily: '"MS Sans Serif", Arial, sans-serif',
                    fontSize: '12px',
                    outline: 'none',
                    width: '100%',
                    boxSizing: 'border-box',
                  }}
                />
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                  <button
                    type="submit"
                    onClick={(e) => { lastClickPos.current = { x: e.clientX, y: e.clientY }; }}
                    onTouchStart={(e) => { e.stopPropagation(); if (e.touches[0]) lastClickPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }; }}
                    onTouchEnd={(e) => e.stopPropagation()}
                    className="win-btn"
                    style={{ fontFamily: '"MS Sans Serif", Arial, sans-serif', fontSize: '11px', color: '#000', padding: '8px 24px', cursor: 'pointer', ...win95Button }}
                  >
                    {isSubscribed ? t.subscribed : (scrambled.confirm || t.confirm)}
                  </button>
                  <button
                    type="button"
                    onClick={handleCloseWelcome}
                    onTouchStart={(e) => e.stopPropagation()}
                    onTouchEnd={(e) => { e.stopPropagation(); e.preventDefault(); handleCloseWelcome(); }}
                    className="win-btn"
                    style={{ fontFamily: '"MS Sans Serif", Arial, sans-serif', fontSize: '11px', color: '#000', padding: '8px 0', width: '75px', minWidth: '75px', maxWidth: '75px', textAlign: 'center', cursor: 'pointer', ...win95Button }}
                  >
                    {scrambled.cancel || t.cancel}
                  </button>
                </div>
              </form>
            </div>
          )}
        </Win95Popup>
      )}

      {/* Subscribed confirmation popup */}
      {showSubscribedPopup && (
        <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 160 }}>
          <div style={{ backgroundColor: '#c0c0c0', border: '2px solid', borderColor: '#ffffff #0a0a0a #0a0a0a #ffffff', boxShadow: '1px 1px 0 #000', width: '280px' }}>
            <div style={{ background: 'linear-gradient(90deg, #000080, #1084d0)', padding: '3px 4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ marginTop: '-1px' }}>
                  <rect x="1" y="3" width="14" height="10" fill="#c0c0c0" stroke="#000" strokeWidth="1" />
                  <rect x="3" y="5" width="10" height="6" fill="#000080" />
                  <rect x="0" y="12" width="16" height="3" fill="#808080" />
                </svg>
                <span style={{ color: 'white', fontFamily: 'Segoe UI, Tahoma, sans-serif', fontSize: '11px', fontWeight: 600 }}>superself.exe</span>
              </div>
            </div>
            <div style={{ padding: '20px 24px', textAlign: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '16px' }}>
                <span style={{ fontSize: '24px' }}>✓</span>
                <span style={{ fontFamily: '"MS Sans Serif", Arial, sans-serif', fontSize: '12px', color: '#000' }}>{t.subscribedMessage}</span>
              </div>
              <button
                onClick={() => { setShowSubscribedPopup(false); setShowNotification(true); }}
                className="win-btn"
                style={{ fontFamily: '"MS Sans Serif", Arial, sans-serif', fontSize: '11px', color: '#000', padding: '4px 24px', cursor: 'pointer', ...win95Button }}
              >
                {t.ok}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* About Panel */}
      {activeSection === 'about' && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'center',
            paddingTop: 'clamp(180px, 28vh, 260px)',
            zIndex: activeWindow === 'about' ? 160 : 90,
            pointerEvents: 'none',
          }}
        >
          <div
            className="popup-window"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => { setActiveWindow('about'); draggable.handleDragStart(e, 'about'); }}
            onTouchStart={(e) => { setActiveWindow('about'); draggable.handleDragStart(e, 'about'); }}
            style={{
              backgroundColor: '#a8a8a8',
              border: '2px solid #000',
              boxShadow: '4px 4px 0 rgba(0,0,0,0.5)',
              fontFamily: winFont,
              fontSize: 'clamp(0.85rem, 2.5vw, 1rem)',
              color: '#000',
              width: '580px',
              maxWidth: '85vw',
              lineHeight: '1.8',
              textAlign: 'center',
              position: draggable.aboutPos.x || draggable.aboutPos.y ? 'fixed' : 'relative',
              top: draggable.aboutPos.y || undefined,
              left: draggable.aboutPos.x || undefined,
              cursor: draggable.isDragging === 'about' ? 'grabbing' : 'grab',
              pointerEvents: 'auto',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '6px 6px 0 6px' }}>
              <button
                onClick={(e) => { e.stopPropagation(); setActiveSection(null); draggable.resetPosition('about'); }}
                onMouseDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
                onTouchEnd={(e) => e.stopPropagation()}
                style={{
                  width: '22px',
                  height: '20px',
                  backgroundColor: '#c0c0c0',
                  border: 'none',
                  boxShadow: 'inset -1px -1px 0 #0a0a0a, inset 1px 1px 0 #ffffff, inset -2px -2px 0 #808080, inset 2px 2px 0 #dfdfdf',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0,
                  touchAction: 'manipulation',
                }}
              >
                <svg width="10" height="9" viewBox="0 0 8 7" fill="none">
                  <path d="M0 0H2V1H3V2H5V1H6V0H8V1H7V2H6V3H5V4H6V5H7V6H8V7H6V6H5V5H3V6H2V7H0V6H1V5H2V4H3V3H2V2H1V1H0V0Z" fill="#000" />
                </svg>
              </button>
            </div>
            <div style={{ padding: '10px clamp(16px, 5vw, 28px) clamp(28px, 4vw, 36px)', overflow: 'hidden' }}>
              <p style={{ wordBreak: 'break-word' }}>
                <span style={{ backgroundColor: '#000080', color: '#fff', padding: '2px 6px', fontFamily: 'Arial, sans-serif', fontWeight: 'bold' }}>superself</span>{' '}
                {scrambled.aboutText || t.aboutText}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Shop Panel */}
      {activeSection === 'shop' && (
        <Shop
          language={language}
          onClose={() => { setActiveSection(null); draggable.resetPosition('shop'); }}
          position={draggable.shopPos}
          isActive={activeWindow === 'shop'}
          onActivate={() => setActiveWindow('shop')}
          onDragStart={(e) => draggable.handleDragStart(e, 'shop')}
          isDragging={draggable.isDragging === 'shop'}
        />
      )}

      {/* Email copied toast */}
      {showEmailCopied && (
        <div
          style={{
            position: 'fixed',
            top: emailToastPos.y - 40,
            left: emailToastPos.x,
            transform: 'translateX(-50%)',
            fontFamily: winFont,
            fontSize: 'clamp(0.9rem, 2vw, 1.1rem)',
            color: '#0000FF',
            backgroundColor: '#fff',
            padding: '6px 14px',
            zIndex: 200,
            pointerEvents: 'none',
          }}
        >
          {t.emailCopied}
        </div>
      )}

      {/* Invalid email toast */}
      {showEmailError && (
        <div
          style={{
            position: 'fixed',
            top: emailErrorPos.y || '50%',
            left: emailErrorPos.x || '50%',
            transform: 'translate(-50%, -100%)',
            fontFamily: winFont,
            fontSize: 'clamp(0.9rem, 2vw, 1.1rem)',
            color: '#0000FF',
            backgroundColor: '#fff',
            padding: '8px 16px',
            zIndex: 200,
            pointerEvents: 'none',
          }}
        >
          {t.invalidEmail}
        </div>
      )}

      {/* Notification reminder */}
      {showNotification && (
        <div
          onClick={() => { setShowWelcomePopup(true); setShowNotification(false); setActiveWindow('welcome'); }}
          style={{
            position: 'absolute',
            bottom: contentInsetBottom,
            left: contentInset,
            cursor: 'pointer',
            fontFamily: winFont,
            fontSize: 'clamp(0.85rem, 2vw, 1rem)',
            color: 'rgba(255,255,255,0.75)',
            zIndex: 10,
          }}
        >
          <span className="blink-slow" style={{ backgroundColor: 'rgba(255,255,255,0.15)', padding: '2px 4px' }}>▶</span> [{scrambled.message || t.message}]
        </div>
      )}

      {/* Language switcher */}
      <div
        className="lang-container"
        style={{
          position: 'absolute',
          bottom: phase === 'confirm' ? 'clamp(80px, 15vh, 120px)' : 'clamp(30px, 5vw, 60px)',
          left: phase === 'confirm' ? '50%' : 'clamp(8px, 2vw, 18px)',
          transform: phase === 'confirm' ? 'translateX(-50%)' : 'none',
          display: phase === 'confirm' || phase === 'main' ? 'flex' : 'none',
          flexDirection: phase === 'confirm' ? 'row' : 'column-reverse',
          gap: phase === 'confirm' ? '24px' : 'clamp(16px, 4vw, 24px)',
          fontFamily: winFont,
          fontSize: 'clamp(1rem, 2.5vw, 1.15rem)',
          opacity: (phase === 'confirm' && confirmScreen.confirmLangVisible) || (phase === 'main' && entrance.showFooter) ? 1 : 0,
          transition: 'opacity 0.6s ease-in-out',
          zIndex: 50,
          pointerEvents: 'auto',
        }}
      >
        {(['ES', 'EN', 'JP'] as Language[]).map((lang) => (
          <div
            key={lang}
            onClick={() => setLanguage(lang)}
            style={{
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              writingMode: phase === 'confirm' ? 'horizontal-tb' : 'vertical-lr',
              transform: phase === 'confirm' ? 'none' : 'rotate(180deg)',
              color: language === lang ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.4)',
              letterSpacing: '0.04em',
              transition: 'color 0.25s ease',
            }}
          >
            <span>{language === lang ? '■' : '□'}</span>
            <span>{lang}</span>
          </div>
        ))}
      </div>

      {/* Copyright */}
      <div
        style={{
          position: 'absolute',
          bottom: 'max(clamp(10px, 2.5vw, 25px), env(safe-area-inset-bottom, 0px))',
          left: '50%',
          transform: 'translateX(-50%)',
          display: showMainContent ? 'block' : 'none',
          opacity: entrance.showFooter ? 1 : 0,
          transition: 'opacity 0.6s ease-in-out',
        }}
      >
        <span style={{ fontFamily: winFont, fontSize: 'clamp(0.6rem, 1.2vw, 0.75rem)', color: 'rgba(255,255,255,0.35)', whiteSpace: 'nowrap' }}>
          {'{ superself '}<Spinner />{` 2026 - ${scrambled.copyright || t.allRightsReserved} }`}
        </span>
      </div>

      {/* Skip button */}
      {phase === 'confirm' && !isReplaying && (
        <div
          onClick={handleSkip}
          style={{
            position: 'absolute',
            bottom: 'clamp(30px, 6vh, 50px)',
            left: 'clamp(24px, 5vw, 40px)',
            fontFamily: winFont,
            fontSize: 'clamp(1rem, 2.5vw, 1.2rem)',
            color: 'rgba(255,255,255,0.5)',
            cursor: 'pointer',
            zIndex: 20,
            display: 'flex',
            alignItems: 'baseline',
            gap: '6px',
          }}
        >
          <span className="blink-slow" style={{ fontSize: '0.75em' }}>▶</span>
          <span>{confirmScreen.scrambledSkip || t.skip}</span>
        </div>
      )}

      {/* Landscape warning */}
      {showLandscapeWarning && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: '#0000FF',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              backgroundColor: '#c0c0c0',
              border: '2px solid',
              borderColor: '#ffffff #0a0a0a #0a0a0a #ffffff',
              boxShadow: '2px 2px 0 #000',
              maxWidth: '90vw',
            }}
          >
            <div
              style={{
                background: 'linear-gradient(90deg, #000080, #1084d0)',
                padding: '3px 4px 3px 8px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span style={{ color: 'white', fontFamily: 'Segoe UI, Tahoma, sans-serif', fontSize: '11px', fontWeight: 700 }}>
                {t.warningTitle}
              </span>
              <button
                disabled
                style={{
                  width: '16px',
                  height: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'not-allowed',
                  padding: 0,
                  backgroundColor: '#c0c0c0',
                  border: 'none',
                  boxShadow: 'inset -1px -1px 0 #0a0a0a, inset 1px 1px 0 #dfdfdf',
                }}
              >
                <svg width="8" height="7" viewBox="0 0 8 7" fill="none">
                  <path d="M0 0H2V1H3V2H5V1H6V0H8V1H7V2H6V3H5V4H6V5H7V6H8V7H6V6H5V5H3V6H2V7H0V6H1V5H2V4H3V3H2V2H1V1H0V0Z" fill="#808080" />
                </svg>
              </button>
            </div>
            <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <svg width="32" height="29" viewBox="0 0 32 29" fill="none" style={{ flexShrink: 0, marginTop: '2px' }}>
                <path d="M18 4H20V5H21V6H22V8H23V10H24V12H25V14H26V16H27V18H28V20H29V22H30V26H29V27H6V26H7V25H27V24H26V22H25V20H24V18H23V16H22V14H21V12H20V10H19V8H18V4Z" fill="#808080" />
                <path d="M14 2H18V4H19V6H20V8H21V10H22V12H23V14H24V16H25V18H26V20H27V24H4V20H5V18H6V16H7V14H8V12H9V10H10V8H11V6H12V4H13V2H14Z" fill="#000" />
                <path d="M15 4H17V6H18V8H19V10H20V12H21V14H22V16H23V18H24V20H25V22H6V20H7V18H8V16H9V14H10V12H11V10H12V8H13V6H14V4H15Z" fill="#FFFF00" />
                <rect x="15" y="8" width="2" height="8" fill="#000" />
                <rect x="15" y="18" width="2" height="2" fill="#000" />
              </svg>
              <span style={{ fontFamily: '"MS Sans Serif", Arial, sans-serif', fontSize: '11px', color: '#000', lineHeight: '1.6', whiteSpace: 'pre-line' }}>
                {t.warningMessage}
              </span>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
