type ContestDto = {
  durationSeconds: number;
  frozen: boolean
  id: number
  name: string;
  phase: string;
  relativeTimeSeconds: number
  startTimeSeconds: number
  type: string;
}

type ProblemDto = {
  contestId: number;
  index: string;
  name: string;
  rating?: number;
  tags: string[]
  type: string;
}

type ProblemsetProblemsResponse = {
  result: {
    problemStatistics: {
      contestId: number;
      index: string;
      solvedCount: number;
    }[];
    problems: ProblemDto[]
  }
}

type ProblemResultDto = {
  points: number;
  rejectedAttemptCount: number;
  type: string;
}

type ContestStandingsResponse = {
  result: {
    contest: ContestDto;
    problems: ProblemDto[];
    rows: {
      problemResults: ProblemResultDto[]
    }[]
  }
}

function getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
}

class CodeForcesApiImpl {
  protected async accessApiEndpoint<T>(name: string, params?: object): Promise<T> {
    const search = new URLSearchParams(Object.entries(params ?? {})).toString();
    const response = await fetch(`https://codeforces.com/api/${name}?${search}`)
    return await response.json();
  }

  public async getUserHandle(): Promise<string | null> {
    const baseUrl = 'https://codeforces.com/profile/';
    const response = await fetch(baseUrl)
    if (!response.url) {
      return null;
    }
    if (response.url.startsWith(baseUrl)) {
      const handle = response.url.substring(baseUrl.length).trim();
      if (handle.length > 0) {
        return handle
      }
    }
    return null;
  }

  public async getUnsolvedTaskUrlInRange(handle: string, min: number, max?: number): Promise<string | null> {
    const url = 'https://codeforces.com/api/problemset.problems';
    const response = await fetch(url);
    const payload = <ProblemsetProblemsResponse>await response.json();
    const problems = payload.result.problems.filter(
      ({rating}) => rating != null && rating >= min && (rating <= (max ?? rating))
    );
    if (problems.length === 0) {
      return null;
    }
    const maxAttempts = 10;
    const solvedProblems = {};
    for (let i = 0; i < maxAttempts; ++i) {
      let problemIdx = getRandomInt(problems.length);
      if (solvedProblems[problemIdx]) {
        continue;
      }

      const problem = problems[problemIdx];
      if (await this.isProblemSolved(handle, problem.index, problem.contestId)) {
        solvedProblems[problemIdx] = true;
      } else {
        return `https://codeforces.com/contest/${problem.contestId}/problem/${problem.index}`
      }
    }

    return null;
  }

  public async isProblemSolved(handle: string, problemIndex: string, contestId: number): Promise<boolean> {
    const data = await this.accessApiEndpoint<ContestStandingsResponse>('contest.standings', {
      contestId,
      handles: handle,
      showUnofficial: true,
      from: 1,
      count: 100,
    });
    const problemArrayIndex = data.result.problems.findIndex(x => x.index === problemIndex);
    if (problemArrayIndex < 0) {
      return false;
    }
    return data.result.rows.some(x => x.problemResults[problemArrayIndex].points > 0)
  }
}

const CodeForcesApi = new CodeForcesApiImpl();
export default CodeForcesApi;

