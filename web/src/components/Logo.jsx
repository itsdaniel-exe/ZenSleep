export default function Logo({ size = 28 }) {
  return (
    <div className="logo">
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M20 4a12 12 0 1 0 8 21.2A12.5 12.5 0 0 1 20 4Z"
          fill="url(#zs-moon)"
        />
        <path
          d="M4 20h4l2-4 3 8 3-11 2.5 7H26"
          stroke="var(--accent-2)"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          opacity="0.85"
        />
        <defs>
          <linearGradient id="zs-moon" x1="8" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
            <stop stopColor="var(--accent)" />
            <stop offset="1" stopColor="var(--accent-2)" />
          </linearGradient>
        </defs>
      </svg>
      <span className="logo-word">ZenSleep</span>
    </div>
  );
}
