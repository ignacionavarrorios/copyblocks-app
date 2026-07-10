import React, { useState } from "react";
import { T, TIPOS } from "@/lib/constants";
import { Btn } from "@/components/ui/button";
import { BlockBadge, FuncTag } from "@/components/ui/badge";
import type { Asset } from "@/types";

function tp(id: string) {
  return TIPOS.find((t) => t.id === id) || TIPOS[0];
}

interface BlockCardProps {
  asset: Asset;
  onEdit: () => void;
  onDelete: () => void;
}

export function BlockCard({ asset, onEdit, onDelete }: BlockCardProps) {
  const [hov, setHov] = useState(false);
  const t = tp(asset.tipo);

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: T.white,
        border: `1.5px solid ${hov ? t.color + "60" : t.border}`,
        borderLeft: `4px solid ${t.color}`,
        borderRadius: 10,
        padding: "12px 14px",
        marginBottom: 7,
        transition: "border-color 0.15s",
      }}
    >
      <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 7 }}>
            <BlockBadge type={asset.tipo} />
            {(asset.funcs || []).map((f) => (
              <FuncTag key={f} f={f} />
            ))}
          </div>
          <p style={{ margin: 0, fontSize: 13, lineHeight: 1.65, color: T.navy }}>{asset.text}</p>
        </div>
        <div
          style={{
            display: "flex",
            gap: 4,
            flexShrink: 0,
            opacity: hov ? 1 : 0.2,
            transition: "opacity 0.15s",
          }}
        >
          <Btn variant="ghost" small onClick={onEdit}>
            Edit
          </Btn>
          <Btn variant="danger" small onClick={onDelete}>
            ✕
          </Btn>
        </div>
      </div>
    </div>
  );
}
