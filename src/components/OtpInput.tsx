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

  const handleChange = (i: number, v: string) => {
    // iOS autofill may dump the full code into the first input
    const digits = v.replace(/\D/g, "");
    if (digits.length > 1) {
      distributeCode(digits);
      return;
    }
    const digit = digits.slice(-1);
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
    <div className="flex justify-center gap-3">
      {values.map((v, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          maxLength={i === 0 ? 6 : 1}
          value={v}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          className="glass-otp-cell"
          aria-label={`Digit ${i + 1}`}
        />
      ))}
    </div>
  );
}
