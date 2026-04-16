import { forwardRef, type InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, className = '', id, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={id} className="text-sm font-medium text-white/70">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40">
              {icon}
            </span>
          )}
          <input
            ref={ref}
            id={id}
            className={`
              w-full rounded-xl border bg-white/5 px-4 py-2.5 text-sm text-white
              placeholder:text-white/30 backdrop-blur-sm
              transition-all duration-200 outline-none
              ${icon ? 'pl-10' : ''}
              ${
                error
                  ? 'border-red-500/50 focus:border-red-500/80 focus:ring-2 focus:ring-red-500/20'
                  : 'border-white/10 focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/20'
              }
              ${className}
            `}
            {...props}
          />
        </div>
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>
    );
  },
);

Input.displayName = 'Input';
