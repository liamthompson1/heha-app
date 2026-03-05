"use client";

import { useRef, useState, useCallback, useEffect } from "react";

interface OtpInputProps {
  length?: number;
  onChange?: (value: string) => void;
  onSubmit?: () => void;
}

export default function OtpInput({ length = 6, onChange, onSubmit }: OtpInputProps) {
  const [values, setValues] = useState<string[]>(Array(length).fill(""));
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const hiddenRef = useRef<HTMLInputElement>(null);

  const focusIndex = useCallback(
    (i: number) => {
      if (i >= 0 && i < length) refs.current[i]?.focus();
    },
    [length]
  );

  const update = useCallback(
    (next: string[]) => {
      setValues(next);
      onChange?.(next.join(""));
    },
    [onChange]
  );

  // Distribute digits from a full string into cells
  const distributeCode = useCallback(
    (code: string) => {
      const digits = code.replace(/\D/g, "").slice(0, length);
      if (!digits) return;
      const next = Array(length).fill("");
      for (let i = 0; i < digits.length; i++) next[i] = digits[i];
      update(next);
      focusIndex(Math.min(digits.length, length - 1));
    },
    [length, update, focusIndex]
  );

  // Watch the hidden autofill input for iOS filling it
  useEffect(() => {
    const el = hiddenRef.current;
    if (!el) return;
    const observer = new MutationObserver(() => {
      if (el.value) {
        distributeCode(el.value);
        el.value = "";
      }
    });
    observer.observe(el, { attributes: true, attributeFilter: ["value"] });
    return () => observer.disconnect();
  }, [distributeCode]);

  const handleChange = (i: number, v: string) => {
    const digit = v.replace(/\D/g, "").slice(-1);
    const next = [...values];
    next[i] = digit;
    update(next);
    if (digit && i < length - 1) focusIndex(i + 1);
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !values[i] && i > 0) {
      focusIndex(i - 1);
    }
    if (e.key === "Enter") {
      onSubmit?.();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    distributeCode(e.clipboardData.getData("text"));
  };

  return (
    <div className="relative flex justify-center gap-3">
      {/* Hidden input for iOS SMS autofill */}
      <input
        ref={hiddenRef}
        type="text"
        autoComplete="one-time-code"
        inputMode="numeric"
        aria-hidden="true"
        tabIndex={-1}
        className="absolute opacity-0 w-0 h-0 pointer-events-none"
        onChange={(e) => {
          if (e.target.value) {
            distributeCode(e.target.value);
            e.target.value = "";
          }
        }}
      />
      {values.map((v, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={v}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={i === 0 ? handlePaste : undefined}
          className="glass-otp-cell"
          aria-label={`Digit ${i + 1}`}
        />
      ))}
    </div>
  );
}
