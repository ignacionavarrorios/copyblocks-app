import React from "react";
import { font } from "@/lib/constants";

interface ToastProps {
  msg: string;
}

export function Toast({ msg }: ToastProps) {
  if (!msg) return null;
  return (
    <div
      style={{
        position: "fixed",
        bottom: 24,
        right: 24,
        background: "#181349",
        color: "#fff",
        padding: "12px 20px",
        borderRadius: 10,
        fontSize: 13,
        fontFamily: font,
        fontWeight: 500,
        boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
        zIndex: 9999,
      }}
    >
      {msg}
    </div>
  );
}
