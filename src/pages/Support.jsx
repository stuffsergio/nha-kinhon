import { Quote } from "lucide-react";
import { Link } from "react-router-dom";
import ButtonPrimary from "../components/ButtonPrimary";
import { useSupporters } from "../hooks/useSupporters";

const fallbackSupporters = [
  { id: "1", name: "María da Silva", message: "Gracias a Nha Kinhon puedo enviar comida a mi familia en Bissau sin preocupaciones. El proceso es muy sencillo y el seguimiento es excelente.", createdAt: "2024-01-01" },
  { id: "2", name: "Carlos Mendes", message: "Llevo usando Nha Kinhon desde que empezaron. La calidad de los productos y la rapidez en la entrega son increíbles. Recomiendo a todo el mundo.", createdAt: "2023-06-01" },
  { id: "3", name: "Ana Lopes", message: "Poder enviar dinero y comida a mis padres en Guinea-Bissau desde el extranjero nunca había sido tan fácil. Nha Kinhon cambió nuestra forma de ayudar.", createdAt: "2024-03-01" },
  { id: "4", name: "João Barbosa", message: "Como destinatario, recibir los paquetes es siempre una alegría. Todo llega en perfecto estado y a tiempo. Gracias por conectar a las familias.", createdAt: "2023-09-01" },
  { id: "5", name: "Fatima Camará", message: "La diáspora necesita servicios como Nha Kinhon. Poder seleccionar productos frescos del mercado y enviarlos directamente es una maravilla.", createdAt: "2024-05-01" },
  { id: "6", name: "Pedro Gomes", message: "Excelente servicio al cliente. Siempre resuelven mis dudas rápidamente y el proceso de envío es transparente de principio a fin.", createdAt: "2023-11-01" },
];

const locations = ["Lisboa, Portugal", "Madrid, España", "Dakar, Senegal", "Bissau, Guinea-Bissau", "París, Francia", "Londres, Reino Unido"];

export default function Support() {
  const { data: apiData, isLoading } = useSupporters();

  const supporters = apiData?.data?.length > 0 ? apiData.data : fallbackSupporters;

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
        <div className="max-w-[980px] mx-auto">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-[#ffffff] p-[24px] rounded-[18px] no-shadow animate-pulse">
                  <div className="h-6 w-6 bg-[#f5f5f7] rounded mb-4" />
                  <div className="h-5 bg-[#f5f5f7] rounded w-full mb-2" />
                  <div className="h-5 bg-[#f5f5f7] rounded w-5/6 mb-6" />
                  <div className="h-5 bg-[#f5f5f7] rounded w-1/3 mb-1" />
                  <div className="h-4 bg-[#f5f5f7] rounded w-1/4" />
                </div>
              ))}
            </div>
          ) : supporters.length === 0 ? (
            <p className="text-center font-apple-body text-[17px] text-[#7a7a7a] py-[80px]">
              Aún no hay testimonios. ¡Sé el primero en compartir tu experiencia!
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {supporters.map((s, idx) => (
                <div key={s.id} className="bg-[#ffffff] p-[24px] rounded-[18px] no-shadow flex flex-col">
                  <Quote size={24} className="text-[#0066cc] mb-4" />
                  <p className="font-apple-body text-[17px] font-normal leading-[1.47] tracking-[-0.374px] text-[#1d1d1f] mb-6 flex-1">
                    "{s.message}"
                  </p>
                  <div className="border-t border-[#e0e0e0] pt-4">
                    <p className="font-apple-display text-[21px] font-semibold leading-[1.19] tracking-[0.231px] text-[#1d1d1f]">
                      {s.name}
                    </p>
                    <p className="font-apple-body text-[14px] font-normal leading-[1.43] tracking-[-0.224px] text-[#7a7a7a]">
                      {locations[idx % locations.length]} &bull; {new Date(s.createdAt).getFullYear()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
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
