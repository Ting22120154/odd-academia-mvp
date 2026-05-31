import Link from "next/link";

type Props = {
  /** Color wordmark for light backgrounds; white simplified mark for blue panels. */
  variant?: "color" | "white";
  /** Render as a link to /home */
  href?: string;
  className?: string;
  /** Tailwind height class for the logo image (width scales automatically). */
  heightClass?: string;
};

const SRC = {
  color: "/odd-academia_logo-color.svg",
  white: "/odd-academia_logo.svg",
} as const;

export function OddAcademiaLogo({
  variant = "color",
  href,
  className = "",
  heightClass = "h-7",
}: Props) {
  const img = (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={SRC[variant]}
      alt="odd Academia"
      className={`${heightClass} w-auto ${className}`.trim()}
    />
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex shrink-0 items-center">
        {img}
      </Link>
    );
  }

  return img;
}
