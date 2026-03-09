"use client";

export function TagFilter({
  tags,
  selected,
  onChange,
}: {
  tags: string[];
  selected: string | null;
  onChange: (tag: string | null) => void;
}) {
  if (tags.length === 0) return null;

  return (
    <div className="mx-auto mb-4 flex max-w-xl flex-wrap gap-1.5">
      <button
        onClick={() => onChange(null)}
        className={`rounded-full px-3 py-1 text-xs transition-colors ${
          selected === null
            ? "bg-blue-600 text-white"
            : "bg-zinc-700 text-zinc-300 hover:bg-zinc-600"
        }`}
      >
        Todos
      </button>
      {tags.map((tag) => (
        <button
          key={tag}
          onClick={() => onChange(selected === tag ? null : tag)}
          className={`rounded-full px-3 py-1 text-xs transition-colors ${
            selected === tag
              ? "bg-blue-600 text-white"
              : "bg-zinc-700 text-zinc-300 hover:bg-zinc-600"
          }`}
        >
          {tag}
        </button>
      ))}
    </div>
  );
}
