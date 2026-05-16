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
}: ButtonProps) {
  const classes = `${base} ${variantClasses[variant]} ${className} ${
    disabled ? "opacity-50 cursor-not-allowed pointer-events-none" : ""
  }`;
  const content = (
    <>
      <span>{children}</span>
      {icon && <span className="inline-flex">{icon}</span>}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={classes}>
        {content}
      </Link>
    );
  }

  return (
    <button onClick={onClick} disabled={disabled} className={classes}>
      {content}
    </button>
  );
}
