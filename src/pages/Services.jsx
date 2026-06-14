export default function Services() {
  return (
    <div className="h-[80dvh] flex flex-col justify-around items-center gap-10 border">
      <h1 className="text-4xl tracking-tighter font-bold">
        Servicios disponibles
      </h1>
      <div className="w-full flex flex-row items-center justify-center gap-30">
        <div className="border border-blue-600 bg-blue-200 p-5">
          Realizar pedido
        </div>
        <div className="border border-blue-600 bg-blue-200 p-5">
          Enviar dinero
        </div>
        <div className="border border-blue-600 bg-blue-200 p-5">
          Checkeo médico
        </div>
      </div>
    </div>
  );
}
