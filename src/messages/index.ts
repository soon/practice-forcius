export type Message = {
  kind: string;
}

export type StartProblemTrackerMsg = Message & {
  kind: 'StartProblemTrackerMsg',
  handle: string;
  problemIndex: string;
  contestId: number;
  timerDurationSeconds?: number;
  minRating: number;
  maxRating?: number;
}

export function isStartProblemTrackerMsg(msg: Message): msg is StartProblemTrackerMsg {
  return msg.kind === 'StartProblemTrackerMsg';
}
