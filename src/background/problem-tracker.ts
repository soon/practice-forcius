import CodeForcesApi from '../api/codeforces';
import {StartProblemTrackerMsg} from '../messages';
import {getProblemUrl, getWsChannelUrl} from '../utils/codeforces-utils';
import {clearNotification} from '../utils/notification-utils';
import {createNewTab} from '../utils/tabs-utils';
import {createProblemSolvedNotification, createTimerNotification, updateTimerNotification} from './notifications';
import {getState, updateState} from './state';

let currentWs: WebSocket | null = null;

export async function cancelTimerNotification() {
  const state = await getState();
  const {timerIntervalId, timerNotificationId} = state.tracker;
  clearInterval(timerIntervalId);
  if (timerNotificationId != null) {
    await clearNotification(timerNotificationId);
  }
}

async function cancelCurrentTracker() {
  const state = await getState();
  const {problemStatusIntervalId, congratulationsNotificationId} = state.tracker;
  await cancelTimerNotification();
  clearInterval(problemStatusIntervalId);
  if (congratulationsNotificationId != null) {
    await clearNotification(congratulationsNotificationId);
  }
  if (currentWs != null) {
    currentWs.close();
  }
}

export async function startProblemTrackerMsg(msg: StartProblemTrackerMsg) {
  await updateState(x => {
    x.lastStartProblemMsg = msg;
  });
  await createNewTab({
    url: getProblemUrl({
      contestId: msg.contestId,
      index: msg.problemIndex,
    }),
  });
  await cancelCurrentTracker();
  const {handle, problemIndex, problemId, contestId, timerDurationSeconds} = msg;
  const isTimerEnabled = timerDurationSeconds != null;
  const endSeconds = (
    timerDurationSeconds == null ? null : Math.floor(new Date().getTime() / 1000 + timerDurationSeconds)
  );
  const hardLimitSeconds = new Date().getTime() / 1000 + 2 * 60 * 60;
  await updateState(x => {
    x.tracker.endSeconds = endSeconds;
  });
  const timerNotificationId = await createTimerNotification(endSeconds);
  await updateState(x => {
    x.tracker.timerNotificationId = timerNotificationId;
  });
  const timerIntervalId = window.setInterval(updateNotificationText, 500);
  await updateState(x => {
    x.tracker.timerIntervalId = timerIntervalId;
  });
  const problemStatusIntervalId = window.setInterval(checkProblemStatus, 60 * 1000);
  await updateState(x => {
    x.tracker.problemStatusIntervalId = problemStatusIntervalId;
  });
  const contestChannel = await CodeForcesApi.getUserShowMessageChannelId(contestId);
  const socket = new WebSocket(getWsChannelUrl(contestChannel));
  currentWs = socket;
  socket.addEventListener('message', async function(event) {
    const payload = JSON.parse(event.data);
    const body = JSON.parse(payload.text);
    const {t, d} = body;
    if (t === 's' && d[6] === 'OK' && d[2] === contestId && String(d[3]) === problemId) {
      await handleProblemSolved();
    }
  });

  function cancelTimer() {
    clearInterval(timerIntervalId);
    clearInterval(problemStatusIntervalId);
    currentWs.close();
  }

  async function handleProblemSolved() {
    cancelTimer();
    await clearNotification(timerNotificationId);
    const congratulationsNotificationId = await createProblemSolvedNotification();
    await updateState(x => {
      x.tracker.congratulationsNotificationId = congratulationsNotificationId;
    });
  }

  async function updateNotificationText() {
    const now = Math.floor(new Date().getTime() / 1000);
    if (now > endSeconds || now > hardLimitSeconds) {
      cancelTimer();
    } else if (isTimerEnabled) {
      await updateTimerNotification(timerNotificationId, endSeconds);
    }
  }

  async function checkProblemStatus() {
    if (await CodeForcesApi.isProblemSolved(handle, problemIndex, contestId)) {
      await handleProblemSolved();
    }
  }
}
