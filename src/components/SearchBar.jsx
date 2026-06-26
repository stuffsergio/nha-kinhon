import { Search } from "lucide-react";

export default function SearchBar({ searchQuery, onSearch, onSearchSubmit, placeholder }) {
  return (
    <div className="relative max-w-[600px] mx-auto">
      <label htmlFor="search-input" className="sr-only">Buscar</label>
      <input
        id="search-input"
        type="text"
        value={searchQuery}
        onChange={(e) => onSearch(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            onSearchSubmit();
          }
        }}
        placeholder={placeholder}
        autoComplete="off"
        spellCheck={false}
        className="w-full bg-[#ffffff] text-[#1d1d1f] font-apple-body text-[17px] font-normal leading-[1.47] tracking-[-0.374px] rounded-[9999px] px-[20px] py-[12px] pl-[48px] h-[44px] border border-[rgba(0,0,0,0.08)] focus-visible:outline-2 focus-visible:outline-[#0071e3] focus-visible:outline-offset-2 focus:border-transparent"
      />
      <Search
        size={18}
        className="absolute left-[20px] top-1/2 transform -translate-y-1/2 text-[#7a7a7a] pointer-events-none"
        aria-hidden="true"
      />
    </div>
  );
}
