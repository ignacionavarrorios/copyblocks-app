import React from "react";
import { T, font } from "@/lib/constants";

export type ButtonVariant = "primary" | "navy" | "ghost" | "outline" | "soft" | "danger" | "default";

interface BtnProps {
  variant?: ButtonVariant;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  children: React.ReactNode;
  disabled?: boolean;
  full?: boolean;
  small?: boolean;
  style?: React.CSSProperties;
  type?: "button" | "submit" | "reset";
}

const variantStyles: Record<ButtonVariant, React.CSSProperties> = {
  primary:  { background: T.purple,     color: "#fff",        borderColor: T.purple },
  navy:     { background: T.navy,       color: "#fff",        borderColor: T.navy },
  ghost:    { background: "transparent",color: T.slate,       borderColor: T.gray },
  outline:  { background: "transparent",color: T.purple,      borderColor: T.purpleLight },
  soft:     { background: T.purpleBg,   color: T.purple,      borderColor: T.purpleLight },
  danger:   { background: "transparent",color: "#D94F4F",     borderColor: "#F5BCBC" },
  default:  { background: T.grayLight,  color: T.navy,        borderColor: T.gray },
};

export function Btn({ variant = "default", onClick, children, disabled, full, small, style = {}, type = "button" }: BtnProps) {
  const base: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    padding: small ? "7px 13px" : "10px 18px",
    fontSize: small ? 12 : 13,
    fontWeight: 600,
    borderRadius: 9,
    cursor: disabled ? "not-allowed" : "pointer",
    border: "1.5px solid",
    fontFamily: font,
    opacity: disabled ? 0.5 : 1,
    transition: "all 0.15s",
    whiteSpace: "nowrap",
    width: full ? "100%" : "auto",
    boxSizing: "border-box",
    ...style,
  };

  return (
    <button
      type={type}
      style={{ ...base, ...(variantStyles[variant] || variantStyles.default) }}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
