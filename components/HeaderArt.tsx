// Drawn background for the header: fields, hills and leaves. Pure SVG, so it
// loads instantly and stays sharp on every screen size.

const LEAVES = [
  { x: 1040, y: 60, r: -35, s: 1.5, o: 0.9 },
  { x: 1110, y: 120, r: 20, s: 1.8, o: 0.85 },
  { x: 980, y: 150, r: -70, s: 1.2, o: 0.75 },
  { x: 1170, y: 40, r: 60, s: 1.1, o: 0.7 },
  { x: 880, y: 40, r: -10, s: 0.9, o: 0.45 },
  { x: 760, y: 150, r: 40, s: 0.8, o: 0.35 },
];

export default function HeaderArt() {
  return (
    <svg
      className="absolute inset-0 h-full w-full"
      viewBox="0 0 1200 200"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
    >
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0f5132" />
          <stop offset="1" stopColor="#1f7a3f" />
        </linearGradient>
        <linearGradient id="leaf" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#a3e635" />
          <stop offset="1" stopColor="#15803d" />
        </linearGradient>
        <linearGradient id="fade" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#0b3d24" stopOpacity="0.85" />
          <stop offset="0.55" stopColor="#0b3d24" stopOpacity="0.35" />
          <stop offset="1" stopColor="#0b3d24" stopOpacity="0" />
        </linearGradient>
      </defs>

      <rect width="1200" height="200" fill="url(#sky)" />
      <circle cx="930" cy="70" r="60" fill="#fde68a" opacity="0.18" />

      {/* Hills */}
      <path d="M0 130 C200 90 380 110 560 95 C760 80 950 120 1200 100 L1200 200 L0 200 Z" fill="#2f8f4e" opacity="0.55" />
      <path d="M0 155 C220 130 420 150 640 135 C850 122 1020 150 1200 140 L1200 200 L0 200 Z" fill="#3fa35d" opacity="0.6" />

      {/* Crop rows */}
      {Array.from({ length: 9 }, (_, i) => (
        <path
          key={i}
          d={`M${-100 + i * 150} 200 Q${250 + i * 110} 165 ${600 + i * 70} 150`}
          stroke="#86efac"
          strokeOpacity="0.18"
          strokeWidth="3"
          fill="none"
        />
      ))}

      {/* Leaves */}
      {LEAVES.map((l, i) => (
        <g key={i} transform={`translate(${l.x} ${l.y}) rotate(${l.r}) scale(${l.s})`} opacity={l.o}>
          <path d="M0 0 C25 -32 80 -34 110 0 C80 34 25 32 0 0 Z" fill="url(#leaf)" />
          <path d="M0 0 L104 0" stroke="#14532d" strokeOpacity="0.5" strokeWidth="2" />
          {[24, 46, 68].map((x) => (
            <path key={x} d={`M${x} 0 L${x + 16} -12 M${x} 0 L${x + 16} 12`} stroke="#14532d" strokeOpacity="0.35" strokeWidth="1.5" />
          ))}
        </g>
      ))}

      {/* Darker on the left so the text stays easy to read */}
      <rect width="1200" height="200" fill="url(#fade)" />
    </svg>
  );
}
