import { useEffect, useMemo, useState } from "react";
import { Send, Sparkles, X } from "lucide-react";
import catSleep from "@/assets/mascot/rick-sleep-v2.png";
import catStretch from "@/assets/mascot/rick-stretch-v2.png";
import catActive from "@/assets/mascot/rick-active-v2.png";

const quickActions = [
  { label: "Mejorar mi marca", view: "perfil" },
  { label: "Crear persona", view: "personas" },
  { label: "Armar oferta", view: "ofertas" },
  { label: "Crear anuncio", view: "meta-ad" },
];

const replies = [
  "Puedo ayudarte a ordenar la marca, crear una persona o convertir una oferta en angulos de anuncio.",
  "Tip rapido: si tu copy se siente flojo, revisa primero persona + dolor + oferta. Casi siempre el problema vive ahi.",
  "Podemos ir paso a paso: marca clara, persona especifica, oferta irresistible y luego compositor.",
];

export default function CatChatHelper({ brandName = "tu marca", currentView, onNavigate }) {
  const [open, setOpen] = useState(false);
  const [mood, setMood] = useState("sleep");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    { id: "hello", role: "ai", text: `Hola, soy Rick. Te ayudo a crear mejor copy para ${brandName}.` },
  ]);

  useEffect(() => {
    if (!open) {
      setMood("sleep");
      return undefined;
    }
    setMood("stretch");
    const timer = window.setTimeout(() => setMood("groom"), 1350);
    return () => window.clearTimeout(timer);
  }, [open]);

  const sprite = useMemo(() => {
    if (mood === "stretch") return catStretch;
    if (mood === "groom") return catActive;
    return catSleep;
  }, [mood]);

  function toggleOpen() {
    setOpen(v => !v);
  }

  function sendMessage(text = input) {
    const clean = text.trim();
    if (!clean) return;
    setInput("");
    setMood("groom");
    setMessages(prev => [
      ...prev,
      { id: `u-${Date.now()}`, role: "user", text: clean },
      { id: `a-${Date.now()}`, role: "ai", text: replies[prev.length % replies.length] },
    ]);
  }

  function handleQuickAction(action) {
    setOpen(true);
    setMood("stretch");
    setMessages(prev => [
      ...prev,
      { id: `q-${Date.now()}`, role: "user", text: action.label },
      { id: `qa-${Date.now()}`, role: "ai", text: `Listo. Te llevo a ${action.label.toLowerCase()} para avanzar desde ahi.` },
    ]);
    onNavigate?.(action.view);
  }

  return (
    <div className={`cat-helper ${open ? "is-open" : ""}`}>
      {open && (
        <section className="cat-helper-panel" aria-label="Chat helper de Flowi">
          <header className="cat-helper-header">
            <div>
              <span><Sparkles size={14}/> Rick</span>
            </div>
            <button type="button" onClick={toggleOpen} aria-label="Cerrar helper"><X size={16}/></button>
          </header>

          <div className="cat-helper-messages">
            {messages.map(msg => (
              <div key={msg.id} className={`cat-helper-msg ${msg.role === "user" ? "is-user" : "is-ai"}`}>{msg.text}</div>
            ))}
          </div>

          <div className="cat-helper-actions">
            {quickActions.map(action => (
              <button key={action.label} type="button" className={currentView === action.view ? "is-active" : ""} onClick={() => handleQuickAction(action)}>{action.label}</button>
            ))}
          </div>

          <form className="cat-helper-input" onSubmit={e => { e.preventDefault(); sendMessage(); }}>
            <input value={input} onChange={e => setInput(e.target.value)} placeholder="Preguntale a Flowi..." />
            <button type="submit" aria-label="Enviar"><Send size={15}/></button>
          </form>
        </section>
      )}

      <button type="button" className="cat-helper-launcher" onClick={toggleOpen} aria-label={open ? "Cerrar chat con Rick" : "Abrir chat con Rick"}>
        <span className="cat-helper-glow" />
        <span
          className="cat-helper-sprite"
          style={{
            backgroundImage: `url(${sprite})`,
            // La pose activa es una imagen cuadrada; se escala para igualar el tamano
            // visual del gato dentro de los sprites de dormir/estirarse.
            backgroundSize: mood === "groom" ? "150% auto" : "400% auto",
            backgroundPosition: "0 50%",
          }}
        />
      </button>
    </div>
  );
}
