import { prisma } from "prisma";
import type { Prisma } from "prisma";

export interface GithubLanguageStats {
    language: string;
    bytes: number;
}

export interface GithubProfileData {
    username: string;
    languages: GithubLanguageStats[];
    topics: string[];
}

export interface GithubFetcher {
    fetchProfile(username: string): Promise<GithubProfileData>;
}

const GITHUB_API = "https://api.github.com";
const CACHE_TTL_MS = 60 * 60 * 1000;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

export class PublicGithubFetcher implements GithubFetcher {
    async fetchProfile(username: string): Promise<GithubProfileData> {
        const headers: Record<string, string> = {
            Accept: "application/vnd.github+json, application/vnd.github.mercy-preview+json",
            "User-Agent": "trello-clone",
        };

        if (GITHUB_TOKEN) {
            headers.Authorization = `Bearer ${GITHUB_TOKEN}`;
        }

        const userRes = await fetch(`${GITHUB_API}/users/${username}`, { headers });
        if (userRes.status === 404) {
            throw new Error("GitHub user not found");
        }
        if (!userRes.ok) {
            throw new Error(`GitHub API error: ${userRes.status}`);
        }

        const reposRes = await fetch(`${GITHUB_API}/users/${username}/repos?per_page=100&sort=updated`, { headers });
        if (!reposRes.ok) {
            throw new Error(`GitHub API error: ${reposRes.status}`);
        }
        const repos = (await reposRes.json()) as { name: string; topics: string[] }[];

        const languages: GithubLanguageStats[] = [];
        const topics = new Set<string>();

        for (const repo of repos) {
            for (const topic of repo.topics ?? []) topics.add(topic);

            const langRes = await fetch(`${GITHUB_API}/repos/${username}/${repo.name}/languages`, { headers });
            if (!langRes.ok) continue;

            const langData = (await langRes.json()) as Record<string, number>;
            for (const [language, bytes] of Object.entries(langData)) {
                languages.push({ language, bytes });
            }
        }

        return { username, languages, topics: [...topics] };
    }
}

const LANGUAGE_TO_SKILL: Record<string, string> = {
    TypeScript: "typescript",
    JavaScript: "javascript",
    Python: "python",
    Go: "golang",
    Rust: "rust",
    Java: "java",
    Kotlin: "kotlin",
    Swift: "swift",
    "Objective-C": "objectivec",
    C: "c",
    "C++": "cpp",
    "C#": "csharp",
    Ruby: "ruby",
    PHP: "php",
    Dart: "dart",
    Scala: "scala",
    Haskell: "haskell",
    Elixir: "elixir",
    Clojure: "clojure",
    Erlang: "erlang",
    Groovy: "groovy",
    Perl: "perl",
    R: "r",
    MATLAB: "matlab",
    Julia: "julia",
    Zig: "zig",
    Lua: "lua",
    Shell: "bash",
    PowerShell: "powershell",
    HTML: "html",
    CSS: "css",
    SCSS: "sass",
    Sass: "sass",
    Vue: "vue",
    Svelte: "svelte",
    Dockerfile: "docker",
    SQL: "sql",
    PLpgSQL: "sql",
};

export function languageStatsToSkills(languages: GithubLanguageStats[]) {
    const totalBytes = languages.reduce((sum, l) => sum + l.bytes, 0);
    if (totalBytes === 0) return [];

    const merged = new Map<string, number>();
    for (const { language, bytes } of languages) {
        const skill = LANGUAGE_TO_SKILL[language];
        if (!skill) continue;
        merged.set(skill, (merged.get(skill) ?? 0) + bytes);
    }

    return [...merged.entries()].map(([name, bytes]) => ({
        name,
        strength: Math.round((bytes / totalBytes) * 100) / 100,
        count: 1,
    }));
}

export async function getCachedGithub(username: string): Promise<GithubProfileData | null> {
    const cached = await prisma.githubCache.findUnique({
        where: {
            username: username,
        },
    });

    if (!cached) {
        return null;
    }

    const age = Date.now() - cached.fetchedAt.getTime();
    if (age > CACHE_TTL_MS) return null;

    return cached.payload as unknown as GithubProfileData;
}

export async function setGithubCache(username: string, data: GithubProfileData): Promise<void> {
    const payload = data as unknown as Prisma.InputJsonValue;

    await prisma.githubCache.upsert({
        where: {
            username: username,
        },
        update: {
            payload,
            fetchedAt: new Date(),
        },
        create: {
            username,
            payload,
        },
    });
}

export async function fetchGithubWithCache(username: string, fetcher: GithubFetcher): Promise<GithubProfileData> {
    const cached = await getCachedGithub(username);
    if (cached) return cached;

    const fresh = await fetcher.fetchProfile(username);
    await setGithubCache(username, fresh);
    return fresh;
}
