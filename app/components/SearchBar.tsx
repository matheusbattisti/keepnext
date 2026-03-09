"use client";

import { useState, useEffect } from "react";

export function SearchBar({ onSearch }: { onSearch: (query: string) => void }) {
  const [query, setQuery] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => onSearch(query), 300);
    return () => clearTimeout(timer);
  }, [query, onSearch]);

  return (
    <div className="mx-auto mb-4 max-w-xl">
      <input
        type="text"
        placeholder="Buscar pensamentos..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-zinc-200 placeholder-zinc-500 outline-none focus:border-zinc-500 transition-colors"
      />
    </div>
  );
}
