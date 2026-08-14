export interface MemberSkillsProfile {
    userId: string
    username: string
    skills: Record<string, number>
}

export interface RequiredSkills {
    name: string
    weight: number
}

export interface CandidateScore {
    userId: string
    username: string
    score: number
    precision: number
    load: number
    matchedSkills: { skill: string; strength: number }[];
    missingSkills: string[]
}

export interface ScoreOptions {
    requiredSkills: RequiredSkills[];
    members: MemberSkillsProfile[];
    loadOf: (userId: string) => number
}

export function scoreCandidates(options: ScoreOptions): CandidateScore[] {
    const { requiredSkills, members, loadOf } = options
    const totalWeight = requiredSkills.reduce((sum, s) => sum + s.weight, 0);
    const candidates: CandidateScore[] = [];

    for (const member of members) {
        const matchedSkills: { skill: string; strength: number }[] = [];
        const missingSkills: string[] = [];

        let strengthTotal = 0;
        for (const req of requiredSkills) {
            const strength = member.skills[req.name] ?? 0;
            if (strength > 0) {
                matchedSkills.push({ skill: req.name, strength });
                strengthTotal += strength * req.weight;
            } else {
                missingSkills.push(req.name);
            }
        }

        const precision = totalWeight > 0 ? strengthTotal / totalWeight : 0;
        const load = loadOf(member.userId);
        const score = strengthTotal / (1 + load * 0.25);

        candidates.push({
            userId: member.userId,
            username: member.username,
            score: Math.round(score * 100) / 100,
            precision: Math.round(precision * 100) / 100,
            load,
            matchedSkills,
            missingSkills,
        });
    }

    return candidates.sort((a, b) => b.score - a.score);
}
