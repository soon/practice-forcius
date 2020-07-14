type Problem = {
  contestId: number;
  index: string
}

export function getProblemUrl({contestId, index}: Problem): string {
  return `https://codeforces.com/contest/${contestId}/problem/${index}`
}
