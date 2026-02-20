import { useRef, useState, KeyboardEvent } from 'react';

interface OTPInputProps {
  length?: number;
  value: string;
  onChange: (otp: string) => void;
  disabled?: boolean;
  className?: string;
}

export default function OTPInput({ length = 6, value, onChange, disabled, className = '' }: OTPInputProps) {
  const [focusedIndex, setFocusedIndex] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const digits = value.split('').concat(Array(Math.max(0, length - value.length)).fill('')).slice(0, length);

  const handleChange = (index: number, v: string) => {
    if (disabled) return;
    const char = v.replace(/\D/g, '').slice(-1);
    const next = digits.slice();
    next[index] = char;
    const joined = next.join('');
    onChange(joined);
    if (char && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
      const next = digits.slice();
      next[index - 1] = '';
      onChange(next.join(''));
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    if (!pasted) return;
    const next = pasted.split('').concat(Array(length).fill('')).slice(0, length);
    onChange(next.join(''));
    const focusIndex = Math.min(pasted.length, length - 1);
    inputRefs.current[focusIndex]?.focus();
  };

  return (
    <div className={`flex justify-center gap-2 ${className}`} onPaste={handlePaste}>
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => { inputRefs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={d}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onFocus={() => setFocusedIndex(i)}
          disabled={disabled}
          className={`w-11 h-12 rounded-lg bg-slate-800 border text-center text-lg font-semibold text-white
            focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition-all
            ${focusedIndex === i ? 'border-cyan-500' : 'border-slate-600'}
            disabled:opacity-50 disabled:cursor-not-allowed`}
        />
      ))}
    </div>
  );
}
