import clsx from "clsx";

interface GlassInputProps {
  label?: string;
  type?: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  size?: "md" | "lg";
  multiline?: boolean;
  rows?: number;
  className?: string;
}

export default function GlassInput({
  label,
  type = "text",
  placeholder,
  value,
  onChange,
  size = "md",
  multiline,
  rows = 4,
  className,
}: GlassInputProps) {
  const inputClass = multiline
    ? clsx("glass-textarea", size === "lg" && "glass-textarea-lg")
    : clsx("glass-input", size === "lg" && "glass-input-lg");

  return (
    <label className={clsx("block", className)}>
      {label && (
        <span className="mb-2 block text-[0.8rem] font-medium tracking-[0.03em]" style={{ color: 'var(--text-secondary)' }}>
          {label}
        </span>
      )}
      {multiline ? (
        <textarea
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          rows={rows}
          className={inputClass}
        />
      ) : (
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange as (e: React.ChangeEvent<HTMLInputElement>) => void}
          className={inputClass}
        />
      )}
    </label>
  );
}
