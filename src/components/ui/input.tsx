import React from "react";
import { T, font } from "@/lib/constants";

interface InpProps {
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  label?: string;
  hint?: string;
  type?: string;
  multiline?: boolean;
  rows?: number;
  autoFocus?: boolean;
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  padding: "10px 14px",
  fontSize: 13,
  border: `1.5px solid ${T.gray}`,
  borderRadius: 9,
  background: T.white,
  color: T.navy,
  fontFamily: font,
  outline: "none",
  resize: "vertical",
  lineHeight: 1.6,
};

export function Inp({ placeholder, value, onChange, label, hint, type = "text", multiline, rows = 3, autoFocus }: InpProps) {
  return (
    <div style={{ marginBottom: 16 }}>
      {label && (
        <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: T.slate, marginBottom: 6 }}>
          {label}
        </div>
      )}
      {multiline ? (
        <textarea
          style={{ ...inputStyle, resize: "vertical" }}
          placeholder={placeholder}
          value={value}
          onChange={onChange as React.ChangeEventHandler<HTMLTextAreaElement>}
          rows={rows}
          autoFocus={autoFocus}
        />
      ) : (
        <input
          style={{ ...inputStyle, resize: "none" }}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange as React.ChangeEventHandler<HTMLInputElement>}
          autoFocus={autoFocus}
        />
      )}
      {hint && <div style={{ fontSize: 11, color: T.slate, marginTop: 5 }}>{hint}</div>}
    </div>
  );
}
