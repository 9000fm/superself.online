import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'superself';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0000FF',
          fontFamily: 'monospace',
          color: 'white',
          fontSize: 72,
          letterSpacing: '0.05em',
        }}
      >
        superself_
      </div>
    ),
    { ...size }
  );
}
