# Trello Clone - Project Documentation

## Overview
A Trello-like project management tool with **GitHub integration** and **skill-based task assignment**. Built with Prisma ORM, PostgreSQL, and TypeScript.

---

## Database Schema (Prisma)

### Core Models

#### User
```prisma
model User {
  id             String    @id @default(uuid())
  username       String
  email          String    @unique
  password       String
  githubUsername String?
  githubSyncedAt DateTime?

  memberships    Membership[]
  comments       Comment[]
  issues         IssueMapping[]
  skills         UserSkill[]
}
```
- Authentication fields (username, email, password)
- GitHub integration: optional username + last sync timestamp
- Relations to all major entities

#### Organization
```prisma
model Organization {
  id          String @id @default(uuid())
  name        String
  description String

  memberships Membership[]
  boards      Board[]
}
```
- Top-level container (workspace/team)
- Contains multiple boards

#### Membership (User ↔ Organization)
```prisma
model Membership {
  id     String @id @default(uuid())
  role   Role   @default(MEMBER)
  userId String
  orgId  String

  user         User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  organization Organization @relation(fields: [orgId], references: [id], onDelete: Cascade)

  @@unique([userId, orgId])
}
```
- Junction table with role-based access control
- Roles: `OWNER`, `ADMIN`, `MEMBER`

#### Board
```prisma
model Board {
  id             String @id @default(uuid())
  title          String
  organizationId String

  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  sections     Section[]
  issues       Issue[]
}
```
- Project board within an organization
- Contains sections (columns) and issues

#### Section
```prisma
model Section {
  id      String @id @default(uuid())
  title   String
  boardId String

  board  Board   @relation(fields: [boardId], references: [id], onDelete: Cascade)
  issues Issue[]
}
```
- Columns/lists on a board (e.g., "To Do", "In Progress", "Done")

#### Issue (Task/Card)
```prisma
model Issue {
  id             String   @id @default(uuid())
  title          String
  description    String?
  requiredSkills String[]

  boardId   String
  sectionId String

  board   Board   @relation(fields: [boardId], references: [id], onDelete: Cascade)
  section Section @relation(fields: [sectionId], references: [id], onDelete: Cascade)

  assignees IssueMapping[]
  comments  Comment[]
}
```
- Core task entity
- **Skill-based assignment**: `requiredSkills[]` matches against `UserSkill`
- Belongs to one board and one section
- Multiple assignees via `IssueMapping`

#### IssueMapping (User ↔ Issue - Many-to-Many)
```prisma
model IssueMapping {
  id      String @id @default(uuid())
  userId  String
  issueId String

  user  User  @relation(fields: [userId], references: [id], onDelete: Cascade)
  issue Issue @relation(fields: [issueId], references: [id], onDelete: Cascade)

  @@unique([userId, issueId])
}
```
- Junction table allowing **multiple assignees per issue**
- Each row = one user assigned to one issue

#### Comment
```prisma
model Comment {
  id      String @id @default(uuid())
  content String

  userId  String
  issueId String

  user  User  @relation(fields: [userId], references: [id], onDelete: Cascade)
  issue Issue @relation(fields: [issueId], references: [id], onDelete: Cascade)
}
```
- Threaded discussions on issues

---

### Skill System

#### UserSkill
```prisma
model UserSkill {
  id              String      @id @default(uuid())
  userId          String
  name            String
  source          SkillSource @default(MANUAL)
  strength        Float       @default(0)
  occurrenceCount Int         @default(0)

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, name])
}
```
- Skills extracted from multiple sources
- **Strength scoring** (0-1+) for matching algorithm
- **Source tracking**: `RESUME`, `GITHUB`, `MANUAL`

#### SkillSource Enum
```prisma
enum SkillSource {
  RESUME
  GITHUB
  MANUAL
}
```

#### GithubCache
```prisma
model GithubCache {
  username  String   @id
  payload   Json
  fetchedAt DateTime @default(now())
}
```
- Caches GitHub API responses to avoid rate limits
- Keyed by GitHub username

---

### Enums

```prisma
enum Role {
  OWNER
  ADMIN
  MEMBER
}

enum SkillSource {
  RESUME
  GITHUB
  MANUAL
}
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Organization                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                    Board                             │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐           │    │
│  │  │ Section  │  │ Section  │  │ Section  │           │    │
│  │  │ "To Do"  │  │ "In Prog"│  │ "Done"   │           │    │
│  │  │          │  │          │  │          │           │    │
│  │  │ Issue ◄──┼──┤ Issue ◄──┼──┤ Issue    │           │    │
│  │  │          │  │          │  │          │           │    │
│  │  └──────────┘  └──────────┘  └──────────┘           │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  Members: User1 (OWNER), User2 (ADMIN), User3 (MEMBER)     │
└─────────────────────────────────────────────────────────────┘
```

---

## Key Features

### 1. Multi-Tenant Organization Structure
- Users belong to multiple organizations via `Membership`
- Role-based permissions (OWNER > ADMIN > MEMBER)
- Cascade deletes maintain data integrity

### 2. Kanban Board System
- Boards → Sections (columns) → Issues (cards)
- Drag-and-drop reordering (frontend implementation)
- Issues belong to exactly one section at a time

### 3. Skill-Based Task Assignment
```
Issue.requiredSkills: ["React", "TypeScript", "Testing"]

User1.skills: [React: 0.9, TypeScript: 0.8, Testing: 0.7]
User2.skills: [React: 0.6, TypeScript: 0.5]
User3.skills: [Python: 0.9, Django: 0.8]

→ Best match: User1 (covers all 3 required skills with high strength)
```

### 4. GitHub Integration
- Sync GitHub profile data (`githubUsername`, `githubSyncedAt`)
- Extract skills from repositories/languages
- Cache API responses in `GithubCache` (rate limit protection)
- Auto-update skill strengths based on GitHub activity

### 5. Collaborative Features
- **Multiple assignees** per issue (via `IssueMapping`)
- **Comments** on issues for discussion
- **Activity tracking** through timestamps

---

## Data Flow Examples

### Assigning an Issue to Multiple Users
```typescript
// Create issue mappings for 3 users
await prisma.issueMapping.createMany({
  data: [
    { userId: "user1", issueId: "issueA" },
    { userId: "user2", issueId: "issueA" },
    { userId: "user3", issueId: "issueA" },
  ],
});

// Fetch all assignees for an issue
const issue = await prisma.issue.findUnique({
  where: { id: "issueA" },
  include: {
    assignees: { include: { user: true } }
  }
});
// issue.assignees = [{user: User1}, {user: User2}, {user: User3}]
```

### Skill Matching Algorithm
```typescript
function matchSkills(issue: Issue, users: User[]): User[] {
  return users
    .map(user => ({
      user,
      score: issue.requiredSkills.reduce((sum, skill) => {
        const userSkill = user.skills.find(s => s.name === skill);
        return sum + (userSkill?.strength || 0);
      }, 0)
    }))
    .filter(m => m.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(m => m.user);
}
```

### GitHub Skill Sync
```typescript
async function syncGitHubSkills(userId: string, githubUsername: string) {
  // 1. Check cache
  const cached = await prisma.githubCache.findUnique({ where: { username: githubUsername } });
  if (cached && isFresh(cached.fetchedAt)) return cached.payload;

  // 2. Fetch from GitHub API
  const repos = await fetchGitHubRepos(githubUsername);
  const languages = extractLanguages(repos);

  // 3. Update cache
  await prisma.githubCache.upsert({
    where: { username: githubUsername },
    create: { username: githubUsername, payload: languages },
    update: { payload: languages, fetchedAt: new Date() }
  });

  // 4. Update user skills
  for (const [lang, count] of Object.entries(languages)) {
    await prisma.userSkill.upsert({
      where: { userId_name: { userId, name: lang } },
      create: { userId, name: lang, source: "GITHUB", strength: calculateStrength(count), occurrenceCount: count },
      update: { strength: calculateStrength(count), occurrenceCount: count, source: "GITHUB" }
    });
  }
}
```

---

## API Endpoints (Planned)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | User registration |
| POST | `/auth/login` | User login |
| GET | `/organizations` | List user's organizations |
| POST | `/organizations` | Create organization |
| GET | `/organizations/:id/boards` | List boards in org |
| POST | `/organizations/:id/boards` | Create board |
| GET | `/boards/:id` | Get board with sections & issues |
| PATCH | `/boards/:id` | Update board |
| POST | `/boards/:id/sections` | Create section |
| PATCH | `/sections/:id` | Update section (reorder) |
| POST | `/sections/:id/issues` | Create issue |
| PATCH | `/issues/:id` | Update issue (move, assign, etc.) |
| POST | `/issues/:id/assignees` | Add assignee |
| DELETE | `/issues/:id/assignees/:userId` | Remove assignee |
| POST | `/issues/:id/comments` | Add comment |
| GET | `/users/:id/skills` | Get user skills |
| POST | `/users/:id/github-sync` | Trigger GitHub sync |

---

## Development Setup

```bash
# Install dependencies
bun install

# Generate Prisma client
bunx prisma generate

# Run migrations
bunx prisma migrate dev

# Seed database (optional)
bunx prisma db seed

# Start development server
bun run dev
```

### Environment Variables
```env
DATABASE_URL="postgresql://user:password@localhost:5432/trello_clone"
JWT_SECRET="your-secret-key"
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"
```

---

## Future Enhancements

- [ ] Real-time updates with WebSockets
- [ ] File attachments on issues
- [ ] Labels/tags for issues
- [ ] Due dates & notifications
- [ ] Board templates
- [ ] Advanced search & filtering
- [ ] Mobile-responsive UI
- [ ] Dark mode
- [ ] Keyboard shortcuts
- [ ] Export/import boards

---

## Project Structure

```
trello-clone/
├── packages/
│   ├── db/
│   │   └── prisma/
│   │       └── schema.prisma      # Database schema (this file)
│   ├── api/                       # Backend API (tRPC/Express)
│   └── web/                       # Frontend (React/Next.js)
├── PROJECT.md                     # This file
├── package.json
├── turbo.json                     # Turborepo config
└── README.md
```

---

## License
MIT