import { ArrowRight, Play, Sparkles } from "lucide-react";
import logo from "@/assets/landing/flowi-logo-landing-white.png";
import heroBg from "@/assets/landing/flowi-landing-hero-sky-valley.png";
import productWorld from "@/assets/landing/flowi-landing-product-world.png";

const navItems = ["Producto", "Precios", "Recursos"];

export default function LandingPage({ onLogin, onSignup }) {
  return (
    <main className="flowi-landing">
      <section className="flowi-hero" style={{ backgroundImage: `linear-gradient(180deg, rgba(25,74,168,0.28) 0%, rgba(86,77,202,0.34) 48%, rgba(34,39,98,0.44) 100%), url(${heroBg})` }}>
        <nav className="flowi-hero-nav" aria-label="Principal">
          <button className="flowi-logo-button" type="button" aria-label="Flowi">
            <img src={logo} alt="Flowi" />
          </button>

          <div className="flowi-nav-pill">
            {navItems.map(item => <a key={item} href={`#${item.toLowerCase()}`}>{item}</a>)}
          </div>

          <div className="flowi-nav-actions">
            <button type="button" className="flowi-login-link" onClick={onLogin}>Iniciar sesion</button>
            <button type="button" className="flowi-dark-pill" onClick={onSignup}>Ingresar <ArrowRight size={15}/></button>
          </div>
        </nav>

        <div className="flowi-hero-inner">
          <div className="flowi-hero-copy">
            <div className="flowi-kicker"><Sparkles size={15}/> Asistente Creativo Visual de IA</div>
            <h1>
              Converti ideas sueltas en anuncios ganadores<span className="flowi-mobile-hide"> en minutos</span>.
            </h1>
            <p>
              Flowi te permite crear contenido unico para tus anuncios con flujos de IA en minutos.
            </p>
          </div>

          <div className="flowi-hero-visual" aria-hidden="true">
            <img src={productWorld} alt="" />
          </div>

          <div className="flowi-hero-ctas">
            <button type="button" className="flowi-dark-pill flowi-cta-main" onClick={onSignup}>Crear cuenta gratis <ArrowRight size={16}/></button>
            <button type="button" className="flowi-light-pill"><Play size={15}/> Ver demo</button>
          </div>
        </div>
      </section>

      <section className="flowi-video-section" id="producto">
        <div className="flowi-video-copy">
          <div className="flowi-section-kicker"><Sparkles size={14}/> Mira Flowi en accion</div>
          <h2>Un flujo visual para crear anuncios sin perderte en prompts.</h2>
          <p>
            En pocos minutos puedes pasar de marca, persona y oferta a ideas de anuncios listas para revisar, editar y publicar con tu equipo.
          </p>
          <div className="flowi-video-points" aria-label="Beneficios del flujo">
            <span>Marca clara</span>
            <span>Personas conectadas</span>
            <span>Copy listo para iterar</span>
          </div>
        </div>

        <div className="flowi-video-shell" aria-label="Video demo de Flowi">
          <div className="flowi-video-card">
            <img src={productWorld} alt="Vista previa del flujo visual de Flowi" />
            <button type="button" className="flowi-video-play">
              <Play size={22} fill="currentColor"/> Ver demo
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}






