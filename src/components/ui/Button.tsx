import Link from "next/link";
import { ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost";

interface ButtonProps {
  variant?: Variant;
  children: ReactNode;
  onClick?: () => void;
  href?: string;
  icon?: ReactNode;
  className?: string;
  disabled?: boolean;
  /** For external CTAs (Maps, WhatsApp). Ignored when href is omitted. */
  target?: string;
  rel?: string;
  "aria-label"?: string;
}

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-[var(--color-bronze)] text-white hover:bg-[var(--color-bronze-hover)] shadow-sm",
  secondary:
    "border border-[var(--color-text)]/15 bg-[var(--color-background)] text-[var(--color-text)] hover:bg-[var(--color-background-soft)]",
  ghost:
    "bg-transparent text-[var(--color-text)] hover:text-[var(--color-bronze)]",
};

const base =
  "inline-flex cursor-pointer items-center gap-2 rounded-full px-6 py-2.5 font-sans text-sm uppercase tracking-widest transition-all duration-200";

export function Button({
  variant = "primary",
  children,
  onClick,
  href,
  icon,
  className = "",
  disabled = false,
  target,
  rel,
  "aria-label": ariaLabel,
}: ButtonProps) {
  // Disabled state overrides the variant's own color entirely (rather than
  // just dimming it) — a bronze/primary button at reduced opacity still
  // reads as an active, clickable accent color, not as "off".
  const classes = `${base} ${className} ${
    disabled
      ? "bg-[rgba(30,41,59,0.08)] text-[rgba(30,41,59,0.35)] shadow-none cursor-not-allowed pointer-events-none"
      : variantClasses[variant]
  }`;
  const content = (
    <>
      <span>{children}</span>
      {icon && <span className="inline-flex">{icon}</span>}
    </>
  );

  if (href) {
    const isExternal = /^https?:\/\//i.test(href) || href.startsWith("mailto:") || href.startsWith("tel:");
    if (isExternal) {
      return (
        <a
          href={href}
          className={classes}
          target={target}
          rel={rel}
          aria-label={ariaLabel}
        >
          {content}
        </a>
      );
    }
    return (
      <Link href={href} className={classes} aria-label={ariaLabel}>
        {content}
      </Link>
    );
  }

  return (
    <button onClick={onClick} disabled={disabled} className={classes} aria-label={ariaLabel}>
      {content}
    </button>
  );
}
