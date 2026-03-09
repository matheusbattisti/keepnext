"use client";

import { useState, useEffect } from "react";
import { ColorPicker } from "./ColorPicker";
import { ThoughtWithTags, ThoughtColor } from "@/lib/constants";

export function ThoughtModal({
  thought,
  allTags,
  onClose,
  onSave,
  onDelete,
}: {
  thought: ThoughtWithTags;
  allTags: string[];
  onClose: () => void;
  onSave: (
    id: string,
    data: {
      content: string;
      title?: string;
      color?: string;
      tagNames?: string[];
    }
  ) => void;
  onDelete: (id: string) => void;
}) {
  const [title, setTitle] = useState(thought.title || "");
  const [content, setContent] = useState(thought.content);
  const [color, setColor] = useState<ThoughtColor>(
    (thought.color as ThoughtColor) || "gray"
  );
  const [selectedTags, setSelectedTags] = useState<string[]>(
    thought.tags.map((t) => t.name)
  );
  const [newTag, setNewTag] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  const handleSave = () => {
    if (!content.trim()) return;
    onSave(thought.id, {
      content: content.trim(),
      title: title.trim() || undefined,
      color,
      tagNames: selectedTags,
    });
    onClose();
  };

  const handleDelete = () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    onDelete(thought.id);
    onClose();
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-lg border border-zinc-700 bg-zinc-800 p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <input
          type="text"
          placeholder="Titulo (opcional)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mb-3 w-full bg-transparent text-lg font-semibold text-zinc-100 placeholder-zinc-500 outline-none"
        />
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={6}
          className="mb-4 w-full resize-none bg-transparent text-zinc-200 placeholder-zinc-500 outline-none"
        />

        {/* Tags */}
        <div className="mb-4 flex flex-wrap gap-1.5">
          {[...new Set([...allTags, ...selectedTags])].map((tag) => (
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
          <input
            type="text"
            placeholder="+ tag"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addNewTag();
              }
            }}
            className="w-16 rounded bg-transparent px-1 text-xs text-zinc-300 placeholder-zinc-500 outline-none focus:w-24 focus:bg-zinc-700 transition-all"
          />
        </div>

        {/* Color + Actions */}
        <div className="mb-4">
          <ColorPicker selected={color} onChange={setColor} />
        </div>

        <div className="flex items-center justify-between">
          <button
            onClick={handleDelete}
            className={`rounded px-3 py-1.5 text-sm ${
              confirmDelete
                ? "bg-red-600 text-white"
                : "text-zinc-400 hover:text-red-400"
            }`}
          >
            {confirmDelete ? "Confirmar exclusao" : "Excluir"}
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
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
      </div>
    </div>
  );
}
