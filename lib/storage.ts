import { ThoughtWithTags, ThoughtColor } from "./constants";

const STORAGE_KEY = "thinkdrop_thoughts";

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}

export function getThoughts(): ThoughtWithTags[] {
  if (typeof window === "undefined") return [];
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) return [];
  const thoughts: ThoughtWithTags[] = JSON.parse(data);
  return thoughts.sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

function saveThoughts(thoughts: ThoughtWithTags[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(thoughts));
}

export function createThought(data: {
  content: string;
  title?: string;
  color?: ThoughtColor;
  tagNames?: string[];
}): ThoughtWithTags {
  const now = new Date().toISOString();
  const thought: ThoughtWithTags = {
    id: generateId(),
    content: data.content,
    title: data.title || null,
    color: data.color || "gray",
    pinned: false,
    createdAt: new Date(now),
    updatedAt: new Date(now),
    tags: (data.tagNames || []).map((name) => ({ id: generateId(), name })),
  };
  const thoughts = getThoughts();
  thoughts.unshift(thought);
  saveThoughts(thoughts);
  return thought;
}

export function updateThought(
  id: string,
  data: {
    content: string;
    title?: string;
    color?: string;
    tagNames?: string[];
  }
): ThoughtWithTags | null {
  const thoughts = getThoughts();
  const idx = thoughts.findIndex((t) => t.id === id);
  if (idx === -1) return null;
  thoughts[idx] = {
    ...thoughts[idx],
    content: data.content,
    title: data.title || null,
    color: data.color || "gray",
    updatedAt: new Date(),
    tags: (data.tagNames || []).map((name) => {
      const existing = thoughts[idx].tags.find((t) => t.name === name);
      return existing || { id: generateId(), name };
    }),
  };
  saveThoughts(thoughts);
  return thoughts[idx];
}

export function deleteThought(id: string) {
  const thoughts = getThoughts().filter((t) => t.id !== id);
  saveThoughts(thoughts);
}

export function togglePin(id: string): ThoughtWithTags | null {
  const thoughts = getThoughts();
  const idx = thoughts.findIndex((t) => t.id === id);
  if (idx === -1) return null;
  thoughts[idx] = { ...thoughts[idx], pinned: !thoughts[idx].pinned };
  saveThoughts(thoughts);
  return thoughts[idx];
}

export function searchThoughts(query: string): ThoughtWithTags[] {
  const q = query.trim().toLowerCase();
  if (!q) return getThoughts();
  return getThoughts().filter(
    (t) =>
      t.content.toLowerCase().includes(q) ||
      (t.title && t.title.toLowerCase().includes(q))
  );
}

export function getAllTags(thoughts: ThoughtWithTags[]): string[] {
  const tags = new Set<string>();
  thoughts.forEach((t) => t.tags.forEach((tag) => tags.add(tag.name)));
  return Array.from(tags).sort();
}
