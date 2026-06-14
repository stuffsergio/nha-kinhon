import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="h-[80dvh] flex flex-col justify-center items-center border">
      <div className="flex flex-col items-center gap-4">
        <h1 className="text-4xl tracking-tighter font-bold">NHA KINHON</h1>
        <Link
          to="/login"
          className="bg-black text-white px-4 py-2 rounded-full text-lg"
        >
          Entrar
        </Link>
      </div>
    </div>
  );
}
