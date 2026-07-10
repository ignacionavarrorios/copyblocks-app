import React from "react";
import { T, FL, FC } from "@/lib/constants";
import type { BlockType, FuncType } from "@/types";

const TIPO_LABELS_ES: Record<string, string> = {
  pain: "Dolor",
  promise: "Promesa",
  proof: "Prueba",
  curiosity: "Curiosidad",
  constraints: "Frenos",
  conditions: "Condiciones",
  offer: "Oferta",
};

interface BlockBadgeProps {
  type: BlockType | string;
  size?: "sm" | "lg";
}

export function BlockBadge({ type, size = "sm" }: BlockBadgeProps) {
  const t = (T as any)[type] || T.curiosity;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: size === "lg" ? "4px 12px" : "2px 8px",
        borderRadius: 20,
        fontSize: size === "lg" ? 12 : 10,
        fontWeight: 700,
        letterSpacing: "0.04em",
        background: t.bg,
        color: t.color,
        border: `1px solid ${t.border}`,
        whiteSpace: "nowrap",
        flexShrink: 0,
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: t.color, flexShrink: 0 }} />
      {TIPO_LABELS_ES[type] || (type.charAt(0).toUpperCase() + type.slice(1))}
    </span>
  );
}

interface FuncTagProps {
  f: FuncType | string;
}

export function FuncTag({ f }: FuncTagProps) {
  const c = FC[f] || T.slate;
  return (
    <span
      style={{
        fontSize: 10,
        fontWeight: 700,
        padding: "2px 7px",
        borderRadius: 8,
        background: `${c}15`,
        color: c,
        border: `1px solid ${c}28`,
        whiteSpace: "nowrap",
      }}
    >
      {FL[f] || f}
    </span>
  );
}
