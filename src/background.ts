import CodeForcesApi from './api/codeforces';
import {isStartProblemTrackerMsg, Message} from './messages';
import {clearNotification, createNotification, updateNotification} from './utils/notification-utils';

type State = {
  tracker: {
    timerIntervalId: number | null,
    timerNotificationId: string | null,
    problemStatusIntervalId: number | null,
    congratulationsNotificationId: string | null,
  }
}

const state: State = {
  tracker: {
    timerIntervalId: null,
    timerNotificationId: null,
    problemStatusIntervalId: null,
    congratulationsNotificationId: null,
  }
}

function formatTimer(endSeconds: number): string {
  const now = Math.floor(new Date().getTime() / 1000);
  if (endSeconds < now) {
    return '';
  }
  const minutes = Math.floor((endSeconds - now) / 60);
  const seconds = (endSeconds - now) % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')} remaining`;
}

async function cancelCurrentTracker() {
  const {
    timerIntervalId,
    timerNotificationId,
    problemStatusIntervalId,
    congratulationsNotificationId
  } = state.tracker;
  if (timerIntervalId != null) {
    clearInterval(timerIntervalId);
  }
  if (problemStatusIntervalId != null) {
    clearInterval(problemStatusIntervalId);
  }
  if (timerNotificationId != null) {
    await clearNotification(timerNotificationId)
  }
  if (congratulationsNotificationId != null) {
    await clearNotification(congratulationsNotificationId)
  }
}

chrome.runtime.onMessage.addListener(async function(msg: Message, sender) {
  console.debug(msg);

  if (isStartProblemTrackerMsg(msg)) {
    await cancelCurrentTracker();
    const {handle, problemIndex, contestId, timerDurationSeconds} = msg;
    const endSeconds = Math.floor(new Date().getTime() / 1000 + timerDurationSeconds);
    const notificationId = await createNotification({
      type: 'basic',
      title: 'Go go go!',
      message: formatTimer(endSeconds),
      iconUrl: 'icon192.png',
      requireInteraction: true,
      silent: true,
      buttons: [],
    });
    state.tracker.timerNotificationId = notificationId;

    const timerIntervalId = window.setInterval(updateNotificationText, 500);
    state.tracker.timerIntervalId = timerIntervalId;
    const problemStatusIntervalId = window.setInterval(checkProblemStatus, 2000);
    state.tracker.problemStatusIntervalId = problemStatusIntervalId

    const cancelTimer = () => {
      clearInterval(timerIntervalId);
      clearInterval(problemStatusIntervalId)
    }

    async function updateNotificationText() {
      const now = Math.floor(new Date().getTime() / 1000);
      if (now > endSeconds) {
        cancelTimer()
      } else {
        await updateNotification(notificationId, {
          message: formatTimer(endSeconds)
        });
      }
    }

    async function checkProblemStatus() {
      if (await CodeForcesApi.isProblemSolved(handle, problemIndex, contestId)) {
        cancelTimer();
        await clearNotification(notificationId);
        state.tracker.congratulationsNotificationId = await createNotification({
          type: 'basic',
          title: 'Congratulations!',
          message: "You've solved the problem! Pick up a new one!",
          iconUrl: 'icon192-trophy.png',
          requireInteraction: true,
          silent: true,
          buttons: [],
        });
      }
    }
  } else {
    console.error('Unknown message', JSON.stringify(msg))
  }
});
