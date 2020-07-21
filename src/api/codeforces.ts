import {getContestUrl, getProblemUrl} from '../utils/codeforces-utils';

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

export type ProblemDto = {
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

type UserStatusResponse = {
  result: {
    contestId: number;
    contest: ContestDto;
    problem: ProblemDto;
    verdict: string;
  }[]
}

type WsChannels = {
  userMessages: string;
  participant: string;
}

function getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
}

class CodeForcesApiImpl {
  protected async accessApiEndpoint<T>(name: string, params?: object): Promise<T> {
    const search = new URLSearchParams(Object.entries(params ?? {})).toString();
    const response = await fetch(`https://codeforces.com/api/${name}?${search}`);
    return await response.json();
  }

  public async getUserHandle(): Promise<string | null> {
    const baseUrl = 'https://codeforces.com/profile/';
    const response = await fetch(baseUrl);
    if (!response.url) {
      return null;
    }
    if (response.url.startsWith(baseUrl)) {
      const handle = response.url.substring(baseUrl.length).trim();
      if (handle.length > 0) {
        return handle;
      }
    }
    return null;
  }

  public async getUnsolvedTaskInRange(
    handle: string, min: number, max?: number,
  ): Promise<ProblemDto & { id: string } | null> {
    const problemsResponse = await this.accessApiEndpoint<ProblemsetProblemsResponse>('problemset.problems');
    const userSubmissions = await this.accessApiEndpoint<UserStatusResponse>('user.status', {
      handle,
    });
    const solvedTasks = {};
    userSubmissions.result.forEach(({problem, verdict}) => {
      if (verdict === 'OK') {
        solvedTasks[`${problem.contestId}:${problem.index}`] = true;
      }
    });
    const problems = problemsResponse.result.problems.filter(
      ({contestId, index, rating}) => (
        rating != null && rating >= min && (rating <= (max ?? rating)) && solvedTasks[`${contestId}:${index}`] == null
      ),
    );
    if (problems.length === 0) {
      return null;
    }
    const problemIdx = getRandomInt(problems.length);
    const problem = problems[problemIdx];
    return {
      id: await this.getProblemId(problem.index, problem.contestId),
      ...problem,
    };
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
    return data.result.rows.some(x => x.problemResults[problemArrayIndex].points > 0);
  }

  public async getProblemId(problemIndex: string, contestId: number): Promise<string> {
    const response = await fetch(getProblemUrl({contestId, index: problemIndex}));
    const text = await response.text();
    const m = text.match(/<input *name="problemId".*value="(?<problemId>\d+)".*>/);
    return m.groups['problemId'] ?? '';
  }

  public async getWsChannels(contestId: number): Promise<WsChannels> {
    const response = await fetch(getContestUrl(contestId));
    const text = await response.text();
    return {
      userMessages: CodeForcesApiImpl.getUserMessagesChannel(text),
      participant: CodeForcesApiImpl.getParticipantChannel(text),
    };
  }

  private static getUserMessagesChannel(text: string) {
    const m = text.match(/<meta *name="usmc".*content="(?<channel>.+)".*>/);
    return m.groups['channel'] ?? '';
  }

  private static getParticipantChannel(text: string) {
    const m = text.match(/<meta *name="pc".*content="(?<channel>.+)".*>/);
    return m.groups['channel'] ?? '';
  }
}

const CodeForcesApi = new CodeForcesApiImpl();
export default CodeForcesApi;

