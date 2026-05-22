import { type ButtonHTMLAttributes, type ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  shortcut?: string;
  children: ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  shortcut,
  children,
  disabled,
  className = "",
  ...props
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center rounded-pill font-medium transition-all active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-ember focus-visible:outline-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100";

  const variants: Record<ButtonVariant, string> = {
    primary: "bg-ember text-white hover:bg-ember-dark",
    secondary:
      "bg-cream-medium text-ink dark:text-cream-light dark:bg-ink-light border-2 border-cream-dark dark:border-ink-muted hover:bg-cream-dark dark:hover:bg-ink-medium",
    ghost:
      "text-ink-muted hover:text-ink dark:text-ink-muted dark:hover:text-cream-light",
    danger: "bg-error text-white hover:bg-red-600",
  };

  const sizes: Record<ButtonSize, string> = {
    sm: "h-10 px-4 text-sm",
    md: "h-12 px-6 text-sm",
    lg: "h-14 px-8 text-base",
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          {children}
        </span>
      ) : shortcut ? (
        <span className="flex items-center gap-2">
          {children}
          <kbd className="text-xs opacity-70 font-normal">{shortcut}</kbd>
        </span>
      ) : (
        children
      )}
    </button>
  );
}
