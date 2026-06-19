export default function ButtonPrimary({ children, onClick, className = "" }) {
  return (
    <button
      onClick={onClick}
      className={`btn-apple-active bg-[#0066cc] text-white font-apple-body text-[17px] font-normal leading-[1.47] tracking-[-0.374px] rounded-[9999px] px-[22px] py-[11px] hover:bg-[#0071e3] focus:outline-none focus:ring-2 focus:ring-[#0071e3] ${className}`}
    >
      {children}
    </button>
  );
}
