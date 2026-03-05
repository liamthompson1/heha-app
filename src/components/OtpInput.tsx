"use client";

import { useRef, useState, useCallback } from "react";

interface OtpInputProps {
  length?: number;
  onChange?: (value: string) => void;
  onSubmit?: () => void;
}

export default function OtpInput({ length = 6, onChange, onSubmit }: OtpInputProps) {
  const [values, setValues] = useState<string[]>(Array(length).fill(""));
  const refs = useRef<(HTMLInputElement | null)[]>([]);

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
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    if (!pasted) return;
    const next = [...values];
    for (let i = 0; i < pasted.length; i++) next[i] = pasted[i];
    update(next);
    focusIndex(Math.min(pasted.length, length - 1));
  };

  return (
    <div className="flex justify-center gap-3">
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
          autoComplete="one-time-code"
          className="glass-otp-cell"
          aria-label={`Digit ${i + 1}`}
        />
      ))}
    </div>
  );
}
