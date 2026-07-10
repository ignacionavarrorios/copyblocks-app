import React from "react";
import { T } from "@/lib/constants";

interface CardProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
}

export function Card({ children, style = {} }: CardProps) {
  return (
    <div
      style={{
        background: T.white,
        borderRadius: 12,
        border: `1px solid ${T.gray}`,
        padding: 20,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
