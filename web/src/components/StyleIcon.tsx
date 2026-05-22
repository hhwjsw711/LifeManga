const STYLE_ICONS: Record<string, React.ReactNode> = {
  shonenJump: (
    <svg width={36} height={36} viewBox="0 0 36 36" fill="none">
      <rect width="36" height="36" rx="4" fill="#FF6B35" />
      <path
        d="M8 28L18 8L28 28"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <line
        x1="12"
        y1="20"
        x2="24"
        y2="20"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="18" cy="14" r="2" fill="white" />
    </svg>
  ),
  sliceOfLife: (
    <svg width={36} height={36} viewBox="0 0 36 36" fill="none">
      <rect width="36" height="36" rx="4" fill="#FFB6C1" />
      <circle cx="18" cy="16" r="6" fill="white" opacity="0.9" />
      <path
        d="M12 28C12 24 15 22 18 22C21 22 24 24 24 28"
        stroke="white"
        strokeWidth="1.5"
        fill="none"
      />
      <circle cx="15" cy="15" r="1" fill="#FF6B9D" />
      <circle cx="21" cy="15" r="1" fill="#FF6B9D" />
      <path
        d="M16 18C16 18 17 19 18 19C19 19 20 18 20 18"
        stroke="#FF6B9D"
        strokeWidth="0.8"
        fill="none"
      />
    </svg>
  ),
  darkSeinen: (
    <svg width={36} height={36} viewBox="0 0 36 36" fill="none">
      <rect width="36" height="36" rx="4" fill="#1A1A2E" />
      <path
        d="M10 26L18 10L26 26"
        stroke="#E94560"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <line x1="14" y1="18" x2="22" y2="18" stroke="#E94560" strokeWidth="1" />
      <path
        d="M13 22L18 14L23 22"
        stroke="#E94560"
        strokeWidth="0.8"
        fill="none"
        opacity="0.6"
      />
    </svg>
  ),
  retroGekiga: (
    <svg width={36} height={36} viewBox="0 0 36 36" fill="none">
      <rect width="36" height="36" rx="4" fill="#D4A574" />
      <rect
        x="8"
        y="8"
        width="20"
        height="20"
        rx="1"
        stroke="white"
        strokeWidth="1.5"
        fill="none"
      />
      <line x1="8" y1="18" x2="28" y2="18" stroke="white" strokeWidth="1" />
      <line x1="18" y1="8" x2="18" y2="28" stroke="white" strokeWidth="1" />
      <circle cx="13" cy="13" r="2" fill="white" opacity="0.8" />
      <circle cx="23" cy="23" r="2" fill="white" opacity="0.8" />
    </svg>
  ),
  chibi4Koma: (
    <svg width={36} height={36} viewBox="0 0 36 36" fill="none">
      <rect width="36" height="36" rx="4" fill="#FFC0CB" />
      <rect
        x="4"
        y="4"
        width="12"
        height="12"
        rx="2"
        fill="white"
        opacity="0.9"
      />
      <rect
        x="20"
        y="4"
        width="12"
        height="12"
        rx="2"
        fill="white"
        opacity="0.9"
      />
      <rect
        x="4"
        y="20"
        width="12"
        height="12"
        rx="2"
        fill="white"
        opacity="0.9"
      />
      <rect
        x="20"
        y="20"
        width="12"
        height="12"
        rx="2"
        fill="white"
        opacity="0.9"
      />
      <circle cx="10" cy="10" r="2" fill="#FF69B4" />
      <circle cx="26" cy="10" r="2" fill="#FF69B4" />
      <circle cx="10" cy="26" r="2" fill="#FF69B4" />
      <circle cx="26" cy="26" r="2" fill="#FF69B4" />
    </svg>
  ),
  sportsHotBlooded: (
    <svg width={36} height={36} viewBox="0 0 36 36" fill="none">
      <rect width="36" height="36" rx="4" fill="#FF4500" />
      <path
        d="M18 6L20 14L28 14L22 19L24 28L18 23L12 28L14 19L8 14L16 14Z"
        fill="white"
      />
      <path
        d="M10 30L18 26L26 30"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  ),
  scifiMecha: (
    <svg width={36} height={36} viewBox="0 0 36 36" fill="none">
      <rect width="36" height="36" rx="4" fill="#1E3A5F" />
      <polygon
        points="18,6 28,14 26,26 10,26 8,14"
        stroke="#4FC3F7"
        strokeWidth="1.5"
        fill="none"
      />
      <circle
        cx="18"
        cy="16"
        r="3"
        stroke="#4FC3F7"
        strokeWidth="1"
        fill="none"
      />
      <circle cx="18" cy="16" r="1" fill="#4FC3F7" />
      <line x1="14" y1="22" x2="22" y2="22" stroke="#4FC3F7" strokeWidth="1" />
    </svg>
  ),
  horrorJunjiIto: (
    <svg width={36} height={36} viewBox="0 0 36 36" fill="none">
      <rect width="36" height="36" rx="4" fill="#2D1B3D" />
      <circle
        cx="18"
        cy="14"
        r="8"
        stroke="#9B59B6"
        strokeWidth="1"
        fill="none"
      />
      <circle cx="15" cy="12" r="1.5" fill="#9B59B6" />
      <circle cx="21" cy="12" r="1.5" fill="#9B59B6" />
      <path
        d="M14 18C14 18 16 20 18 20C20 20 22 18 22 18"
        stroke="#9B59B6"
        strokeWidth="1"
        fill="none"
      />
      <path
        d="M10 26C10 26 14 24 18 24C22 24 26 26 26 26"
        stroke="#9B59B6"
        strokeWidth="0.8"
        fill="none"
        opacity="0.5"
      />
      <path
        d="M8 30L12 28L16 30L20 28L24 30L28 28"
        stroke="#9B59B6"
        strokeWidth="0.6"
        fill="none"
        opacity="0.3"
      />
    </svg>
  ),
};

export function StyleIcon({ styleId }: { styleId: string }) {
  return (
    <div className="rounded-md overflow-hidden">
      {STYLE_ICONS[styleId] ?? (
        <div
          className="w-9 h-9 rounded-md flex items-center justify-center bg-ink-muted"
          aria-hidden="true"
        >
          <span className="text-white text-xs font-bold">
            {styleId.charAt(0).toUpperCase()}
          </span>
        </div>
      )}
    </div>
  );
}
