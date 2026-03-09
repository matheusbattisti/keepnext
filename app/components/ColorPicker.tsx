"use client";

import { COLORS, ThoughtColor } from "@/lib/constants";

export function ColorPicker({
  selected,
  onChange,
}: {
  selected: ThoughtColor;
  onChange: (color: ThoughtColor) => void;
}) {
  return (
    <div className="flex gap-1.5">
      {(Object.keys(COLORS) as ThoughtColor[]).map((color) => (
        <button
          key={color}
          type="button"
          onClick={() => onChange(color)}
          title={COLORS[color].label}
          className={`h-6 w-6 rounded-full ${COLORS[color].bg} border-2 ${
            selected === color ? "border-white" : "border-transparent"
          } transition-all hover:scale-110`}
        />
      ))}
    </div>
  );
}
