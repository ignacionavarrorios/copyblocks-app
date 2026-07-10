import React, { useState } from "react";
import { T, TIPOS, FUNCIONES, FL, FC, font } from "@/lib/constants";
import { Btn } from "@/components/ui/button";
import { Inp } from "@/components/ui/input";
import type { Asset, FuncType } from "@/types";

interface AssetFormProps {
  initial?: Partial<Asset>;
  onSave: (form: Partial<Asset>) => void;
  onClose: () => void;
}

export function AssetForm({ initial = {}, onSave, onClose }: AssetFormProps) {
  const [form, setForm] = useState<Partial<Asset>>({
    tipo: "pain",
    funcs: [],
    tags: [],
    text: "",
    ...initial,
  });

  const toggleFunc = (id: FuncType) =>
    setForm((p) => ({
      ...p,
      funcs: (p.funcs || []).includes(id)
        ? (p.funcs || []).filter((x) => x !== id)
        : [...(p.funcs || []), id],
    }));

  return (
    <div>
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: T.slate, marginBottom: 8 }}>
          Tipo de bloque
        </div>
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
          {TIPOS.map((t) => (
            <button
              key={t.id}
              onClick={() => setForm((p) => ({ ...p, tipo: t.id as any }))}
              style={{
                padding: "6px 12px",
                fontSize: 12,
                borderRadius: 20,
                cursor: "pointer",
                fontFamily: font,
                fontWeight: form.tipo === t.id ? 700 : 400,
                border: `1.5px solid ${form.tipo === t.id ? t.color : t.border}`,
                background: form.tipo === t.id ? t.bg : "transparent",
                color: form.tipo === t.id ? t.color : T.slate,
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: T.slate, marginBottom: 8 }}>
          Función en el anuncio
        </div>
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
          {FUNCIONES.map((f) => (
            <button
              key={f}
              onClick={() => toggleFunc(f as FuncType)}
              style={{
                padding: "6px 12px",
                fontSize: 12,
                borderRadius: 20,
                cursor: "pointer",
                fontFamily: font,
                border: `1.5px solid ${(form.funcs || []).includes(f as FuncType) ? FC[f] : T.gray}`,
                background: (form.funcs || []).includes(f as FuncType) ? `${FC[f]}15` : "transparent",
                color: (form.funcs || []).includes(f as FuncType) ? FC[f] : T.slate,
                fontWeight: (form.funcs || []).includes(f as FuncType) ? 700 : 400,
              }}
            >
              {FL[f]}
            </button>
          ))}
        </div>
      </div>

      <Inp
        label="Texto del bloque"
        multiline
        rows={4}
        placeholder="Escribe tu bloque de copy…"
        value={form.text || ""}
        onChange={(e) => setForm((p) => ({ ...p, text: e.target.value }))}
        autoFocus
      />

      {(form.funcs || []).includes("headline") && (
        <div
          style={{
            fontSize: 11,
            marginTop: -10,
            marginBottom: 14,
            color: (form.text || "").length > 40 ? "#D94F4F" : T.slate,
          }}
        >
          {(form.text || "").length} chars{" "}
          {(form.text || "").length > 40 ? "— Meta truncates headlines over ~40 chars" : ""}
        </div>
      )}

      <div style={{ display: "flex", gap: 8 }}>
        <Btn variant="primary" onClick={() => onSave(form)} disabled={!form.text?.trim()}>
          Save
        </Btn>
        <Btn variant="ghost" onClick={onClose}>
          Cancel
        </Btn>
      </div>
    </div>
  );
}
