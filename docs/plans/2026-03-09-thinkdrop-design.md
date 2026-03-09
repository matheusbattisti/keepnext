# ThinkDrop — Design Document

App local estilo Google Keep para captura rapida de pensamentos.

## Stack

- Next.js 15 (App Router) + React 19
- Tailwind CSS 4
- Prisma + SQLite (banco em `prisma/dev.db`)
- react-masonry-css
- TypeScript

## Modelo de Dados

```
Thought
  id          String   @id @default(cuid())
  title       String?
  content     String
  color       String   @default("gray")
  pinned      Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  tags        Tag[]    (N:N)

Tag
  id          String   @id @default(cuid())
  name        String   @unique
  thoughts    Thought[] (N:N)
```

Cores pre-definidas: gray, red, orange, yellow, green, blue, purple, pink.

Relacao N:N via tabela implicita do Prisma.

## Arquitetura

- Server Actions para mutacoes: create, update, delete, togglePin (thoughts) e create, delete (tags)
- API Route GET `/api/search?q=termo` para busca full-text com LIKE no titulo e conteudo
- Componentes client apenas onde precisa de interatividade

## Estrutura de Arquivos

```
app/
  layout.tsx              — layout raiz, dark mode padrao
  page.tsx                — pagina principal (server component)
  api/search/route.ts     — busca full-text
  components/
    QuickCapture.tsx       — barra de captura rapida no topo
    ThoughtGrid.tsx        — grid masonry dos cards
    ThoughtCard.tsx        — card individual
    ThoughtModal.tsx       — modal para editar/visualizar
    SearchBar.tsx          — input de busca com debounce
    TagFilter.tsx          — filtro por tags
    ColorPicker.tsx        — seletor das 8 cores
  actions/
    thoughts.ts            — Server Actions de thoughts
    tags.ts                — Server Actions de tags
```

## UX

- Barra de captura rapida sempre visivel no topo. Ao focar, expande mostrando titulo opcional, cor e tags. Salva com botao ou Ctrl+Enter.
- Grid masonry: pinned primeiro, depois por createdAt desc. Cards mostram titulo, preview do conteudo, cor de fundo, tags como chips, icone de pin. Hover mostra acoes.
- Modal de edicao ao clicar no card: titulo, conteudo, cor, tags. Deletar com confirmacao.
- Busca com debounce 300ms via `/api/search?q=`. Filtra cards por titulo e conteudo.
- Filtro por tags via chips abaixo da busca. Combinavel com busca.
- Dark mode como padrao.

## Dependencias

Producao: next, react, tailwindcss, prisma, @prisma/client, react-masonry-css.

Dev: typescript, @types/react, eslint, prisma CLI.

Sem biblioteca de componentes, sem state management externo, sem autenticacao.
