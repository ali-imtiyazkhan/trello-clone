# Trello Clone → Skill-Based Auto-Assignment: Full Project Plan

> From the first commit to the final release — the complete roadmap for turning a basic Trello clone into a tool that solves a real-life problem.

---

## 1. Vision

A boring Trello clone is table stakes. This project exists to solve a real, everyday problem:

> **Team leads don't know who can actually build what. Onboarding a new engineer means manually reading resumes and digging through GitHub profiles. Cards get assigned to whoever is least busy — not whoever is best at the task.**

The answer: **Skill-based auto-assignment.** The app learns every member's real technical profile (from resumes + GitHub + manual correction) and automatically suggests — and can auto-assign — the best person for every card, with a transparent explanation of why.

---

## 2. Where we are (current state, completed)

### Monorepo (Turborepo + Bun)

| Path | App | Port | Stack |
|---|---|---|---|
| `apps/frontend` | Next.js web app | 3000 | React 19, Tailwind 4, Axios |
| `apps/Backend` | REST API | 3001 | Express, TypeScript, JWT |
| `apps/websocket` | WebSocket server | 8080 | `ws` — rooms, presence, board events, chat |
| `packages/db` | Prisma schema + client | — | PostgreSQL |
| `packages/shared` | Shared code (future: skill dictionary) | — | TypeScript |

### Completed features
- **Auth:** signup / signin with JWT, protected routes (`RequireAuth`), logout, session redirects
- **Organizations:** create, delete, member management, roles (OWNER / ADMIN / MEMBER), member list UI
- **Boards:** create, rename, delete, per-org tabs + grid on `/boards`
- **Sections:** create, rename, delete (`⋯` menu)
- **Cards (issues):** create, delete, drag & drop between sections, full detail modal (title, description, assignees, comments)
- **Realtime:** live presence ("N online"), instant board updates across clients, board chat
- **Quality:** `check-types` + `lint` (zero warnings) pass; README documented; pushed to GitHub

---

## 3. The real-life feature: Skill-Based Auto-Assignment

### Problem definition

Managers waste time discovering team skills. Assignments are made by availability or memory, not by ability. New hires are an unknown quantity until weeks of trial and error.

### Product definition

1. Each member builds a **skill profile**: extracted automatically from their **resume** (PDF/text) and **GitHub** (repos + languages), correctable manually through a checklist.
2. Every card can carry **required skills** (tags), auto-extracted from the title/description, manually editable.
3. A **matching engine** scores every org member against the card's required skills and current workload.
4. "**Suggest assignee**" returns a ranked list with a full breakdown; one click assigns (realtime, via existing WebSocket).

### Architecture

```
Resume (PDF/text) ──► parser ──┐
                                ├──► Skill profile per user (strength 0-1)
GitHub (public API/OAuth) ─────┘          │
Manual checklist ────────────────────────►│ (source: MANUAL, overrides)
                                          ▼
Card title/description ──► tag extractor ──► scorer:
  score(user) = Σ (skill weight × user strength) ÷ (1 + open assigned cards)
                                          │
                                          ▼
                        "Suggest assignee" → ranked list + breakdown
                        one click assigns → WS broadcast to everyone
```

---

## 4. Roadmap — Phase by Phase

### Phase 0 — Base app (COMPLETED)
The Trello clone itself: auth, orgs, boards, sections, cards, assignees, comments, realtime, chat. See §2.

---

### Phase 1 — Data model & skill dictionary

**Goal:** schema and shared vocabulary everything else builds on.

1. **Prisma migrations (`packages/db`):**
   ```
   UserSkill { id, userId, name, source: RESUME|GITHUB|MANUAL, strength (0-1), occurrenceCount }
   User      + githubUsername String?
   User      + githubSyncedAt DateTime?
   Issue     + requiredSkills String[]   (e.g. ["react","sql","docker"])
   GithubCache { username, payload Json, fetchedAt }
   ```
2. **Skill dictionary in `packages/shared`:**
   - ~200 skills with aliases (`react`/`reactjs`/`react.js`) and default weights
   - Shared by the resume extractor, the tag extractor, the scorer, and the UI checklist
   - Exposed via a small API (`getSkillDictionary()`, `matchText(text) -> SkillHit[]`)
3. Migrate + regenerate Prisma client; unit tests for the dictionary matcher.

**Definition of done:** `bunx prisma migrate dev` applies; dictionary matcher returns weighted hits for sample text.

---

### Phase 2 — Skill extraction (backend)

**Goal:** every user can build a profile from three sources, merged into `UserSkill`.

1. **Resume upload — `POST /api/profile/resume`**
   - multer upload (`.pdf`, `.txt`; reject > 5 MB)
   - Extract text: `pdf-parse` for PDFs, raw read for text files
   - Run dictionary match → upsert `UserSkill` (source `RESUME`, strength from occurrence frequency)
   - Store the raw text for future re-parsing (LLM upgrade path)

2. **Manual checklist — `POST /api/profile/skills`**
   - Body: `[{ skill, strength: 1-5 }]`
   - Source `MANUAL`; manual entries overrule conflicting auto-extracted ones

3. **GitHub — `POST /api/profile/github { username }`** *(connection method TBD — see §6)*
   - Fetch profile → repos → per-repo language statistics
   - Strength from byte-weighted language share (e.g. 60% Rust code → strength 0.6)
   - **Cache everything in `GithubCache`** (public API rate limit is ~60 req/hr)
   - Endpoint must be designed as an abstraction so the fetch backend (public fetch → OAuth) can swap later
   - Also scrape a lightweight highlight: repo topics / top README keywords

4. **Profile read API — `GET /api/profile`** (merged skills with source badges, github sync state)

**Definition of done:** upload a sample resume → skills appear with sensible strengths; link a GitHub username → language profile appears; manual tweaks override.

---

### Phase 3 — Matching engine (backend, the core)

**Goal:** a transparent, deterministic — and later upgradable — scorer. This is the heart of the feature.

1. **Tag extractor:** on card create/update, run the dictionary over title + description → `Issue.requiredSkills`. Manual override API: `PUT /api/issues/:sectionId/:issueId/skills`.
2. **Suggest endpoint — `POST /api/issues/:sectionId/:issueId/suggest`:**
   ```
   For each org member:
     strengthTotal  = Σ over requiredSkills: userStrength(skill) × skillWeight
     precision      = strengthTotal / Σ weights          (0-1, how well they fit)
     load           = open cards assigned to user
     score          = strengthTotal ÷ (1 + load × 0.25)  (penalize busy people)
   ```
   Response:
   ```
   { candidates: [{ userId, username, score, precision, load,
                    matchedSkills: [{skill, strength}], missingSkills: [] }] }
   ```
3. Tie-breakers for later: role boost (owner/admins for "planning"), recency of GitHub activity.
4. Optional **auto-assign flag** on cards: if enabled, top candidate is assigned automatically on card creation.

**Definition of done:** scorer is a pure function with unit tests; suggest endpoint returns a sensible ranking given a seeded org.

---

### Phase 4 — UI (frontend)

**Goal:** make the feature visible and delightful.

1. **`/profile` page** (linked from the shared Header):
   - Resume upload dropzone + parsed-results preview
   - "Link GitHub" section: username input, sync button, last-sync time, progress
   - Extracted skills list: name, strength bar, source badge (RESUME / GITHUB / MANUAL), delete
   - Manual checklist editor (with search + proficiency slider)
2. **Card detail modal:**
   - Required skills as editable chips (auto-extracted, can add/remove)
   - **"Suggest assignee" button** → ranked candidates with per-skill bars + load info → click to assign (existing assignee API + WS broadcast)
3. **Org page member list:** show dominant skills ("React · Node · Docker")
4. **Empty state:** if a user has no skill profile, suggest they set one up

**Definition of done:** end-to-end flow works: profile built → card tagged → suggest → assign → other clients see the update live.

---

### Phase 5 — Hardening & open decisions

1. **GitHub connection method** (see §6) — chosen after Phase 2; swap the abstraction
2. **Optional LLM upgrade pass**:
   - Smarter resume parsing (extract context: years, projects, "lead" vs "used")
   - Card tagging from intent, not just keywords
   - Weekly digest: "What moved, who did it, who's overloaded"
3. **Tests:** scorer unit tests, dictionary tests, resume extraction fixtures; CI running `check-types` + `lint` + tests
4. **Deployment prep:** env docs, Docker for the DB, production websocket URL wiring, rate-limit friendly GitHub batching

---

### Phase 6 — Future real-life features (backlog)

Once auto-assignment proves the concept, these extend the same profile data:

- **Deadlines + reminders:** due dates, overdue flags, realtime + Discord/Telegram webhook pings
- **Time tracking → billable hours:** timers per card, per-assignee logs, weekly reports (pairs with GitHub/assignment data)
- **Workload dashboard:** who's overloaded, who's idle — the load factor we already compute, visualized
- **Retros generated from board activity:** what moved, what stalled, who shipped

---

## 5. API surface (new endpoints)

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/profile/resume` | Upload + parse resume → skill profile |
| POST | `/api/profile/skills` | Manual skill checklist |
| POST | `/api/profile/github` | Link GitHub username + trigger fetch |
| GET | `/api/profile` | Merged skill profile + sync state |
| PUT | `/api/issues/:sectionId/:issueId/skills` | Override required skills on a card |
| POST | `/api/issues/:sectionId/:issueId/suggest` | Ranking + scoring breakdown |

---

## 6. Open decisions

| Decision | Options | Notes |
|---|---|---|
| GitHub data source | a) Username + public API fetch (fast, no setup, rate-limited, cache-heavy) b) OAuth app (clean UX, needs registered app + client secrets) | **Decided later**; backend designed as a swappable abstraction (§2.3) |
| Strength model | (a) simple 0-1 from frequencies/language share, (b) LLM-refined with experience context | Start with (a), upgrade path intact |
| Auto-assign vs suggest | (a) suggest only, (b) optional auto-assign flag | Ship suggest first |
| Resume storage | (a) store raw text only, (b) store file for re-parse | File storage if re-parse matters |

---

## 7. Risks & mitigations

| Risk | Mitigation |
|---|---|
| GitHub rate limits | Mandatory `GithubCache` table; batch fetches; fallback to manual skills |
| Resume parsing quality (PDFs vary wildly) | Dictionary keyed by aliases; manual checklist as correction path |
| Scorer feels "wrong" to users | Transparent breakdown UI; deterministic v1; LLM refinement in v2 |
| Privacy concerns (resume storage) | Own-account data, deletable profile, no sharing outside org |
| Feature abuse (fake skills) | GitHub data as objective cross-check; manual entries flagged as source MANUAL |

---

## 8. Done = shipped

1. Any member can set up a profile from resume + GitHub + manual in under 5 minutes
2. Any card can get required skills automatically
3. One click on "Suggest assignee" assigns the right person, with a reason
4. All of it works in realtime across clients
5. `check-types`, `lint`, and tests pass; docs updated

---

## 9. Future extension — "Paste a Problem → Shipping Plan" (backlog, builds on Phase 5 LLM upgrade)

### Vision

A team pastes a hackathon problem statement (or any project brief) into the app. The system:

1. **Analyzes** the problem (LLM) → breaks it into concrete tasks with dependencies
2. **Tags** each task with required skills (reuses the dictionary from Phase 1)
3. **Assigns** each task to the best member (reuses the scorer from Phase 3)
4. **Creates** the tasks as cards on a fresh board, already assigned, in realtime

Every member opens the app and sees exactly what they should build. No "how do we break this down?" hours wasted.

### Why this matters

This turns the product from "a smarter Trello" into an **AI project manager**: *understand → plan → assign → ship*. It directly solves the stranger-team pain at hackathons — teams that don't know each other's strengths or how to split a problem.

### Guardrails (non-negotiable)

- **Propose, don't impose:** the generated plan is an editable draft. Humans approve/adjust before cards are created.
- **Transparent rationale:** every assignment shows the scoring breakdown (why this person, what they're missing) — same as Phase 3.
- **Human override at every step:** edit tasks, re-tag skills, reassign people.
- **Sequenced rollout:** this builds on the skill-matching foundation (Phases 1–3) — ship the foundation first.

### Open questions

| Question | Notes |
|---|---|
| LLM provider & cost per plan | Token-heavy prompt (problem + profiles); cache generated plans |
| Plan quality vs. human effort | Start with small problems; expose "regenerate" until good |
| When to trigger | Per-org "New project from brief" flow vs. standalone tool |

### Definition of done

Paste a 3-paragraph problem → within ~1 minute a board appears with 5–10 tasks, each assigned to the strongest member, with rationale — and any member can edit everything before the team starts.