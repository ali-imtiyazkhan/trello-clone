export interface ProblemAnalysisResult {
    requiredSkills: RequiredSkills[];
    suggestedRoles: string[];
    complexity: "low" | "medium" | "high";
    estimatedHours: number;
}

export interface RequiredSkills {
    name: string;
    weight: number;
}

export interface CandidateScore {
    userId: string;
    username: string;
    score: number;
    precision: number;
    load: number;
    matchedSkills: { skill: string; strength: number }[];
    missingSkills: string[];
}

export interface WorkDistributionResult {
    analysis: ProblemAnalysisResult;
    distribution: CandidateScore[];
}