// @ts-nocheck
// ─── MEDIDOR DE COSTO (HUD flotante) ──────────────────────────────────────────
// Muestra el costo en USD por acción y el total de la sesión. Se alimenta del
// uso real de tokens reportado por la API (ver src/lib/cost.ts + src/lib/ai.ts).

import { useEffect, useState } from "react";
import { T, font } from "@/lib/constants";
import { subscribe, resetCost } from "@/lib/cost";

const fmt = (n) => "$" + (n < 0.01 ? n.toFixed(5) : n.toFixed(4));
const fmtTok = (n) => n >= 1000 ? (n / 1000).toFixed(1) + "k" : String(n);

export default function CostMeter() {
  const [sum, setSum] = useState({ total: 0, calls: 0, tokensIn: 0, tokensOut: 0, cacheRead: 0, records: [] });
  const [open, setOpen] = useState(false);

  useEffect(() => subscribe(setSum), []);

  if (sum.calls === 0 && !open) {
    return (
      <div style={{ position: "fixed", bottom: 16, left: 16, zIndex: 9500 }}>
        <button onClick={() => setOpen(true)} title="Medidor de costo" style={pill(false)}>
          💸 Costo
        </button>
      </div>
    );
  }

  return (
    <div style={{ position: "fixed", bottom: 16, left: 16, zIndex: 9500, fontFamily: font }}>
      {open && (
        <div style={{ width: 320, maxHeight: 420, background: T.white, border: `1.5px solid ${T.purpleLight}`, borderRadius: 14, boxShadow: "0 16px 48px rgba(24,19,73,0.22)", marginBottom: 8, overflow: "hidden", display: "flex", flexDirection: "column" }}>
          {/* Header con totales */}
          <div style={{ padding: "14px 16px", background: T.navy, color: "#fff" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.04em" }}>💸 COSTO DE SESIÓN</span>
              <button onClick={resetCost} style={{ fontSize: 10, padding: "3px 8px", borderRadius: 7, border: "1px solid rgba(255,255,255,0.25)", background: "transparent", color: "rgba(255,255,255,0.7)", cursor: "pointer", fontFamily: font }}>Reiniciar</button>
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.02em" }}>{fmt(sum.total)}</div>
            <div style={{ display: "flex", gap: 12, marginTop: 6, fontSize: 11, color: "rgba(255,255,255,0.6)" }}>
              <span>{sum.calls} llamadas</span>
              <span>↑ {fmtTok(sum.tokensIn)} in</span>
              <span>↓ {fmtTok(sum.tokensOut)} out</span>
            </div>
            {sum.cacheRead > 0 && <div style={{ fontSize: 10, color: "#9EE0C6", marginTop: 3 }}>✓ {fmtTok(sum.cacheRead)} tokens leídos de caché (90% más baratos)</div>}
            {sum.calls > 0 && <div style={{ fontSize: 10, color: "rgba(255,255,255,0.45)", marginTop: 3 }}>Promedio {fmt(sum.total / sum.calls)} / acción</div>}
          </div>
          {/* Lista de llamadas */}
          <div style={{ overflowY: "auto", flex: 1 }}>
            {sum.records.length === 0 && <div style={{ padding: 20, fontSize: 12, color: T.slate, textAlign: "center" }}>Aún no hay llamadas. Genera algo para ver el costo.</div>}
            {sum.records.map(r => (
              <div key={r.id} style={{ padding: "9px 16px", borderBottom: `1px solid ${T.grayLight}`, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: T.navy, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.label}</div>
                  <div style={{ fontSize: 10, color: T.slate, marginTop: 1 }}>↑{fmtTok(r.totalIn)} {r.cacheRead > 0 ? `(caché ${fmtTok(r.cacheRead)})` : ""} · ↓{fmtTok(r.output)} · {(r.ms / 1000).toFixed(1)}s</div>
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, color: T.purple, flexShrink: 0 }}>{fmt(r.cost)}</div>
              </div>
            ))}
          </div>
          {/* Proyección */}
          {sum.calls > 0 && (
            <div style={{ padding: "10px 16px", borderTop: `1px solid ${T.gray}`, background: T.grayLight, fontSize: 11, color: T.slate, lineHeight: 1.5 }}>
              Proyección: <b style={{ color: T.navy }}>{fmt((sum.total / sum.calls) * 50)}</b> por ~50 acciones de un usuario.
            </div>
          )}
        </div>
      )}
      <button onClick={() => setOpen(o => !o)} style={pill(true)}>
        💸 {fmt(sum.total)} <span style={{ opacity: 0.6, fontWeight: 400 }}>· {sum.calls}</span>
      </button>
    </div>
  );
}

function pill(active) {
  return {
    display: "inline-flex", alignItems: "center", gap: 6,
    padding: "8px 14px", fontSize: 13, fontWeight: 700, fontFamily: font,
    borderRadius: 22, cursor: "pointer",
    border: `1.5px solid ${active ? T.purple : T.gray}`,
    background: active ? T.purple : T.white,
    color: active ? "#fff" : T.slate,
    boxShadow: "0 6px 20px rgba(24,19,73,0.16)",
  };
}
