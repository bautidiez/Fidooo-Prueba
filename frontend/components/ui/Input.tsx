import { forwardRef, useState, type InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, className = '', id, type, ...props }, ref) => {
    const [isVisible, setIsVisible] = useState(false);
    const isPassword = type === 'password';

    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label htmlFor={id} className="text-sm font-medium text-white/70">
            {label}
          </label>
        )}
        <div className="relative group">
          {icon && (
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30 transition-colors group-focus-within:text-violet-400">
              {icon}
            </span>
          )}
          <input
            ref={ref}
            id={id}
            type={isPassword ? (isVisible ? 'text' : 'password') : type}
            className={`
              w-full rounded-xl border bg-white/[0.03] px-4 py-2.5 text-sm text-white
              placeholder:text-white/20 backdrop-blur-md
              transition-all duration-300 outline-none
              ${icon ? 'pl-10' : ''}
              ${isPassword ? 'pr-11' : ''}
              ${
                error
                  ? 'border-red-500/40 focus:border-red-500/80 focus:ring-4 focus:ring-red-500/10'
                  : 'border-white/10 focus:border-[#1ebbf4]/50 focus:ring-4 focus:ring-[#1ebbf4]/10'
              }
              hover:bg-white/[0.05] hover:border-white/20
              ${className}
            `}
            {...props}
          />
          
          {isPassword && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsVisible(!isVisible);
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-30 p-2 text-white/40 hover:text-[#1ebbf4] transition-all rounded-lg hover:bg-white/10 active:scale-90"
              style={{ cursor: 'pointer' }}
              tabIndex={-1}
              aria-label={isVisible ? "Ocultar contraseña" : "Mostrar contraseña"}
            >
              {isVisible ? (
                <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                </svg>
              ) : (
                <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          )}
        </div>
        {error && <p className="text-xs text-red-400 animate-in fade-in slide-in-from-top-1">{error}</p>}
      </div>
    );
  },
);

Input.displayName = 'Input';
