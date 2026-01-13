'use client';

import { useState, useEffect, useRef } from 'react';
import Image from "next/image";
import LoadingDots from "./LoadingDots";
import AsciiArt from "./AsciiArt";

type Phase = 'boot' | 'loading' | 'pause' | 'confirm' | 'shutdown' | 'off' | 'main';
type Language = 'ES' | 'EN' | 'JP';

const translations = {
  ES: {
    willYouContinue: 'CONTINUAR AL SITIO?',
    yes: 'SI',
    no: 'NO',
    shuttingDown: 'apagando',
    about: '> acerca',
    shop: '> tienda',
    welcomeTitle: 'superself.exe',
    welcomeMessage: 'Aviso del sistema. Se encontro una invitacion activa.',
    ok: 'OK',
    aboutTitle: 'acerca.txt',
    aboutText1: '(2023) es un sello y colectivo de musica electronica.',
    aboutText2: 'Compartimos sets, musica propia y recomendaciones fuera del radar, desde artistas emergentes hasta productores poco conocidos. Damos espacio a nuevas propuestas, conectamos a gente que realmente escucha y sumamos a la escena local con colaboraciones y experiencias honestas.',
    aboutText3: 'Donde lo que mas importa es el sonido, la energia y la gente correcta.',
    aboutPlaceholder: '// marcador - edita con tu historia de marca',
    close: 'Cerrar',
    shopTitle: 'tienda.exe',
    shopMessage: 'Tienda proximamente...',
    copyright: '{ superself • 2026 }',
    message: '1 mensaje',
    emailCopied: 'email copiado',
    subscribe: 'suscribirse',
    subscribePrompt: 'Ingresa tu email para suscribirte',
    emailPlaceholder: 'tu@email.com',
    subscribed: 'suscrito!',
    subscribedMessage: 'Gracias por suscribirte',
  },
  EN: {
    willYouContinue: 'WILL YOU CONTINUE?',
    yes: 'YES',
    no: 'NO',
    shuttingDown: 'shutting down',
    about: '> about',
    shop: '> shop',
    welcomeTitle: 'superself.exe',
    welcomeMessage: 'System notice. Active invitation found.',
    ok: 'OK',
    aboutTitle: 'about.txt',
    aboutText1: '(2023) is an electronic music label and collective.',
    aboutText2: 'We share sets, original music and off-the-radar recommendations, from emerging artists to lesser-known producers. We give space to new proposals, connect people who truly listen, and contribute to the local scene with honest collaborations and experiences.',
    aboutText3: 'Where what matters most is the sound, the energy, and the right people.',
    aboutPlaceholder: '// placeholder - edit with your actual brand story',
    close: 'Close',
    shopTitle: 'shop.exe',
    shopMessage: 'Shop coming soon...',
    copyright: '{ superself • 2026 }',
    message: '1 message',
    emailCopied: 'email copied',
    subscribe: 'subscribe',
    subscribePrompt: 'Enter your email to subscribe',
    emailPlaceholder: 'your@email.com',
    subscribed: 'subscribed!',
    subscribedMessage: 'Thanks for subscribing',
  },
  JP: {
    willYouContinue: '続けますか?',
    yes: 'はい',
    no: 'いいえ',
    shuttingDown: 'シャットダウン',
    about: '> 概要',
    shop: '> 店舗',
    welcomeTitle: 'superself.exe',
    welcomeMessage: 'システム通知。アクティブな招待が見つかりました。',
    ok: 'OK',
    aboutTitle: '概要.txt',
    aboutText1: '(2023) は電子音楽レーベル＆コレクティブです。',
    aboutText2: 'セット、オリジナル音楽、新進アーティストから知られざるプロデューサーまで、レーダー外のおすすめを共有。新しい提案にスペースを与え、本当に聴く人々をつなぎ、誠実なコラボレーションと体験でローカルシーンに貢献。',
    aboutText3: '最も大切なのは、サウンド、エネルギー、そして正しい人々。',
    aboutPlaceholder: '// プレースホルダー',
    close: '閉じる',
    shopTitle: '店舗.exe',
    shopMessage: 'ショップは近日公開...',
    copyright: '{ superself • 2026 }',
    message: '1件',
    emailCopied: 'コピーしました',
    subscribe: '登録',
    subscribePrompt: 'メールを入力して登録',
    emailPlaceholder: 'メール@例.com',
    subscribed: '登録完了!',
    subscribedMessage: '登録ありがとう',
  },
};

export default function Home() {
  const [phase, setPhase] = useState<Phase>('boot');
  const [showLogo, setShowLogo] = useState(false);
  const [showLoader, setShowLoader] = useState(false);
  const [language, setLanguage] = useState<Language>('ES');
  const t = translations[language];

  const [selectedOption, setSelectedOption] = useState<'yes' | 'no'>('yes');
  const [showWelcomePopup, setShowWelcomePopup] = useState(false);

  // Main content entrance sequence
  const [showFrame, setShowFrame] = useState(false);
  const [showTitlePrompt, setShowTitlePrompt] = useState(false);
  const [typedTitle, setTypedTitle] = useState('');
  const [showTitleCursor, setShowTitleCursor] = useState(false);
  const [showFooter, setShowFooter] = useState(false);
  const [activeSection, setActiveSection] = useState<'about' | 'shop' | null>(null);
  const [showNotification, setShowNotification] = useState(false);
  const [showEmailCopied, setShowEmailCopied] = useState(false);
  const [emailToastPos, setEmailToastPos] = useState({ x: 0, y: 0 });
  const [typedAboutText, setTypedAboutText] = useState('');
  const [aboutTypingComplete, setAboutTypingComplete] = useState(false);
  const [subscribeEmail, setSubscribeEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [showSubscribedPopup, setShowSubscribedPopup] = useState(false);
  const [welcomeStep, setWelcomeStep] = useState<'message' | 'subscribe'>('message');
  const [shopDots, setShopDots] = useState('');
  const [spinner, setSpinner] = useState(0);
  const spinnerChars = ['◐', '◓', '◑', '◒'];
  const [aboutHasTyped, setAboutHasTyped] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // Welcome popup positioning (only popup that's draggable)
  const [welcomePos, setWelcomePos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Menu dropdown state
  const [showMenuDropdown, setShowMenuDropdown] = useState(false);

  // Shutdown animation
  const [shutdownText, setShutdownText] = useState('');
  const [rebootCount, setRebootCount] = useState(0);

  // Confirm screen typing
  const [typedConfirm, setTypedConfirm] = useState('');
  const [typedYes, setTypedYes] = useState('');
  const [typedNo, setTypedNo] = useState('');
  const [showSelector, setShowSelector] = useState(false);

  // Boot sequence: blue → logo appears → loader starts
  useEffect(() => {
    if (phase === 'boot') {
      // Show logo after brief blue screen
      const logoTimer = setTimeout(() => {
        setShowLogo(true);
      }, 600);

      // Start loader after logo is visible
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
    // Brief pause on blue screen, then show confirm
    setTimeout(() => {
      setPhase('confirm');
    }, 800);
  };

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

  const handleCopyEmail = (e: React.MouseEvent) => {
    navigator.clipboard.writeText('flavio@superself.online');
    setEmailToastPos({ x: e.clientX, y: e.clientY });
    setShowEmailCopied(true);
    setTimeout(() => setShowEmailCopied(false), 2000);
  };

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    // Basic email validation: has @, has text before and after @, has dot after @
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (emailRegex.test(subscribeEmail)) {
      // TODO: Send to mailing list service (Mailchimp, Buttondown, etc.)
      // Example: fetch('/api/subscribe', { method: 'POST', body: JSON.stringify({ email: subscribeEmail }) })
      console.log('Subscribe email:', subscribeEmail);
      setSubscribeEmail('');
      setShowWelcomePopup(false);
      setWelcomeStep('message');
      setShowSubscribedPopup(true);
    }
  };

  // Replay entrance animation when clicking title
  const handleReplayEntrance = () => {
    // Reset entrance states
    setShowFrame(false);
    setShowTitlePrompt(false);
    setTypedTitle('');
    setShowTitleCursor(false);
    setShowFooter(false);
    setShowWelcomePopup(false);
    setShowNotification(false);
    setShowMenuDropdown(false);
    // Reset about panel typing state
    setTypedAboutText('');
    setAboutTypingComplete(false);
    setAboutHasTyped(false);

    // Trigger re-run by toggling phase
    setPhase('confirm');
    setTimeout(() => setPhase('main'), 50);
  };

  const handleConfirmSelect = (option: 'yes' | 'no') => {
    if (option === 'yes') {
      setPhase('main');
    } else {
      // Start shutdown sequence
      setPhase('shutdown');
      const shutBase = t.shuttingDown;

      // 2 full passes + first dot of third pass, then shutdown
      const dotTimings = [
        { text: shutBase, delay: 0 },
        { text: shutBase + '.', delay: 400 },
        { text: shutBase + '..', delay: 800 },
        { text: shutBase + '...', delay: 1200 },
        { text: shutBase, delay: 1800 },
        { text: shutBase + '.', delay: 2200 },
        { text: shutBase + '..', delay: 2600 },
        { text: shutBase + '...', delay: 3000 },
        { text: shutBase, delay: 3600 },
        { text: shutBase + '.', delay: 4000 }, // 7th dot - shutdown after this
      ];

      dotTimings.forEach(({ text, delay }) => {
        setTimeout(() => setShutdownText(text), delay);
      });

      // Go to black screen
      setTimeout(() => {
        setPhase('off');
      }, 4600);

      // Brief pause on black, then snap to blue and start boot sequence
      setTimeout(() => {
        // Reset everything and reboot
        setTypedConfirm('');
        setTypedYes('');
        setTypedNo('');
        setShowSelector(false);
        setSelectedOption('yes');
        setShowWelcomePopup(false);
        setActiveSection(null);
        setShowNotification(false);
        setShowMenuDropdown(false);
        setShowLogo(false);
        setShowLoader(false);
        // Reset entrance sequence
        setShowFrame(false);
        setShowTitlePrompt(false);
        setTypedTitle('');
        setShowTitleCursor(false);
        setShowFooter(false);
        setRebootCount(c => c + 1);
        setPhase('boot');
      }, 6200);
    }
  };

  // Typing effect for confirm screen
  const [showConfirmCursor, setShowConfirmCursor] = useState(false);
  useEffect(() => {
    if (phase === 'confirm') {
      const confirmText = t.willYouContinue;
      const yesText = t.yes;
      const noText = t.no;
      let confirmIndex = 0;
      let yesIndex = 0;
      let noIndex = 0;

      setTypedConfirm('');
      setTypedYes('');
      setTypedNo('');
      setShowSelector(false);
      setShowConfirmCursor(false);

      // First show blinking cursor, then start typing
      const cursorTimer = setTimeout(() => {
        setShowConfirmCursor(true);
      }, 300);

      const typeTimer = setTimeout(() => {
        const confirmInterval = setInterval(() => {
          if (confirmIndex < confirmText.length) {
            setTypedConfirm(confirmText.slice(0, confirmIndex + 1));
            confirmIndex++;
          } else {
            clearInterval(confirmInterval);

            // Pause, then type YES
            setTimeout(() => {
              const yesInterval = setInterval(() => {
                if (yesIndex < yesText.length) {
                  setTypedYes(yesText.slice(0, yesIndex + 1));
                  yesIndex++;
                } else {
                  clearInterval(yesInterval);

                  // Small pause, then type NO
                  setTimeout(() => {
                    const noInterval = setInterval(() => {
                      if (noIndex < noText.length) {
                        setTypedNo(noText.slice(0, noIndex + 1));
                        noIndex++;
                      } else {
                        clearInterval(noInterval);

                        // Show selector after everything is typed
                        setTimeout(() => setShowSelector(true), 400);
                      }
                    }, 80);
                  }, 200);
                }
              }, 80);
            }, 400);
          }
        }, 60);
      }, 1000);

      return () => {
        clearTimeout(cursorTimer);
        clearTimeout(typeTimer);
      };
    }
  }, [phase, t]);

  // Keyboard navigation for confirm screen
  useEffect(() => {
    if (phase !== 'confirm' || !showSelector) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        setSelectedOption(prev => prev === 'yes' ? 'no' : 'yes');
      } else if (e.key === 'Enter') {
        handleConfirmSelect(selectedOption);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [phase, selectedOption, showSelector]);

  // Main content entrance sequence
  useEffect(() => {
    if (phase === 'main') {
      const titleText = 'superself';
      let titleIndex = 0;

      // Step 1: Show frame
      const frameTimer = setTimeout(() => {
        setShowFrame(true);
      }, 200);

      // Step 2: Show ">" prompt
      const promptTimer = setTimeout(() => {
        setShowTitlePrompt(true);
      }, 700);

      // Step 3: Show blinking cursor after prompt
      const cursorTimer = setTimeout(() => {
        setShowTitleCursor(true);
      }, 900);

      // Step 4: Start typing "superself" (dramatic pause with blinking cursor first)
      const titleStartTimer = setTimeout(() => {
        const titleInterval = setInterval(() => {
          if (titleIndex < titleText.length) {
            setTypedTitle(titleText.slice(0, titleIndex + 1));
            titleIndex++;
          } else {
            clearInterval(titleInterval);
          }
        }, 60);
      }, 1500);

      // Step 5: Show footer (languages + copyright) with fade
      const footerTimer = setTimeout(() => {
        setShowFooter(true);
      }, 3500);

      // Step 6: Show welcome popup (random 12-15 seconds)
      const randomDelay = 12000 + Math.random() * 3000;
      const welcomeTimer = setTimeout(() => {
        setShowWelcomePopup(true);
      }, randomDelay);

      return () => {
        clearTimeout(frameTimer);
        clearTimeout(promptTimer);
        clearTimeout(cursorTimer);
        clearTimeout(titleStartTimer);
        clearTimeout(footerTimer);
        clearTimeout(welcomeTimer);
      };
    }
  }, [phase]);


  // Handle Esc key to close popups and menu
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

  // Shop dots animation
  useEffect(() => {
    if (activeSection === 'shop') {
      setShopDots('');
      const interval = setInterval(() => {
        setShopDots(prev => prev.length >= 3 ? '' : prev + '.');
      }, 400);
      return () => clearInterval(interval);
    }
  }, [activeSection]);

  // Spinner animation for copyright
  useEffect(() => {
    const interval = setInterval(() => {
      setSpinner(prev => (prev + 1) % 4);
    }, 150);
    return () => clearInterval(interval);
  }, []);

  // About typing effect - only types once per session, not on every open
  useEffect(() => {
    if (activeSection === 'about' && !aboutHasTyped) {
      const fullText = `${t.aboutText1} ${t.aboutText2} ${t.aboutText3}`;
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

      const startDelay = setTimeout(() => {
        typeNextChar();
      }, 300);

      return () => {
        clearTimeout(startDelay);
      };
    }
  }, [activeSection, aboutHasTyped, t]);

  // Dragging logic for welcome popup - supports both mouse and touch
  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    const rect = (e.target as HTMLElement).closest('.popup-window')?.getBoundingClientRect();
    if (rect) {
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      setDragOffset({
        x: clientX - rect.left,
        y: clientY - rect.top,
      });
      setIsDragging('welcome');
    }
  };

  useEffect(() => {
    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (isDragging) {
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
        setWelcomePos({
          x: clientX - dragOffset.x,
          y: clientY - dragOffset.y,
        });
      }
    };
    const handleEnd = () => setIsDragging(null);

    if (isDragging) {
      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseup', handleEnd);
      window.addEventListener('touchmove', handleMove);
      window.addEventListener('touchend', handleEnd);
    }
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging, dragOffset]);

  const showMainContent = phase === 'main';

  // Windows 95 style button
  const win95Button = {
    backgroundColor: '#c0c0c0',
    border: 'none',
    boxShadow: 'inset -1px -1px 0 #0a0a0a, inset 1px 1px 0 #ffffff, inset -2px -2px 0 #808080, inset 2px 2px 0 #dfdfdf',
  };

  // Classic Windows font
  const winFont = 'Fixedsys, Terminal, "Perfect DOS VGA 437", "Lucida Console", Consolas, monospace';

  const frameInset = '60px';
  const contentInset = '80px';

  // Win95 popup component (only used for welcome popup now)
  const Win95Popup = ({
    title,
    children,
    onClose,
    position,
    width = '340px'
  }: {
    title: string;
    children: React.ReactNode;
    onClose: () => void;
    position: { x: number; y: number };
    width?: string;
  }) => (
    <div
      className="popup-window"
      style={{
        position: 'fixed',
        top: position.y || '50%',
        left: position.x || '50%',
        transform: position.x || position.y ? 'none' : 'translate(-50%, -50%)',
        zIndex: 150,
      }}
    >
      <div
        style={{
          backgroundColor: '#c0c0c0',
          border: '2px solid',
          borderColor: '#ffffff #0a0a0a #0a0a0a #ffffff',
          boxShadow: '1px 1px 0 #000',
          width,
        }}
      >
        <div
          onMouseDown={handleDragStart}
          onTouchStart={handleDragStart}
          style={{
            background: 'linear-gradient(90deg, #000080, #1084d0)',
            padding: '3px 4px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            cursor: isDragging ? 'grabbing' : 'grab',
            userSelect: 'none',
          }}
        >
          <span style={{ color: 'white', fontFamily: '"MS Sans Serif", Arial, sans-serif', fontSize: '12px', fontWeight: 'bold' }}>
            {title}
          </span>
          <button
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            onMouseDown={(e) => e.stopPropagation()}
            style={{
              width: '20px',
              height: '18px',
              fontSize: '14px',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              padding: 0,
              fontFamily: 'Arial, sans-serif',
              color: '#000',
              lineHeight: 1,
              ...win95Button,
            }}
          >
            ×
          </button>
        </div>
        <div style={{ padding: '16px 20px' }}>
          {children}
        </div>
      </div>
    </div>
  );

  return (
    <main
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: phase === 'off' ? '#000' : '#0000FF',
        margin: 0,
        padding: 0,
        transition: phase === 'off' ? 'background-color 0.3s' : 'none',
      }}
    >
      {/* Single line frame border */}
      <div
        style={{
          position: 'absolute',
          top: frameInset,
          left: frameInset,
          right: frameInset,
          bottom: frameInset,
          display: showMainContent ? 'block' : 'none',
          pointerEvents: 'none',
          border: '1px solid rgba(255,255,255,0.4)',
          opacity: showFrame ? 1 : 0,
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
          display: (phase === 'boot' || phase === 'loading') ? 'flex' : 'none',
        }}
      >
        {/* Logo - appears first */}
        <div
          style={{
            marginBottom: '1rem',
            width: '86%',
            aspectRatio: '1',
            position: 'relative',
            opacity: showLogo ? 1 : 0,
            transition: 'none',
          }}
        >
          <Image
            src="/superself-logo-wh.png"
            alt="superself"
            fill
            style={{ objectFit: 'contain' }}
            priority
          />
        </div>
        {/* Loader - appears after logo (fixed height to prevent layout shift) */}
        <div style={{
          opacity: showLoader ? 1 : 0,
          height: '1.2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          {(phase === 'boot' || phase === 'loading') && <LoadingDots key={rebootCount} onComplete={handleLoadingComplete} />}
        </div>
      </div>

      {/* === CONFIRM PHASE - "WILL YOU CONTINUE?" === */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          display: phase === 'confirm' ? 'block' : 'none',
          fontFamily: winFont,
          color: 'white',
          textAlign: 'left',
        }}
      >
        <div style={{ fontSize: 'clamp(1.1rem, 3.5vw, 1.6rem)', marginBottom: '1.5rem', letterSpacing: '0.05em' }}>
          {typedConfirm}
          <span className={showConfirmCursor && !typedYes ? 'blink' : ''} style={{ opacity: showConfirmCursor && !typedYes ? 1 : 0 }}>_</span>
        </div>
        <div style={{ fontSize: 'clamp(1rem, 3vw, 1.3rem)', marginLeft: '1rem' }}>
          {/* YES option */}
          <div
            onClick={() => showSelector && handleConfirmSelect('yes')}
            style={{
              cursor: showSelector ? 'pointer' : 'default',
              marginBottom: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              visibility: typedYes ? 'visible' : 'hidden',
            }}
          >
            <span
              className={showSelector && selectedOption === 'yes' ? 'blink-slow' : ''}
              style={{ opacity: showSelector && selectedOption === 'yes' ? 1 : 0 }}
            >
              ▶
            </span>
            <span>{typedYes}</span>
          </div>
          {/* NO option */}
          <div
            onClick={() => showSelector && handleConfirmSelect('no')}
            style={{
              cursor: showSelector ? 'pointer' : 'default',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              visibility: typedNo ? 'visible' : 'hidden',
            }}
          >
            <span
              className={showSelector && selectedOption === 'no' ? 'blink-slow' : ''}
              style={{ opacity: showSelector && selectedOption === 'no' ? 1 : 0 }}
            >
              ▶
            </span>
            <span>{typedNo}</span>
          </div>
        </div>
      </div>

      {/* === SHUTDOWN PHASE === */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          display: phase === 'shutdown' ? 'block' : 'none',
          fontFamily: winFont,
          color: 'white',
          fontSize: 'clamp(0.9rem, 2.5vw, 1.2rem)',
          textAlign: 'center',
        }}
      >
        {shutdownText}
      </div>

      {/* === MAIN CONTENT === */}


      {/* Top Left - CLI Logo */}
      <div
        style={{
          position: 'absolute',
          top: contentInset,
          left: contentInset,
          display: showMainContent ? 'block' : 'none',
          fontFamily: winFont,
          fontSize: 'clamp(1.5rem, 5vw, 2.5rem)',
          color: '#000080',
          backgroundColor: '#c0c0c0',
          padding: '4px 10px',
          visibility: showTitlePrompt ? 'visible' : 'hidden',
          cursor: 'pointer',
        }}
        onClick={handleReplayEntrance}
      >
        <span style={{ opacity: showTitlePrompt ? 1 : 0 }}>&gt; </span>{typedTitle}<span className={showTitleCursor ? 'blink' : ''} style={{ opacity: showTitleCursor ? 1 : 0 }}>_</span>
      </div>

      {/* Center - ASCII Art (contained within frame) */}
      <div
        style={{
          position: 'absolute',
          top: frameInset,
          left: frameInset,
          right: frameInset,
          bottom: frameInset,
          display: showMainContent ? 'flex' : 'none',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: showFooter ? 1 : 0,
          transition: 'opacity 1.5s ease-in-out',
          pointerEvents: 'none',
          overflow: 'hidden',
        }}
      >
        <AsciiArt color="white" isVisible={showFooter} />
      </div>

      {/* Social icons - bottom right outside frame, vertical */}
      <div
        className="social-icons-container"
        style={{
          position: 'absolute',
          bottom: frameInset,
          right: '10px',
          display: showMainContent ? 'flex' : 'none',
          flexDirection: 'column',
          gap: '8px',
          opacity: showFooter ? 1 : 0,
          transition: 'opacity 0.6s ease-in-out',
        }}
      >
        <a
          href="https://www.instagram.com/superself__/"
          target="_blank"
          rel="noopener noreferrer"
          className="social-icon"
          title="Instagram"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
          </svg>
        </a>
        <a
          href="https://soundcloud.com/superself-music"
          target="_blank"
          rel="noopener noreferrer"
          className="social-icon"
          title="SoundCloud"
        >
          <svg width="18" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M7 17.939h-1v-8.068c.308-.231.639-.429 1-.566v8.634zm3 0h1v-9.224c-.229.265-.443.548-.621.857l-.379-.184v8.551zm-2 0h1v-8.848c-.508-.079-.623-.05-1-.01v8.858zm-4 0h1v-7.02c-.312.458-.555.971-.692 1.535l-.308-.182v5.667zm-3-5.25c-.606.547-1 1.354-1 2.268 0 .914.394 1.721 1 2.268v-4.536zm18.879-.671c-.204-2.837-2.404-5.079-5.117-5.079-1.022 0-1.964.328-2.762.877v10.123h9.089c1.607 0 2.911-1.393 2.911-3.106 0-2.233-2.168-3.772-4.121-2.815zm-16.879-.027c-.302-.024-.526-.03-1 .122v5.689h1v-5.811z"/>
          </svg>
        </a>
        <span
          onClick={handleCopyEmail}
          className="social-icon"
          title="flavio@superself.online"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M0 3v18h24v-18h-24zm21.518 2l-9.518 7.713-9.518-7.713h19.036zm-19.518 14v-11.817l10 8.104 10-8.104v11.817h-20z"/>
          </svg>
        </span>
      </div>

      {/* Top Right - Burger Menu */}
      <div
        style={{
          position: 'absolute',
          right: contentInset,
          top: contentInset,
          display: showMainContent ? 'flex' : 'none',
          flexDirection: 'column',
          alignItems: 'flex-end',
          opacity: showFooter ? 1 : 0,
          transition: 'opacity 0.6s ease-in-out',
        }}
      >
        {/* Burger Icon */}
        <span
          onClick={() => setShowMenuDropdown(!showMenuDropdown)}
          style={{
            fontFamily: winFont,
            fontSize: 'clamp(1.5rem, 5vw, 2.5rem)',
            color: '#000080',
            backgroundColor: '#c0c0c0',
            cursor: 'pointer',
            padding: '6px 14px',
            fontWeight: 'bold',
            lineHeight: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {showMenuDropdown ? '✕' : '≡'}
        </span>

        {/* Dropdown Menu */}
        {showMenuDropdown && (
          <div
            style={{
              marginTop: '16px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              gap: '12px',
            }}
          >
            <span
              className={activeSection === 'about' ? '' : 'nav-cli'}
              onClick={() => {
                setActiveSection(activeSection === 'about' ? null : 'about');
                setShowMenuDropdown(false);
              }}
              style={{
                fontFamily: winFont,
                fontSize: 'clamp(1rem, 3.5vw, 1.2rem)',
                color: activeSection === 'about' ? '#000080' : 'white',
                backgroundColor: activeSection === 'about' ? '#c0c0c0' : undefined,
                cursor: 'pointer',
                padding: '3px 6px',
              }}
            >
              {t.about}<span className="nav-cursor" style={{ color: activeSection === 'about' ? '#000080' : undefined }}>_</span>
            </span>
            <span
              className={activeSection === 'shop' ? '' : 'nav-cli'}
              onClick={() => {
                setActiveSection(activeSection === 'shop' ? null : 'shop');
                setShowMenuDropdown(false);
              }}
              style={{
                fontFamily: winFont,
                fontSize: 'clamp(1rem, 3.5vw, 1.2rem)',
                color: activeSection === 'shop' ? '#000080' : 'white',
                backgroundColor: activeSection === 'shop' ? '#c0c0c0' : undefined,
                cursor: 'pointer',
                padding: '3px 6px',
              }}
            >
              {t.shop}<span className="nav-cursor" style={{ color: activeSection === 'shop' ? '#000080' : undefined }}>_</span>
            </span>
          </div>
        )}
      </div>

      {/* Welcome Popup - Win95 style with 2-step flow */}
      {showWelcomePopup && (
        <Win95Popup title={t.welcomeTitle} onClose={handleCloseWelcome} position={welcomePos} width="300px">
          {welcomeStep === 'message' ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', width: '100%' }}>
                <Image src="/smiley.png" alt=":)" width={48} height={48} style={{ minWidth: '48px', flexShrink: 0 }} />
                <span style={{ fontFamily: '"MS Sans Serif", Arial, sans-serif', fontSize: '11px', color: '#000', lineHeight: '1.5' }}>
                  {t.welcomeMessage}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={handleWelcomeOk}
                  className="win-btn"
                  style={{ fontFamily: '"MS Sans Serif", Arial, sans-serif', fontSize: '11px', color: '#000', padding: '3px 20px', cursor: 'pointer', ...win95Button }}
                >
                  {t.ok}
                </button>
                <button
                  onClick={handleCloseWelcome}
                  className="win-btn"
                  style={{ fontFamily: '"MS Sans Serif", Arial, sans-serif', fontSize: '11px', color: '#000', padding: '3px 16px', cursor: 'pointer', ...win95Button }}
                >
                  {t.close}
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: '12px' }} onMouseDown={(e) => e.stopPropagation()} onTouchStart={(e) => e.stopPropagation()}>
              <span style={{ fontFamily: '"MS Sans Serif", Arial, sans-serif', fontSize: '11px', color: '#000', textAlign: 'left' }}>
                {t.subscribePrompt}
              </span>
              <form onSubmit={handleSubscribe} style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
                <input
                  type="email"
                  value={subscribeEmail}
                  onChange={(e) => setSubscribeEmail(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                  placeholder={t.emailPlaceholder}
                  autoFocus
                  style={{
                    backgroundColor: '#fff',
                    border: '2px inset #808080',
                    color: '#000',
                    padding: '6px 10px',
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
                    className="win-btn"
                    style={{ fontFamily: '"MS Sans Serif", Arial, sans-serif', fontSize: '11px', color: '#000', padding: '3px 20px', cursor: 'pointer', ...win95Button }}
                  >
                    {isSubscribed ? t.subscribed : t.ok}
                  </button>
                  <button
                    type="button"
                    onClick={handleCloseWelcome}
                    className="win-btn"
                    style={{ fontFamily: '"MS Sans Serif", Arial, sans-serif', fontSize: '11px', color: '#000', padding: '3px 16px', cursor: 'pointer', ...win95Button }}
                  >
                    {t.close}
                  </button>
                </div>
              </form>
            </div>
          )}
        </Win95Popup>
      )}

      {/* Subscribed confirmation popup - Win95 style */}
      {showSubscribedPopup && (
        <div
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 160,
          }}
        >
          <div
            style={{
              backgroundColor: '#c0c0c0',
              border: '2px solid',
              borderColor: '#ffffff #0a0a0a #0a0a0a #ffffff',
              boxShadow: '1px 1px 0 #000',
              width: '280px',
            }}
          >
            <div
              style={{
                background: 'linear-gradient(90deg, #000080, #1084d0)',
                padding: '3px 4px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span style={{ color: 'white', fontFamily: '"MS Sans Serif", Arial, sans-serif', fontSize: '12px', fontWeight: 'bold' }}>
                superself.exe
              </span>
            </div>
            <div style={{ padding: '20px 24px', textAlign: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '16px' }}>
                <span style={{ fontSize: '24px' }}>✓</span>
                <span style={{ fontFamily: '"MS Sans Serif", Arial, sans-serif', fontSize: '12px', color: '#000' }}>
                  {t.subscribedMessage}
                </span>
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

      {/* About Panel - MS-DOS Editor style */}
      {activeSection === 'about' && (
        <div
          onClick={() => setActiveSection(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 90,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#a8a8a8',
              border: '2px solid #000',
              boxShadow: '4px 4px 0 rgba(0,0,0,0.5)',
              fontFamily: winFont,
              fontSize: 'clamp(0.85rem, 2.5vw, 1rem)',
              color: '#000',
              width: '520px',
              maxWidth: '85vw',
              padding: 'clamp(16px, 4vw, 24px) clamp(16px, 5vw, 28px)',
              lineHeight: '1.8',
              textAlign: 'center',
            }}
          >
            <p>
              <span style={{ backgroundColor: '#000080', color: '#fff', padding: '2px 6px', fontFamily: 'Arial, sans-serif', fontWeight: 'bold' }}>superself</span> {t.aboutText1} {t.aboutText2} {t.aboutText3}
            </p>
          </div>
        </div>
      )}

      {/* Shop Panel - MS-DOS Editor style */}
      {activeSection === 'shop' && (
        <div
          onClick={() => setActiveSection(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 90,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#a8a8a8',
              border: '2px solid #000',
              boxShadow: '4px 4px 0 rgba(0,0,0,0.5)',
              fontFamily: winFont,
              fontSize: 'clamp(0.85rem, 2.5vw, 1rem)',
              color: '#000',
              width: '340px',
              maxWidth: '85vw',
              padding: 'clamp(16px, 4vw, 24px) clamp(16px, 5vw, 28px)',
              textAlign: 'center',
            }}
          >
            {t.shopMessage.replace('...', '')}<span style={{ display: 'inline-block', width: '1.5em', textAlign: 'left' }}>{shopDots}</span>
          </div>
        </div>
      )}

      {/* Email copied toast - appears at cursor */}
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

      {/* Bottom Left - Notification reminder */}
      {showNotification && (
        <div
          onClick={() => { setShowWelcomePopup(true); setShowNotification(false); }}
          style={{
            position: 'absolute',
            bottom: contentInset,
            left: contentInset,
            cursor: 'pointer',
            fontFamily: winFont,
            fontSize: 'clamp(0.85rem, 2vw, 1rem)',
            color: 'rgba(255,255,255,0.75)',
          }}
        >
          <span className="blink-slow">▶</span> [{t.message}]
        </div>
      )}

      {/* Bottom Left - Language switcher (vertical stack, rotated text) */}
      <div
        className="lang-container"
        style={{
          position: 'absolute',
          bottom: frameInset,
          left: '24px',
          display: showMainContent ? 'flex' : 'none',
          flexDirection: 'column',
          gap: '18px',
          fontFamily: winFont,
          fontSize: 'clamp(0.95rem, 2.2vw, 1.1rem)',
          opacity: showFooter ? 1 : 0,
          transition: 'opacity 0.6s ease-in-out',
        }}
      >
        {(['JP', 'EN', 'ES'] as Language[]).map((lang) => (
          <div
            key={lang}
            onClick={() => setLanguage(lang)}
            style={{
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              writingMode: 'vertical-lr',
              transform: 'rotate(180deg)',
              color: language === lang ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.4)',
              letterSpacing: '0.04em',
            }}
          >
            <span>{language === lang ? '■' : '□'}</span>
            <span>{lang}</span>
          </div>
        ))}
      </div>

      {/* Bottom Center - Copyright */}
      <div
        style={{
          position: 'absolute',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: showMainContent ? 'block' : 'none',
          opacity: showFooter ? 1 : 0,
          transition: 'opacity 0.6s ease-in-out',
        }}
      >
        <span style={{ fontFamily: winFont, fontSize: 'clamp(0.7rem, 1.5vw, 0.8rem)', color: 'rgba(255,255,255,0.35)' }}>
          {'{ superself '}<span>{spinnerChars[spinner]}</span>{' 2026 }'}
        </span>
      </div>
    </main>
  );
}
