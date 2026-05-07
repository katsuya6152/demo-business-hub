import { PATTERNS, type QuestionPattern } from "./patterns";

export function matchPattern(input: string): QuestionPattern | null {
  if (!input.trim()) return null;
  const normalized = input.trim();

  const scored = PATTERNS.map((pattern) => {
    const matchCount = pattern.triggers.filter((t) =>
      normalized.toLowerCase().includes(t.toLowerCase()),
    ).length;
    return { pattern, matchCount };
  }).filter(({ matchCount }) => matchCount > 0);

  if (scored.length === 0) return null;

  scored.sort((a, b) => {
    if (b.matchCount !== a.matchCount) return b.matchCount - a.matchCount;
    return a.pattern.priority - b.pattern.priority;
  });

  return scored[0].pattern;
}
