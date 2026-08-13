# Trello Clone

A real-time kanban board app with organizations, boards, sections, cards (issues), assignees, comments, and live presence over WebSocket.

## Architecture

Turborepo monorepo:

| Path | App | Stack |
|---|---|---|
| `apps/frontend` | Next.js web app (port 3000) | React 19, Tailwind CSS 4, Axios |
| `apps/Backend` | REST API (port 3001) | Express, TypeScript, JWT auth |
| `apps/websocket` | WebSocket server (port 8080) | `ws` — rooms, presence, board events |
| `packages/db` | Prisma schema + generated client | PostgreSQL |

## Prerequisites

- [Bun](https://bun.sh) (package manager)
- PostgreSQL database

## Setup

```sh
bun install
```

### Database

Create a `.env` in `packages/db/prisma` (or set in your shell):

```env
DATABASE_URL="postgresql://user:password@localhost:5432/trello"
```

Then run migrations and generate the client:

```sh
cd packages/db/prisma
bunx prisma migrate deploy
bunx prisma generate
```

### Backend

Create `apps/Backend/.env`:

```env
JWT_SECRET="some-long-random-secret"
```

### Run all apps

```sh
bun run dev
```

or individually:

```sh
bun --cwd apps/Backend run dev      # API on http://localhost:3001
bun --cwd apps/websocket run dev    # WebSocket on ws://localhost:8080
bun --cwd apps/frontend run dev     # UI on http://localhost:3000
```

## Features

- Sign up / sign in with JWT
- Organizations: create, delete, invite members, assign roles (OWNER / ADMIN / MEMBER)
- Boards: create, rename, delete
- Sections (columns): create, rename, delete
- Cards (issues): create, delete, drag-and-drop between sections, edit title/description, assign members, comments
- Real-time: live presence ("N online"), instant board updates, and board chat via WebSocket

## Checks

```sh
bun --cwd apps/frontend run check-types   # typecheck
bun --cwd apps/frontend run lint          # lint (zero warnings allowed)
```

## API overview

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/auth/signup`, `/api/auth/signin` | Auth |
| GET/POST | `/api/users/me` | Current user |
| GET/POST | `/api/orgs` | List / create organizations |
| GET/PUT/DELETE | `/api/orgs/:id` | Org detail / update / delete (owner) |
| GET/POST/DELETE/PUT | `/api/orgs/:id/members[/:userId]` | Member management |
| GET/POST | `/api/boards` | List (by `orgId`) / create |
| PUT/DELETE | `/api/boards/:id` | Rename / delete |
| GET/POST | `/api/sections` | Sections by board / create |
| PUT/DELETE | `/api/sections/:id` | Rename / delete |
| POST | `/api/issues` | Create card |
| GET/PUT/DELETE | `/api/issues/:sectionId/:issueId` | Card detail / update (incl. move) / delete |
| POST/DELETE | `/api/issues/:sectionId/:issueId/assignees[/:userId]` | Assign / unassign |
| GET/POST | `/api/issues/:sectionId/:issueId/comments` | Comments |
