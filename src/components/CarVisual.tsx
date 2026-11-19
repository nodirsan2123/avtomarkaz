import { useEffect, useState } from 'react';
import { PresetKey } from '../types/car';

interface CarVisualProps {
  imageUrl?: string;
  presetKey: PresetKey;
  alt: string;
  className?: string;
  darkBackdrop?: boolean;
}

const PRESET_THEMES: Record<
  PresetKey,
  {
    isSuv: boolean;
    bodyTop: string;
    bodyMid: string;
    bodyShadow: string;
    cabinGlass: string;
    accentLine: string;
    rimColor: string;
    studioBg: string;
  }
> = {
  white_sedan: {
    isSuv: false,
    bodyTop: '#FFFFFF',
    bodyMid: '#E4E4E7',
    bodyShadow: '#A1A1AA',
    cabinGlass: '#18181B',
    accentLine: '#D4D4D8',
    rimColor: '#71717A',
    studioBg: 'from-zinc-100 via-zinc-50 to-zinc-200/80',
  },
  grey_suv: {
    isSuv: true,
    bodyTop: '#71717A',
    bodyMid: '#52525B',
    bodyShadow: '#27272A',
    cabinGlass: '#09090B',
    accentLine: '#A1A1AA',
    rimColor: '#D4D4D8',
    studioBg: 'from-zinc-100 via-stone-50 to-zinc-200/80',
  },
  black_fastback: {
    isSuv: false,
    bodyTop: '#3F3F46',
    bodyMid: '#18181B',
    bodyShadow: '#09090B',
    cabinGlass: '#09090B',
    accentLine: '#52525B',
    rimColor: '#A1A1AA',
    studioBg: 'from-zinc-200/70 via-zinc-100 to-zinc-200',
  },
  silver_camry: {
    isSuv: false,
    bodyTop: '#F4F4F5',
    bodyMid: '#D4D4D8',
    bodyShadow: '#71717A',
    cabinGlass: '#18181B',
    accentLine: '#E4E4E7',
    rimColor: '#52525B',
    studioBg: 'from-zinc-100 via-white to-zinc-200/70',
  },
  emerald_suv: {
    isSuv: true,
    bodyTop: '#475569',
    bodyMid: '#334155',
    bodyShadow: '#0F172A',
    cabinGlass: '#09090B',
    accentLine: '#64748B',
    rimColor: '#CBD5E1',
    studioBg: 'from-slate-100 via-zinc-50 to-slate-200/70',
  },
  slate_crossover: {
    isSuv: true,
    bodyTop: '#2563EB',
    bodyMid: '#1E3A8A',
    bodyShadow: '#172554',
    cabinGlass: '#09090B',
    accentLine: '#60A5FA',
    rimColor: '#E4E4E7',
    studioBg: 'from-slate-100 via-zinc-50 to-slate-200/80',
  },
};

function StudioCarSvg({
  presetKey,
  darkBackdrop,
}: {
  presetKey: PresetKey;
  darkBackdrop?: boolean;
}) {
  const theme = PRESET_THEMES[presetKey] || PRESET_THEMES.white_sedan;
  const gradId = `paint-${presetKey}-${darkBackdrop ? 'dark' : 'light'}`;

  return (
    <div
      className={`w-full h-full flex items-center justify-center relative overflow-hidden ${
        darkBackdrop
          ? 'bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800'
          : `bg-gradient-to-br ${theme.studioBg}`
      }`}
    >
      {/* Subtle architectural studio horizon */}
      <div
        className={`absolute inset-x-0 bottom-0 h-[34%] border-t ${
          darkBackdrop
            ? 'bg-zinc-950/60 border-white/10'
            : 'bg-zinc-200/45 border-zinc-300/60'
        }`}
      />

      <svg
        viewBox="0 0 640 380"
        className="w-[88%] h-auto relative z-10 select-none"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={theme.bodyTop} />
            <stop offset="55%" stopColor={theme.bodyMid} />
            <stop offset="100%" stopColor={theme.bodyShadow} />
          </linearGradient>
          <radialGradient id={`shadow-${presetKey}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#09090B" stopOpacity="0.38" />
            <stop offset="70%" stopColor="#09090B" stopOpacity="0.14" />
            <stop offset="100%" stopColor="#09090B" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Ground contact shadow */}
        <ellipse
          cx="320"
          cy="296"
          rx="236"
          ry="22"
          fill={`url(#shadow-${presetKey})`}
        />

        {theme.isSuv ? (
          <g>
            {/* SUV Body Silhouette */}
            <path
              d="M78 242 C76 216, 86 196, 118 188 L178 176 L236 122 C252 110, 276 106, 314 106 L448 106 C486 106, 518 122, 542 162 L564 196 C572 212, 570 238, 558 250 L534 256 L106 256 Z"
              fill={`url(#${gradId})`}
              stroke={theme.bodyShadow}
              strokeWidth="1.5"
            />
            {/* Cabin Glass */}
            <path
              d="M214 176 L252 132 C264 121, 282 118, 314 118 L438 118 C466 118, 492 132, 508 162 L512 174 Z"
              fill={theme.cabinGlass}
              opacity="0.92"
            />
            {/* Window Pillars */}
            <path d="M352 118 L358 175" stroke={theme.bodyMid} strokeWidth="7" />
            <path d="M446 119 L462 174" stroke={theme.bodyMid} strokeWidth="6" />
            {/* Shoulder Character Line */}
            <path
              d="M110 198 C210 190, 390 186, 534 192"
              fill="none"
              stroke={theme.accentLine}
              strokeWidth="2"
              opacity="0.7"
            />
            {/* Lower Cladding */}
            <path
              d="M108 248 L544 248 L536 259 L114 259 Z"
              fill="#18181B"
            />
            {/* Headlight LED */}
            <path
              d="M84 206 L124 198 L128 208 L86 216 Z"
              fill="#F8FAFC"
            />
            {/* Taillight LED */}
            <path
              d="M542 184 L566 194 L560 206 L536 198 Z"
              fill="#EF4444"
            />
            {/* Rear Wheel */}
            <g transform="translate(466, 254)">
              <circle r="44" fill="#18181B" />
              <circle r="29" fill="#27272A" stroke={theme.rimColor} strokeWidth="3" />
              <circle r="10" fill={theme.rimColor} />
              <path d="M-24 0 L24 0 M0 -24 L0 24 M-17 -17 L17 17 M-17 17 L17 -17" stroke={theme.rimColor} strokeWidth="2.5" />
            </g>
            {/* Front Wheel */}
            <g transform="translate(178, 254)">
              <circle r="44" fill="#18181B" />
              <circle r="29" fill="#27272A" stroke={theme.rimColor} strokeWidth="3" />
              <circle r="10" fill={theme.rimColor} />
              <path d="M-24 0 L24 0 M0 -24 L0 24 M-17 -17 L17 17 M-17 17 L17 -17" stroke={theme.rimColor} strokeWidth="2.5" />
            </g>
          </g>
        ) : (
          <g>
            {/* Sedan / Fastback Body Silhouette */}
            <path
              d="M64 244 C64 218, 84 198, 124 190 L196 176 L262 128 C282 114, 308 110, 352 110 L422 110 C458 110, 496 132, 534 176 L568 196 C578 212, 574 238, 560 250 L534 256 L92 256 Z"
              fill={`url(#${gradId})`}
              stroke={theme.bodyShadow}
              strokeWidth="1.5"
            />
            {/* Cabin Glass */}
            <path
              d="M224 176 L274 134 C290 123, 314 120, 352 120 L416 120 C446 120, 476 138, 502 174 Z"
              fill={theme.cabinGlass}
              opacity="0.92"
            />
            {/* B-Pillar */}
            <path d="M358 120 L364 176" stroke={theme.bodyMid} strokeWidth="7" />
            {/* Sleek Body Crease */}
            <path
              d="M96 204 C205 194, 396 190, 542 198"
              fill="none"
              stroke={theme.accentLine}
              strokeWidth="2"
              opacity="0.7"
            />
            {/* Side Skirt */}
            <path
              d="M118 250 L544 250 L536 258 L124 258 Z"
              fill="#18181B"
            />
            {/* Headlight LED */}
            <path
              d="M72 210 L118 200 L122 210 L76 219 Z"
              fill="#F8FAFC"
            />
            {/* Taillight LED */}
            <path
              d="M542 190 L570 198 L564 209 L536 201 Z"
              fill="#EF4444"
            />
            {/* Rear Wheel */}
            <g transform="translate(468, 254)">
              <circle r="41" fill="#18181B" />
              <circle r="27" fill="#27272A" stroke={theme.rimColor} strokeWidth="3" />
              <circle r="9" fill={theme.rimColor} />
              <path d="M-22 0 L22 0 M0 -22 L0 22 M-15 -15 L15 15 M-15 15 L15 -15" stroke={theme.rimColor} strokeWidth="2.4" />
            </g>
            {/* Front Wheel */}
            <g transform="translate(174, 254)">
              <circle r="41" fill="#18181B" />
              <circle r="27" fill="#27272A" stroke={theme.rimColor} strokeWidth="3" />
              <circle r="9" fill={theme.rimColor} />
              <path d="M-22 0 L22 0 M0 -22 L0 22 M-15 -15 L15 15 M-15 15 L15 -15" stroke={theme.rimColor} strokeWidth="2.4" />
            </g>
          </g>
        )}
      </svg>
    </div>
  );
}

export function CarVisual({
  imageUrl,
  presetKey,
  alt,
  className = '',
  darkBackdrop = false,
}: CarVisualProps) {
  const [failed, setFailed] = useState(false);
  const cleanUrl = (imageUrl || '').trim();

  useEffect(() => {
    setFailed(false);
  }, [cleanUrl]);

  if (cleanUrl && !failed) {
    return (
      <div className="relative w-full h-full overflow-hidden bg-zinc-100">
        <img
          src={cleanUrl}
          alt={alt}
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
          className={`absolute inset-0 w-full h-full object-cover ${className}`}
        />
      </div>
    );
  }

  return <StudioCarSvg presetKey={presetKey} darkBackdrop={darkBackdrop} />;
}
