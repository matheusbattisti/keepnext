# ThinkDrop Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a local Google Keep-style app for rapid thought capture with search, tags, and masonry grid.

**Architecture:** Next.js 15 App Router with Server Actions for CRUD, single API Route for full-text search, Prisma + SQLite for persistence. Dark mode default. Masonry grid layout with colored post-it cards.

**Tech Stack:** Next.js 15, React 19, Tailwind CSS 4, Prisma, SQLite, react-masonry-css, TypeScript

---

### Task 1: Project Scaffolding

**Files:**
- Create: project root via `create-next-app`
- Modify: `package.json` (add prisma, react-masonry-css)

**Step 1: Create Next.js project**

Run from `D:/VIDEOS_YT/148_superpowers/projeto_148`:

```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src=no --import-alias="@/*" --turbopack --yes
```

**Step 2: Install dependencies**

```bash
npm install prisma @prisma/client react-masonry-css
```

**Step 3: Initialize Prisma with SQLite**

```bash
npx prisma init --datasource-provider sqlite
```

**Step 4: Verify project runs**

```bash
npm run dev
```

Expected: Next.js dev server starts on localhost:3000

**Step 5: Commit**

```bash
git init
git add .
git commit -m "chore: scaffold Next.js 15 project with Prisma and dependencies"
```

---

### Task 2: Database Schema and Prisma Client

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `lib/prisma.ts`

**Step 1: Write the Prisma schema**

Replace contents of `prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model Thought {
  id        String   @id @default(cuid())
  title     String?
  content   String
  color     String   @default("gray")
  pinned    Boolean  @default(false)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  tags      Tag[]
}

model Tag {
  id       String    @id @default(cuid())
  name     String    @unique
  thoughts Thought[]
}
```

**Step 2: Run migration**

```bash
npx prisma migrate dev --name init
```

Expected: Migration created, `prisma/dev.db` file appears.

**Step 3: Create Prisma client singleton**

Create `lib/prisma.ts`:

```typescript
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

**Step 4: Verify Prisma Studio opens**

```bash
npx prisma studio
```

Expected: Opens browser with Thought and Tag tables.

**Step 5: Commit**

```bash
git add prisma/ lib/prisma.ts
git commit -m "feat: add Prisma schema with Thought and Tag models"
```

---

### Task 3: Server Actions for Thoughts

**Files:**
- Create: `app/actions/thoughts.ts`

**Step 1: Create thought server actions**

Create `app/actions/thoughts.ts`:

```typescript
"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createThought(formData: {
  content: string;
  title?: string;
  color?: string;
  tagNames?: string[];
}) {
  const { content, title, color, tagNames } = formData;

  await prisma.thought.create({
    data: {
      content,
      title: title || null,
      color: color || "gray",
      tags: tagNames?.length
        ? {
            connectOrCreate: tagNames.map((name) => ({
              where: { name },
              create: { name },
            })),
          }
        : undefined,
    },
  });

  revalidatePath("/");
}

export async function updateThought(
  id: string,
  formData: {
    content: string;
    title?: string;
    color?: string;
    tagNames?: string[];
  }
) {
  const { content, title, color, tagNames } = formData;

  await prisma.thought.update({
    where: { id },
    data: {
      content,
      title: title || null,
      color: color || "gray",
      tags: {
        set: [],
        connectOrCreate: (tagNames || []).map((name) => ({
          where: { name },
          create: { name },
        })),
      },
    },
  });

  revalidatePath("/");
}

export async function deleteThought(id: string) {
  await prisma.thought.delete({ where: { id } });
  revalidatePath("/");
}

export async function togglePin(id: string) {
  const thought = await prisma.thought.findUnique({ where: { id } });
  if (!thought) return;

  await prisma.thought.update({
    where: { id },
    data: { pinned: !thought.pinned },
  });

  revalidatePath("/");
}
```

**Step 2: Commit**

```bash
git add app/actions/thoughts.ts
git commit -m "feat: add server actions for thought CRUD and pin toggle"
```

---

### Task 4: Server Actions for Tags

**Files:**
- Create: `app/actions/tags.ts`

**Step 1: Create tag server actions**

Create `app/actions/tags.ts`:

```typescript
"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getAllTags() {
  return prisma.tag.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { thoughts: true } } },
  });
}

export async function deleteTag(id: string) {
  await prisma.tag.delete({ where: { id } });
  revalidatePath("/");
}
```

**Step 2: Commit**

```bash
git add app/actions/tags.ts
git commit -m "feat: add server actions for tags"
```

---

### Task 5: Search API Route

**Files:**
- Create: `app/api/search/route.ts`

**Step 1: Create search API route**

Create `app/api/search/route.ts`:

```typescript
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q");

  if (!q || q.trim().length === 0) {
    const thoughts = await prisma.thought.findMany({
      include: { tags: true },
      orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
    });
    return NextResponse.json(thoughts);
  }

  const term = `%${q.trim()}%`;

  const thoughts = await prisma.thought.findMany({
    where: {
      OR: [
        { title: { contains: q.trim() } },
        { content: { contains: q.trim() } },
      ],
    },
    include: { tags: true },
    orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
  });

  return NextResponse.json(thoughts);
}
```

**Step 2: Commit**

```bash
git add app/api/search/route.ts
git commit -m "feat: add search API route with full-text LIKE query"
```

---

### Task 6: Layout and Dark Mode

**Files:**
- Modify: `app/layout.tsx`
- Modify: `app/globals.css`

**Step 1: Update globals.css for dark mode**

Replace `app/globals.css` with:

```css
@import "tailwindcss";

:root {
  --background: #0a0a0a;
  --foreground: #ededed;
}

body {
  background: var(--background);
  color: var(--foreground);
  font-family: system-ui, -apple-system, sans-serif;
}
```

**Step 2: Update layout.tsx**

Replace `app/layout.tsx` with:

```tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ThinkDrop",
  description: "Capture your thoughts instantly",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className="dark">
      <body className="min-h-screen antialiased">
        <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
```

**Step 3: Commit**

```bash
git add app/layout.tsx app/globals.css
git commit -m "feat: configure dark mode layout and global styles"
```

---

### Task 7: Color Constants and Types

**Files:**
- Create: `lib/constants.ts`

**Step 1: Create color constants and types**

Create `lib/constants.ts`:

```typescript
export const COLORS = {
  gray: { bg: "bg-zinc-700", border: "border-zinc-600", label: "Cinza" },
  red: { bg: "bg-red-900/70", border: "border-red-800", label: "Vermelho" },
  orange: { bg: "bg-orange-900/70", border: "border-orange-800", label: "Laranja" },
  yellow: { bg: "bg-yellow-900/70", border: "border-yellow-800", label: "Amarelo" },
  green: { bg: "bg-green-900/70", border: "border-green-800", label: "Verde" },
  blue: { bg: "bg-blue-900/70", border: "border-blue-800", label: "Azul" },
  purple: { bg: "bg-purple-900/70", border: "border-purple-800", label: "Roxo" },
  pink: { bg: "bg-pink-900/70", border: "border-pink-800", label: "Rosa" },
} as const;

export type ThoughtColor = keyof typeof COLORS;

export type ThoughtWithTags = {
  id: string;
  title: string | null;
  content: string;
  color: string;
  pinned: boolean;
  createdAt: Date;
  updatedAt: Date;
  tags: { id: string; name: string }[];
};
```

**Step 2: Commit**

```bash
git add lib/constants.ts
git commit -m "feat: add color constants and types"
```

---

### Task 8: ColorPicker Component

**Files:**
- Create: `app/components/ColorPicker.tsx`

**Step 1: Create ColorPicker**

Create `app/components/ColorPicker.tsx`:

```tsx
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
```

**Step 2: Commit**

```bash
git add app/components/ColorPicker.tsx
git commit -m "feat: add ColorPicker component"
```

---

### Task 9: QuickCapture Component

**Files:**
- Create: `app/components/QuickCapture.tsx`

**Step 1: Create QuickCapture**

Create `app/components/QuickCapture.tsx`:

```tsx
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
```

**Step 2: Commit**

```bash
git add app/components/QuickCapture.tsx
git commit -m "feat: add QuickCapture component with tags and color picker"
```

---

### Task 10: ThoughtCard Component

**Files:**
- Create: `app/components/ThoughtCard.tsx`

**Step 1: Create ThoughtCard**

Create `app/components/ThoughtCard.tsx`:

```tsx
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
```

**Step 2: Commit**

```bash
git add app/components/ThoughtCard.tsx
git commit -m "feat: add ThoughtCard component with pin, delete, and tags"
```

---

### Task 11: ThoughtModal Component

**Files:**
- Create: `app/components/ThoughtModal.tsx`

**Step 1: Create ThoughtModal**

Create `app/components/ThoughtModal.tsx`:

```tsx
"use client";

import { useState, useEffect } from "react";
import { updateThought, deleteThought } from "@/app/actions/thoughts";
import { ColorPicker } from "./ColorPicker";
import { ThoughtWithTags, ThoughtColor } from "@/lib/constants";

export function ThoughtModal({
  thought,
  allTags,
  onClose,
}: {
  thought: ThoughtWithTags;
  allTags: string[];
  onClose: () => void;
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

  const handleSave = async () => {
    if (!content.trim()) return;
    await updateThought(thought.id, {
      content: content.trim(),
      title: title.trim() || undefined,
      color,
      tagNames: selectedTags,
    });
    onClose();
  };

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    await deleteThought(thought.id);
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
```

**Step 2: Commit**

```bash
git add app/components/ThoughtModal.tsx
git commit -m "feat: add ThoughtModal component for editing thoughts"
```

---

### Task 12: SearchBar Component

**Files:**
- Create: `app/components/SearchBar.tsx`

**Step 1: Create SearchBar**

Create `app/components/SearchBar.tsx`:

```tsx
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
```

**Step 2: Commit**

```bash
git add app/components/SearchBar.tsx
git commit -m "feat: add SearchBar component with 300ms debounce"
```

---

### Task 13: TagFilter Component

**Files:**
- Create: `app/components/TagFilter.tsx`

**Step 1: Create TagFilter**

Create `app/components/TagFilter.tsx`:

```tsx
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
```

**Step 2: Commit**

```bash
git add app/components/TagFilter.tsx
git commit -m "feat: add TagFilter component"
```

---

### Task 14: ThoughtGrid Component

**Files:**
- Create: `app/components/ThoughtGrid.tsx`

**Step 1: Create ThoughtGrid**

Create `app/components/ThoughtGrid.tsx`:

```tsx
"use client";

import Masonry from "react-masonry-css";
import { ThoughtCard } from "./ThoughtCard";
import { ThoughtWithTags } from "@/lib/constants";

export function ThoughtGrid({
  thoughts,
  onEdit,
}: {
  thoughts: ThoughtWithTags[];
  onEdit: (thought: ThoughtWithTags) => void;
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
        <ThoughtCard key={thought.id} thought={thought} onEdit={onEdit} />
      ))}
    </Masonry>
  );
}
```

**Step 2: Commit**

```bash
git add app/components/ThoughtGrid.tsx
git commit -m "feat: add ThoughtGrid masonry component"
```

---

### Task 15: Main Page Assembly

**Files:**
- Create: `app/components/ThoughtBoard.tsx` (client orchestrator)
- Modify: `app/page.tsx` (server component that fetches data)

**Step 1: Create ThoughtBoard client component**

Create `app/components/ThoughtBoard.tsx`:

```tsx
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
```

**Step 2: Create main page server component**

Replace `app/page.tsx`:

```tsx
import { prisma } from "@/lib/prisma";
import { ThoughtBoard } from "./components/ThoughtBoard";

export const dynamic = "force-dynamic";

export default async function Home() {
  const thoughts = await prisma.thought.findMany({
    include: { tags: true },
    orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
  });

  const tags = await prisma.tag.findMany({
    orderBy: { name: "asc" },
  });

  return (
    <ThoughtBoard
      initialThoughts={JSON.parse(JSON.stringify(thoughts))}
      allTags={tags.map((t) => t.name)}
    />
  );
}
```

**Step 3: Verify the app runs**

```bash
npm run dev
```

Open `http://localhost:3000`. Expected: dark page with "ThinkDrop" header, quick capture bar, empty grid message.

**Step 4: Test the full flow**

1. Click "Capturar um pensamento...", type content, save
2. Verify card appears in grid
3. Click card, edit in modal, save
4. Pin a thought, verify it goes to top
5. Search for text, verify filtering
6. Delete a thought

**Step 5: Commit**

```bash
git add app/components/ThoughtBoard.tsx app/page.tsx
git commit -m "feat: assemble main page with ThoughtBoard orchestrator"
```

---

### Task 16: Final Polish

**Files:**
- Modify: `.gitignore` (ensure dev.db is NOT gitignored so schema persists, but add it if preferred)

**Step 1: Update .gitignore**

Add to `.gitignore`:

```
# Keep prisma migrations but ignore the db file
prisma/dev.db
prisma/dev.db-journal
```

**Step 2: Final full test**

```bash
npm run build
```

Expected: Build succeeds with no errors.

**Step 3: Commit**

```bash
git add .gitignore
git commit -m "chore: add SQLite db files to gitignore"
```
