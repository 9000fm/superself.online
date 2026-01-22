'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { products, shopTranslations, getProductName, getWhatsAppLink, type Language, type Product } from '../data/products';
import { WIN_FONT, WIN95_STYLES, SCRAMBLE_CHARS } from '../constants';

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
  const [selectedSize, setSelectedSize] = useState<string>('M');
  const [isMobile, setIsMobile] = useState(false);
  const t = shopTranslations[language];

  // Detect mobile on mount
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768 || 'ontouchstart' in window);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // UI state
  const [whatsAppHover, setWhatsAppHover] = useState(false);

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
      const maxFrames = 12;

      const scrambleText = (text: string, locked: number) => {
        let result = '';
        for (let i = 0; i < text.length; i++) {
          if (i < locked) {
            result += text[i];
          } else if (text[i] === ' ') {
            result += ' ';
          } else {
            result += scrambleChars[Math.floor(Math.random() * scrambleChars.length)];
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
      }, 35);

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
    priceSize: isMobile ? '1.3rem' : 'clamp(1.5rem, 1.6vw, 1.9rem)',

    // Size buttons
    sizeButtonFont: isMobile ? '14px' : 'clamp(15px, 1.1vw, 18px)',
    sizeButtonPadding: isMobile ? '8px 16px' : '10px 20px',

    // WhatsApp button
    whatsAppFont: isMobile ? '0.9rem' : 'clamp(0.95rem, 1.1vw, 1.2rem)',
    whatsAppPadding: isMobile ? '10px 20px' : '10px 24px',
    whatsAppWidth: isMobile ? '240px' : 'clamp(260px, 22vw, 320px)',

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
        paddingBottom: isMobile ? '80px' : 0,
      }}
    >
      <div
        className="popup-window"
        onMouseDown={() => onActivate?.()}
        onTouchStart={() => onActivate?.()}
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: '#c0c0c0',
          border: '2px solid',
          borderColor: '#ffffff #0a0a0a #0a0a0a #ffffff',
          boxShadow: '2px 2px 0 #000',
          fontFamily: WIN_FONT,
          color: '#000',
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
                stroke="#000"
                strokeWidth="1"
              />
              <path d="M6 2 L8 4 L10 2" fill="none" stroke="#808080" strokeWidth="0.5"/>
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
              backgroundColor: '#c0c0c0',
              border: 'none',
              boxShadow: 'inset -1px -1px 0 #0a0a0a, inset 1px 1px 0 #ffffff, inset -2px -2px 0 #808080, inset 2px 2px 0 #dfdfdf',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 0,
            }}
          >
            <svg width="10" height="9" viewBox="0 0 8 7" fill="none">
              <path d="M0 0H2V1H3V2H5V1H6V0H8V1H7V2H6V3H5V4H6V5H7V6H8V7H6V6H5V5H3V6H2V7H0V6H1V5H2V4H3V3H2V2H1V1H0V0Z" fill="#000"/>
            </svg>
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: sizes.windowPadding }}>

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
                  backgroundColor: index === currentIndex ? '#000080' : '#a0a0a0',
                  border: 'none',
                  boxShadow: index === currentIndex ? 'none' : 'inset -1px -1px 0 #808080, inset 1px 1px 0 #dfdfdf',
                  cursor: 'pointer',
                }}
              />
            ))}
          </div>

          {/* Carousel */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: isMobile ? '10px' : '14px',
            marginTop: isMobile ? '4px' : '6px',
            marginBottom: isMobile ? '8px' : '10px',
          }}>
            {/* Left Arrow */}
            <button
              onClick={goPrev}
              disabled={currentIndex === 0}
              aria-label="Previous product"
              style={{
                width: sizes.arrowSize,
                height: sizes.arrowSize,
                backgroundColor: currentIndex === 0 ? '#a0a0a0' : '#c0c0c0',
                border: 'none',
                boxShadow: currentIndex === 0
                  ? 'inset 1px 1px 0 #808080'
                  : 'inset -1px -1px 0 #0a0a0a, inset 1px 1px 0 #ffffff, inset -2px -2px 0 #808080, inset 2px 2px 0 #dfdfdf',
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
                color: currentIndex === 0 ? '#808080' : '#000',
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
                          color: '#000',
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
                          marginTop: isMobile ? '6px' : '8px',
                          color: '#000',
                          opacity: isActiveProduct ? 1 : 0,
                          height: isActiveProduct ? 'auto' : '0',
                          overflow: 'hidden',
                          transition: 'opacity 0.2s ease',
                          width: '100%',
                        }}
                      >
                        <span style={{ textDecoration: 'line-through', opacity: 0.45, fontSize: '0.75em', marginRight: '8px', color: '#666' }}>
                          {t.currency}{product.originalPrice}
                        </span>
                        <span style={{ color: '#000080', fontWeight: '600' }}>
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
              style={{
                width: sizes.arrowSize,
                height: sizes.arrowSize,
                backgroundColor: currentIndex === products.length - 1 ? '#a0a0a0' : '#c0c0c0',
                border: 'none',
                boxShadow: currentIndex === products.length - 1
                  ? 'inset 1px 1px 0 #808080'
                  : 'inset -1px -1px 0 #0a0a0a, inset 1px 1px 0 #ffffff, inset -2px -2px 0 #808080, inset 2px 2px 0 #dfdfdf',
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
                color: currentIndex === products.length - 1 ? '#808080' : '#000',
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
              marginTop: isMobile ? '6px' : '10px',
              marginBottom: isMobile ? '14px' : '18px',
            }}
          >
            {t.sizes.map((size) => (
              <button
                key={size}
                onClick={() => setSelectedSize(size)}
                style={{
                  fontFamily: WIN_FONT,
                  fontSize: sizes.sizeButtonFont,
                  padding: sizes.sizeButtonPadding,
                  cursor: 'pointer',
                  backgroundColor: selectedSize === size ? '#000080' : '#c0c0c0',
                  color: selectedSize === size ? '#fff' : '#000',
                  border: 'none',
                  boxShadow: selectedSize === size
                    ? 'inset 1px 1px 0 #000050, inset -1px -1px 0 #0000a0'
                    : WIN95_STYLES.button.boxShadow,
                }}
              >
                {size}
              </button>
            ))}
          </div>

          {/* WhatsApp button */}
          <div style={{ textAlign: 'center', marginBottom: isMobile ? '12px' : '16px' }}>
            <button
              onClick={handleWhatsAppClick}
              onMouseEnter={() => setWhatsAppHover(true)}
              onMouseLeave={() => setWhatsAppHover(false)}
              style={{
                fontFamily: WIN_FONT,
                fontSize: sizes.whatsAppFont,
                padding: sizes.whatsAppPadding,
                cursor: 'pointer',
                backgroundColor: whatsAppHover ? '#1da851' : '#25D366',
                color: '#fff',
                border: '1px solid #128C7E',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'background-color 0.15s ease-out',
                width: sizes.whatsAppWidth,
                maxWidth: '100%',
              }}
            >
              <svg width={isMobile ? 22 : 28} height={isMobile ? 22 : 28} viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              {scrambledWhatsApp || t.whatsappButton}
            </button>
          </div>

          {/* Footer text */}
          <div
            style={{
              textAlign: 'center',
              fontFamily: WIN_FONT,
              fontSize: sizes.footerFontSize,
              color: '#606060',
              letterSpacing: '0.1em',
              marginTop: isMobile ? '4px' : '6px',
            }}
          >
            [&nbsp; {scrambledMoreSoon || t.moreSoon}<AnimatedDots char="." width="1.5em" /> &nbsp;]
          </div>
        </div>
      </div>
    </div>
  );
}
