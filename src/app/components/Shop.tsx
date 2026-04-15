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
  transitionStyle?: React.CSSProperties;
}

export default function Shop({
  language,
  onClose,
  position = { x: 0, y: 0 },
  isActive = true,
  onActivate,
  onDragStart,
  isDragging = false,
  transitionStyle,
}: ShopProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [isMobile, setIsMobile] = useState(false);
  const t = shopTranslations[language];

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const [pressedButton, setPressedButton] = useState<string | null>(null);

  // Touch swipe
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  // Scramble state
  const prevLangRef = useRef<Language>(language);
  const [scrambledWhatsApp, setScrambledWhatsApp] = useState('');
  const [scrambledProductNames, setScrambledProductNames] = useState<Record<number, string>>({});
  const [scrambledTitle, setScrambledTitle] = useState('');

  const currentProduct = products[currentIndex];

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

  // Language change scramble
  useEffect(() => {
    if (prevLangRef.current !== language) {
      prevLangRef.current = language;
      const newWhatsApp = t.whatsappButton;
      const newTitle = t.shopTitle;
      let frame = 0;
      const maxFrames = 8;
      const baseChars = SCRAMBLE_CHARS.base;
      const jpChars = SCRAMBLE_CHARS.japanese;
      const scrambleText = (text: string, locked: number) => {
        let result = '';
        for (let i = 0; i < text.length; i++) {
          if (i < locked) { result += text[i]; }
          else if (text[i] === ' ') { result += ' '; }
          else {
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
        const titleLocked = Math.floor((frame / maxFrames) * newTitle.length);
        setScrambledWhatsApp(scrambleText(newWhatsApp, whatsAppLocked));
        setScrambledTitle(scrambleText(newTitle, titleLocked));
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
          setScrambledTitle('');
          setScrambledProductNames({});
        }
      }, 40);
      return () => { clearInterval(interval); setScrambledWhatsApp(''); setScrambledTitle(''); setScrambledProductNames({}); };
    }
  }, [language, t]);

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
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    const deltaY = e.changedTouches[0].clientY - touchStartY.current;
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
      deltaX > 0 ? goPrev() : goNext();
    }
    touchStartX.current = null;
    touchStartY.current = null;
  }, [goPrev, goNext]);

  const name = getProductName(currentProduct, language);
  const displayName = scrambledProductNames[currentProduct.id] || name;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: isActive ? 160 : 90,
        pointerEvents: 'none',
      }}
    >
      <div
        className="popup-window"
        onMouseDown={() => onActivate?.()}
        onTouchStart={() => onActivate?.()}
        onClick={(e) => e.stopPropagation()}
        style={{
          ...transitionStyle,
          backgroundColor: 'var(--win95-bg, #c0c0c0)',
          border: '2px solid',
          borderColor: 'var(--win95-highlight, #dfdfdf) var(--win95-shadow, #0a0a0a) var(--win95-shadow, #0a0a0a) var(--win95-highlight, #dfdfdf)',
          boxShadow: '2px 2px 0 #000',
          fontFamily: WIN_FONT,
          color: 'var(--win95-text, #000)',
          width: isMobile ? '92vw' : 'clamp(340px, 42vw, 520px)',
          maxWidth: '520px',
          position: position.x || position.y ? 'fixed' : 'relative',
          top: position.y || undefined,
          left: position.x || undefined,
          pointerEvents: 'auto',
          overflow: 'hidden',
        }}
      >
        {/* ── Title Bar ── */}
        <div
          onMouseDown={(e) => { if (!isMobile && onDragStart) { e.preventDefault(); onDragStart(e); } }}
          style={{
            background: WIN95_STYLES.titlebarGradient,
            padding: '4px 6px',
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
                fill="#fff" stroke="var(--win95-text, #000)" strokeWidth="1"
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
            {/* Product counter */}
            <span style={{
              color: 'rgba(255,255,255,0.5)',
              fontFamily: 'Segoe UI, Tahoma, sans-serif',
              fontSize: '11px',
              marginLeft: '4px',
            }}>
              [{currentIndex + 1}/{products.length}]
            </span>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            style={{
              ...WIN95_STYLES.closeButton as React.CSSProperties,
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

        {/* ── Content ── */}
        <div style={{ padding: isMobile ? '10px' : '12px' }}>

          {/* Win95 sunken panel — carousel area */}
          <div
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            style={{
              boxShadow: 'inset 1px 1px 0 var(--win95-shadow, #0a0a0a), inset -1px -1px 0 var(--win95-highlight, #dfdfdf), inset 2px 2px 0 var(--win95-dark, #808080)',
              backgroundColor: 'var(--win95-dark, #808080)',
              padding: isMobile ? '10px 6px' : '14px 10px',
              position: 'relative',
              touchAction: 'pan-y',
            }}
          >
            {/* Carousel with arrows */}
            <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '6px' : '10px' }}>
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
                  width: isMobile ? '32px' : 'clamp(34px, 2.5vw, 40px)',
                  height: isMobile ? '32px' : 'clamp(34px, 2.5vw, 40px)',
                  backgroundColor: currentIndex === 0 ? 'var(--win95-disabled, #a0a0a0)' : 'var(--win95-bg, #c0c0c0)',
                  border: 'none',
                  boxShadow: currentIndex === 0
                    ? 'inset 1px 1px 0 var(--win95-dark, #808080)'
                    : pressedButton === 'left' ? WIN95_STYLES.buttonPressed.boxShadow : WIN95_STYLES.button.boxShadow,
                  cursor: currentIndex === 0 ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  fontFamily: WIN_FONT,
                  fontSize: isMobile ? '12px' : '14px',
                  color: currentIndex === 0 ? 'var(--win95-dark, #808080)' : 'var(--win95-text, #000)',
                }}
              >
                ◀
              </button>

              {/* Center: Polaroid product display */}
              <div style={{ flex: 1, display: 'flex', justifyContent: 'center', overflow: 'hidden' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  transform: `translateX(calc(-${currentIndex * 100}%))`,
                  transition: 'transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
                }}>
                  {products.map((product, index) => {
                    const isActive = index === currentIndex;
                    const prodName = getProductName(product, language);
                    return (
                      <div
                        key={product.id}
                        onClick={() => goTo(index)}
                        style={{
                          minWidth: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          opacity: isActive ? 1 : 0.3,
                          transform: isActive ? 'scale(1)' : 'scale(0.85)',
                          transition: 'all 0.35s ease-out',
                          cursor: isActive ? 'default' : 'pointer',
                        }}
                      >
                        {/* Polaroid card — name lives in the bottom white strip */}
                        <div style={{
                          width: '100%',
                          maxWidth: isMobile ? '200px' : 'clamp(200px, 18vw, 260px)',
                          backgroundColor: '#fff',
                          padding: isMobile ? '8px 8px 0 8px' : '10px 10px 0 10px',
                          boxShadow: isActive
                            ? '0 4px 12px rgba(0,0,0,0.35), 0 2px 4px rgba(0,0,0,0.2)'
                            : '0 2px 4px rgba(0,0,0,0.2)',
                          transform: isActive ? 'rotate(0deg)' : index < currentIndex ? 'rotate(-2deg)' : 'rotate(2deg)',
                          transition: 'all 0.35s ease-out',
                        }}>
                          {/* Image */}
                          <div style={{
                            position: 'relative',
                            aspectRatio: '1',
                            overflow: 'hidden',
                            backgroundColor: '#e8e8e8',
                          }}>
                            <Image
                              src={product.image}
                              alt={prodName}
                              fill
                              priority={isActive}
                              style={{ objectFit: 'contain' }}
                            />
                          </div>
                          {/* Name inside polaroid bottom strip */}
                          <div style={{
                            fontFamily: WIN_FONT,
                            fontSize: isMobile ? '0.75rem' : 'clamp(0.8rem, 1vw, 0.95rem)',
                            color: '#333',
                            textAlign: 'center',
                            padding: isMobile ? '8px 2px 10px' : '10px 4px 14px',
                            letterSpacing: '0.04em',
                            lineHeight: 1.3,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical' as const,
                          }}>
                            {scrambledProductNames[product.id] || prodName}
                          </div>
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
                  width: isMobile ? '32px' : 'clamp(34px, 2.5vw, 40px)',
                  height: isMobile ? '32px' : 'clamp(34px, 2.5vw, 40px)',
                  backgroundColor: currentIndex === products.length - 1 ? 'var(--win95-disabled, #a0a0a0)' : 'var(--win95-bg, #c0c0c0)',
                  border: 'none',
                  boxShadow: currentIndex === products.length - 1
                    ? 'inset 1px 1px 0 var(--win95-dark, #808080)'
                    : pressedButton === 'right' ? WIN95_STYLES.buttonPressed.boxShadow : WIN95_STYLES.button.boxShadow,
                  cursor: currentIndex === products.length - 1 ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  fontFamily: WIN_FONT,
                  fontSize: isMobile ? '12px' : '14px',
                  color: currentIndex === products.length - 1 ? 'var(--win95-dark, #808080)' : 'var(--win95-text, #000)',
                }}
              >
                ▶
              </button>
            </div>

            {/* Status bar at bottom of sunken panel */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '5px',
              marginTop: isMobile ? '8px' : '10px',
            }}>
              {products.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goTo(index)}
                  aria-label={`Product ${index + 1}`}
                  style={{
                    width: isMobile ? '18px' : '22px',
                    height: isMobile ? '5px' : '6px',
                    padding: 0,
                    backgroundColor: index === currentIndex ? 'var(--nav-hover-fg, #000080)' : 'var(--win95-bg, #c0c0c0)',
                    border: 'none',
                    boxShadow: index === currentIndex
                      ? 'none'
                      : 'inset -1px -1px 0 var(--win95-highlight, #dfdfdf), inset 1px 1px 0 var(--win95-shadow, #0a0a0a)',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s ease',
                  }}
                />
              ))}
            </div>
          </div>

          {/* ── Price — terminal/DOS style ── */}
          <div style={{
            fontFamily: WIN_FONT,
            fontSize: isMobile ? '1rem' : 'clamp(1.1rem, 1.4vw, 1.3rem)',
            color: 'var(--win95-text, #000)',
            margin: isMobile ? '10px 0 8px' : '12px 0 10px',
            textAlign: 'center',
            letterSpacing: '0.05em',
          }}>
            <span style={{ color: 'var(--win95-dark, #808080)', textDecoration: 'line-through' }}>
              {t.currency}{currentProduct.originalPrice}
            </span>
            <span style={{ color: 'var(--win95-dark, #808080)', margin: '0 6px' }}>&gt;</span>
            <span style={{ color: 'var(--nav-hover-fg, #000080)', fontWeight: 'bold', fontSize: '1.2em' }}>
              {t.currency}{currentProduct.price}
            </span>
          </div>

          {/* ── Size selector ── */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '6px',
            marginBottom: isMobile ? '10px' : '12px',
          }}>
            <span style={{
              fontFamily: WIN_FONT,
              fontSize: isMobile ? '0.7rem' : '0.8rem',
              color: 'var(--win95-dark, #808080)',
              letterSpacing: '0.1em',
            }}>
              {t.selectSize}
            </span>
            <div style={{ display: 'flex', gap: isMobile ? '6px' : '8px' }}>
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
                    fontSize: isMobile ? '14px' : 'clamp(15px, 1.2vw, 18px)',
                    padding: isMobile ? '6px 16px' : '8px 20px',
                    minWidth: isMobile ? '46px' : '50px',
                    boxSizing: 'border-box',
                    textAlign: 'center',
                    cursor: 'pointer',
                    backgroundColor: 'var(--win95-bg, #c0c0c0)',
                    color: selectedSize === size ? 'var(--nav-hover-fg, #000080)' : 'var(--win95-text, #000)',
                    fontWeight: selectedSize === size ? 'bold' : 'normal',
                    border: 'none',
                    boxShadow: selectedSize === size || pressedButton === `size-${size}`
                      ? WIN95_STYLES.buttonPressed.boxShadow
                      : WIN95_STYLES.button.boxShadow,
                  }}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* ── WhatsApp button ── */}
          <Win95Button
            onClick={handleWhatsAppClick}
            aria-label="Order via WhatsApp"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              fontFamily: WIN_FONT,
              fontSize: isMobile ? '14px' : 'clamp(15px, 1.2vw, 18px)',
              padding: '10px 20px',
              width: '100%',
            }}
          >
            <svg width={isMobile ? 20 : 24} height={isMobile ? 20 : 24} viewBox="0 0 16 16" fill="#25D366" style={{ flexShrink: 0 }}>
              <path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.898 7.898 0 0 0 13.6 2.326zM7.994 14.521a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.557 6.557 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592zm3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.325-.335-.445-.34-.114-.007-.247-.007-.38-.007a.729.729 0 0 0-.529.247c-.182.198-.691.677-.691 1.654 0 .977.71 1.916.81 2.049.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232z" />
            </svg>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {scrambledWhatsApp || t.whatsappButton}
            </span>
          </Win95Button>

        </div>
      </div>
    </div>
  );
}
