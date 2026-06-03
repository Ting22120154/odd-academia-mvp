import type { ComponentType, ReactNode } from "react";
import type { PaperCategory } from "@/lib/papers/categories";

type IconProps = { className?: string };

function strokeIcon(
  paths: ReactNode,
  className = "h-10 w-10",
) {
  return function CategorySvg({ className: cls }: IconProps) {
    return (
      <svg
        className={cls ?? className}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        {paths}
      </svg>
    );
  };
}

const ICONS: Record<PaperCategory, ComponentType<IconProps>> = {
  AI: strokeIcon(
    <>
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
      <circle cx="12" cy="12" r="3" />
    </>,
  ),
  "Data Science": strokeIcon(
    <>
      <ellipse cx="12" cy="5" rx="7" ry="3" />
      <path d="M5 5v6c0 1.66 3.13 3 7 3s7-1.34 7-3V5" />
      <path d="M5 11v6c0 1.66 3.13 3 7 3s7-1.34 7-3v-6" />
    </>,
  ),
  Biohacking: strokeIcon(
    <>
      <path d="M12 2v20M8 6h8M8 18h8M6 10h12M6 14h12" />
    </>,
  ),
  Biology: strokeIcon(
    <>
      <path d="M12 2c-2 4-6 6-6 10a6 6 0 0 0 12 0c0-4-4-6-6-10Z" />
      <path d="M12 12v10" />
    </>,
  ),
  Business: strokeIcon(
    <>
      <rect x="3" y="7" width="18" height="14" rx="2" />
      <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </>,
  ),
  Chemistry: strokeIcon(
    <>
      <path d="M9 3h6v7l5 9a4 4 0 0 1-3.5 6H7.5a4 4 0 0 1-3.5-6l5-9V3Z" />
    </>,
  ),
  Design: strokeIcon(
    <>
      <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3Z" />
      <circle cx="12" cy="12" r="2.5" />
    </>,
  ),
  Economics: strokeIcon(
    <>
      <path d="M3 3v18h18" />
      <path d="M7 16l4-5 4 3 5-7" />
    </>,
  ),
  Education: strokeIcon(
    <>
      <path d="M22 10 12 5 2 10l10 5 10-5Z" />
      <path d="M6 12v5c0 2 3 3 6 3s6-1 6-3v-5" />
    </>,
  ),
  "Engineering/Robotics": strokeIcon(
    <>
      <rect x="4" y="8" width="16" height="10" rx="2" />
      <circle cx="9" cy="13" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="15" cy="13" r="1.5" fill="currentColor" stroke="none" />
      <path d="M12 8V5M8 5h8" />
    </>,
  ),
  Fashion: strokeIcon(
    <>
      <path d="M12 3 7 8h10L12 3Z" />
      <path d="M7 8v12h10V8" />
    </>,
  ),
  Gastronomy: strokeIcon(
    <>
      <path d="M6 3v8a4 4 0 0 0 8 0V3M10 3v18M18 3v5a3 3 0 0 1-3 3h-1V3" />
    </>,
  ),
  Health: strokeIcon(
    <>
      <path d="M12 21s-7-4.5-7-10a4 4 0 0 1 7-2 4 4 0 0 1 7 2c0 5.5-7 10-7 10Z" />
    </>,
  ),
  History: strokeIcon(
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>,
  ),
  Law: strokeIcon(
    <>
      <path d="M12 3v18M4 7h16M7 7l5 14 5-14" />
    </>,
  ),
  "Lifestyle/Culture": strokeIcon(
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 3.5-7 8-7s8 3 8 7" />
    </>,
  ),
  Maths: strokeIcon(
    <>
      <path d="M8 7h8M8 12h8M8 17h5" />
      <path d="M6 4h12v16H6z" opacity="0" />
      <path d="M4 7 8 17M20 7l-4 10" />
    </>,
  ),
  Music: strokeIcon(
    <>
      <path d="M9 18V6l10-2v12" />
      <circle cx="7" cy="18" r="2" />
      <circle cx="17" cy="16" r="2" />
    </>,
  ),
  Nature: strokeIcon(
    <>
      <path d="M12 22V12M12 12C12 6 7 3 4 3c0 5 3 9 8 9M12 12c0-6 5-9 8-9 0 5-3 9-8 9" />
    </>,
  ),
  Philosophy: strokeIcon(
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M8 14c1.5 2 6.5 2 8 0M9 10h.01M15 10h.01" />
    </>,
  ),
  Physics: strokeIcon(
    <>
      <circle cx="12" cy="12" r="2" />
      <ellipse cx="12" cy="12" rx="9" ry="4" />
      <ellipse cx="12" cy="12" rx="9" ry="4" transform="rotate(60 12 12)" />
      <ellipse cx="12" cy="12" rx="9" ry="4" transform="rotate(120 12 12)" />
    </>,
  ),
  Politics: strokeIcon(
    <>
      <path d="M3 21h18M5 21V9l7-6 7 6v12" />
      <path d="M9 21v-6h6v6" />
    </>,
  ),
  Psychology: strokeIcon(
    <>
      <path d="M12 3a5 5 0 0 0-5 5c0 2.5 2 4 5 7 3-3 5-4.5 5-7a5 5 0 0 0-5-5Z" />
      <path d="M8 21h8" />
    </>,
  ),
  "Pop Culture": strokeIcon(
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M7 15l3-3 2 2 4-4 3 3" />
    </>,
  ),
  Science: strokeIcon(
    <>
      <path d="M10 2v7.5L4 20h16l-6-10.5V2" />
    </>,
  ),
  Sociology: strokeIcon(
    <>
      <circle cx="9" cy="8" r="3" />
      <circle cx="16" cy="9" r="2.5" />
      <path d="M4 20c0-3 2.5-5 5-5s5 2 5 5M14 20c0-2 1.5-3.5 3.5-3.5" />
    </>,
  ),
  Sports: strokeIcon(
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3a12 12 0 0 1 0 18M12 3a12 12 0 0 0 0 18M3 12h18" />
    </>,
  ),
  Technology: strokeIcon(
    <>
      <rect x="2" y="4" width="20" height="14" rx="2" />
      <path d="M8 20h8M12 18v2" />
    </>,
  ),
  Arts: strokeIcon(
    <>
      <path d="M12 3l1.5 6.5L20 11l-6.5 1.5L12 19l-1.5-6.5L4 11l6.5-1.5L12 3Z" />
    </>,
  ),
  Architecture: strokeIcon(
    <>
      <path d="M3 21h18M6 21V9l6-6 6 6v12" />
      <path d="M9 21v-5h6v5" />
    </>,
  ),
};

export function CategoryIcon({
  category,
  className,
}: {
  category: PaperCategory;
  className?: string;
}) {
  const Icon = ICONS[category];
  return <Icon className={className} />;
}
