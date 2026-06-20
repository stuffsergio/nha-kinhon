import { Quote } from "lucide-react";
import { Link } from "react-router-dom";
import ButtonPrimary from "../components/ButtonPrimary";

const testimonials = [
  {
    name: "María da Silva",
    location: "Lisboa, Portugal",
    text: "Gracias a Nha Kinhon puedo enviar comida a mi familia en Bissau sin preocupaciones. El proceso es muy sencillo y el seguimiento es excelente.",
    since: "2024",
  },
  {
    name: "Carlos Mendes",
    location: "Madrid, España",
    text: "Llevo usando Nha Kinhon desde que empezaron. La calidad de los productos y la rapidez en la entrega son increíbles. Recomiendo a todo el mundo.",
    since: "2023",
  },
  {
    name: "Ana Lopes",
    location: "Dakar, Senegal",
    text: "Poder enviar dinero y comida a mis padres en Guinea-Bissau desde el extranjero nunca había sido tan fácil. Nha Kinhon cambió nuestra forma de ayudar.",
    since: "2024",
  },
  {
    name: "João Barbosa",
    location: "Bissau, Guinea-Bissau",
    text: "Como destinatario, recibir los paquetes es siempre una alegría. Todo llega en perfecto estado y a tiempo. Gracias por conectar a las familias.",
    since: "2023",
  },
  {
    name: "Fatima Camará",
    location: "París, Francia",
    text: "La diáspora necesita servicios como Nha Kinhon. Poder seleccionar productos frescos del mercado y enviarlos directamente es una maravilla.",
    since: "2024",
  },
  {
    name: "Pedro Gomes",
    location: "Londres, Reino Unido",
    text: "Excelente servicio al cliente. Siempre resuelven mis dudas rápidamente y el proceso de envío es transparente de principio a fin.",
    since: "2023",
  },
];

export default function Support() {
  return (
    <div className="w-full">
      <section className="bg-[#ffffff] py-[80px] px-6">
        <div className="max-w-[980px] mx-auto text-center">
          <h1 className="font-apple-display text-[56px] font-semibold leading-[1.07] tracking-[-0.28px] text-[#1d1d1f] mb-4">
            Supporters
          </h1>
          <p className="font-apple-body text-[24px] font-normal leading-[1.17] tracking-[0.168px] text-[#7a7a7a] max-w-[680px] mx-auto">
            Personas que confían en Nha Kinhon para enviar su apoyo a Guinea-Bissau
          </p>
        </div>
      </section>

      <section className="bg-[#f5f5f7] py-[80px] px-6">
        <div className="max-w-[980px] mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((t) => (
            <div key={t.name} className="bg-[#ffffff] p-[24px] rounded-[18px] no-shadow flex flex-col">
              <Quote size={24} className="text-[#0066cc] mb-4" />
              <p className="font-apple-body text-[17px] font-normal leading-[1.47] tracking-[-0.374px] text-[#1d1d1f] mb-6 flex-1">
                "{t.text}"
              </p>
              <div className="border-t border-[#e0e0e0] pt-4">
                <p className="font-apple-display text-[21px] font-semibold leading-[1.19] tracking-[0.231px] text-[#1d1d1f]">
                  {t.name}
                </p>
                <p className="font-apple-body text-[14px] font-normal leading-[1.43] tracking-[-0.224px] text-[#7a7a7a]">
                  {t.location} &bull; {t.since}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-[#272729] py-[80px] px-6 text-center">
        <div className="max-w-[980px] mx-auto">
          <h2 className="font-apple-display text-[40px] font-semibold leading-[1.1] text-[#ffffff] mb-4">
            Únete a nuestra comunidad
          </h2>
          <p className="font-apple-body text-[17px] font-normal leading-[1.47] tracking-[-0.374px] text-[#cccccc] mb-8">
            Regístrate y empieza a enviar tu apoyo hoy mismo
          </p>
          <Link to="/login?mode=register">
            <ButtonPrimary>Crear cuenta</ButtonPrimary>
          </Link>
        </div>
      </section>
    </div>
  );
}
