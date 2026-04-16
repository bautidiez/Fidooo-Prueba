import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'ghost' | 'danger';
  isLoading?: boolean;
  fullWidth?: boolean;
}

export function Button({
  children,
  variant = 'primary',
  isLoading = false,
  fullWidth = false,
  disabled,
  className = '',
  ...props
}: ButtonProps) {
  const base =
    'relative inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-2 md:py-3 text-sm font-bold tracking-wide transition-all duration-300 focus:outline-none disabled:opacity-50 disabled:pointer-events-none active:scale-[0.97] hover:scale-[1.02] overflow-hidden group cursor-pointer';

  const variants = {
    primary:
      'bg-gradient-to-r from-[#1ebbf4] to-[#84d6f6] text-[#0a0a0f] shadow-[0_0_20px_rgba(30,187,244,0.3)] hover:shadow-[0_0_30px_rgba(30,187,244,0.5)] border border-white/20',
    ghost:
      'bg-white/5 text-white/80 hover:bg-white/10 hover:text-white border border-white/10',
    danger:
      'bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30',
  };

  return (
    <button
      disabled={disabled || isLoading}
      className={`${base} ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {/* Shine effect for primary */}
      {variant === 'primary' && (
         <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent group-hover:animate-[shimmer_1.5s_infinite] skew-x-12"></div>
      )}
      
      <span className="relative flex items-center gap-2">
        {isLoading ? (
          <>
            <span className="size-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
            Cargando...
          </>
        ) : (
          children
        )}
      </span>
    </button>
  );
}
