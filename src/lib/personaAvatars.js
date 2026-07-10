// personaAvatars.js — pack de "heads" pixel-art para el character builder de Personas.
// Los guardamos por KEY (no por URL resuelta) porque el hash de Vite cambia en cada build;
// el Avatar solo persiste `avatarImageKey`, y acá resolvemos la imagen real al renderizar.
import p1825f from "@/assets/personas/persona-18-25-female.png";
import p1825m from "@/assets/personas/persona-18-25-male.png";
import p2532f from "@/assets/personas/persona-25-32-female.png";
import p2532m from "@/assets/personas/persona-25-32-male.png";
import p3245f from "@/assets/personas/persona-32-45-female.png";
import p3245m from "@/assets/personas/persona-32-45-male.png";
import p4555f from "@/assets/personas/persona-45-55-female.png";
import p4555m from "@/assets/personas/persona-45-55-male.png";
import p60f from "@/assets/personas/persona-60-plus-female.png";
import p60m from "@/assets/personas/persona-60-plus-male.png";
import neutral from "@/assets/personas/persona-neutral-transparent.png";

export const PERSONA_AVATAR_IMAGES = {
  "neutral": neutral,
  "18-25-female": p1825f, "18-25-male": p1825m,
  "25-32-female": p2532f, "25-32-male": p2532m,
  "32-45-female": p3245f, "32-45-male": p3245m,
  "45-55-female": p4555f, "45-55-male": p4555m,
  "60-plus-female": p60f, "60-plus-male": p60m,
};

// Orden de despliegue en el picker — el usuario puede elegir CUALQUIER head sin importar
// el género/edad que haya puesto en el formulario (esos campos son libres/independientes).
export const PERSONA_AVATAR_OPTIONS = [
  { key: "neutral", label: "Neutral" },
  { key: "18-25-female", label: "18-25 · F" },
  { key: "18-25-male", label: "18-25 · M" },
  { key: "25-32-female", label: "25-32 · F" },
  { key: "25-32-male", label: "25-32 · M" },
  { key: "32-45-female", label: "32-45 · F" },
  { key: "32-45-male", label: "32-45 · M" },
  { key: "45-55-female", label: "45-55 · F" },
  { key: "45-55-male", label: "45-55 · M" },
  { key: "60-plus-female", label: "60+ · F" },
  { key: "60-plus-male", label: "60+ · M" },
];

export function personaAvatarSrc(key) {
  return PERSONA_AVATAR_IMAGES[key] || PERSONA_AVATAR_IMAGES.neutral;
}
