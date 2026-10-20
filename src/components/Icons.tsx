import React from 'react';

interface IconProps {
  name: string;
  size?: number;
  className?: string;
}

export const Icon: React.FC<IconProps> = ({ name, size = 18, className }) => {
  const props = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.75,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    className,
    'aria-hidden': true,
  };

  switch (name) {
    case 'clock':
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="9" />
          <polyline points="12 7 12 12 15.5 14" />
        </svg>
      );
    case 'calendar':
      return (
        <svg {...props}>
          <rect x="3" y="4" width="18" height="17" rx="3" />
          <line x1="16" y1="2.5" x2="16" y2="6" />
          <line x1="8" y1="2.5" x2="8" y2="6" />
          <line x1="3" y1="9.5" x2="21" y2="9.5" />
        </svg>
      );
    case 'weather':
    case 'cloud-sun':
      return (
        <svg {...props}>
          <path d="M12 3v2M5.6 5.6l1.4 1.4M3 12h2M18.4 5.6l-1.4 1.4" />
          <path d="M10 9a4 4 0 0 1 6.8 2.8A3.5 3.5 0 0 1 17.5 19H8.5a4.5 4.5 0 0 1-.8-8.9A4 4 0 0 1 10 9Z" />
        </svg>
      );
    case 'system':
    case 'cpu':
      return (
        <svg {...props}>
          <rect x="5" y="5" width="14" height="14" rx="3" />
          <rect x="9" y="9" width="6" height="6" rx="1" />
          <path d="M9 2v3M15 2v3M9 19v3M15 19v3M2 9h3M2 15h3M19 9h3M19 15h3" />
        </svg>
      );
    case 'prices':
    case 'trending':
      return (
        <svg {...props}>
          <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
          <polyline points="16 7 22 7 22 13" />
        </svg>
      );
    case 'notes':
    case 'file-text':
      return (
        <svg {...props}>
          <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z" />
          <polyline points="14 3 14 8 19 8" />
          <line x1="9" y1="13" x2="15" y2="13" />
          <line x1="9" y1="17" x2="13" y2="17" />
        </svg>
      );
    case 'launcher':
    case 'grid':
      return (
        <svg {...props}>
          <rect x="3" y="3" width="7.5" height="7.5" rx="2" />
          <rect x="13.5" y="3" width="7.5" height="7.5" rx="2" />
          <rect x="3" y="13.5" width="7.5" height="7.5" rx="2" />
          <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="2" />
        </svg>
      );
    case 'music':
      return (
        <svg {...props}>
          <path d="M9 18V5l12-2v13" />
          <circle cx="6" cy="18" r="3" />
          <circle cx="18" cy="16" r="3" />
        </svg>
      );
    case 'sparkles':
      return (
        <svg {...props}>
          <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3Z" />
          <path d="M19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8L19 16Z" />
        </svg>
      );
    case 'briefcase':
      return (
        <svg {...props}>
          <rect x="3" y="7" width="18" height="13" rx="2.5" />
          <path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
        </svg>
      );
    case 'gamepad':
      return (
        <svg {...props}>
          <rect x="2" y="6" width="20" height="12" rx="5" />
          <path d="M6 12h4M8 10v4M15.5 11.5h.01M18 13.5h.01" />
        </svg>
      );
    case 'book':
      return (
        <svg {...props}>
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
        </svg>
      );
    case 'feather':
      return (
        <svg {...props}>
          <path d="M20.2 12.2a6 6 0 0 0-8.4-8.4L5 10.5V19h8.5l6.7-6.8Z" />
          <line x1="16" y1="8" x2="2" y2="22" />
        </svg>
      );
    case 'terminal':
      return (
        <svg {...props}>
          <rect x="3" y="4" width="18" height="16" rx="2.5" />
          <polyline points="7 9 10.5 12 7 15" />
          <line x1="12.5" y1="15" x2="17" y2="15" />
        </svg>
      );
    case 'palette':
      return (
        <svg {...props}>
          <circle cx="13.5" cy="6.5" r="1" fill="currentColor" />
          <circle cx="17.5" cy="10.5" r="1" fill="currentColor" />
          <circle cx="8.5" cy="7.5" r="1" fill="currentColor" />
          <circle cx="6.5" cy="12.5" r="1" fill="currentColor" />
          <path d="M12 2a10 10 0 1 0 0 20 2.5 2.5 0 0 0 2.5-2.5c0-.6-.2-1.2-.6-1.6-.4-.4-.6-1-.6-1.6A2.5 2.5 0 0 1 15.8 14H18a4 4 0 0 0 4-4c0-4.4-4.5-8-10-8Z" />
        </svg>
      );
    case 'settings':
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.26.6.77 1.02 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
        </svg>
      );
    case 'lock':
      return (
        <svg {...props}>
          <rect x="4" y="11" width="16" height="10" rx="2.5" />
          <path d="M8 11V7a4 4 0 0 1 8 0v4" />
        </svg>
      );
    case 'unlock':
      return (
        <svg {...props}>
          <rect x="4" y="11" width="16" height="10" rx="2.5" />
          <path d="M8 11V7a4 4 0 0 1 7.6-1.8" />
        </svg>
      );
    case 'search':
      return (
        <svg {...props}>
          <circle cx="11" cy="11" r="7.5" />
          <line x1="20.5" y1="20.5" x2="16.4" y2="16.4" />
        </svg>
      );
    case 'plus':
      return (
        <svg {...props}>
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      );
    case 'trash':
      return (
        <svg {...props}>
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
        </svg>
      );
    case 'copy':
      return (
        <svg {...props}>
          <rect x="9" y="9" width="12" height="12" rx="2" />
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
      );
    case 'eye':
      return (
        <svg {...props}>
          <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      );
    case 'eye-off':
      return (
        <svg {...props}>
          <path d="M17.9 17.9A10.1 10.1 0 0 1 12 19c-6.4 0-10-7-10-7a18.4 18.4 0 0 1 5.1-5.9M9.9 5.2A9.1 9.1 0 0 1 12 5c6.4 0 10 7 10 7a18.5 18.5 0 0 1-2.2 3.2" />
          <line x1="2" y1="2" x2="22" y2="22" />
        </svg>
      );
    case 'refresh':
      return (
        <svg {...props}>
          <polyline points="23 4 23 10 17 10" />
          <path d="M20.5 15a9 9 0 1 1-2.1-9.4L23 10" />
        </svg>
      );
    case 'play':
      return (
        <svg {...props}>
          <polygon points="6 4 20 12 6 20 6 4" fill="currentColor" stroke="none" />
        </svg>
      );
    case 'pause':
      return (
        <svg {...props}>
          <rect x="6" y="4" width="4" height="16" rx="1" fill="currentColor" stroke="none" />
          <rect x="14" y="4" width="4" height="16" rx="1" fill="currentColor" stroke="none" />
        </svg>
      );
    case 'skip-prev':
      return (
        <svg {...props}>
          <polygon points="19 20 9 12 19 4 19 20" />
          <line x1="5" y1="19" x2="5" y2="5" />
        </svg>
      );
    case 'skip-next':
      return (
        <svg {...props}>
          <polygon points="5 4 15 12 5 20 5 4" />
          <line x1="19" y1="5" x2="19" y2="19" />
        </svg>
      );
    case 'folder':
      return (
        <svg {...props}>
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2Z" />
        </svg>
      );
    case 'globe':
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="9.5" />
          <line x1="2.5" y1="12" x2="21.5" y2="12" />
          <path d="M12 2.5a14.5 14.5 0 0 1 0 19 14.5 14.5 0 0 1 0-19" />
        </svg>
      );
    case 'calculator':
      return (
        <svg {...props}>
          <rect x="4" y="2" width="16" height="20" rx="2.5" />
          <line x1="8" y1="6" x2="16" y2="6" />
          <circle cx="8.5" cy="11" r="0.8" fill="currentColor" />
          <circle cx="12" cy="11" r="0.8" fill="currentColor" />
          <circle cx="15.5" cy="11" r="0.8" fill="currentColor" />
          <circle cx="8.5" cy="15" r="0.8" fill="currentColor" />
          <circle cx="12" cy="15" r="0.8" fill="currentColor" />
          <circle cx="15.5" cy="15" r="0.8" fill="currentColor" />
        </svg>
      );
    case 'pin':
      return (
        <svg {...props}>
          <path d="M12 17v5M8 3h8l-1 6 3 3v2H6v-2l3-3-1-6Z" />
        </svg>
      );
    case 'close':
      return (
        <svg {...props}>
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      );
    case 'check':
      return (
        <svg {...props}>
          <polyline points="20 6 9 17 4 12" />
        </svg>
      );
    case 'move':
      return (
        <svg {...props}>
          <polyline points="5 9 2 12 5 15" />
          <polyline points="9 5 12 2 15 5" />
          <polyline points="15 19 12 22 9 19" />
          <polyline points="19 9 22 12 19 15" />
          <line x1="2" y1="12" x2="22" y2="12" />
          <line x1="12" y1="2" x2="12" y2="22" />
        </svg>
      );
    case 'info':
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="9.5" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
      );
    default:
      return (
        <svg {...props}>
          <rect x="4" y="4" width="16" height="16" rx="4" />
          <circle cx="12" cy="12" r="2.5" />
        </svg>
      );
  }
};

export const WeatherGlyph: React.FC<{ code: number; isDay?: boolean; size?: number }> = ({
  code,
  isDay = true,
  size = 40,
}) => {
  if (code === 0) {
    return isDay ? (
      <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden>
        <circle cx="24" cy="24" r="10.5" fill="#FBBF24" />
        <g stroke="#FDE68A" strokeWidth="2.4" strokeLinecap="round">
          <line x1="24" y1="5" x2="24" y2="9.5" />
          <line x1="24" y1="38.5" x2="24" y2="43" />
          <line x1="5" y1="24" x2="9.5" y2="24" />
          <line x1="38.5" y1="24" x2="43" y2="24" />
          <line x1="10.6" y1="10.6" x2="13.8" y2="13.8" />
          <line x1="34.2" y1="34.2" x2="37.4" y2="37.4" />
          <line x1="37.4" y1="10.6" x2="34.2" y2="13.8" />
          <line x1="13.8" y1="34.2" x2="10.6" y2="37.4" />
        </g>
      </svg>
    ) : (
      <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden>
        <path
          d="M34 28.5A12.5 12.5 0 0 1 19.5 14a12.5 12.5 0 1 0 14.5 14.5Z"
          fill="#93C5FD"
        />
      </svg>
    );
  }

  if (code >= 1 && code <= 3) {
    return (
      <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden>
        <circle cx="19" cy="18" r="8" fill="#FBBF24" />
        <path
          d="M16 36h18.5a7.5 7.5 0 0 0 .8-14.9A10 10 0 0 0 16 19.5 6.8 6.8 0 0 0 16 36Z"
          fill="rgba(241, 245, 249, 0.92)"
        />
      </svg>
    );
  }

  if (code >= 51 && code <= 82) {
    return (
      <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden>
        <path
          d="M14 31h20a7 7 0 0 0 .7-13.9A9.5 9.5 0 0 0 16.5 15 6.5 6.5 0 0 0 14 31Z"
          fill="rgba(226, 232, 240, 0.9)"
        />
        <g stroke="#60A5FA" strokeWidth="2.4" strokeLinecap="round">
          <line x1="17" y1="35" x2="15" y2="41" />
          <line x1="24" y1="35" x2="22" y2="41" />
          <line x1="31" y1="35" x2="29" y2="41" />
        </g>
      </svg>
    );
  }

  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden>
      <path
        d="M14 33h20a7 7 0 0 0 .7-13.9A9.5 9.5 0 0 0 16.5 17 6.5 6.5 0 0 0 14 33Z"
        fill="rgba(203, 213, 225, 0.92)"
      />
    </svg>
  );
};
