"use client";

import { useState, useCallback, useEffect } from "react";
import { QuickCapture } from "./QuickCapture";
import { SearchBar } from "./SearchBar";
import { TagFilter } from "./TagFilter";
import { ThoughtGrid } from "./ThoughtGrid";
import { ThoughtModal } from "./ThoughtModal";
import { ThoughtWithTags, ThoughtColor } from "@/lib/constants";
import * as storage from "@/lib/storage";

export function ThoughtBoard() {
  const [thoughts, setThoughts] = useState<ThoughtWithTags[]>([]);
  const [searchResults, setSearchResults] = useState<ThoughtWithTags[] | null>(
    null
  );
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [editingThought, setEditingThought] =
    useState<ThoughtWithTags | null>(null);

  useEffect(() => {
    setThoughts(storage.getThoughts());
  }, []);

  const allTags = storage.getAllTags(thoughts);

  const refresh = () => setThoughts(storage.getThoughts());

  const handleCreate = useCallback(
    (data: {
      content: string;
      title?: string;
      color?: ThoughtColor;
      tagNames?: string[];
    }) => {
      storage.createThought(data);
      refresh();
    },
    []
  );

  const handleUpdate = useCallback(
    (
      id: string,
      data: {
        content: string;
        title?: string;
        color?: string;
        tagNames?: string[];
      }
    ) => {
      storage.updateThought(id, data);
      refresh();
    },
    []
  );

  const handleDelete = useCallback((id: string) => {
    storage.deleteThought(id);
    refresh();
  }, []);

  const handleTogglePin = useCallback((id: string) => {
    storage.togglePin(id);
    refresh();
  }, []);

  const handleSearch = useCallback((query: string) => {
    if (!query.trim()) {
      setSearchResults(null);
      return;
    }
    setSearchResults(storage.searchThoughts(query));
  }, []);

  const displayThoughts = searchResults
    ? searchResults
    : selectedTag
      ? thoughts.filter((t) => t.tags.some((tag) => tag.name === selectedTag))
      : thoughts;

  return (
    <>
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-zinc-100">ThinkDrop</h1>
        <p className="text-sm text-zinc-500">Capture seus pensamentos</p>
      </header>

      <QuickCapture allTags={allTags} onCreate={handleCreate} />
      <SearchBar onSearch={handleSearch} />
      <TagFilter
        tags={allTags}
        selected={selectedTag}
        onChange={setSelectedTag}
      />
      <ThoughtGrid
        thoughts={displayThoughts}
        onEdit={setEditingThought}
        onTogglePin={handleTogglePin}
        onDelete={handleDelete}
      />

      {editingThought && (
        <ThoughtModal
          thought={editingThought}
          allTags={allTags}
          onClose={() => setEditingThought(null)}
          onSave={handleUpdate}
          onDelete={handleDelete}
        />
      )}
    </>
  );
}
