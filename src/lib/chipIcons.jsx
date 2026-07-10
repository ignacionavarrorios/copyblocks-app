// chipIcons.jsx — íconos pixel-art para chips/tags secundarios (secciones de Persona, ángulos
// rápidos, temperatura de tráfico, ecuación de valor, proveedores de IA). Todos sin fondo.
import tabAwareness from "@/assets/icons/tab-awareness.png";
import tabBackground from "@/assets/icons/tab-background.png";
import tabBehavior from "@/assets/icons/tab-behavior.png";
import tabBeliefs from "@/assets/icons/tab-beliefs.png";
import tabLikesDislikes from "@/assets/icons/tab-likes-dislikes.png";
import tabPains from "@/assets/icons/tab-pains.png";
import structConfession from "@/assets/icons/struct-confession.png";
import structCounterintuitive from "@/assets/icons/struct-counterintuitive.png";
import structDirectPain from "@/assets/icons/struct-direct-pain.png";
import structMechanismCuriosity from "@/assets/icons/struct-mechanism-curiosity.png";
import structSocialProof from "@/assets/icons/struct-social-proof.png";
import structStakes from "@/assets/icons/struct-stakes.png";
import trafficCold from "@/assets/icons/traffic-cold.png";
import trafficWarm from "@/assets/icons/traffic-warm.png";
import trafficHot from "@/assets/icons/traffic-hot.png";
import valueDreamOutcome from "@/assets/icons/value-dream-outcome.png";
import valueProbability from "@/assets/icons/value-probability.png";
import valueTime from "@/assets/icons/value-time.png";
import valueEffort from "@/assets/icons/value-effort.png";
import providerClaude from "@/assets/icons/provider-claude.png";
import providerCodex from "@/assets/icons/provider-codex.png";
import providerGemini from "@/assets/icons/provider-gemini.png";

export const CHIP_ICONS = {
  awareness: tabAwareness, background: tabBackground, behavior: tabBehavior, beliefs: tabBeliefs,
  likesDislikes: tabLikesDislikes, pains: tabPains,
  confession: structConfession, counterintuitive: structCounterintuitive, directPain: structDirectPain,
  mechanismCuriosity: structMechanismCuriosity, socialProof: structSocialProof, stakes: structStakes,
  cold: trafficCold, warm: trafficWarm, hot: trafficHot,
  dreamOutcome: valueDreamOutcome, probability: valueProbability, time: valueTime, effort: valueEffort,
  claude: providerClaude, codex: providerCodex, gemini: providerGemini,
};

export function ChipIcon({ type, size = 16, style, ...props }) {
  const src = CHIP_ICONS[type];
  if (!src) return null;
  return <img src={src} alt="" style={{ width: size, height: size, objectFit: "contain", flexShrink: 0, ...style }} {...props} />;
}
