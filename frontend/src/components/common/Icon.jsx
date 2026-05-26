function Icon({ name, className = 'h-5 w-5', filled = false }) {
  const shared = {
    className,
    viewBox: '0 0 24 24',
    fill: filled ? 'currentColor' : 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
  };

  switch (name) {
    case 'search':
      return (
        <svg {...shared}>
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
      );
    case 'heart':
      return (
        <svg {...shared}>
          <path d="m12 20-1.2-1.1C5.3 13.8 2 10.8 2 7.1 2 4.4 4.1 2.3 6.8 2.3c1.5 0 2.9.7 3.8 1.9.9-1.2 2.3-1.9 3.8-1.9 2.7 0 4.8 2.1 4.8 4.8 0 3.7-3.3 6.7-8.8 11.8L12 20Z" />
        </svg>
      );
    case 'bag':
      return (
        <svg {...shared}>
          <path d="M6 8h12l-1 12H7L6 8Z" />
          <path d="M9 9V7a3 3 0 1 1 6 0v2" />
        </svg>
      );
    case 'person':
      return (
        <svg {...shared}>
          <circle cx="12" cy="8" r="3.5" />
          <path d="M5 20a7 7 0 0 1 14 0" />
        </svg>
      );
    case 'eye':
      return (
        <svg {...shared}>
          <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
          <circle cx="12" cy="12" r="2.5" />
        </svg>
      );
    case 'eye-off':
      return (
        <svg {...shared}>
          <path d="m3 3 18 18" />
          <path d="M10.7 5.1A12.5 12.5 0 0 1 12 5c6.5 0 10 7 10 7a17.8 17.8 0 0 1-3.2 4.2" />
          <path d="M6.2 6.3C3.5 8 2 12 2 12s3.5 7 10 7a9.9 9.9 0 0 0 3-.4" />
          <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
        </svg>
      );
    case 'truck':
      return (
        <svg {...shared}>
          <path d="M3 7h11v8H3Z" />
          <path d="M14 10h3l3 3v2h-6" />
          <circle cx="7.5" cy="18" r="1.5" />
          <circle cx="17.5" cy="18" r="1.5" />
        </svg>
      );
    case 'shield':
      return (
        <svg {...shared}>
          <path d="M12 3 5 6v5c0 4.2 2.4 8 7 10 4.6-2 7-5.8 7-10V6l-7-3Z" />
        </svg>
      );
    case 'return':
      return (
        <svg {...shared}>
          <path d="M9 14 4 9l5-5" />
          <path d="M20 20v-7a4 4 0 0 0-4-4H4" />
        </svg>
      );
    case 'support':
      return (
        <svg {...shared}>
          <path d="M4 12a8 8 0 0 1 16 0" />
          <path d="M4 12v4a2 2 0 0 0 2 2h2v-6H6a2 2 0 0 0-2 2Zm16 0a2 2 0 0 0-2-2h-2v6h2a2 2 0 0 0 2-2Z" />
          <path d="M12 20h2" />
        </svg>
      );
    case 'star':
      return (
        <svg {...shared}>
          <path d="m12 3 2.8 5.6 6.2.9-4.5 4.4 1.1 6.1L12 17.1 6.4 20l1.1-6.1L3 9.5l6.2-.9L12 3Z" />
        </svg>
      );
    case 'quote':
      return (
        <svg {...shared}>
          <path d="M9 8c-2.8 1.7-4 3.7-4 6h4v5H4v-5c0-4 1.8-7 5-9Zm11 0c-2.8 1.7-4 3.7-4 6h4v5h-5v-5c0-4 1.8-7 5-9Z" />
        </svg>
      );
    case 'mail':
      return (
        <svg {...shared}>
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="m4 7 8 6 8-6" />
        </svg>
      );
    case 'phone':
      return (
        <svg {...shared}>
          <path d="M6.6 4h3.2l1.3 4.3-1.8 1.8a16.4 16.4 0 0 0 4.6 4.6l1.8-1.8L20 14.2v3.2c0 .7-.6 1.3-1.3 1.3A16.7 16.7 0 0 1 5.3 5.3C5.3 4.6 5.9 4 6.6 4Z" />
        </svg>
      );
    case 'location':
      return (
        <svg {...shared}>
          <path d="M12 21s6-5.4 6-11a6 6 0 1 0-12 0c0 5.6 6 11 6 11Z" />
          <circle cx="12" cy="10" r="2.2" />
        </svg>
      );
    case 'globe':
      return (
        <svg {...shared}>
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18" />
          <path d="M12 3a15 15 0 0 1 0 18" />
          <path d="M12 3a15 15 0 0 0 0 18" />
        </svg>
      );
    case 'share':
      return (
        <svg {...shared}>
          <circle cx="18" cy="5" r="2" />
          <circle cx="6" cy="12" r="2" />
          <circle cx="18" cy="19" r="2" />
          <path d="m8 12 8-6" />
          <path d="m8 12 8 6" />
        </svg>
      );
    case 'link':
      return (
        <svg {...shared}>
          <path d="M10 13a5 5 0 0 1 0-7l1.5-1.5a5 5 0 1 1 7 7L17 13" />
          <path d="M14 11a5 5 0 0 1 0 7L12.5 19.5a5 5 0 1 1-7-7L7 11" />
        </svg>
      );
    case 'card':
      return (
        <svg {...shared}>
          <rect x="3" y="6" width="18" height="12" rx="2" />
          <path d="M3 10h18" />
        </svg>
      );
    case 'wallet':
      return (
        <svg {...shared}>
          <path d="M4 7h13a3 3 0 0 1 3 3v7H7a3 3 0 0 1-3-3V7Z" />
          <path d="M4 7V6a2 2 0 0 1 2-2h10" />
          <circle cx="16" cy="12" r="1" />
        </svg>
      );
    case 'tap':
      return (
        <svg {...shared}>
          <path d="M7 12a5 5 0 0 1 10 0" />
          <path d="M4 12a8 8 0 0 1 16 0" />
          <path d="M12 12v7" />
          <path d="M10 19h4" />
        </svg>
      );
    case 'user':
      return (
        <svg {...shared}>
          <circle cx="12" cy="8" r="4" />
          <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
        </svg>
      );
    case 'camera':
      return (
        <svg {...shared}>
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
          <circle cx="12" cy="13" r="4" />
        </svg>
      );
    case 'lock':
      return (
        <svg {...shared}>
          <rect x="3" y="11" width="18" height="11" rx="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      );
    case 'menu':
      return (
        <svg {...shared}>
          <path d="M4 7h16M4 12h16M4 17h16" />
        </svg>
      );
    case 'close':
      return (
        <svg {...shared}>
          <path d="m6 6 12 12M18 6 6 18" />
        </svg>
      );
    default:
      return null;
  }
}

export default Icon;
