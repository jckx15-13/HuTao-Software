import type { ButtonHTMLAttributes } from 'react';
import type { LucideIcon } from 'lucide-react';

type IconButtonVariant = 'ghost' | 'primary' | 'danger';

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: LucideIcon;
  label: string;
  variant?: IconButtonVariant;
  showLabel?: boolean;
}

const variantClasses: Record<IconButtonVariant, string> = {
  ghost: 'text-text-muted hover:text-text-main hover:bg-base/70',
  primary: 'text-primary bg-primary/15 border border-primary/30 hover:bg-primary hover:text-primary-text',
  danger: 'text-text-muted hover:text-danger hover:bg-danger/20',
};

export function IconButton({
  icon: Icon,
  label,
  variant = 'ghost',
  showLabel = false,
  className = '',
  ...buttonProps
}: IconButtonProps) {
  const classes = [
    'inline-flex min-h-8 min-w-8 items-center justify-center gap-2 rounded-lg p-2 text-sm transition-colors disabled:pointer-events-none disabled:opacity-40',
    variantClasses[variant],
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button aria-label={label} title={label} className={classes} {...buttonProps}>
      <Icon className="h-4 w-4 shrink-0" />
      {showLabel && <span className="truncate">{label}</span>}
    </button>
  );
}
