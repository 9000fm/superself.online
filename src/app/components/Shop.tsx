'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { products, shopTranslations, getProductName, getWhatsAppLink } from '../data/products';
import type { Language } from '../types';
import { WIN_FONT, SCRAMBLE_CHARS } from '../constants';
import { translations } from '../translations';

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

type ShopView = 'catalog' | 'detail';

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
  const [view, setView] = useState<ShopView>('catalog');
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [selectedProduct, setSelectedProduct] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [isMobile, setIsMobile] = useState(false);
  const t = shopTranslations[language];
  const tGlobal = translations[language];

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const prevLangRef = useRef<Language>(language);
  const [scrambledTitle, setScrambledTitle] = useState('');
  const [scrambledWA, setScrambledWA] = useState('');
  const [scrambledCatalog, setScrambledCatalog] = useState('');
  const [scrambledSelectHint, setScrambledSelectHint] = useState('');
  const [scrambledSizeLabel, setScrambledSizeLabel] = useState('');
  const [scrambledPriceLabel, setScrambledPriceLabel] = useState('');
  const [scrambledNames, setScrambledNames] = useState<string[]>([]);
  const [scrambledStatic, setScrambledStatic] = useState<{
    back: string; id: string; item: string; sizesCol: string; sizeRow: string;
    tapHint: string; navHint: string; oversized: string; cotton: string;
  }>({ back: '', id: '', item: '', sizesCol: '', sizeRow: '', tapHint: '', navHint: '', oversized: '', cotton: '' });

  const openDetail = useCallback((index: number) => {
    setSelectedProduct(index);
    setSelectedSize('');
    setView('detail');
  }, []);

  const backToCatalog = useCallback(() => {
    setView('catalog');
  }, []);

  const handleWhatsAppClick = useCallback(() => {
    window.open(getWhatsAppLink(products[selectedProduct], language, selectedSize), '_blank');
  }, [selectedProduct, language, selectedSize]);

  useEffect(() => {
    if (prevLangRef.current !== language) {
      prevLangRef.current = language;
      const newTitle = t.shopTitle;
      const newWA = t.whatsappButton;
      const newCatalog = t.catalogLabel;
      const newHint = t.selectHint;
      const newSize = t.selectSize;
      const newPrice = t.priceLabel;
      const newNames = products.map((p) => getProductName(p, language));
      let frame = 0;
      const maxFrames = 10;
      const baseChars = SCRAMBLE_CHARS.base;
      const jpChars = SCRAMBLE_CHARS.japanese;
      const scrambleText = (text: string, locked: number) => {
        let result = '';
        for (let i = 0; i < text.length; i++) {
          if (i < locked) { result += text[i]; }
          else if (text[i] === ' ' || text[i] === '\n' || text[i] === '/' || text[i] === '·' || text[i] === '[' || text[i] === ']') {
            result += text[i];
          } else {
            const code = text.charCodeAt(i);
            const isWide = code > 0x7F;
            const chars = isWide ? jpChars : baseChars;
            result += chars[Math.floor(Math.random() * chars.length)];
          }
        }
        return result;
      };
      const advance = (s: string) => scrambleText(s, Math.floor((frame / maxFrames) * s.length));
      const STATIC_BACK = '< back';
      const STATIC_ID = 'ID';
      const STATIC_ITEM = 'ITEM';
      const STATIC_SIZES_COL = 'SIZES';
      const STATIC_SIZE_ROW = 'S M L XL';
      const STATIC_TAP = 'tap';
      const STATIC_NAV = '↑ ↓ enter';
      const STATIC_OVERSIZED = 'OVERSIZED';
      const STATIC_COTTON = '100% cotton';
      const interval = setInterval(() => {
        frame++;
        setScrambledTitle(advance(newTitle));
        setScrambledWA(advance(newWA));
        setScrambledCatalog(advance(newCatalog));
        setScrambledSelectHint(advance(newHint));
        setScrambledSizeLabel(advance(newSize));
        setScrambledPriceLabel(advance(newPrice));
        setScrambledNames(newNames.map(advance));
        setScrambledStatic({
          back: advance(STATIC_BACK),
          id: advance(STATIC_ID),
          item: advance(STATIC_ITEM),
          sizesCol: advance(STATIC_SIZES_COL),
          sizeRow: advance(STATIC_SIZE_ROW),
          tapHint: advance(STATIC_TAP),
          navHint: advance(STATIC_NAV),
          oversized: advance(STATIC_OVERSIZED),
          cotton: advance(STATIC_COTTON),
        });
        if (frame >= maxFrames) {
          clearInterval(interval);
          setScrambledTitle('');
          setScrambledWA('');
          setScrambledCatalog('');
          setScrambledSelectHint('');
          setScrambledSizeLabel('');
          setScrambledPriceLabel('');
          setScrambledNames([]);
          setScrambledStatic({ back: '', id: '', item: '', sizesCol: '', sizeRow: '', tapHint: '', navHint: '', oversized: '', cotton: '' });
        }
      }, 40);
      return () => {
        clearInterval(interval);
        setScrambledTitle(''); setScrambledWA('');
        setScrambledCatalog(''); setScrambledSelectHint('');
        setScrambledSizeLabel(''); setScrambledPriceLabel('');
        setScrambledNames([]);
        setScrambledStatic({ back: '', id: '', item: '', sizesCol: '', sizeRow: '', tapHint: '', navHint: '', oversized: '', cotton: '' });
      };
    }
  }, [language, t]);

  useEffect(() => {
    if (view !== 'catalog') return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusedIndex((i) => Math.min(products.length - 1, i + 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setFocusedIndex((i) => Math.max(0, i - 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        openDetail(focusedIndex);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [view, focusedIndex, openDetail]);

  const panelWidth = isMobile ? '92vw' : 'clamp(400px, 48vw, 780px)';

  const titlebarText = useMemo(() => {
    const base = scrambledTitle || t.shopTitle;
    if (view === 'detail') {
      const id = String(products[selectedProduct].id).padStart(3, '0');
      return `${base} / ${id}`;
    }
    return base;
  }, [view, selectedProduct, scrambledTitle, t.shopTitle]);

  const product = products[selectedProduct];
  const prodName = getProductName(product, language);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: isMobile ? 'env(safe-area-inset-top, 20px)' : 0,
        paddingBottom: isMobile ? 'env(safe-area-inset-bottom, 20px)' : 0,
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
          backgroundColor: 'var(--popup-bg)',
          border: '1px solid var(--panel-border)',
          fontFamily: WIN_FONT,
          color: 'var(--popup-fg)',
          width: panelWidth,
          maxWidth: '780px',
          maxHeight: isMobile ? 'calc(100svh - 40px)' : undefined,
          position: position.x || position.y ? 'fixed' : 'relative',
          top: position.y || undefined,
          left: position.x || undefined,
          pointerEvents: 'auto',
          overflow: isMobile ? 'hidden auto' : 'hidden',
        }}
      >
        {/* Flat titlebar */}
        <div
          onMouseDown={(e) => { if (!isMobile && onDragStart) { e.preventDefault(); onDragStart(e); } }}
          onTouchStart={(e) => { if (onDragStart) { onDragStart(e); } }}
          style={{
            background: 'var(--titlebar-bg)',
            padding: '6px 10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px',
            cursor: isMobile ? 'default' : (isDragging ? 'grabbing' : 'grab'),
            borderBottom: '1px solid var(--panel-border)',
            touchAction: 'none',
          }}
        >
          <span style={{
            color: 'var(--titlebar-fg)',
            fontFamily: WIN_FONT,
            fontSize: '16px',
            letterSpacing: '0.02em',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            flex: 1,
          }}>
            {titlebarText}
          </span>
          <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
            {view === 'detail' && (
              <button
                onClick={(e) => { e.stopPropagation(); backToCatalog(); }}
                onMouseDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
                aria-label="Back"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--titlebar-fg)',
                  fontFamily: WIN_FONT,
                  fontSize: '15px',
                  cursor: 'pointer',
                  padding: '2px 10px',
                  lineHeight: 1.3,
                  touchAction: 'manipulation',
                  whiteSpace: 'nowrap',
                }}
              >
                [ {(scrambledStatic.back && scrambledStatic.back.length > 0) ? scrambledStatic.back : '< back'} ]
              </button>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); onClose(); }}
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              aria-label="Close"
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--titlebar-fg)',
                fontFamily: WIN_FONT,
                fontSize: '15px',
                cursor: 'pointer',
                padding: '2px 10px',
                lineHeight: 1.3,
                touchAction: 'manipulation',
                whiteSpace: 'nowrap',
              }}
            >
              [ {tGlobal.close.toLowerCase()} ]
            </button>
          </div>
        </div>

        {/* Body */}
        <div style={{
          padding: isMobile ? '16px 14px' : '20px 22px',
          fontSize: isMobile ? '0.95rem' : '1.05rem',
          animation: 'fadeIn 0.3s ease-out',
        }}>
          {view === 'catalog' ? (
            <CatalogView
              focusedIndex={focusedIndex}
              setFocusedIndex={setFocusedIndex}
              openDetail={openDetail}
              language={language}
              currency={t.currency}
              isMobile={isMobile}
              catalogLabel={scrambledCatalog || t.catalogLabel}
              selectHint={scrambledSelectHint || t.selectHint}
              scrambledNames={scrambledNames}
              scrambledStatic={scrambledStatic}
            />
          ) : (
            <DetailView
              product={product}
              prodName={(scrambledNames[selectedProduct] && scrambledNames[selectedProduct].length > 0) ? scrambledNames[selectedProduct] : prodName}
              sizes={t.sizes as unknown as string[]}
              selectedSize={selectedSize}
              setSelectedSize={setSelectedSize}
              onWhatsApp={handleWhatsAppClick}
              waLabel={scrambledWA || t.whatsappButton}
              sizeLabel={scrambledSizeLabel || t.selectSize}
              priceLabel={scrambledPriceLabel || t.priceLabel}
              currency={t.currency}
              isMobile={isMobile}
              scrambledOversized={scrambledStatic.oversized}
              scrambledCotton={scrambledStatic.cotton}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function CatalogView({
  focusedIndex,
  setFocusedIndex,
  openDetail,
  language,
  currency,
  isMobile,
  catalogLabel,
  selectHint,
  scrambledNames,
  scrambledStatic,
}: {
  focusedIndex: number;
  setFocusedIndex: (i: number) => void;
  openDetail: (i: number) => void;
  language: Language;
  currency: string;
  isMobile: boolean;
  catalogLabel: string;
  selectHint: string;
  scrambledNames: string[];
  scrambledStatic: { back: string; id: string; item: string; sizesCol: string; sizeRow: string; tapHint: string; navHint: string };
}) {
  const sx = (val: string, fb: string) => (val && val.length > 0 ? val : fb);
  return (
    <div>
      <div style={{ color: 'var(--panel-prompt)', marginBottom: '12px', letterSpacing: '0.04em' }}>## {catalogLabel}</div>
      {/* Header row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '44px 1fr 72px' : '52px 1fr 110px 72px',
        gap: isMobile ? '8px' : '14px',
        color: 'var(--panel-muted)',
        fontSize: '0.9em',
        padding: '0 4px 6px',
      }}>
        <span>{sx(scrambledStatic.id, 'ID')}</span>
        <span>{sx(scrambledStatic.item, 'ITEM')}</span>
        {!isMobile && <span>{sx(scrambledStatic.sizesCol, 'SIZES')}</span>}
        <span style={{ textAlign: 'right' }}>$</span>
      </div>
      {/* Divider */}
      <div aria-hidden style={{
        height: '1px',
        background: 'var(--panel-divider)',
        margin: '0 4px 6px',
      }} />
      {/* Rows */}
      <div>
        {products.map((product, idx) => {
          const isFocused = idx === focusedIndex;
          const id = String(product.id).padStart(3, '0');
          const liveName = getProductName(product, language);
          const name = (scrambledNames[idx] && scrambledNames[idx].length > 0) ? scrambledNames[idx] : liveName;
          return (
            <button
              key={product.id}
              onMouseEnter={() => setFocusedIndex(idx)}
              onClick={() => openDetail(idx)}
              style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '44px 1fr 72px' : '52px 1fr 110px 72px',
                gap: isMobile ? '8px' : '14px',
                width: '100%',
                padding: '6px 4px',
                background: isFocused ? 'var(--popup-fg)' : 'transparent',
                color: isFocused ? 'var(--popup-bg)' : 'var(--popup-fg)',
                border: 'none',
                fontFamily: WIN_FONT,
                fontSize: 'inherit',
                textAlign: 'left',
                cursor: 'pointer',
                alignItems: 'center',
                transform: isFocused ? 'translateX(6px)' : 'translateX(0)',
                transition: 'background 280ms cubic-bezier(0.34, 1.56, 0.64, 1), color 280ms cubic-bezier(0.34, 1.56, 0.64, 1), transform 280ms cubic-bezier(0.34, 1.56, 0.64, 1)',
              }}
            >
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                transform: isFocused ? 'scale(1.08)' : 'scale(1)',
                transformOrigin: 'left center',
                transition: 'transform 280ms cubic-bezier(0.34, 1.56, 0.64, 1)',
              }}>
                <span style={{ opacity: isFocused ? 1 : 0, width: '10px' }}>▸</span>
                {id}
              </span>
              <span style={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>{name}</span>
              {!isMobile && (
                <span style={{ opacity: 0.75, fontSize: '0.9em' }}>{sx(scrambledStatic.sizeRow, 'S M L XL')}</span>
              )}
              <span style={{ textAlign: 'right' }}>{currency}{product.price}</span>
            </button>
          );
        })}
      </div>
      {/* Footer hint */}
      <div style={{
        marginTop: '18px',
        color: 'var(--panel-muted)',
        fontSize: '0.9em',
      }}>
        &gt; {selectHint} {isMobile ? `[ ${sx(scrambledStatic.tapHint, 'tap')} ]` : `[ ${sx(scrambledStatic.navHint, '\u2191 \u2193 enter')} ]`}
      </div>
    </div>
  );
}

function DetailView({
  product,
  prodName,
  sizes,
  selectedSize,
  setSelectedSize,
  onWhatsApp,
  waLabel,
  sizeLabel,
  priceLabel,
  currency,
  isMobile,
  scrambledOversized,
  scrambledCotton,
}: {
  product: typeof products[number];
  prodName: string;
  sizes: string[];
  selectedSize: string;
  setSelectedSize: (s: string) => void;
  onWhatsApp: () => void;
  waLabel: string;
  sizeLabel: string;
  priceLabel: string;
  currency: string;
  isMobile: boolean;
  scrambledOversized: string;
  scrambledCotton: string;
}) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: isMobile ? '1fr' : '1fr 1.2fr',
      gap: isMobile ? '10px' : '22px',
      alignItems: 'start',
    }}>
      {/* Image — reduced on mobile so info fits without scrolling */}
      <div style={{
        border: '1px solid var(--panel-border)',
        aspectRatio: isMobile ? '1' : '1',
        position: 'relative',
        background: '#e8e8e8',
        overflow: 'hidden',
      }}>
        <Image
          src={product.image}
          alt={prodName}
          fill
          priority
          style={{ objectFit: 'contain' }}
        />
      </div>

      {/* Info */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '8px' : '12px' }}>
        {/* Title + description */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
            <div style={{ fontSize: 'clamp(1.2rem, 3vw, 1.8rem)', fontWeight: 'bold', lineHeight: 1.2, flex: '0 1 auto', minWidth: 0 }}>
              {/* Split name: model on line 1, color on line 2 */}
              {(() => {
                const parts = prodName.split(/(?<=SUPERSELF-T)\s+/i);
                if (parts.length > 1) {
                  return <>{parts[0]}<br /><span style={{ fontSize: '0.85em' }}>{parts.slice(1).join(' ')}</span></>;
                }
                return prodName;
              })()}
            </div>
            <div style={{ whiteSpace: 'nowrap', textAlign: 'right', flexShrink: 0 }}>
              <div style={{ color: 'var(--panel-muted)', textDecoration: 'line-through', fontSize: '1.4em', lineHeight: 1 }}>
                {currency}{product.originalPrice}
              </div>
              <div style={{ fontWeight: 'bold', fontSize: '4em', lineHeight: 0.9, textShadow: '1px 1px 0 var(--panel-muted)' }}>
                {currency}{product.price}
              </div>
            </div>
          </div>
          <div aria-hidden style={{ height: '1px', background: 'var(--panel-divider)', margin: '6px 0' }} />
        </div>

        {/* Description + sizes + WhatsApp in a row layout. WA button spans full height. */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'stretch' }}>
          {/* Left: description + sizes */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ color: 'var(--panel-muted)', fontSize: '0.9em', lineHeight: 1.5 }}>
              {(scrambledOversized && scrambledOversized.length > 0) ? scrambledOversized : 'OVERSIZED'}<br />{(scrambledCotton && scrambledCotton.length > 0) ? scrambledCotton : '100% cotton'}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              <span style={{ color: 'var(--panel-prompt)' }}>▸</span>
              {sizes.map((size) => {
                const active = selectedSize === size;
                return (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(active ? '' : size)}
                    style={{
                      fontFamily: WIN_FONT,
                      fontSize: 'inherit',
                      padding: '4px 12px',
                      minWidth: '36px',
                      cursor: 'pointer',
                      background: active ? 'var(--popup-fg)' : 'transparent',
                      color: active ? 'var(--popup-bg)' : 'var(--popup-fg)',
                      border: '1px solid var(--panel-border)',
                      touchAction: 'manipulation',
                    }}
                  >
                    {size}
                  </button>
                );
              })}
            </div>
          </div>
          {/* Right: WhatsApp tall button spanning full height */}
          <button
            onClick={onWhatsApp}
            aria-label={waLabel}
            style={{
              background: 'transparent',
              border: '1px solid var(--panel-border)',
              color: 'var(--popup-fg)',
              fontFamily: WIN_FONT,
              fontSize: 'inherit',
              padding: isMobile ? '8px 14px' : '8px 18px',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              touchAction: 'manipulation',
              flexShrink: 0,
              alignSelf: 'stretch',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--popup-fg)'; e.currentTarget.style.color = 'var(--popup-bg)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--popup-fg)'; }}
          >
            <svg width={22} height={22} viewBox="0 0 16 16" fill="currentColor" style={{ flexShrink: 0 }}>
              <path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.898 7.898 0 0 0 13.6 2.326zM7.994 14.521a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.557 6.557 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592zm3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.325-.335-.445-.34-.114-.007-.247-.007-.38-.007a.729.729 0 0 0-.529.247c-.182.198-.691.677-.691 1.654 0 .977.71 1.916.81 2.049.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
