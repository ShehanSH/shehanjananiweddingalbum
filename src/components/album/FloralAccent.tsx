export function FloralAccent({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 220 220"
      className={className}
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M110 30c8 28 8 52 0 80-8-28-8-52 0-80Z"
        stroke="currentColor"
        strokeWidth="1.2"
      />
      <path
        d="M78 58c22 18 38 26 62 28-24 2-40 10-62 28 8-22 12-38 0-56Z"
        stroke="currentColor"
        strokeWidth="1.2"
      />
      <path
        d="M142 58c-22 18-38 26-62 28 24 2 40 10 62 28-8-22-12-38 0-56Z"
        stroke="currentColor"
        strokeWidth="1.2"
      />
      <circle cx="110" cy="110" r="4" fill="currentColor" />
      <path
        d="M110 118c2 28-6 52-22 72"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinecap="round"
      />
      <path
        d="M110 126c8 18 24 36 46 48"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function FloralCorner({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 160" className={className} fill="none" aria-hidden="true">
      <path
        d="M12 148C18 92 48 42 118 18"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinecap="round"
      />
      <path
        d="M28 132c18-8 32-6 46 8"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
      />
      <path
        d="M40 86c12-18 32-28 58-32"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
      />
      <circle cx="118" cy="18" r="3" fill="currentColor" />
    </svg>
  );
}
