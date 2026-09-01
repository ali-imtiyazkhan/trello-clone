import type { RequiredSkills } from "@repo/shared";

const GROQ_API = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama-3.3-70b-versatile";

function getGroqApiKey(): string {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new Error("GROQ_API_KEY not configured");
  return key;
}

export interface ProblemAnalysisResult {
    requiredSkills: RequiredSkills[];
    suggestedRoles: string[];
    complexity: "low" | "medium" | "high";
    estimatedHours: number;
}

const SYSTEM_PROMPT = `You are a technical project analyst. Analyze the given problem/hackathon description and extract required technical skills with importance weights.

Return ONLY valid JSON in this exact format:
{
  "requiredSkills": [
    {"name": "skill_name_from_dictionary", "weight": 1-5},
    ...
  ],
  "suggestedRoles": ["frontend", "backend", "devops", "ml", "mobile", "fullstack"],
  "complexity": "low|medium|high",
  "estimatedHours": number
}

Rules:
- Use skill names from this dictionary: react, nextjs, vue, typescript, javascript, python, golang, rust, java, node, express, nestjs, fastapi, django, postgresql, mongodb, redis, docker, kubernetes, aws, gcp, azure, graphql, rest, websockets, prisma, tailwind, machine-learning, pytorch, tensorflow, nlp, llm, rag, langchain, react-native, flutter, android, ios, git, github-actions, ci-cd, testing, jest, cypress, playwright
- Weight 1-5 (5 = critical, 1 = nice-to-have)
- Max 15 skills
- suggestedRoles: pick from [frontend, backend, devops, ml, mobile, fullstack, data]
- complexity: low (1-2 people, <20h), medium (3-4 people, 20-60h), high (5+ people, >60h)
- estimatedHours: total team hours`;

export async function analyzeProblem(description: string): Promise<ProblemAnalysisResult> {
    const GROQ_API_KEY = getGroqApiKey();

    const response = await fetch(GROQ_API, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify({
            model: MODEL,
            messages: [
                { role: "system", content: SYSTEM_PROMPT },
                { role: "user", content: description },
            ],
            temperature: 0.1,
            response_format: { type: "json_object" },
        }),
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Groq API error: ${response.status} - ${error}`);
    }

    const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
        throw new Error("No response from LLM");
    }

    try {
        const parsed = JSON.parse(content);
        return {
            requiredSkills: parsed.requiredSkills ?? [],
            suggestedRoles: parsed.suggestedRoles ?? [],
            complexity: parsed.complexity ?? "medium",
            estimatedHours: parsed.estimatedHours ?? 40,
        };
    } catch (e) {
        throw new Error("Failed to parse LLM response as JSON");
    }
}