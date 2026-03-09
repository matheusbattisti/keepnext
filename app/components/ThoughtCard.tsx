"use client";

import { COLORS, ThoughtWithTags, ThoughtColor } from "@/lib/constants";
import { togglePin, deleteThought } from "@/app/actions/thoughts";
import { useState } from "react";

export function ThoughtCard({
  thought,
  onEdit,
}: {
  thought: ThoughtWithTags;
  onEdit: (thought: ThoughtWithTags) => void;
}) {
  const [showActions, setShowActions] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const colorKey = (thought.color as ThoughtColor) || "gray";
  const colors = COLORS[colorKey] || COLORS.gray;

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    await deleteThought(thought.id);
  };

  return (
    <div
      className={`group relative mb-3 cursor-pointer rounded-lg border p-4 ${colors.bg} ${colors.border} transition-all hover:shadow-lg`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => {
        setShowActions(false);
        setConfirmDelete(false);
      }}
      onClick={() => onEdit(thought)}
    >
      {/* Pin indicator */}
      {thought.pinned && (
        <span className="absolute -top-2 -right-2 text-sm" title="Fixado">
          📌
        </span>
      )}

      {/* Action buttons */}
      {showActions && (
        <div
          className="absolute top-2 right-2 flex gap-1"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => togglePin(thought.id)}
            className="rounded p-1 text-xs hover:bg-black/20"
            title={thought.pinned ? "Desafixar" : "Fixar"}
          >
            {thought.pinned ? "📌" : "📍"}
          </button>
          <button
            onClick={handleDelete}
            className={`rounded p-1 text-xs hover:bg-black/20 ${
              confirmDelete ? "text-red-400" : ""
            }`}
            title={confirmDelete ? "Confirmar exclusao" : "Excluir"}
          >
            {confirmDelete ? "✕" : "🗑"}
          </button>
        </div>
      )}

      {/* Content */}
      {thought.title && (
        <h3 className="mb-1 font-semibold text-zinc-100">{thought.title}</h3>
      )}
      <p className="whitespace-pre-wrap text-sm text-zinc-200 line-clamp-6">
        {thought.content}
      </p>

      {/* Tags */}
      {thought.tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {thought.tags.map((tag) => (
            <span
              key={tag.id}
              className="rounded-full bg-black/20 px-2 py-0.5 text-xs text-zinc-300"
            >
              {tag.name}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
