interface LoaderProps {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
}

const sizeMap = {
  sm: 'size-4 border-2',
  md: 'size-6 border-2',
  lg: 'size-10 border-[3px]',
};

export function Loader({ size = 'md', label }: LoaderProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <span
        className={`${sizeMap[size]} rounded-full border-white/20 border-t-violet-400 animate-spin`}
      />
      {label && <p className="text-sm text-white/50 animate-pulse">{label}</p>}
    </div>
  );
}
