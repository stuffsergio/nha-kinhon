import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="bg-surface-tile-1 text-white px-6 pt-14 pb-28 md:pb-6">
      <div className="max-w-[980px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-10">
          <div>
            <h3 className="font-apple-display text-[22px] font-semibold text-white mb-2">
              NHA KINHON
            </h3>
            <p className="font-apple-body text-[14px] text-body-muted leading-relaxed">
              Servicio de env&iacute;o de comida desde la diáspora para Guinea-Bissau.
            </p>
          </div>
          <div>
            <h4 className="font-apple-body text-[12px] font-semibold text-body-muted mb-4 uppercase tracking-[0.5px]">
              Navegación
            </h4>
            <ul className="space-y-2.5">
              <li><Link to="/" className="font-apple-body text-[14px] text-body-muted hover:text-white transition-colors duration-150">Inicio</Link></li>
              <li><Link to="/mapa" className="font-apple-body text-[14px] text-body-muted hover:text-white transition-colors duration-150">Mapa</Link></li>
              <li><Link to="/buscar" className="font-apple-body text-[14px] text-body-muted hover:text-white transition-colors duration-150">Buscar</Link></li>
              <li><Link to="/servicios" className="font-apple-body text-[14px] text-body-muted hover:text-white transition-colors duration-150">Servicios</Link></li>
              <li><Link to="/supporters" className="font-apple-body text-[14px] text-body-muted hover:text-white transition-colors duration-150">Supporters</Link></li>
              <li><Link to="/carrito" className="font-apple-body text-[14px] text-body-muted hover:text-white transition-colors duration-150">Carrito</Link></li>
              <li><Link to="/perfil" className="font-apple-body text-[14px] text-body-muted hover:text-white transition-colors duration-150">Perfil</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-apple-body text-[12px] font-semibold text-body-muted mb-4 uppercase tracking-[0.5px]">
              Contacto
            </h4>
            <ul className="space-y-2.5">
              <li className="font-apple-body text-[14px] text-body-muted">contacto@nhakinhon.com</li>
              <li className="font-apple-body text-[14px] text-body-muted">Bissau, Guinea-Bissau</li>
            </ul>
          </div>
        </div>
        <hr className="border-[#3a3a3c] mb-6" />
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="font-apple-body text-[12px] text-ink-muted-48">
            &copy; {new Date().getFullYear()} Nha Kinhon. Todos los derechos reservados.
          </p>
          <div className="flex gap-6">
            <Link to="/servicios" className="font-apple-body text-[12px] text-ink-muted-48 hover:text-white transition-colors duration-150">
              Servicios
            </Link>
            <Link to="/supporters" className="font-apple-body text-[12px] text-ink-muted-48 hover:text-white transition-colors duration-150">
              Supporters
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
