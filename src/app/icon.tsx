import { ImageResponse } from 'next/og';

export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          background: '#0f172a',
          borderRadius: 8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Wallet icon */}
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <rect x="2" y="7" width="20" height="14" rx="2.5" stroke="white" strokeWidth="2" />
          <path d="M7 7V5a5 5 0 0 1 10 0v2" stroke="white" strokeWidth="2" strokeLinecap="round" />
          <circle cx="12" cy="14" r="2" fill="white" />
        </svg>
      </div>
    ),
    { ...size }
  );
}
