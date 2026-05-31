import type { ReactNode } from "react";

interface IconProps {
  size?: number;
}

// All icons are decorative: they sit beside text, or inside controls that
// carry their own aria-label. Hide them from assistive tech so screen readers
// don't announce unlabelled SVGs. A control that is icon-only must always
// supply its own aria-label.
const Icon = ({ d, size = 20 }: IconProps & { d: ReactNode }) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    {d}
  </svg>
);

export const I_Search = (p: IconProps) => (
  <Icon
    {...p}
    d={
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="M21 21l-4.3-4.3" />
      </>
    }
  />
);
export const I_Arrow = (p: IconProps) => (
  <Icon
    {...p}
    d={
      <>
        <path d="M5 12h14M12 5l7 7-7 7" />
      </>
    }
  />
);
export const I_X = (p: IconProps) => (
  <Icon
    {...p}
    d={
      <>
        <path d="M18 6L6 18M6 6l12 12" />
      </>
    }
  />
);
export const I_Menu = (p: IconProps) => (
  <Icon
    {...p}
    d={
      <>
        <path d="M3 6h18M3 12h18M3 18h18" />
      </>
    }
  />
);
export const I_Check = (p: IconProps) => (
  <Icon
    {...p}
    d={
      <>
        <path d="M20 6L9 17l-5-5" />
      </>
    }
  />
);
export const I_Plus = (p: IconProps) => (
  <Icon
    {...p}
    d={
      <>
        <path d="M12 5v14M5 12h14" />
      </>
    }
  />
);
export const I_Pin = (p: IconProps) => (
  <Icon
    {...p}
    d={
      <>
        <path d="M12 21s-7-7.6-7-12a7 7 0 1 1 14 0c0 4.4-7 12-7 12z" />
        <circle cx="12" cy="9" r="2.5" />
      </>
    }
  />
);
export const I_Calendar = (p: IconProps) => (
  <Icon
    {...p}
    d={
      <>
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M16 2v4M8 2v4M3 10h18" />
      </>
    }
  />
);
export const I_Clock = (p: IconProps) => (
  <Icon
    {...p}
    d={
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    }
  />
);
export const I_Users = (p: IconProps) => (
  <Icon
    {...p}
    d={
      <>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13A4 4 0 0 1 16 11" />
      </>
    }
  />
);
export const I_Money = (p: IconProps) => (
  <Icon
    {...p}
    d={
      <>
        <path d="M12 1v22M17 5H9.5a3.5 3.5 0 1 0 0 7h5a3.5 3.5 0 1 1 0 7H6" />
      </>
    }
  />
);
export const I_Trophy = (p: IconProps) => (
  <Icon
    {...p}
    d={
      <>
        <path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z" />
        <path d="M5 4H3a4 4 0 0 0 4 4M19 4h2a4 4 0 0 1-4 4" />
      </>
    }
  />
);
export const I_Star = (p: IconProps) => (
  <Icon {...p} d={<polygon points="12 2 15 9 22 10 17 15 18 22 12 19 6 22 7 15 2 10 9 9 12 2" />} />
);
export const I_External = (p: IconProps) => (
  <Icon
    {...p}
    d={
      <>
        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" />
      </>
    }
  />
);
export const I_Chevron = (p: IconProps) => <Icon {...p} d={<path d="M9 6l6 6-6 6" />} />;
export const I_Compare = (p: IconProps) => (
  <Icon
    {...p}
    d={
      <>
        <path d="M3 7h18M3 12h12M3 17h18" />
      </>
    }
  />
);
export const I_Grid = (p: IconProps) => (
  <Icon
    {...p}
    d={
      <>
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
      </>
    }
  />
);
export const I_List = (p: IconProps) => (
  <Icon
    {...p}
    d={
      <>
        <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
      </>
    }
  />
);
