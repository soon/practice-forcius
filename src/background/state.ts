import {getLocal, setLocal} from '../local-storage';
import {StartProblemTrackerMsg} from '../messages';

type State = {
  lastStartProblemMsg: StartProblemTrackerMsg | null
  tracker: {
    endSeconds: number | null,
    timerIntervalId: number | null,
    timerNotificationId: string | null,
    problemStatusIntervalId: number | null,
    congratulationsNotificationId: string | null,
  }
}

export function getDefaultState(): State {
  return {
    lastStartProblemMsg: null,
    tracker: {
      endSeconds: null,
      timerIntervalId: null,
      timerNotificationId: null,
      problemStatusIntervalId: null,
      congratulationsNotificationId: null,
    }
  }
}

export async function updateState(fn: (state: State) => void) {
  const state = await getState();
  fn(state);
  await setState(state);
}

const BG_STATE_LS_KEY = 'bgState';

export async function getState(): Promise<State> {
  return (await getLocal<State | null>(BG_STATE_LS_KEY)) ?? getDefaultState();
}

async function setState(state: State): Promise<void> {
  await setLocal(BG_STATE_LS_KEY, state)
}
