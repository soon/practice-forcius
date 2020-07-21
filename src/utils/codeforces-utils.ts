type Problem = {
  contestId: number;
  index: string
}

export function getProblemUrl({contestId, index}: Problem): string {
  return `https://codeforces.com/contest/${contestId}/problem/${index}`;
}

export function getContestUrl(contestId: number): string {
  return `https://codeforces.com/contest/${contestId}`;
}

export function getWsChannelsUrl(channels: string[]) {
  const now = new Date().getTime();
  return `wss://pubsub.codeforces.com/ws/${channels.join('/')}?_=${now}&tag=&time=&eventid=`;
}
