// blockIcons.js — íconos pixel-art (ROAS Academy asset pack) para cada tipo de bloque del
// Compositor. Reemplazan los emojis genéricos por arte de marca, todos sin fondo (transparent).
import cerebro from "@/assets/icons/block-cerebro.png";
import persona from "@/assets/icons/block-persona.png";
import angulo from "@/assets/icons/block-angle.png";
import oferta from "@/assets/icons/offer-gift-clean.png";
import formato from "@/assets/icons/block-format.png";
import chat from "@/assets/icons/block-chat.png";
import nextStep from "@/assets/icons/block-next-step.png";
import prompt from "@/assets/icons/block-prompt.png";
import receta from "@/assets/icons/block-recipe.png";

export const BLOCK_ICONS = { cerebro, persona, angulo, oferta, formato, chat, nextStep, prompt, receta };

// <img> listo para usar como ícono de bloque — tamaño consistente, sin distorsión.
export function BlockIcon({ type, size = 18, style, ...props }) {
  const src = BLOCK_ICONS[type];
  if (!src) return null;
  return <img src={src} alt="" style={{ width: size, height: size, objectFit: "contain", flexShrink: 0, ...style }} {...props} />;
}

