"use client";

import { useState, useRef } from "react";
import { createThought } from "@/app/actions/thoughts";
import { ColorPicker } from "./ColorPicker";
import { ThoughtColor } from "@/lib/constants";

export function QuickCapture({ allTags }: { allTags: string[] }) {
  const [expanded, setExpanded] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [color, setColor] = useState<ThoughtColor>("gray");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const contentRef = useRef<HTMLTextAreaElement>(null);

  const reset = () => {
    setTitle("");
    setContent("");
    setColor("gray");
    setSelectedTags([]);
    setNewTag("");
    setExpanded(false);
  };

  const handleSave = async () => {
    if (!content.trim()) return;

    await createThought({
      content: content.trim(),
      title: title.trim() || undefined,
      color,
      tagNames: selectedTags.length > 0 ? selectedTags : undefined,
    });

    reset();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSave();
    }
    if (e.key === "Escape") {
      reset();
    }
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const addNewTag = () => {
    const tag = newTag.trim().toLowerCase();
    if (tag && !selectedTags.includes(tag)) {
      setSelectedTags((prev) => [...prev, tag]);
    }
    setNewTag("");
  };

  return (
    <div
      className="mx-auto mb-6 max-w-xl rounded-lg border border-zinc-700 bg-zinc-800 shadow-lg transition-all"
      onKeyDown={handleKeyDown}
    >
      {!expanded ? (
        <button
          onClick={() => {
            setExpanded(true);
            setTimeout(() => contentRef.current?.focus(), 0);
          }}
          className="w-full px-4 py-3 text-left text-zinc-400 hover:text-zinc-300"
        >
          Capturar um pensamento...
        </button>
      ) : (
        <div className="p-4">
          <input
            type="text"
            placeholder="Titulo (opcional)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mb-2 w-full bg-transparent text-lg font-medium text-zinc-100 placeholder-zinc-500 outline-none"
          />
          <textarea
            ref={contentRef}
            placeholder="No que voce esta pensando?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
            className="mb-3 w-full resize-none bg-transparent text-zinc-200 placeholder-zinc-500 outline-none"
          />

          {/* Tags */}
          <div className="mb-3 flex flex-wrap gap-1.5">
            {allTags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                className={`rounded-full px-2.5 py-0.5 text-xs transition-colors ${
                  selectedTags.includes(tag)
                    ? "bg-blue-600 text-white"
                    : "bg-zinc-700 text-zinc-300 hover:bg-zinc-600"
                }`}
              >
                {tag}
              </button>
            ))}
            <div className="flex items-center gap-1">
              <input
                type="text"
                placeholder="+ tag"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    e.stopPropagation();
                    addNewTag();
                  }
                }}
                className="w-16 rounded bg-transparent px-1 text-xs text-zinc-300 placeholder-zinc-500 outline-none focus:w-24 focus:bg-zinc-700 transition-all"
              />
            </div>
          </div>

          {/* Color picker + actions */}
          <div className="flex items-center justify-between">
            <ColorPicker selected={color} onChange={setColor} />
            <div className="flex gap-2">
              <button
                onClick={reset}
                className="rounded px-3 py-1.5 text-sm text-zinc-400 hover:text-zinc-200"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={!content.trim()}
                className="rounded bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-40"
              >
                Salvar
              </button>
            </div>
          </div>
          <p className="mt-2 text-right text-xs text-zinc-500">
            Ctrl+Enter para salvar · Esc para cancelar
          </p>
        </div>
      )}
    </div>
  );
}
