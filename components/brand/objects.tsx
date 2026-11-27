/**
 * Object illustrations for business types (brand illustration style: flat shapes, hard Ink
 * shadow). Decorative; label them with nearby text.
 */

export function CupObject({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 200 200"
      aria-hidden
      style={{ filter: "drop-shadow(8px 8px 0 #0B0D12)" }}
    >
      <polygon points="84,34 98,34 92,16 78,16" fill="#0B0D12" />
      <polygon points="104,30 118,30 112,8 98,8" fill="#0B0D12" />
      <polygon points="124,34 138,34 132,16 118,16" fill="#0B0D12" />
      <path d="M66 48 L74 38 H130 L138 48 Z" fill="#0B0D12" />
      <rect x="58" y="46" width="88" height="16" rx="6" fill="#0B0D12" />
      <path d="M62 62 H142 L130 178 H74 Z" fill="#FFFFFF" />
      <path d="M66 98 H138 L134 140 H70 Z" fill="#2B3AF3" />
      <g transform="translate(86 104) scale(0.3)" fill="#FFCF28">
        <polygon points="40,4 98,4 68.3,30 10.3,30" />
        <polygon points="11.1,34 57.1,34 94.9,58 48.9,58" />
        <polygon points="66,88 8,88 37.7,62 95.7,62" />
      </g>
    </svg>
  );
}

export function BurgerObject({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 200 200"
      aria-hidden
      style={{ filter: "drop-shadow(8px 8px 0 #0B0D12)" }}
    >
      <path d="M44 94 C44 50 156 50 156 94 Z" fill="#FFCF28" />
      <path
        d="M38 94 H162 L156 108 L148 98 L140 108 L132 98 L124 108 L116 98 L108 108 L100 98 L92 108 L84 98 L76 108 L68 98 L60 108 L52 98 L44 108 Z"
        fill="#0FA968"
      />
      <rect x="42" y="108" width="116" height="24" rx="12" fill="#0B0D12" />
      <path
        d="M46 106 H154 L150 114 H118 L110 126 L102 114 H50 Z"
        fill="#FFFFFF"
      />
      <path d="M44 138 H156 V146 C156 160 44 160 44 146 Z" fill="#FFCF28" />
    </svg>
  );
}

export function ShoppingBagObject({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 200 200"
      aria-hidden
      style={{ filter: "drop-shadow(8px 8px 0 #0B0D12)" }}
    >
      <path
        d="M78 70 V54 C78 28 122 28 122 54 V70"
        fill="none"
        stroke="#0B0D12"
        strokeWidth="9"
        strokeLinecap="round"
      />
      <polygon points="50,64 150,64 158,176 42,176" fill="#FFFFFF" />
      <g transform="rotate(-12 118 124)">
        <rect x="92" y="102" width="56" height="44" rx="8" fill="#FFCF28" />
        <g transform="translate(106 110) scale(0.29)" fill="#0B0D12">
          <polygon points="40,4 98,4 68.3,30 10.3,30" />
          <polygon points="11.1,34 57.1,34 94.9,58 48.9,58" />
          <polygon points="66,88 8,88 37.7,62 95.7,62" />
        </g>
      </g>
    </svg>
  );
}

export function ClinicObject({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 200 200"
      aria-hidden
      style={{ filter: "drop-shadow(8px 8px 0 #0B0D12)" }}
    >
      <rect x="54" y="38" width="92" height="132" rx="14" fill="#FFFFFF" />
      <rect x="78" y="28" width="44" height="20" rx="7" fill="#0B0D12" />
      <rect x="88" y="64" width="24" height="62" rx="5" fill="#0FA968" />
      <rect x="69" y="83" width="62" height="24" rx="5" fill="#0FA968" />
    </svg>
  );
}

export function ScissorsObject({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 200 200"
      aria-hidden
      style={{ filter: "drop-shadow(8px 8px 0 #2B3AF3)" }}
    >
      <polygon points="96,104 106,104 160,26 148,22" fill="#FFFFFF" />
      <polygon points="94,104 104,104 52,22 40,26" fill="#ECEEF2" />
      <polygon points="96,100 106,106 84,132 74,126" fill="#FF6B4A" />
      <polygon points="104,100 94,106 116,132 126,126" fill="#FF6B4A" />
      <circle
        cx="72"
        cy="148"
        r="20"
        fill="none"
        stroke="#FF6B4A"
        strokeWidth="12"
      />
      <circle
        cx="128"
        cy="148"
        r="20"
        fill="none"
        stroke="#FF6B4A"
        strokeWidth="12"
      />
      <circle cx="100" cy="104" r="7" fill="#FFCF28" />
    </svg>
  );
}

export function CarObject({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 200 200"
      aria-hidden
      style={{ filter: "drop-shadow(8px 8px 0 #0B0D12)" }}
    >
      <path
        d="M22 132 V110 L52 104 L76 76 H130 L158 104 L180 110 V132 Z"
        fill="#FF6B4A"
      />
      <polygon points="82,84 102,84 102,102 66,102" fill="#FFFFFF" />
      <polygon points="108,84 128,84 148,102 108,102" fill="#FFFFFF" />
      <circle cx="60" cy="134" r="19" fill="#0B0D12" />
      <circle cx="60" cy="134" r="7" fill="#FFCF28" />
      <circle cx="146" cy="134" r="19" fill="#0B0D12" />
      <circle cx="146" cy="134" r="7" fill="#FFCF28" />
    </svg>
  );
}
