"use client";

import Masonry from "react-masonry-css";
import { ThoughtCard } from "./ThoughtCard";
import { ThoughtWithTags } from "@/lib/constants";

export function ThoughtGrid({
  thoughts,
  onEdit,
  onTogglePin,
  onDelete,
}: {
  thoughts: ThoughtWithTags[];
  onEdit: (thought: ThoughtWithTags) => void;
  onTogglePin: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  if (thoughts.length === 0) {
    return (
      <p className="py-12 text-center text-zinc-500">
        Nenhum pensamento ainda. Comece capturando uma ideia!
      </p>
    );
  }

  return (
    <Masonry
      breakpointCols={{ default: 3, 768: 2, 480: 1 }}
      className="flex w-auto gap-4"
      columnClassName="flex flex-col"
    >
      {thoughts.map((thought) => (
        <ThoughtCard
          key={thought.id}
          thought={thought}
          onEdit={onEdit}
          onTogglePin={onTogglePin}
          onDelete={onDelete}
        />
      ))}
    </Masonry>
  );
}
