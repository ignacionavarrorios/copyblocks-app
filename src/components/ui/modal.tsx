import React from "react";
import { T, font } from "@/lib/constants";

interface ModalProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  width?: number;
}

export function Modal({ title, onClose, children, width = 520 }: ModalProps) {
  return (
    <div
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(11,16,32,0.72)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9000,
        padding: 16,
      }}
    >
      <div
        onMouseDown={(e) => e.stopPropagation()}
        style={{
          background: T.white,
          borderRadius: 16,
          padding: 28,
          width,
          maxWidth: "96vw",
          maxHeight: "90vh",
          overflowY: "auto",
          border: `1.5px solid ${T.purpleLight}`,
          boxSizing: "border-box",
          boxShadow: "0 24px 60px rgba(24,19,73,0.22)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
            paddingBottom: 14,
            borderBottom: `1px solid ${T.gray}`,
          }}
        >
          <div style={{ fontSize: 15, fontWeight: 700, color: T.navy }}>{title}</div>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", color: T.slate, fontSize: 24, lineHeight: 1, padding: 0 }}
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
