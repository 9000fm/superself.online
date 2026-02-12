'use client';

interface Win95CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}

export default function Win95Checkbox({ checked, onChange, label }: Win95CheckboxProps) {
  return (
    <div
      onClick={() => onChange(!checked)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        height: '26px',
        userSelect: 'none',
        cursor: 'pointer',
      }}
    >
      {/* Label — matches Win95Trackbar 46px right-aligned */}
      <span style={{
        fontFamily: '"MS Sans Serif", Arial, sans-serif',
        fontSize: '10px',
        color: 'var(--win95-text, #000)',
        width: '46px',
        flexShrink: 0,
        textAlign: 'right',
        textTransform: 'uppercase',
      }}>
        {label}
      </span>

      {/* Checkbox box — classic Win95 sunken 13x13 */}
      <div style={{
        width: '13px',
        height: '13px',
        flexShrink: 0,
        backgroundColor: '#fff',
        boxShadow: 'inset 1px 1px 0 var(--win95-dark, #808080), inset -1px -1px 0 var(--win95-highlight, #dfdfdf), inset 2px 2px 0 var(--win95-shadow, #0a0a0a)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {checked && (
          <svg width="7" height="7" viewBox="0 0 7 7" fill="none">
            <path d="M1 3L3 5L6 1" stroke="#000" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter" fill="none" />
          </svg>
        )}
      </div>

      {/* ON/OFF readout — fills remaining space, right-aligned to match trackbar value column */}
      <span style={{
        fontFamily: '"MS Sans Serif", Arial, sans-serif',
        fontSize: '10px',
        color: checked ? 'var(--win95-text, #000)' : 'var(--win95-dark, #808080)',
        flex: 1,
        textAlign: 'right',
      }}>
        {checked ? 'ON' : 'OFF'}
      </span>
    </div>
  );
}
