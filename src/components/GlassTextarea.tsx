import clsx from "clsx";

interface GlassTextareaProps {
  label?: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  rows?: number;
  className?: string;
}

export default function GlassTextarea({
  label,
  placeholder,
  value,
  onChange,
  rows = 4,
  className,
}: GlassTextareaProps) {
  return (
    <label className={clsx("block", className)}>
      {label && (
        <span className="mb-2 block text-sm font-medium text-white/50">
          {label}
        </span>
      )}
      <textarea
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        rows={rows}
        className="glass-textarea"
      />
    </label>
  );
}
