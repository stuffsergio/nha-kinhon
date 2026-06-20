export default function ButtonPrimary({ children, onClick, className = "", disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`btn-apple-active bg-[#0066cc] text-white font-apple-body text-[17px] font-normal leading-[1.47] tracking-[-0.374px] rounded-[9999px] px-[22px] py-[11px] hover:bg-[#0071e3] focus:outline-none focus:ring-2 focus:ring-[#0071e3] disabled:bg-[#d2d2d7] disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
    >
      {children}
    </button>
  );
}
