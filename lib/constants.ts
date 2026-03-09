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
