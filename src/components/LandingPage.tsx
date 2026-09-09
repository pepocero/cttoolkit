import { useEffect, useRef } from 'react';
import {
  ArrowRight,
  Boxes,
  ClipboardCopy,
  Cloud,
  Download,
  FolderKanban,
  Lock,
  Search,
  Star,
  Terminal,
} from 'lucide-react';

interface LandingPageProps {
  onLogin: () => void;
  onRegister: () => void;
}

export function LandingPage({ onLogin, onRegister }: LandingPageProps) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const items = root.querySelectorAll('.lp-reveal');
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
          }
        }
      },
      { threshold: 0.16 },
    );

    items.forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="landing" ref={rootRef}>
      <header className="landing-nav">
        <button
          type="button"
          className="landing-nav__brand"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          aria-label="Ir al inicio de la landing"
        >
          <span className="brand__mark">
            <Boxes size={20} />
          </span>
          <strong>CT Toolkit</strong>
        </button>
        <div className="landing-nav__actions">
          <button type="button" className="btn btn-ghost" onClick={onLogin}>
            Entrar
          </button>
          <button type="button" className="btn btn-primary" onClick={onRegister}>
            Crear cuenta
          </button>
        </div>
      </header>

      <section className="landing-hero">
        <img
          className="landing-hero__media"
          src="/landing/hero.png"
          alt="Escritorio técnico con paneles de accesos rápidos en CT Toolkit"
        />
        <div className="landing-hero__veil" aria-hidden />
        <div className="landing-hero__content">
          <p className="landing-kicker">CT Toolkit</p>
          <h1>Tu panel de accesos rápidos para soporte informático</h1>
          <p className="landing-lead">
            Guarda URLs, rutas de red y comandos en paneles privados. Cópialos al instante o
            descarga un .BAT listo para usar.
          </p>
          <div className="landing-hero__cta">
            <button type="button" className="btn btn-primary btn-lg" onClick={onRegister}>
              Empezar ahora <ArrowRight size={18} />
            </button>
            <button type="button" className="btn btn-secondary btn-lg" onClick={onLogin}>
              Ya tengo cuenta
            </button>
          </div>
        </div>
      </section>

      <section className="landing-section landing-purpose lp-reveal">
        <div className="landing-section__copy">
          <h2>¿Para qué sirve?</h2>
          <p>
            Cuando configuras o das soporte a un PC, pierdes tiempo buscando siempre lo mismo:
            el enlace de Authenticator, la ruta de impresoras, <code>ncpa.cpl</code>, scripts…
          </p>
          <p>
            <strong>CT Toolkit</strong> concentra esos accesos en paneles de trabajo. Cada técnico
            tiene los suyos, sincronizados en la nube y listos en cualquier ordenador.
          </p>
        </div>
        <figure className="landing-figure">
          <img
            src="/landing/purpose.png"
            alt="Técnico informático configurando un equipo en un entorno de soporte"
          />
        </figure>
      </section>

      <section className="landing-section landing-features">
        <div className="landing-section__intro lp-reveal">
          <h2>Características pensadas para el día a día</h2>
          <p>
            Menos buscar. Más resolver. Todo lo que usas en soporte, organizado y a un clic.
          </p>
        </div>

        <div className="landing-feature-layout lp-reveal">
          <figure className="landing-figure landing-figure--feature">
            <img
              src="/landing/panels.png"
              alt="Paneles organizados con rutas de red, comandos y archivos BAT"
            />
          </figure>

          <ul className="landing-feature-list">
            <li>
              <FolderKanban size={22} />
              <div>
                <h3>Paneles de trabajo</h3>
                <p>Agrupa acciones por contexto: SOC, impresoras, Active Directory, red…</p>
              </div>
            </li>
            <li>
              <ClipboardCopy size={22} />
              <div>
                <h3>Copiar al instante</h3>
                <p>Un clic y el valor exacto va al portapapeles: URL, UNC o comando.</p>
              </div>
            </li>
            <li>
              <Download size={22} />
              <div>
                <h3>Descargar .BAT</h3>
                <p>Genera scripts Windows adaptados al tipo de acción, sin backend raro.</p>
              </div>
            </li>
            <li>
              <Terminal size={22} />
              <div>
                <h3>Varios tipos de acción</h3>
                <p>URL, ruta de red, Windows, CMD, PowerShell o personalizado.</p>
              </div>
            </li>
            <li>
              <Search size={22} />
              <div>
                <h3>Búsqueda y favoritos</h3>
                <p>Encuentra cualquier valor y marca lo que usas cada día.</p>
              </div>
            </li>
            <li>
              <Lock size={22} />
              <div>
                <h3>Privado por usuario</h3>
                <p>Login propio: solo ves y gestionas tus paneles en Cloudflare D1.</p>
              </div>
            </li>
          </ul>
        </div>
      </section>

      <section className="landing-section landing-steps lp-reveal">
        <h2>Cómo funciona</h2>
        <ol className="landing-steps__list">
          <li>
            <figure className="landing-steps__media">
              <img
                src="/landing/step-1.png"
                alt="Crear un panel de trabajo en CT Toolkit"
              />
            </figure>
            <span>1</span>
            <h3>Crea un panel</h3>
            <p>Por ejemplo «Herramientas de red».</p>
          </li>
          <li>
            <figure className="landing-steps__media">
              <img
                src="/landing/step-2.png"
                alt="Añadir una acción con nombre, tipo y valor"
              />
            </figure>
            <span>2</span>
            <h3>Añade acciones</h3>
            <p>
              Por ejemplo: «Adaptadores de red» → <code>ncpa.cpl</code>, o «Servidor de
              archivos» → <code>\\fs-oficina\datos</code>.
            </p>
          </li>
          <li>
            <figure className="landing-steps__media">
              <img
                src="/landing/step-3.png"
                alt="Copiar, abrir URL o descargar un archivo BAT"
              />
            </figure>
            <span>3</span>
            <h3>Úsalas al momento</h3>
            <p>Copia, abre la URL o descarga el .BAT.</p>
          </li>
        </ol>
      </section>

      <section className="landing-cta lp-reveal">
        <div className="landing-cta__inner">
          <Cloud size={28} className="landing-cta__icon" />
          <h2>Lleva tu kit técnico a cualquier PC</h2>
          <p>
            Entra, abre tus paneles y sigue trabajando. Tus datos viajan contigo, no en un bloc de
            notas perdido.
          </p>
          <div className="landing-hero__cta">
            <button type="button" className="btn btn-primary btn-lg" onClick={onRegister}>
              Crear cuenta gratis <Star size={18} />
            </button>
            <button type="button" className="btn btn-secondary btn-lg" onClick={onLogin}>
              Entrar
            </button>
          </div>
        </div>
      </section>

      <footer className="landing-footer">
        <span>CT Toolkit</span>
        <span>Creada por CarliniTools</span>
      </footer>
    </div>
  );
}
