'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { products, shopTranslations, getProductName, getWhatsAppLink } from '../data/products';
import type { Language } from '../types';
import { WIN_FONT, WIN95_STYLES, SCRAMBLE_CHARS } from '../constants';
import Win95Button from './Win95Button';

interface ShopProps {
  language: Language;
  onClose: () => void;
  position?: { x: number; y: number };
  isActive?: boolean;
  onActivate?: () => void;
  onDragStart?: (e: React.MouseEvent | React.TouchEvent) => void;
  isDragging?: boolean;
}

// Animated dots component
function AnimatedDots({ char = '.', width = '1.5em' }: { char?: string; width?: string }) {
  const [dots, setDots] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + char);
    }, 400);
    return () => clearInterval(interval);
  }, [char]);

  return <span style={{ display: 'inline-block', width, textAlign: 'left' }}>{dots}</span>;
}

export default function Shop({
  language,
  onClose,
  position = { x: 0, y: 0 },
  isActive = true,
  onActivate,
  onDragStart,
  isDragging = false
}: ShopProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [isMobile, setIsMobile] = useState(false);
  const t = shopTranslations[language];

  // Detect mobile on mount
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // UI state
  const [pressedButton, setPressedButton] = useState<string | null>(null);

  // Touch swipe state
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  // Scramble effect state
  const prevLangRef = useRef<Language>(language);
  const [scrambledWhatsApp, setScrambledWhatsApp] = useState('');
  const [scrambledMoreSoon, setScrambledMoreSoon] = useState('');
  const [scrambledProductNames, setScrambledProductNames] = useState<Record<number, string>>({});
  const [scrambledTitle, setScrambledTitle] = useState('');

  const currentProduct = products[currentIndex];
  const scrambleChars = language === 'JP' ? SCRAMBLE_CHARS.japanese : SCRAMBLE_CHARS.base;

  const goPrev = useCallback(() => {
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
  }, [currentIndex]);

  const goNext = useCallback(() => {
    if (currentIndex < products.length - 1) setCurrentIndex(currentIndex + 1);
  }, [currentIndex]);

  const goTo = useCallback((index: number) => {
    setCurrentIndex(index);
  }, []);

  const handleWhatsAppClick = useCallback(() => {
    window.open(getWhatsAppLink(currentProduct, language, selectedSize), '_blank');
  }, [currentProduct, language, selectedSize]);

  // Language change scramble effect
  useEffect(() => {
    if (prevLangRef.current !== language) {
      prevLangRef.current = language;

      const newWhatsApp = t.whatsappButton;
      const newMoreSoon = t.moreSoon;
      const newTitle = t.shopTitle;

      let frame = 0;
      const maxFrames = 8;

      // Width-aware scramble: use base chars for ASCII positions, JP chars for CJK
      // This prevents wide CJK chars from replacing narrow Latin chars and blowing out containers
      const baseChars = SCRAMBLE_CHARS.base;
      const jpChars = SCRAMBLE_CHARS.japanese;
      const scrambleText = (text: string, locked: number) => {
        let result = '';
        for (let i = 0; i < text.length; i++) {
          if (i < locked) {
            result += text[i];
          } else if (text[i] === ' ') {
            result += ' ';
          } else {
            // Use matching-width charset: ASCII char → base scramble, CJK char → JP scramble
            const code = text.charCodeAt(i);
            const isWide = code > 0x7F;
            const chars = isWide ? jpChars : baseChars;
            result += chars[Math.floor(Math.random() * chars.length)];
          }
        }
        return result;
      };

      const interval = setInterval(() => {
        frame++;
        const whatsAppLocked = Math.floor((frame / maxFrames) * newWhatsApp.length);
        const moreSoonLocked = Math.floor((frame / maxFrames) * newMoreSoon.length);
        const titleLocked = Math.floor((frame / maxFrames) * newTitle.length);

        setScrambledWhatsApp(scrambleText(newWhatsApp, whatsAppLocked));
        setScrambledMoreSoon(scrambleText(newMoreSoon, moreSoonLocked));
        setScrambledTitle(scrambleText(newTitle, titleLocked));

        // Scramble product names
        const newScrambledNames: Record<number, string> = {};
        products.forEach((product) => {
          const name = getProductName(product, language);
          const locked = Math.floor((frame / maxFrames) * name.length);
          newScrambledNames[product.id] = scrambleText(name, locked);
        });
        setScrambledProductNames(newScrambledNames);

        if (frame >= maxFrames) {
          clearInterval(interval);
          setScrambledWhatsApp('');
          setScrambledMoreSoon('');
          setScrambledTitle('');
          setScrambledProductNames({});
        }
      }, 40);

      return () => {
        clearInterval(interval);
        setScrambledWhatsApp('');
        setScrambledMoreSoon('');
        setScrambledTitle('');
        setScrambledProductNames({});
      };
    }
  }, [language, t, scrambleChars]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'ArrowRight') goNext();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goPrev, goNext]);

  // Touch swipe handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;

    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const deltaX = touchEndX - touchStartX.current;
    const deltaY = touchEndY - touchStartY.current;

    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
      if (deltaX > 0) {
        goPrev();
      } else {
        goNext();
      }
    }

    touchStartX.current = null;
    touchStartY.current = null;
  }, [goPrev, goNext]);

  // Responsive sizes - compact spacing, larger elements
  const sizes = {
    // Window
    windowWidth: isMobile ? '94vw' : 'clamp(480px, 38vw, 620px)',
    windowPadding: isMobile ? '10px' : '14px',

    // Title bar - match superself.exe popup style
    titleBarPadding: '4px 6px',
    closeButtonSize: { w: 22, h: 20 },

    // Arrow buttons
    arrowSize: isMobile ? '36px' : 'clamp(38px, 3vw, 44px)',
    arrowFontSize: isMobile ? '14px' : 'clamp(15px, 1.2vw, 18px)',

    // Polaroid - exaggerated bottom padding for classic polaroid look
    polaroidMaxWidth: isMobile ? '220px' : 'clamp(220px, 20vw, 300px)',
    polaroidPadding: isMobile
      ? '8px 8px 38px 8px'
      : '10px 10px 60px 10px',

    // Typography - increased for better desktop readability
    productNameSize: isMobile ? '1.1rem' : 'clamp(1.25rem, 1.5vw, 1.6rem)',
    priceSize: isMobile ? '1.5rem' : 'clamp(1.7rem, 2vw, 2.2rem)',

    // Size buttons
    sizeButtonFont: isMobile ? '16px' : 'clamp(17px, 1.3vw, 20px)',
    sizeButtonPadding: isMobile ? '8px 20px' : '10px 24px',
    sizeButtonMinWidth: isMobile ? '52px' : '56px',

    // WhatsApp button
    whatsAppIconSize: isMobile ? 22 : 26,
    whatsAppFont: isMobile ? '15px' : 'clamp(16px, 1.3vw, 19px)',

    // Footer text
    footerFontSize: isMobile ? '0.85rem' : 'clamp(0.95rem, 1vw, 1.1rem)',
  };

  return (
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
        zIndex: isActive ? 160 : 90,
        pointerEvents: 'none',
        paddingBottom: 0,
      }}
    >
      <div
        className="popup-window"
        onMouseDown={() => onActivate?.()}
        onTouchStart={() => onActivate?.()}
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: 'var(--win95-bg, #c0c0c0)',
          border: '2px solid',
          borderColor: 'var(--win95-highlight, #dfdfdf) var(--win95-shadow, #0a0a0a) var(--win95-shadow, #0a0a0a) var(--win95-highlight, #dfdfdf)',
          boxShadow: '2px 2px 0 #000',
          fontFamily: WIN_FONT,
          color: 'var(--win95-text, #000)',
          width: sizes.windowWidth,
          maxWidth: '94vw',
          position: position.x || position.y ? 'fixed' : 'relative',
          top: position.y || undefined,
          left: position.x || undefined,
          pointerEvents: 'auto',
          overflow: 'hidden',
        }}
      >
        {/* Win95 Title Bar */}
        <div
          onMouseDown={(e) => { if (!isMobile && onDragStart) { e.preventDefault(); onDragStart(e); } }}
          style={{
            background: WIN95_STYLES.titlebarGradient,
            padding: sizes.titleBarPadding,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: isMobile ? 'default' : (isDragging ? 'grabbing' : 'grab'),
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ marginTop: '-1px' }}>
              <path
                d="M4 2 L1 4 L1 7 L4 7 L4 14 L12 14 L12 7 L15 7 L15 4 L12 2 L10 2 L10 3 C10 4 9 5 8 5 C7 5 6 4 6 3 L6 2 Z"
                fill="#fff"
                stroke="var(--win95-text, #000)"
                strokeWidth="1"
              />
              <path d="M6 2 L8 4 L10 2" fill="none" stroke="var(--win95-dark, #808080)" strokeWidth="0.5"/>
            </svg>
            <span style={{
              color: 'white',
              fontFamily: 'Segoe UI, Tahoma, sans-serif',
              fontSize: '13px',
              fontWeight: 600,
            }}>
              {scrambledTitle || t.shopTitle}
            </span>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            style={{
              width: `${sizes.closeButtonSize.w}px`,
              height: `${sizes.closeButtonSize.h}px`,
              backgroundColor: 'var(--win95-bg, #c0c0c0)',
              border: 'none',
              boxShadow: 'inset -1px -1px 0 var(--win95-shadow, #0a0a0a), inset 1px 1px 0 var(--win95-highlight, #dfdfdf), inset -2px -2px 0 var(--win95-dark, #808080), inset 2px 2px 0 var(--win95-highlight, #dfdfdf)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 0,
            }}
          >
            <svg width="10" height="9" viewBox="0 0 8 7" fill="none">
              <path d="M0 0H2V1H3V2H5V1H6V0H8V1H7V2H6V3H5V4H6V5H7V6H8V7H6V6H5V5H3V6H2V7H0V6H1V5H2V4H3V3H2V2H1V1H0V0Z" fill="var(--win95-text, #000)"/>
            </svg>
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: sizes.windowPadding, overflow: 'hidden' }}>

          {/* Dots indicator - at top */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '6px',
            marginTop: isMobile ? '4px' : '6px',
            marginBottom: isMobile ? '14px' : '18px',
          }}>
            {products.map((product, index) => (
              <button
                key={index}
                onClick={() => goTo(index)}
                aria-label={`Go to product ${index + 1}`}
                style={{
                  width: isMobile ? '20px' : '24px',
                  height: isMobile ? '6px' : '7px',
                  padding: 0,
                  backgroundColor: index === currentIndex ? 'var(--nav-hover-fg, #000080)' : 'var(--win95-disabled, #a0a0a0)',
                  border: 'none',
                  boxShadow: index === currentIndex ? 'none' : 'inset -1px -1px 0 var(--win95-dark, #808080), inset 1px 1px 0 var(--win95-highlight, #dfdfdf)',
                  cursor: 'pointer',
                }}
              />
            ))}
          </div>

          {/* Carousel */}
          <div
            aria-roledescription="carousel"
            aria-label="Products"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: isMobile ? '10px' : '14px',
              marginTop: isMobile ? '4px' : '6px',
              marginBottom: isMobile ? '8px' : '10px',
            }}
          >
            {/* Left Arrow */}
            <button
              onClick={goPrev}
              disabled={currentIndex === 0}
              aria-label="Previous product"
              onMouseDown={() => currentIndex > 0 && setPressedButton('left')}
              onMouseUp={() => setPressedButton(null)}
              onMouseLeave={() => pressedButton === 'left' && setPressedButton(null)}
              onTouchStart={() => currentIndex > 0 && setPressedButton('left')}
              onTouchEnd={() => setPressedButton(null)}
              style={{
                width: sizes.arrowSize,
                height: sizes.arrowSize,
                backgroundColor: currentIndex === 0 ? 'var(--win95-disabled, #a0a0a0)' : 'var(--win95-bg, #c0c0c0)',
                border: 'none',
                boxShadow: currentIndex === 0
                  ? 'inset 1px 1px 0 var(--win95-dark, #808080)'
                  : pressedButton === 'left'
                    ? 'inset 1px 1px 0 var(--win95-shadow, #0a0a0a), inset -1px -1px 0 var(--win95-highlight, #dfdfdf), inset 2px 2px 0 var(--win95-dark, #808080), inset -2px -2px 0 var(--win95-highlight, #dfdfdf)'
                    : 'inset -1px -1px 0 var(--win95-shadow, #0a0a0a), inset 1px 1px 0 var(--win95-highlight, #dfdfdf), inset -2px -2px 0 var(--win95-dark, #808080), inset 2px 2px 0 var(--win95-highlight, #dfdfdf)',
                cursor: currentIndex === 0 ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <span style={{
                fontFamily: WIN_FONT,
                fontSize: sizes.arrowFontSize,
                color: currentIndex === 0 ? 'var(--win95-dark, #808080)' : 'var(--win95-text, #000)',
              }}>
                ◀
              </span>
            </button>

            {/* Product Display */}
            <div
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              style={{
                flex: 1,
                overflow: 'hidden',
                position: 'relative',
                touchAction: 'pan-y',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  transform: `translateX(calc(-${currentIndex * 65}% + ${currentIndex * 50}px + 17.5%))`,
                  transition: 'transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              >
                {products.map((product, index) => {
                  const name = getProductName(product, language);
                  const isActiveProduct = index === currentIndex;
                  const distance = Math.abs(index - currentIndex);

                  return (
                    <div
                      key={product.id}
                      onClick={() => goTo(index)}
                      style={{
                        minWidth: '65%',
                        marginLeft: index === 0 ? '0' : '-50px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        opacity: isActiveProduct ? 1 : distance === 1 ? 0.6 : 0.2,
                        transform: isActiveProduct ? 'scale(1)' : 'scale(0.82)',
                        transition: 'all 0.35s ease-out',
                        cursor: isActiveProduct ? 'default' : 'pointer',
                        filter: isActiveProduct ? 'none' : 'grayscale(40%)',
                        zIndex: isActiveProduct ? 10 : 5 - distance,
                        position: 'relative',
                      }}
                    >
                      {/* Polaroid frame */}
                      <div
                        style={{
                          position: 'relative',
                          width: '100%',
                          maxWidth: sizes.polaroidMaxWidth,
                          backgroundColor: '#fff',
                          padding: sizes.polaroidPadding,
                          boxShadow: isActiveProduct
                            ? '0 4px 8px rgba(0,0,0,0.3), 0 2px 4px rgba(0,0,0,0.2)'
                            : '0 2px 4px rgba(0,0,0,0.2)',
                          transform: isActiveProduct ? 'rotate(0deg)' : index < currentIndex ? 'rotate(-3deg)' : 'rotate(3deg)',
                          transition: 'all 0.35s ease-out',
                        }}
                      >
                        {/* Image container with grey background */}
                        <div style={{
                          position: 'relative',
                          aspectRatio: '1',
                          overflow: 'hidden',
                          backgroundColor: '#e8e8e8',
                        }}>
                          <Image
                            src={product.image}
                            alt={name}
                            fill
                            priority={isActiveProduct}
                            style={{ objectFit: 'contain' }}
                          />
                        </div>
                      </div>

                      {/* Product Name */}
                      <div
                        style={{
                          fontFamily: WIN_FONT,
                          fontSize: sizes.productNameSize,
                          color: 'var(--win95-text, #000)',
                          textAlign: 'center',
                          marginTop: isMobile ? '12px' : '16px',
                          fontWeight: 'bold',
                          letterSpacing: '0.06em',
                          opacity: isActiveProduct ? 1 : 0,
                          height: isActiveProduct ? 'auto' : '0',
                          overflow: 'hidden',
                          transition: 'opacity 0.2s ease',
                          width: '100%',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {scrambledProductNames[product.id] || name}
                      </div>

                      {/* Price */}
                      <div
                        style={{
                          fontFamily: 'system-ui, -apple-system, sans-serif',
                          fontSize: sizes.priceSize,
                          textAlign: 'center',
                          marginTop: isMobile ? '10px' : '12px',
                          marginBottom: isMobile ? '4px' : '6px',
                          color: 'var(--win95-text, #000)',
                          opacity: isActiveProduct ? 1 : 0,
                          height: isActiveProduct ? 'auto' : '0',
                          overflow: 'hidden',
                          transition: 'opacity 0.2s ease',
                          width: '100%',
                        }}
                      >
                        <span style={{ textDecoration: 'line-through', opacity: 0.45, fontSize: '0.75em', marginRight: '8px', color: 'var(--win95-dark, #808080)' }}>
                          {t.currency}{product.originalPrice}
                        </span>
                        <span style={{ color: 'var(--nav-hover-fg, #000080)', fontWeight: '700', fontSize: '1.15em' }}>
                          {t.currency}{product.price}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Arrow */}
            <button
              onClick={goNext}
              disabled={currentIndex === products.length - 1}
              aria-label="Next product"
              onMouseDown={() => currentIndex < products.length - 1 && setPressedButton('right')}
              onMouseUp={() => setPressedButton(null)}
              onMouseLeave={() => pressedButton === 'right' && setPressedButton(null)}
              onTouchStart={() => currentIndex < products.length - 1 && setPressedButton('right')}
              onTouchEnd={() => setPressedButton(null)}
              style={{
                width: sizes.arrowSize,
                height: sizes.arrowSize,
                backgroundColor: currentIndex === products.length - 1 ? 'var(--win95-disabled, #a0a0a0)' : 'var(--win95-bg, #c0c0c0)',
                border: 'none',
                boxShadow: currentIndex === products.length - 1
                  ? 'inset 1px 1px 0 var(--win95-dark, #808080)'
                  : pressedButton === 'right'
                    ? 'inset 1px 1px 0 var(--win95-shadow, #0a0a0a), inset -1px -1px 0 var(--win95-highlight, #dfdfdf), inset 2px 2px 0 var(--win95-dark, #808080), inset -2px -2px 0 var(--win95-highlight, #dfdfdf)'
                    : 'inset -1px -1px 0 var(--win95-shadow, #0a0a0a), inset 1px 1px 0 var(--win95-highlight, #dfdfdf), inset -2px -2px 0 var(--win95-dark, #808080), inset 2px 2px 0 var(--win95-highlight, #dfdfdf)',
                cursor: currentIndex === products.length - 1 ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <span style={{
                fontFamily: WIN_FONT,
                fontSize: sizes.arrowFontSize,
                color: currentIndex === products.length - 1 ? 'var(--win95-dark, #808080)' : 'var(--win95-text, #000)',
              }}>
                ▶
              </span>
            </button>
          </div>

          {/* Size selector */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: isMobile ? '8px' : '10px',
              marginTop: isMobile ? '12px' : '16px',
              marginBottom: isMobile ? '14px' : '18px',
            }}
          >
            {t.sizes.map((size) => (
              <button
                key={size}
                onClick={() => setSelectedSize(prev => prev === size ? '' : size)}
                onMouseDown={() => setPressedButton(`size-${size}`)}
                onMouseUp={() => setPressedButton(null)}
                onMouseLeave={() => pressedButton === `size-${size}` && setPressedButton(null)}
                onTouchStart={() => setPressedButton(`size-${size}`)}
                onTouchEnd={() => setPressedButton(null)}
                style={{
                  fontFamily: WIN_FONT,
                  fontSize: sizes.sizeButtonFont,
                  padding: sizes.sizeButtonPadding,
                  width: sizes.sizeButtonMinWidth,
                  boxSizing: 'border-box' as const,
                  textAlign: 'center',
                  cursor: 'pointer',
                  backgroundColor: 'var(--win95-bg, #c0c0c0)',
                  color: selectedSize === size ? 'var(--nav-hover-fg, #000080)' : 'var(--win95-text, #000)',
                  fontWeight: selectedSize === size ? 'bold' : 'normal',
                  border: 'none',
                  boxShadow: selectedSize === size
                    ? 'inset 1px 1px 0 var(--win95-shadow, #0a0a0a), inset -1px -1px 0 var(--win95-highlight, #dfdfdf), inset 2px 2px 0 var(--win95-dark, #808080), inset -2px -2px 0 var(--win95-highlight, #dfdfdf)'
                    : pressedButton === `size-${size}`
                      ? 'inset 1px 1px 0 var(--win95-shadow, #0a0a0a), inset -1px -1px 0 var(--win95-highlight, #dfdfdf), inset 2px 2px 0 var(--win95-dark, #808080), inset -2px -2px 0 var(--win95-highlight, #dfdfdf)'
                      : WIN95_STYLES.button.boxShadow,
                }}
              >
                {size}
              </button>
            ))}
          </div>

          {/* WhatsApp button — Win95 bevel, green icon + text */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: isMobile ? '12px' : '16px', maxWidth: '100%' }}>
            <Win95Button
              onClick={handleWhatsAppClick}
              aria-label="Order via WhatsApp"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                fontFamily: WIN_FONT,
                fontSize: sizes.whatsAppFont,
                padding: '10px 28px',
                maxWidth: '100%',
                minWidth: isMobile ? '70%' : '240px',
              }}
            >
              <svg width={sizes.whatsAppIconSize} height={sizes.whatsAppIconSize} viewBox="0 0 16 16" fill="#25D366" style={{ flexShrink: 0 }}>
                <path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.898 7.898 0 0 0 13.6 2.326zM7.994 14.521a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.557 6.557 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592zm3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.325-.335-.445-.34-.114-.007-.247-.007-.38-.007a.729.729 0 0 0-.529.247c-.182.198-.691.677-.691 1.654 0 .977.71 1.916.81 2.049.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232z" />
              </svg>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {scrambledWhatsApp || t.whatsappButton}
              </span>
            </Win95Button>
          </div>

          {/* Footer text */}
          <div
            style={{
              textAlign: 'center',
              fontFamily: WIN_FONT,
              fontSize: sizes.footerFontSize,
              color: 'var(--win95-dark, #808080)',
              letterSpacing: '0.1em',
              marginTop: isMobile ? '4px' : '6px',
              minHeight: '1.5em',
            }}
          >
            [&nbsp; {scrambledMoreSoon || t.moreSoon}<AnimatedDots char="." width="1.5em" /> &nbsp;]
          </div>
        </div>
      </div>
    </div>
  );
}
