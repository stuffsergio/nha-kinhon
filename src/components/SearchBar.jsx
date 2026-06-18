import { Search } from "lucide-react";

export default function SearchBar({ searchQuery, onSearch, onSearchSubmit, placeholder }) {
  return (
    <div className="relative">
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => onSearch(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            onSearchSubmit();
          }
        }}
        placeholder={placeholder}
        className="w-full px-5 py-4 pl-12 text-lg border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
      <Search
        size={24}
        className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"
      />
    </div>
  );
}
