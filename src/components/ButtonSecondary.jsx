export default function ButtonSecondary({ children, onClick, className = "" }) {
  return (
    <button
      onClick={onClick}
      className={`btn-apple-active bg-transparent text-[#0066cc] font-apple-body text-[17px] font-normal leading-[1.47] tracking-[-0.374px] rounded-[9999px] px-[22px] py-[11px] border border-[#0066cc] hover:bg-[#0066cc] hover:text-white focus-visible:outline-2 focus-visible:outline-[#0071e3] focus-visible:outline-offset-2 transition-colors duration-150 ease-in-out ${className}`}
    >
      {children}
    </button>
  );
}
