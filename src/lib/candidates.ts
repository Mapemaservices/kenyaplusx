// Meru County 2027 Gubernatorial Candidate Name Resolver
// Normalises free-text input → canonical candidate name

function cleanStr(s: string): string {
  return s
    .toLowerCase()
    .replace(/['’‘`.\-]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length
  const dp = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  )
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
  return dp[m][n]
}

interface CandidateDef {
  canonical: string
  tokens: string[] // pre-cleaned; any ONE token uniquely identifies this candidate
}

export const MERU_GOVERNOR_CANDIDATES: CandidateDef[] = [
  {
    canonical: "Isaac Mutuma M'Ithingia",
    // "M'Ithingia" → clean → "mithingia"; "Mthingia" → clean → "mthingia"
    tokens: ['isaac', 'mutuma', 'mithingia', 'mthingia'],
  },
  {
    canonical: 'Kinoti Marete JR',
    tokens: ['kinoti', 'marete', 'jr', 'jnr', 'junior'],
  },
  {
    canonical: 'Mithika Linturi',
    tokens: ['mithika', 'linturi'],
  },
  {
    canonical: 'Peter Munya',
    tokens: ['munya', 'peter'],
  },
]

export const KNOWN_MERU_GOVERNORS = new Set(
  MERU_GOVERNOR_CANDIDATES.map((c) => c.canonical)
)

function tokenScore(word: string, token: string): number {
  if (word === token) return 100                                          // exact
  if (word.length >= 3 && token.startsWith(word)) return 70             // word is prefix of token
  if (token.length >= 3 && word.startsWith(token)) return 60            // token is prefix of word
  if (word.length >= 4 && token.length >= 4) {
    const d = levenshtein(word, token)
    if (d === 1) return 50                                               // 1 typo
    if (d === 2 && Math.max(word.length, token.length) >= 7) return 30  // 2 typos, long word
  }
  return 0
}

export function resolveGovernorName(input: string): string {
  const trimmed = input?.trim() ?? ''
  if (!trimmed) return trimmed

  const words = cleanStr(trimmed).split(' ').filter((w) => w.length >= 2)
  if (words.length === 0) return trimmed

  const scores: Record<string, number> = {}

  for (const word of words) {
    for (const cand of MERU_GOVERNOR_CANDIDATES) {
      for (const token of cand.tokens) {
        const s = tokenScore(word, token)
        if (s > 0) scores[cand.canonical] = (scores[cand.canonical] || 0) + s
      }
    }
  }

  const best = Object.entries(scores).sort((a, b) => b[1] - a[1])[0]
  // Require at least a prefix match (score ≥ 50) to avoid false positives
  if (best && best[1] >= 50) return best[0]

  return trimmed
}

// Used in survey search: true if the stored governor name resolves to the same
// candidate as the search query (or the raw string contains the query).
export function governorMatchesQuery(stored: string, query: string): boolean {
  if (!stored || !query?.trim()) return false
  const resolvedStored = resolveGovernorName(stored)
  const resolvedQuery  = resolveGovernorName(query)
  // If either side resolved to a known candidate, compare canonicals
  if (KNOWN_MERU_GOVERNORS.has(resolvedStored) || KNOWN_MERU_GOVERNORS.has(resolvedQuery)) {
    return resolvedStored === resolvedQuery
  }
  // Both unknown — fall back to substring
  return resolvedStored.toLowerCase().includes(cleanStr(query))
}
