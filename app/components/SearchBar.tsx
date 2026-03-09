"use client";

import { useState, useEffect, useCallback } from "react";
import { ThoughtWithTags } from "@/lib/constants";

export function SearchBar({
  onResults,
  onClear,
}: {
  onResults: (thoughts: ThoughtWithTags[]) => void;
  onClear: () => void;
}) {
  const [query, setQuery] = useState("");

  const search = useCallback(
    async (q: string) => {
      if (!q.trim()) {
        onClear();
        return;
      }
      const res = await fetch(
        `/api/search?q=${encodeURIComponent(q.trim())}`
      );
      const data = await res.json();
      onResults(data);
    },
    [onResults, onClear]
  );

  useEffect(() => {
    const timer = setTimeout(() => search(query), 300);
    return () => clearTimeout(timer);
  }, [query, search]);

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
