'use client';

import { useState, useEffect, useRef } from 'react';
import Image from "next/image";
import LoadingDots from "./LoadingDots";
import AsciiArt, { AsciiArtRef } from "./AsciiArt";

type Phase = 'boot' | 'loading' | 'pause' | 'confirm' | 'shutdown' | 'off' | 'main';
type Language = 'ES' | 'EN' | 'JP';

// Isolated spinner component to prevent re-renders on main component
// This updates every 150ms but only re-renders itself, not the parent
function Spinner() {
  const [frame, setFrame] = useState(0);
  const chars = ['|', '/', '-', '\\'];

  useEffect(() => {
    const interval = setInterval(() => {
      setFrame(prev => (prev + 1) % 4);
    }, 150);
    return () => clearInterval(interval);
  }, []);

  return <span>{chars[frame]}</span>;
}

const translations = {
  ES: {
    welcome: 'BIENVENIDO/A.',
    willYouContinue: 'DESEA CONTINUAR AL SITIO?',
    yes: 'SÍ',
    no: 'NO',
    shuttingDown: 'apagando',
    about: '> acerca',
    shop: '> tienda',
    welcomeTitle: 'superself.exe',
    welcomeMessage: 'Se encontro una invitacion activa.',
    ok: 'OK',
    aboutTitle: 'acerca.txt',
    aboutText: '(2023) es un sello y colectivo de música electrónica. Compartimos mixes, recomendaciones selectas y música original. Nos mueve apoyar proyectos con identidad, acercar artistas a oyentes reales y fomentar una cultura de colaboración. Sonido primero. Poco floro. Energía real.',
    close: 'Cerrar',
    shopTitle: 'tienda.exe',
    shopMessage: 'Tienda próximamente...',
    copyright: '{ superself • 2026 }',
    message: '1 mensaje nuevo',
    allRightsReserved: 'todos los derechos reservados',
    emailCopied: 'email copiado',
    invalidEmail: 'ingresa un email válido',
    subscribe: 'suscribirse',
    subscribePrompt: 'Ingresa tu e-mail para suscribirte! :)',
    emailPlaceholder: 'tu@email.com',
    subscribed: '¡suscrito!',
    subscribedMessage: 'Gracias por suscribirte',
    confirm: 'Confirmar',
    cancel: 'Cancelar',
    skip: 'saltar',
    warningTitle: 'Mensaje del sistema',
    warningMessage: 'El tamano de pantalla puede afectar la experiencia.\nGira el dispositivo o redimensiona la ventana.',
  },
  EN: {
    welcome: 'WELCOME.',
    willYouContinue: 'DO YOU WISH TO CONTINUE?',
    yes: 'YES',
    no: 'NO',
    shuttingDown: 'shutting down',
    about: '> about',
    shop: '> shop',
    welcomeTitle: 'superself.exe',
    welcomeMessage: 'Active invitation found.',
    ok: 'OK',
    aboutTitle: 'about.txt',
    aboutText: '(2023) is an electronic music label and collective. We share mixes, curated recommendations and original music. We support projects with identity, bring artists closer to real listeners and foster a culture of collaboration. Sound first. Less talk. Real energy.',
    close: 'Close',
    shopTitle: 'shop.exe',
    shopMessage: 'Shop coming soon...',
    copyright: '{ superself • 2026 }',
    message: '1 new message',
    allRightsReserved: 'all rights reserved',
    emailCopied: 'email copied',
    invalidEmail: 'enter a valid email',
    subscribe: 'subscribe',
    subscribePrompt: 'Enter your e-mail to subscribe.',
    emailPlaceholder: 'your@email.com',
    subscribed: 'subscribed!',
    subscribedMessage: 'Thanks for subscribing',
    confirm: 'Confirm',
    cancel: 'Cancel',
    skip: 'skip',
    warningTitle: 'System message',
    warningMessage: 'Screen size may affect the experience.\nRotate device or resize window.',
  },
  JP: {
    welcome: 'ようこそ。',
    willYouContinue: '続行しますか?',
    yes: 'はい',
    no: 'いいえ',
    shuttingDown: 'シャットダウン',
    about: '> 概要',
    shop: '> 店舗',
    welcomeTitle: 'superself.exe',
    welcomeMessage: '招待が見つかりました。',
    ok: 'OK',
    aboutTitle: '概要.txt',
    aboutText: '(2023) は電子音楽レーベル＆コレクティブ。ミックス、厳選レコメンド、オリジナル音楽を共有。個性あるプロジェクトを支援し、アーティストと本物のリスナーを繋ぎ、コラボ文化を育む。サウンド優先。余計な言葉なし。リアルなエネルギー。',
    close: '閉じる',
    shopTitle: '店舗.exe',
    shopMessage: 'ショップは近日公開...',
    copyright: '{ superself • 2026 }',
    message: '1件の新着',
    allRightsReserved: '全著作権所有',
    emailCopied: 'コピーしました',
    invalidEmail: '有効なメールを入力',
    subscribe: '登録',
    subscribePrompt: 'メールを入力して登録。',
    emailPlaceholder: 'メール@例.com',
    subscribed: '登録完了!',
    subscribedMessage: '登録ありがとう',
    confirm: '確認',
    cancel: 'キャンセル',
    skip: 'スキップ',
    warningTitle: 'システムメッセージ',
    warningMessage: '画面サイズが体験に影響する可能性があります。\nデバイスを回転またはリサイズ。',
  },
};

export default function Home() {
  const [phase, setPhase] = useState<Phase>('boot');
  const [showLogo, setShowLogo] = useState(false);
  const [showLoader, setShowLoader] = useState(false);
  const [language, setLanguage] = useState<Language>('ES');
  const t = translations[language];
  // Japanese uses middle dot (・) instead of period for animated dots
  const dotChar = language === 'JP' ? '・' : '.';

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
  const [showEmailError, setShowEmailError] = useState(false);
  const [emailErrorPos, setEmailErrorPos] = useState({ x: 0, y: 0 });
  const emailInputRef = useRef<HTMLInputElement>(null);
  const lastClickPos = useRef({ x: 0, y: 0 });
  const [typedAboutText, setTypedAboutText] = useState('');
  const [aboutTypingComplete, setAboutTypingComplete] = useState(false);
  const [subscribeEmail, setSubscribeEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [showSubscribedPopup, setShowSubscribedPopup] = useState(false);
  const [welcomeStep, setWelcomeStep] = useState<'message' | 'subscribe'>('message');
  const [shopDots, setShopDots] = useState('');
  const [aboutHasTyped, setAboutHasTyped] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // Ref for ASCII art ripple creation
  const asciiRef = useRef<AsciiArtRef>(null);

  // Popup positioning (draggable popups)
  const [welcomePos, setWelcomePos] = useState({ x: 0, y: 0 });
  const [aboutPos, setAboutPos] = useState({ x: 0, y: 0 });
  // Track which window is on top (like real Windows)
  const [activeWindow, setActiveWindow] = useState<'welcome' | 'about' | null>(null);
  const [isDragging, setIsDragging] = useState<string | null>(null);

  // Menu dropdown state
  const [showMenuDropdown, setShowMenuDropdown] = useState(false);
  const [burgerVisible, setBurgerVisible] = useState(false);

  // Shutdown animation
  const [shutdownText, setShutdownText] = useState('');

  // Skip mode for fast entrance
  const [skipMode, setSkipMode] = useState(false);

  // Track if replaying entrance (to hide skip button)
  const [isReplaying, setIsReplaying] = useState(false);
  const [replayTrigger, setReplayTrigger] = useState(0);

  // Main screen language scramble effect (use ref to avoid effect re-triggering)
  const isMainLangScramblingRef = useRef(false);
  const [scrambledAbout, setScrambledAbout] = useState('');
  const [scrambledShop, setScrambledShop] = useState('');
  const [scrambledMessage, setScrambledMessage] = useState('');
  const [scrambledCopyright, setScrambledCopyright] = useState('');
  // Additional scramble states for popup/panel content
  const [scrambledWelcomeMsg, setScrambledWelcomeMsg] = useState('');
  const [scrambledAboutText, setScrambledAboutText] = useState('');
  const [scrambledShopMsg, setScrambledShopMsg] = useState('');
  const [scrambledClose, setScrambledClose] = useState('');
  const [scrambledCancel, setScrambledCancel] = useState('');
  const prevMainLangRef = useRef<Language>(language);
  const [rebootCount, setRebootCount] = useState(0);

  // Landscape/problematic aspect ratio detection
  const [showLandscapeWarning, setShowLandscapeWarning] = useState(false);

  // Detect problematic aspect ratio (landscape on small screens)
  useEffect(() => {
    const checkAspectRatio = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const aspectRatio = w / h;
      // Show warning when: landscape (wider than tall) AND short height (mobile/tablet landscape)
      // Threshold: aspect ratio > 1.4 AND height < 500px
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

  // Confirm screen typing
  const [typedWelcome, setTypedWelcome] = useState('');
  const [welcomeDots, setWelcomeDots] = useState('');
  const [typedConfirm, setTypedConfirm] = useState('');
  const [typedYes, setTypedYes] = useState('');
  const [typedNo, setTypedNo] = useState('');
  const [showSelector, setShowSelector] = useState(false);
  const [confirmLangVisible, setConfirmLangVisible] = useState(false); // Stays true once shown
  const [isConfirmScrambling, setIsConfirmScrambling] = useState(false); // For language change scramble
  const prevLangRef = useRef<Language>(language); // Track previous language

  // Ref to track all active timers/intervals for proper cleanup
  const confirmTimersRef = useRef<{ timers: NodeJS.Timeout[], intervals: NodeJS.Timeout[] }>({ timers: [], intervals: [] });

  // Scramble effect characters (used in multiple places)
  // Include Japanese katakana for smoother JP scramble effect
  const scrambleCharsBase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  const scrambleCharsJP = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン';
  const scrambleChars = language === 'JP' ? scrambleCharsJP : scrambleCharsBase;

  // Reset confirm screen state when language changes during confirm phase
  // This ensures the typing animation restarts with the new language
  useEffect(() => {
    if (phase === 'confirm' && prevLangRef.current !== language) {
      // Language changed during confirm - reset all typed text
      setTypedWelcome('');
      setWelcomeDots('');
      setTypedConfirm('');
      setTypedYes('');
      setTypedNo('');
      setShowSelector(false);
      setShowConfirmCursor(false);
      // Update ref so we don't trigger this again
      prevLangRef.current = language;
    }
  }, [language, phase]);

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

  const handleCopyEmail = async (e: React.MouseEvent | React.TouchEvent) => {
    const clientX = 'touches' in e ? e.touches[0]?.clientX || 0 : e.clientX;
    const clientY = 'touches' in e ? e.touches[0]?.clientY || 0 : e.clientY;
    const email = 'flavio@superself.online';

    try {
      // Try modern clipboard API first
      await navigator.clipboard.writeText(email);
    } catch {
      // Fallback for iOS Safari: use textarea trick
      const textarea = document.createElement('textarea');
      textarea.value = email;
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

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    // Basic email validation: has @, has text before and after @, has dot after @
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (emailRegex.test(subscribeEmail)) {
      // TODO: Send to mailing list service (Mailchimp, Buttondown, etc.)
      setSubscribeEmail('');
      setShowWelcomePopup(false);
      setWelcomeStep('message');
      setShowSubscribedPopup(true);
    } else {
      // Show error toast at mouse position
      setEmailErrorPos({ x: lastClickPos.current.x, y: lastClickPos.current.y });
      setShowEmailError(true);
      setTimeout(() => setShowEmailError(false), 2000);
    }
  };

  // Replay entrance animation when clicking title
  const handleReplayEntrance = () => {
    // Mark as replaying to hide skip button
    setIsReplaying(true);

    // Close any open sections/popups first
    setActiveSection(null);
    setShowWelcomePopup(false);
    setShowNotification(false);
    setShowMenuDropdown(false);

    // Hide all main content elements immediately
    setShowFrame(false);
    setShowTitlePrompt(false);
    setTypedTitle('');
    setShowTitleCursor(false);
    setShowFooter(false);
    setBurgerVisible(false);

    // Reset about panel typing state
    setTypedAboutText('');
    setAboutTypingComplete(false);
    setAboutHasTyped(false);

    // Reset language scramble states
    setScrambledAbout('');
    setScrambledShop('');
    setScrambledMessage('');
    setScrambledCopyright('');

    // Wait briefly for elements to hide, then restart entrance (snappy)
    setTimeout(() => {
      setReplayTrigger(prev => prev + 1); // Trigger entrance effect re-run
      setIsReplaying(false);
    }, 150);
  };

  // Loading dots state for YES transition
  const [loadingDots, setLoadingDots] = useState('');
  const [showLoadingDots, setShowLoadingDots] = useState(false);

  const handleConfirmSelect = (option: 'yes' | 'no') => {
    if (option === 'yes') {
      // Fade out everything first
      // NOTE: Don't reset showSelector to false - that would re-trigger typing effect
      setConfirmLangVisible(false);
      setTypedWelcome('');
      setTypedConfirm('');
      setTypedYes('');
      setTypedNo('');

      // Show loading dots animation: . then .. then ... then poof
      setShowLoadingDots(true);
      const d = dotChar;
      const loadingTimings = [
        { text: d, delay: 300 },
        { text: d + d, delay: 600 },
        { text: d + d + d, delay: 900 },
        { text: '', delay: 1300 }, // poof
      ];

      loadingTimings.forEach(({ text, delay }) => {
        setTimeout(() => setLoadingDots(text), delay);
      });

      // Then transition to main
      setTimeout(() => {
        setShowLoadingDots(false);
        setPhase('main');
      }, 1600);
    } else {
      // Start shutdown sequence
      setPhase('shutdown');
      const shutBase = t.shuttingDown;

      // 2 full passes + first dot of third pass, then shutdown
      const d = dotChar;
      const dotTimings = [
        { text: shutBase, delay: 0 },
        { text: shutBase + d, delay: 400 },
        { text: shutBase + d + d, delay: 800 },
        { text: shutBase + d + d + d, delay: 1200 },
        { text: shutBase, delay: 1800 },
        { text: shutBase + d, delay: 2200 },
        { text: shutBase + d + d, delay: 2600 },
        { text: shutBase + d + d + d, delay: 3000 },
        { text: shutBase, delay: 3600 },
        { text: shutBase + d, delay: 4000 }, // 7th dot - shutdown after this
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
        setTypedWelcome('');
        setWelcomeDots('');
        setTypedConfirm('');
        setTypedYes('');
        setTypedNo('');
        setShowSelector(false);
        setConfirmLangVisible(false);
        setSelectedOption('yes');
        setShowWelcomePopup(false);
        setActiveSection(null);
        setShowNotification(false);
        setShowMenuDropdown(false);
        setBurgerVisible(false);
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

  // Skip to main handler - elegant transition
  const handleSkip = () => {
    // Clear any existing timers
    clearAllConfirmTimers();
    // Hide all current content
    setShowLogo(false);
    setShowLoader(false);
    setTypedWelcome('');
    setTypedConfirm('');
    setTypedYes('');
    setTypedNo('');
    setShowSelector(false);
    setConfirmLangVisible(false);
    // Enable skip mode for faster entrance
    setSkipMode(true);
    // Brief pause on blue, then go to main
    setTimeout(() => {
      setPhase('main');
    }, 400);
  };

  // Typing effect for confirm screen - hacker style
  // Only runs when typing hasn't completed yet (showSelector is false)
  const [showConfirmCursor, setShowConfirmCursor] = useState(false);

  // Helper to add timer/interval to tracking ref
  const addTimer = (timer: NodeJS.Timeout) => {
    confirmTimersRef.current.timers.push(timer);
    return timer;
  };
  const addInterval = (interval: NodeJS.Timeout) => {
    confirmTimersRef.current.intervals.push(interval);
    return interval;
  };

  // Clear all tracked timers/intervals
  const clearAllConfirmTimers = () => {
    confirmTimersRef.current.timers.forEach(t => clearTimeout(t));
    confirmTimersRef.current.intervals.forEach(i => clearInterval(i));
    confirmTimersRef.current = { timers: [], intervals: [] };
  };

  useEffect(() => {
    // Don't re-run if selector is already shown (typing complete) - let scramble effect handle language changes
    if (phase === 'confirm' && !showSelector && !isConfirmScrambling) {
      // Clear any existing timers first
      clearAllConfirmTimers();

      const welcomeText = t.welcome;
      const confirmText = t.willYouContinue;
      const yesText = t.yes;
      const noText = t.no;
      let welcomeIndex = 0;
      let confirmIndex = 0;
      let yesIndex = 0;
      let noIndex = 0;

      setTypedWelcome('');
      setWelcomeDots('');
      setTypedConfirm('');
      setTypedYes('');
      setTypedNo('');
      setShowSelector(false);
      setShowConfirmCursor(false);

      // First show blinking cursor, then start typing
      addTimer(setTimeout(() => {
        setShowConfirmCursor(true);
      }, 300));

      addTimer(setTimeout(() => {
        // Type WELCOME first
        const welcomeInterval = addInterval(setInterval(() => {
          if (welcomeIndex < welcomeText.length) {
            setTypedWelcome(welcomeText.slice(0, welcomeIndex + 1));
            welcomeIndex++;
          } else {
            clearInterval(welcomeInterval);

            // Animate dots: . then .. then ...
            let dotCount = 0;
            const dotsInterval = addInterval(setInterval(() => {
              dotCount++;
              setWelcomeDots(dotChar.repeat(dotCount));
              if (dotCount >= 3) {
                clearInterval(dotsInterval);

                // Pause after dots, then type the question
                addTimer(setTimeout(() => {
                  const confirmInterval = addInterval(setInterval(() => {
                    if (confirmIndex < confirmText.length) {
                      setTypedConfirm(confirmText.slice(0, confirmIndex + 1));
                      confirmIndex++;
                    } else {
                      clearInterval(confirmInterval);

                      // Pause, then type YES
                      addTimer(setTimeout(() => {
                        const yesInterval = addInterval(setInterval(() => {
                          if (yesIndex < yesText.length) {
                            setTypedYes(yesText.slice(0, yesIndex + 1));
                            yesIndex++;
                          } else {
                            clearInterval(yesInterval);

                            // Small pause, then type NO
                            addTimer(setTimeout(() => {
                              const noInterval = addInterval(setInterval(() => {
                                if (noIndex < noText.length) {
                                  setTypedNo(noText.slice(0, noIndex + 1));
                                  noIndex++;
                                } else {
                                  clearInterval(noInterval);

                                  // Show selector after everything is typed
                                  addTimer(setTimeout(() => {
                                    setShowSelector(true);
                                    setConfirmLangVisible(true);
                                  }, 400));
                                }
                              }, 80));
                            }, 200));
                          }
                        }, 80));
                      }, 400));
                    }
                  }, 50));
                }, 600)); // Pause after dots
              }
            }, 300)); // Dot animation speed
          }
        }, 70));
      }, 1000));

      return () => {
        clearAllConfirmTimers();
      };
    }
  }, [phase, t, showSelector, isConfirmScrambling, dotChar]);

  // Language change scramble effect for confirm screen
  useEffect(() => {
    if (phase !== 'confirm' || !showSelector || isConfirmScrambling) return;

    // Check if language actually changed
    if (prevLangRef.current !== language) {
      const prevLang = prevLangRef.current;
      prevLangRef.current = language;

      // Get old and new texts
      const oldConfirm = translations[prevLang].willYouContinue;
      const newConfirm = t.willYouContinue;
      const oldYes = translations[prevLang].yes;
      const newYes = t.yes;
      const oldNo = translations[prevLang].no;
      const newNo = t.no;

      setIsConfirmScrambling(true);

      // Scramble all text simultaneously
      let frame = 0;
      const maxFrames = 15;

      const scrambleInterval = setInterval(() => {
        frame++;

        // Calculate how many chars to lock (progressive reveal)
        const confirmLocked = Math.floor((frame / maxFrames) * newConfirm.length);
        const yesLocked = Math.floor((frame / maxFrames) * newYes.length);
        const noLocked = Math.floor((frame / maxFrames) * newNo.length);

        // Build scrambled strings
        let confirmDisplay = '';
        for (let i = 0; i < newConfirm.length; i++) {
          if (i < confirmLocked) {
            confirmDisplay += newConfirm[i];
          } else {
            confirmDisplay += scrambleChars[Math.floor(Math.random() * scrambleChars.length)];
          }
        }

        let yesDisplay = '';
        for (let i = 0; i < newYes.length; i++) {
          if (i < yesLocked) {
            yesDisplay += newYes[i];
          } else {
            yesDisplay += scrambleChars[Math.floor(Math.random() * scrambleChars.length)];
          }
        }

        let noDisplay = '';
        for (let i = 0; i < newNo.length; i++) {
          if (i < noLocked) {
            noDisplay += newNo[i];
          } else {
            noDisplay += scrambleChars[Math.floor(Math.random() * scrambleChars.length)];
          }
        }

        setTypedConfirm(confirmDisplay);
        setTypedYes(yesDisplay);
        setTypedNo(noDisplay);

        if (frame >= maxFrames) {
          // Final values
          setTypedConfirm(newConfirm);
          setTypedYes(newYes);
          setTypedNo(newNo);
          clearInterval(scrambleInterval);
          setIsConfirmScrambling(false);
        }
      }, 50);

      return () => clearInterval(scrambleInterval);
    }
  }, [language, phase, showSelector, isConfirmScrambling, t, scrambleChars]);

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

  // Main content entrance sequence - frame first, then title scramble
  // Uses faster timings when skipMode is enabled
  useEffect(() => {
    if (phase === 'main') {
      const titleText = 'superself';
      let scrambleFrame = 0;
      let scrambleInterval: NodeJS.Timeout | null = null;

      // Timings depend on skip mode
      // Skip mode: faster but still shows the sequence properly
      // Normal: deliberate pacing for first-time experience
      const timings = skipMode
        ? { frame: 300, title: 800, footer: 1500, burger: 2000, popup: 12000 }
        : { frame: 800, title: 1500, footer: 3500, burger: 5000, popup: 18000 + Math.random() * 4000 };

      // Step 1: Show frame first
      const frameTimer = setTimeout(() => {
        setShowFrame(true);
      }, timings.frame);

      // Step 2: Start title scramble after frame is visible
      const titleTimer = setTimeout(() => {
        setShowTitlePrompt(true);
        setShowTitleCursor(true);

        // Per-character lock frame targets (randomized for organic feel)
        // Faster lock in skip mode
        const lockMultiplier = skipMode ? 8 : 14;
        const lockTargets = titleText.split('').map((_, i) => {
          const baseDelay = (i + 1) * lockMultiplier;
          const randomVariation = Math.floor(Math.random() * 8) - 4;
          return baseDelay + randomVariation;
        });
        const isLocked = new Array(titleText.length).fill(false);

        // Scramble animation (faster interval in skip mode)
        const scrambleSpeed = skipMode ? 30 : 55;
        scrambleInterval = setInterval(() => {
          scrambleFrame++;

          let display = '';
          let allLocked = true;

          for (let i = 0; i < titleText.length; i++) {
            if (!isLocked[i] && scrambleFrame >= lockTargets[i]) {
              isLocked[i] = true;
            }

            if (isLocked[i]) {
              display += titleText[i];
            } else {
              display += scrambleChars[Math.floor(Math.random() * scrambleChars.length)];
              allLocked = false;
            }
          }
          setTypedTitle(display);

          if (allLocked) {
            setTypedTitle(titleText);
            if (scrambleInterval) clearInterval(scrambleInterval);
            // Reset skip mode after entrance complete
            if (skipMode) setSkipMode(false);
          }
        }, scrambleSpeed);
      }, timings.title);

      // Step 3: Show ASCII background
      const bgTimer = setTimeout(() => {
        setShowFooter(true);
      }, timings.footer);

      // Step 4: Show burger (icons and language)
      const burgerTimer = setTimeout(() => {
        setBurgerVisible(true);
      }, timings.burger);

      // Step 5: Show welcome popup
      const welcomeTimer = setTimeout(() => {
        setShowWelcomePopup(true);
      }, timings.popup);

      return () => {
        if (scrambleInterval) clearInterval(scrambleInterval);
        clearTimeout(frameTimer);
        clearTimeout(titleTimer);
        clearTimeout(bgTimer);
        clearTimeout(burgerTimer);
        clearTimeout(welcomeTimer);
      };
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, replayTrigger]);


  // Language change scramble effect for main screen
  useEffect(() => {
    if (phase !== 'main' || isMainLangScramblingRef.current) return;

    // Check if language changed
    if (prevMainLangRef.current !== language) {
      const prevLang = prevMainLangRef.current;
      prevMainLangRef.current = language;

      // Get old and new texts - nav items
      const oldAbout = translations[prevLang].about;
      const newAbout = t.about;
      const oldShop = translations[prevLang].shop;
      const newShop = t.shop;
      const oldMessage = translations[prevLang].message;
      const newMessage = t.message;
      const oldCopyright = translations[prevLang].allRightsReserved;
      const newCopyright = t.allRightsReserved;
      // Popup/panel content
      const oldWelcomeMsg = translations[prevLang].welcomeMessage;
      const newWelcomeMsg = t.welcomeMessage;
      const oldAboutText = translations[prevLang].aboutText;
      const newAboutText = t.aboutText;
      const oldShopMsg = translations[prevLang].shopMessage;
      const newShopMsg = t.shopMessage;
      const newClose = t.close;
      const newCancel = t.cancel;

      isMainLangScramblingRef.current = true;

      // Scramble all visible text simultaneously
      let frame = 0;
      const maxFrames = 18;

      const scrambleInterval = setInterval(() => {
        frame++;

        // Progressive reveal for each text (preserves spaces to prevent overflow)
        const scrambleText = (newText: string) => {
          const locked = Math.floor((frame / maxFrames) * newText.length);
          let result = '';
          for (let i = 0; i < newText.length; i++) {
            if (i < locked) {
              result += newText[i];
            } else if (newText[i] === ' ' || newText[i] === '\n') {
              // Preserve whitespace to maintain text width
              result += newText[i];
            } else {
              result += scrambleChars[Math.floor(Math.random() * scrambleChars.length)];
            }
          }
          return result;
        };

        setScrambledAbout(scrambleText(newAbout));
        setScrambledShop(scrambleText(newShop));
        setScrambledMessage(scrambleText(newMessage));
        setScrambledCopyright(scrambleText(newCopyright));
        setScrambledWelcomeMsg(scrambleText(newWelcomeMsg));
        setScrambledAboutText(scrambleText(newAboutText));
        setScrambledShopMsg(scrambleText(newShopMsg));
        setScrambledClose(scrambleText(newClose));
        setScrambledCancel(scrambleText(newCancel));

        if (frame >= maxFrames) {
          // Final values - clear scrambled states to show actual translations
          setScrambledAbout('');
          setScrambledShop('');
          setScrambledMessage('');
          setScrambledCopyright('');
          setScrambledWelcomeMsg('');
          setScrambledAboutText('');
          setScrambledShopMsg('');
          setScrambledClose('');
          setScrambledCancel('');
          clearInterval(scrambleInterval);
          isMainLangScramblingRef.current = false;
        }
      }, 40);

      return () => clearInterval(scrambleInterval);
    }
  }, [language, phase, t, scrambleChars]);

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
        setShopDots(prev => prev.length >= 3 ? '' : prev + dotChar);
      }, 400);
      return () => clearInterval(interval);
    }
  }, [activeSection, dotChar]);


  // About typing effect - only types once per session, not on every open
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

      const startDelay = setTimeout(() => {
        typeNextChar();
      }, 300);

      return () => {
        clearTimeout(startDelay);
      };
    }
  }, [activeSection, aboutHasTyped, t]);

  // Dragging logic for popups - supports both mouse and touch
  const handleDragStart = (e: React.MouseEvent | React.TouchEvent, popupId: string) => {
    e.preventDefault(); // Prevent text selection

    const popup = (e.target as HTMLElement).closest('.popup-window');
    const rect = popup?.getBoundingClientRect();
    if (rect) {
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

      // If popup is centered (position is 0,0), convert to absolute position first
      const currentPos = popupId === 'welcome' ? welcomePos : aboutPos;
      if (currentPos.x === 0 && currentPos.y === 0) {
        const initialPos = { x: rect.left, y: rect.top };
        if (popupId === 'welcome') {
          setWelcomePos(initialPos);
        } else if (popupId === 'about') {
          setAboutPos(initialPos);
        }
      }

      const offsetX = clientX - rect.left;
      const offsetY = clientY - rect.top;

      // Define handlers
      const handleMove = (moveEvent: MouseEvent | TouchEvent) => {
        if ('touches' in moveEvent) {
          moveEvent.preventDefault();
          if (!moveEvent.touches[0]) return;
        }
        const moveX = 'touches' in moveEvent ? moveEvent.touches[0].clientX : moveEvent.clientX;
        const moveY = 'touches' in moveEvent ? moveEvent.touches[0].clientY : moveEvent.clientY;

        const newPos = { x: moveX - offsetX, y: moveY - offsetY };
        if (popupId === 'welcome') {
          setWelcomePos(newPos);
        } else if (popupId === 'about') {
          setAboutPos(newPos);
        }
      };

      const handleEnd = () => {
        document.removeEventListener('mousemove', handleMove);
        document.removeEventListener('mouseup', handleEnd);
        document.removeEventListener('touchmove', handleMove);
        document.removeEventListener('touchend', handleEnd);
        document.removeEventListener('touchcancel', handleEnd);
        setIsDragging(null);
      };

      // Attach listeners immediately
      document.addEventListener('mousemove', handleMove);
      document.addEventListener('mouseup', handleEnd);
      document.addEventListener('touchmove', handleMove, { passive: false });
      document.addEventListener('touchend', handleEnd);
      document.addEventListener('touchcancel', handleEnd);

      setIsDragging(popupId);
    }
  };

  const showMainContent = phase === 'main';

  // Windows 95 style button
  const win95Button = {
    backgroundColor: '#c0c0c0',
    border: 'none',
    boxShadow: 'inset -1px -1px 0 #0a0a0a, inset 1px 1px 0 #ffffff, inset -2px -2px 0 #808080, inset 2px 2px 0 #dfdfdf',
  };

  // Classic Windows font - VT323 loaded via CSS variable, fallbacks for system fonts
  const winFont = 'var(--font-terminal), VT323, Fixedsys, Terminal, Consolas, monospace';

  // Frame and content insets with safe-area support for iOS
  // Tighter margins on mobile (30px min vs 60px max)
  const frameInset = 'max(clamp(30px, 5vw, 60px), env(safe-area-inset-top, 0px))';
  const frameInsetBottom = 'max(clamp(30px, 5vw, 60px), env(safe-area-inset-bottom, 0px))';
  const contentInset = 'max(clamp(45px, 7vw, 80px), env(safe-area-inset-top, 0px))';
  const contentInsetBottom = 'max(clamp(45px, 7vw, 80px), env(safe-area-inset-bottom, 0px))';

  // Win95 popup component (only used for welcome popup now)
  const Win95Popup = ({
    title,
    children,
    onClose,
    position,
    width = '340px',
    windowId = 'welcome'
  }: {
    title: string;
    children: React.ReactNode;
    onClose: () => void;
    position: { x: number; y: number };
    width?: string;
    windowId?: 'welcome' | 'about';
  }) => (
    <div
      className="popup-window"
      onMouseDown={() => setActiveWindow(windowId)}
      style={{
        position: 'fixed',
        top: position.y || '50%',
        left: position.x || '50%',
        transform: position.x || position.y ? 'none' : 'translate(-50%, -50%)',
        zIndex: activeWindow === windowId ? 160 : 150,
        userSelect: 'none',
        WebkitUserSelect: 'none',
      }}
    >
      <div
        style={{
          backgroundColor: '#c0c0c0',
          border: '2px solid',
          borderColor: '#ffffff #0a0a0a #0a0a0a #ffffff',
          boxShadow: '1px 1px 0 #000',
          width,
          minWidth: width,
          maxWidth: width,
        }}
      >
        {/* Titlebar - only this is draggable */}
        <div
          onMouseDown={(e) => { e.preventDefault(); handleDragStart(e, windowId); }}
          onTouchStart={(e) => { e.preventDefault(); handleDragStart(e, windowId); }}
          style={{
            background: 'linear-gradient(90deg, #000080, #1084d0)',
            padding: '6px 6px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            cursor: isDragging === windowId ? 'grabbing' : 'grab',
            touchAction: 'none',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ marginTop: '-1px' }}>
              <rect x="1" y="3" width="14" height="10" fill="#c0c0c0" stroke="#000" strokeWidth="1"/>
              <rect x="3" y="5" width="10" height="6" fill="#000080"/>
              <rect x="0" y="12" width="16" height="3" fill="#808080"/>
            </svg>
            <span style={{ color: 'white', fontFamily: 'Segoe UI, Tahoma, sans-serif', fontSize: '11px', fontWeight: 600 }}>
              {title}
            </span>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            onTouchEnd={(e) => e.stopPropagation()}
            style={{
              width: '20px',
              height: '18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              padding: 0,
              touchAction: 'manipulation',
              backgroundColor: '#c0c0c0',
              border: 'none',
              boxShadow: 'inset -1px -1px 0 #0a0a0a, inset 1px 1px 0 #dfdfdf',
            }}
          >
            <svg width="10" height="9" viewBox="0 0 8 7" fill="none">
              <path d="M0 0H2V1H3V2H5V1H6V0H8V1H7V2H6V3H5V4H6V5H7V6H8V7H6V6H5V5H3V6H2V7H0V6H1V5H2V4H3V3H2V2H1V1H0V0Z" fill="#000"/>
            </svg>
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
        height: '100dvh', // Dynamic viewport height - fixes Safari mobile URL bar
        minHeight: '-webkit-fill-available', // Fallback for older Safari
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
          bottom: frameInsetBottom,
          display: showMainContent ? 'block' : 'none',
          pointerEvents: 'none',
          border: '1px solid rgba(255,255,255,0.4)',
          opacity: showFrame ? 1 : 0,
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

      {/* === CONFIRM PHASE - "BIENVENIDO" then question === */}
      {/* key={language} forces complete re-render when language changes, restarting typing animation */}
      <div
        key={`confirm-${language}`}
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          display: phase === 'confirm' ? 'block' : 'none',
          fontFamily: winFont,
          color: 'white',
          textAlign: 'left',
          width: 'clamp(280px, 70vw, 450px)', // Fixed width so text types from left edge
        }}
      >
        {/* Loading dots - shown after YES is clicked, same position as welcome text */}
        {showLoadingDots ? (
          <div style={{
            fontSize: 'clamp(1.4rem, 5vw, 2.2rem)',
            letterSpacing: '0.2em',
          }}>
            {loadingDots}
          </div>
        ) : (
          <>
            {/* BIENVENIDO/A... line - disappears when question starts */}
            <div style={{
              fontSize: 'clamp(1.4rem, 5vw, 2.2rem)',
              marginBottom: '1rem',
              letterSpacing: '0.05em',
              display: typedConfirm ? 'none' : 'block',
            }}>
              {typedWelcome}{welcomeDots}
              <span className={showConfirmCursor && !welcomeDots ? 'blink' : ''} style={{ opacity: showConfirmCursor && welcomeDots.length < 3 ? 1 : 0 }}>_</span>
            </div>
            {/* Question line - appears after welcome disappears */}
            <div style={{ fontSize: 'clamp(1.4rem, 5vw, 2.2rem)', marginBottom: '1.5rem', letterSpacing: '0.05em', display: typedConfirm ? 'block' : 'none' }}>
              {typedConfirm}
              <span className={typedConfirm && !typedYes ? 'blink' : ''} style={{ opacity: typedConfirm && !typedYes ? 1 : 0 }}>_</span>
            </div>
            <div style={{ fontSize: 'clamp(1.2rem, 4vw, 1.6rem)', marginLeft: '1rem' }}>
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
          </>
        )}
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
          fontSize: 'clamp(1.2rem, 4vw, 1.8rem)',
          textAlign: 'center',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
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
          fontSize: 'clamp(2.25rem, 7.5vw, 3.75rem)',
          color: 'white',
          visibility: showTitlePrompt ? 'visible' : 'hidden',
          cursor: 'pointer',
          zIndex: 10,
        }}
        onClick={handleReplayEntrance}
      >
        <span style={{ opacity: showTitlePrompt ? 1 : 0 }}>&gt; </span>{typedTitle}<span className={showTitleCursor ? 'blink' : ''} style={{ opacity: showTitleCursor ? 1 : 0 }}>_</span>
      </div>

      {/* Center - ASCII Art (contained within frame) */}
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
          opacity: showFooter ? 1 : 0,
          transition: 'opacity 1.5s ease-in-out',
          overflow: 'hidden',
          zIndex: 1,
          cursor: 'crosshair',
        }}
      >
        <AsciiArt ref={asciiRef} color="white" isVisible={showFooter} />
      </div>

      {/* Social icons - bottom right INSIDE frame, vertical */}
      <div
        className="social-icons-container"
        style={{
          position: 'absolute',
          bottom: contentInsetBottom,
          right: contentInset,
          display: showMainContent ? 'flex' : 'none',
          flexDirection: 'column',
          gap: '12px',
          opacity: showFooter ? 1 : 0,
          transition: 'opacity 0.6s ease-in-out',
          zIndex: 10,
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
          opacity: burgerVisible ? 1 : 0,
          transition: 'opacity 0.6s ease-in-out',
          zIndex: 10,
        }}
      >
        {/* Burger Icon - bigger on mobile for better touch target */}
        <span
          onClick={() => setShowMenuDropdown(!showMenuDropdown)}
          style={{
            backgroundColor: '#c0c0c0',
            color: '#000080',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: 'clamp(48px, 10vw, 56px)',
            width: 'clamp(48px, 10vw, 56px)',
          }}
        >
          {showMenuDropdown ? (
            <svg style={{ width: '60%', height: '60%' }} viewBox="0 0 20 20" fill="none">
              <path d="M4 4L16 16M16 4L4 16" stroke="#000080" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
          ) : (
            <svg style={{ width: '60%', height: '60%' }} viewBox="0 0 20 20" fill="none">
              <path d="M3 5H17M3 10H17M3 15H17" stroke="#000080" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
          )}
        </span>

        {/* Dropdown Menu */}
        {showMenuDropdown && (
          <div
            style={{
              marginTop: '28px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              gap: '20px',
            }}
          >
            <span
              className={activeSection === 'about' ? '' : 'nav-cli'}
              onClick={() => {
                setActiveSection(activeSection === 'about' ? null : 'about');
              }}
              style={{
                fontFamily: winFont,
                fontSize: 'clamp(1.1rem, 4vw, 1.4rem)',
                color: activeSection === 'about' ? '#000080' : 'white',
                backgroundColor: activeSection === 'about' ? '#c0c0c0' : undefined,
                cursor: 'pointer',
                padding: '4px 8px',
              }}
            >
              {scrambledAbout || t.about}<span className="nav-cursor" style={{ color: activeSection === 'about' ? '#000080' : undefined }}>_</span>
            </span>
            <span
              className={activeSection === 'shop' ? '' : 'nav-cli'}
              onClick={() => {
                setActiveSection(activeSection === 'shop' ? null : 'shop');
              }}
              style={{
                fontFamily: winFont,
                fontSize: 'clamp(1.1rem, 4vw, 1.4rem)',
                color: activeSection === 'shop' ? '#000080' : 'white',
                backgroundColor: activeSection === 'shop' ? '#c0c0c0' : undefined,
                cursor: 'pointer',
                padding: '4px 8px',
              }}
            >
              {scrambledShop || t.shop}<span className="nav-cursor" style={{ color: activeSection === 'shop' ? '#000080' : undefined }}>_</span>
            </span>
          </div>
        )}
      </div>

      {/* Welcome Popup - Win95 style with 2-step flow */}
      {showWelcomePopup && (
        <Win95Popup title={t.welcomeTitle} onClose={handleCloseWelcome} position={welcomePos} width="250px">
          {welcomeStep === 'message' ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px', minWidth: '200px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%' }}>
                <Image src="/smiley.svg" alt=":)" width={48} height={48} style={{ flexShrink: 0 }} />
                <span style={{ fontFamily: '"MS Sans Serif", Arial, sans-serif', fontSize: '11px', color: '#000', lineHeight: '1.4', minWidth: '140px' }}>
                  {scrambledWelcomeMsg || t.welcomeMessage}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', width: '100%' }}>
                <button
                  onClick={handleWelcomeOk}
                  onMouseDown={(e) => e.stopPropagation()}
                  onTouchStart={(e) => e.stopPropagation()}
                  onTouchEnd={(e) => { e.stopPropagation(); e.preventDefault(); handleWelcomeOk(); }}
                  className="win-btn"
                  style={{ fontFamily: '"MS Sans Serif", Arial, sans-serif', fontSize: '11px', color: '#000', padding: '8px 20px', minWidth: '50px', cursor: 'pointer', ...win95Button }}
                >
                  {t.ok}
                </button>
                <button
                  onClick={handleCloseWelcome}
                  onMouseDown={(e) => e.stopPropagation()}
                  onTouchStart={(e) => e.stopPropagation()}
                  onTouchEnd={(e) => { e.stopPropagation(); e.preventDefault(); handleCloseWelcome(); }}
                  className="win-btn"
                  style={{ fontFamily: '"MS Sans Serif", Arial, sans-serif', fontSize: '11px', color: '#000', padding: '8px 0', width: '75px', minWidth: '75px', maxWidth: '75px', textAlign: 'center', cursor: 'pointer', ...win95Button }}
                >
                  {scrambledClose || t.close}
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }} onMouseDown={(e) => e.stopPropagation()} onTouchStart={(e) => e.stopPropagation()}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%' }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
                  <rect x="2" y="5" width="20" height="14" fill="#ffffcc" stroke="#808080" strokeWidth="1"/>
                  <path d="M2 5 L12 13 L22 5" stroke="#808080" strokeWidth="1" fill="none"/>
                  <rect x="3" y="6" width="18" height="12" fill="none" stroke="#fff" strokeWidth="0.5"/>
                </svg>
                <span style={{ fontFamily: '"MS Sans Serif", Arial, sans-serif', fontSize: '11px', color: '#000', textAlign: 'left', lineHeight: '1.5' }}>
                  {t.subscribePrompt}
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
                    {isSubscribed ? t.subscribed : t.confirm}
                  </button>
                  <button
                    type="button"
                    onClick={handleCloseWelcome}
                    onTouchStart={(e) => e.stopPropagation()}
                    onTouchEnd={(e) => { e.stopPropagation(); e.preventDefault(); handleCloseWelcome(); }}
                    className="win-btn"
                    style={{ fontFamily: '"MS Sans Serif", Arial, sans-serif', fontSize: '11px', color: '#000', padding: '8px 0', width: '75px', minWidth: '75px', maxWidth: '75px', textAlign: 'center', cursor: 'pointer', ...win95Button }}
                  >
                    {scrambledCancel || t.cancel}
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ marginTop: '-1px' }}>
                <rect x="1" y="3" width="14" height="10" fill="#c0c0c0" stroke="#000" strokeWidth="1"/>
                <rect x="3" y="5" width="10" height="6" fill="#000080"/>
                <rect x="0" y="12" width="16" height="3" fill="#808080"/>
              </svg>
              <span style={{ color: 'white', fontFamily: 'Segoe UI, Tahoma, sans-serif', fontSize: '11px', fontWeight: 600 }}>
                superself.exe
              </span>
            </div>
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

      {/* About Panel - MS-DOS Editor style, draggable */}
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
            onMouseDown={(e) => { setActiveWindow('about'); handleDragStart(e, 'about'); }}
            onTouchStart={(e) => { setActiveWindow('about'); handleDragStart(e, 'about'); }}
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
              position: aboutPos.x || aboutPos.y ? 'fixed' : 'relative',
              top: aboutPos.y || undefined,
              left: aboutPos.x || undefined,
              cursor: isDragging === 'about' ? 'grabbing' : 'grab',
              pointerEvents: 'auto',
            }}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              padding: '6px 6px 0 6px',
            }}>
              <button
                onClick={(e) => { e.stopPropagation(); setActiveSection(null); setAboutPos({ x: 0, y: 0 }); }}
                onMouseDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
                onTouchEnd={(e) => e.stopPropagation()}
                style={{
                  width: '28px',
                  height: '26px',
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
                  <path d="M0 0H2V1H3V2H5V1H6V0H8V1H7V2H6V3H5V4H6V5H7V6H8V7H6V6H5V5H3V6H2V7H0V6H1V5H2V4H3V3H2V2H1V1H0V0Z" fill="#000"/>
                </svg>
              </button>
            </div>
            <div style={{ padding: '10px clamp(16px, 5vw, 28px) clamp(28px, 4vw, 36px)', overflow: 'hidden' }}>
              <p style={{ wordBreak: 'break-word' }}>
                <span style={{ backgroundColor: '#000080', color: '#fff', padding: '2px 6px', fontFamily: 'Arial, sans-serif', fontWeight: 'bold' }}>superself</span> {scrambledAboutText || t.aboutText}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Shop Panel - MS-DOS Editor style */}
      {activeSection === 'shop' && (
        <div
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
            pointerEvents: 'none',
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
              width: '280px',
              maxWidth: '85vw',
              textAlign: 'center',
              position: 'relative',
              pointerEvents: 'auto',
            }}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              padding: '6px 6px 0 6px',
            }}>
              <button
                onClick={(e) => { e.stopPropagation(); setActiveSection(null); }}
                onMouseDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
                onTouchEnd={(e) => e.stopPropagation()}
                style={{
                  width: '28px',
                  height: '26px',
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
                  <path d="M0 0H2V1H3V2H5V1H6V0H8V1H7V2H6V3H5V4H6V5H7V6H8V7H6V6H5V5H3V6H2V7H0V6H1V5H2V4H3V3H2V2H1V1H0V0Z" fill="#000"/>
                </svg>
              </button>
            </div>
            <div style={{ padding: '10px clamp(16px, 5vw, 28px) clamp(28px, 4vw, 36px)' }}>
              {(scrambledShopMsg || t.shopMessage).replace('...', '')}<span style={{ display: 'inline-block', width: '1.5em', textAlign: 'left' }}>{shopDots}</span>
            </div>
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

      {/* Invalid email toast - appears near input field */}
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

      {/* Bottom Left - Notification reminder */}
      {showNotification && (
        <div
          onClick={() => { setShowWelcomePopup(true); setShowNotification(false); }}
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
          <span className="blink-slow" style={{ backgroundColor: 'rgba(255,255,255,0.15)', padding: '2px 4px' }}>▶</span> [{scrambledMessage || t.message}]
        </div>
      )}

      {/* Language switcher - visible during confirm and main phases */}
      {/* During main: positioned outside frame on left, between edge and frame */}
      {/* Large and spaced like Keita Yamada's reference */}
      <div
        className="lang-container"
        style={{
          position: 'absolute',
          bottom: phase === 'confirm' ? 'clamp(80px, 15vh, 120px)' : 'clamp(30px, 5vw, 60px)',
          left: phase === 'confirm' ? '50%' : 'clamp(8px, 2vw, 18px)',
          transform: phase === 'confirm' ? 'translateX(-50%)' : 'none',
          display: (phase === 'confirm' || phase === 'main') ? 'flex' : 'none',
          flexDirection: phase === 'confirm' ? 'row' : 'column-reverse',
          gap: phase === 'confirm' ? '24px' : 'clamp(16px, 4vw, 24px)',
          fontFamily: winFont,
          fontSize: 'clamp(1rem, 2.5vw, 1.15rem)',
          opacity: (phase === 'confirm' && confirmLangVisible) || (phase === 'main' && showFooter) ? 1 : 0,
          transition: 'opacity 0.6s ease-in-out',
          zIndex: 200,
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

      {/* Bottom Center - Copyright */}
      {/* Positioned centered between frame bottom and screen edge */}
      <div
        style={{
          position: 'absolute',
          bottom: 'max(clamp(10px, 2.5vw, 25px), env(safe-area-inset-bottom, 0px))',
          left: '50%',
          transform: 'translateX(-50%)',
          display: showMainContent ? 'block' : 'none',
          opacity: showFooter ? 1 : 0,
          transition: 'opacity 0.6s ease-in-out',
        }}
      >
        <span style={{ fontFamily: winFont, fontSize: 'clamp(0.6rem, 1.2vw, 0.75rem)', color: 'rgba(255,255,255,0.35)', whiteSpace: 'nowrap' }}>
          {'{ superself '}<Spinner />{` 2026 - ${scrambledCopyright || t.allRightsReserved} }`}
        </span>
      </div>

      {/* Skip button - visible only during confirm phase (after preloader) */}
      {/* Positioned bottom-left */}
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
          <span>{t.skip}</span>
        </div>
      )}

      {/* Landscape/aspect ratio warning overlay */}
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
                  <path d="M0 0H2V1H3V2H5V1H6V0H8V1H7V2H6V3H5V4H6V5H7V6H8V7H6V6H5V5H3V6H2V7H0V6H1V5H2V4H3V3H2V2H1V1H0V0Z" fill="#808080"/>
                </svg>
              </button>
            </div>
            <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <svg width="32" height="29" viewBox="0 0 32 29" fill="none" style={{ flexShrink: 0, marginTop: '2px' }}>
                {/* Gray shadow */}
                <path d="M18 4H20V5H21V6H22V8H23V10H24V12H25V14H26V16H27V18H28V20H29V22H30V26H29V27H6V26H7V25H27V24H26V22H25V20H24V18H23V16H22V14H21V12H20V10H19V8H18V4Z" fill="#808080"/>
                {/* Black outline */}
                <path d="M14 2H18V4H19V6H20V8H21V10H22V12H23V14H24V16H25V18H26V20H27V24H4V20H5V18H6V16H7V14H8V12H9V10H10V8H11V6H12V4H13V2H14Z" fill="#000"/>
                {/* Yellow fill */}
                <path d="M15 4H17V6H18V8H19V10H20V12H21V14H22V16H23V18H24V20H25V22H6V20H7V18H8V16H9V14H10V12H11V10H12V8H13V6H14V4H15Z" fill="#FFFF00"/>
                {/* Exclamation mark */}
                <rect x="15" y="8" width="2" height="8" fill="#000"/>
                <rect x="15" y="18" width="2" height="2" fill="#000"/>
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
