"use client";

import { useState, useCallback } from "react";
import { QuickCapture } from "./QuickCapture";
import { SearchBar } from "./SearchBar";
import { TagFilter } from "./TagFilter";
import { ThoughtGrid } from "./ThoughtGrid";
import { ThoughtModal } from "./ThoughtModal";
import { ThoughtWithTags } from "@/lib/constants";

export function ThoughtBoard({
  initialThoughts,
  allTags,
}: {
  initialThoughts: ThoughtWithTags[];
  allTags: string[];
}) {
  const [thoughts, setThoughts] = useState(initialThoughts);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [editingThought, setEditingThought] = useState<ThoughtWithTags | null>(
    null
  );

  const handleSearchResults = useCallback((results: ThoughtWithTags[]) => {
    setThoughts(results);
    setIsSearching(true);
  }, []);

  const handleSearchClear = useCallback(() => {
    setIsSearching(false);
  }, []);

  const displayThoughts = isSearching
    ? thoughts
    : selectedTag
    ? initialThoughts.filter((t) => t.tags.some((tag) => tag.name === selectedTag))
    : initialThoughts;

  return (
    <>
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-zinc-100">ThinkDrop</h1>
        <p className="text-sm text-zinc-500">Capture seus pensamentos</p>
      </header>

      <QuickCapture allTags={allTags} />
      <SearchBar onResults={handleSearchResults} onClear={handleSearchClear} />
      <TagFilter tags={allTags} selected={selectedTag} onChange={setSelectedTag} />
      <ThoughtGrid thoughts={displayThoughts} onEdit={setEditingThought} />

      {editingThought && (
        <ThoughtModal
          thought={editingThought}
          allTags={allTags}
          onClose={() => setEditingThought(null)}
        />
      )}
    </>
  );
}
