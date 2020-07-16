import CodeForcesApi from '../api/codeforces';
import {StartProblemTrackerMsg} from '../messages';
import {getProblemUrl} from '../utils/codeforces-utils';
import {clearNotification} from '../utils/notification-utils';
import {createNewTab} from '../utils/tabs-utils';
import {createProblemSolvedNotification, createTimerNotification, updateTimerNotification} from './notifications';
import {getState, updateState} from './state';

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
  const {handle, problemIndex, contestId, timerDurationSeconds} = msg;
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
  const problemStatusIntervalId = window.setInterval(checkProblemStatus, 2000);
  await updateState(x => {
    x.tracker.problemStatusIntervalId = problemStatusIntervalId;
  });

  const cancelTimer = () => {
    clearInterval(timerIntervalId);
    clearInterval(problemStatusIntervalId);
  };

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
      cancelTimer();
      await clearNotification(timerNotificationId);
      const congratulationsNotificationId = await createProblemSolvedNotification();
      await updateState(x => {
        x.tracker.congratulationsNotificationId = congratulationsNotificationId;
      });
    }
  }
}
