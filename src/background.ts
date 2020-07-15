import CodeForcesApi from './api/codeforces';
import {isStartProblemTrackerMsg, Message, StartProblemTrackerMsg} from './messages';
import {getProblemUrl} from './utils/codeforces-utils';
import {clearNotification, createNotification, updateNotification} from './utils/notification-utils';
import {createNewTab} from './utils/tabs-utils';

type State = {
  lastStartProblemMsg: StartProblemTrackerMsg | null
  tracker: {
    timerIntervalId: number | null,
    timerNotificationId: string | null,
    problemStatusIntervalId: number | null,
    congratulationsNotificationId: string | null,
  }
}

const state: State = {
  lastStartProblemMsg: null,
  tracker: {
    timerIntervalId: null,
    timerNotificationId: null,
    problemStatusIntervalId: null,
    congratulationsNotificationId: null,
  },
};

function formatTimer(endSeconds: number): string {
  const now = Math.floor(new Date().getTime() / 1000);
  if (endSeconds < now) {
    return '';
  }
  const minutes = Math.floor((endSeconds - now) / 60);
  const seconds = (endSeconds - now) % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')} remaining`;
}

async function cancelTimerNotification() {
  const {timerIntervalId, timerNotificationId} = state.tracker;
  clearInterval(timerIntervalId);
  if (timerNotificationId != null) {
    await clearNotification(timerNotificationId);
  }
}

async function cancelCurrentTracker() {
  const {problemStatusIntervalId, congratulationsNotificationId} = state.tracker;
  await cancelTimerNotification();
  clearInterval(problemStatusIntervalId);
  if (congratulationsNotificationId != null) {
    await clearNotification(congratulationsNotificationId);
  }
}

async function createProblemSolvedNotification(): Promise<string> {
  return await createNotification({
    type: 'basic',
    title: 'Congratulations!',
    message: "You've solved the problem! Pick up a new one!",
    iconUrl: 'icon192-trophy.png',
    requireInteraction: true,
    silent: true,
    buttons: [{
      'title': 'Repeat',
    }],
  });
}

async function handleStartProblemTrackerMsg(msg: StartProblemTrackerMsg) {
  state.lastStartProblemMsg = msg;
  await createNewTab({
    url: getProblemUrl({
      contestId: msg.contestId,
      index: msg.problemIndex,
    }),
  });
  await cancelCurrentTracker();
  const {handle, problemIndex, contestId, timerDurationSeconds} = msg;
  const isTimerEnabled = timerDurationSeconds != null;
  const endSeconds = Math.floor(new Date().getTime() / 1000 + timerDurationSeconds);
  const notificationId = await createNotification({
    type: 'basic',
    title: isTimerEnabled ? 'Go go go!' : `A new problem to solve!`,
    message: isTimerEnabled ? formatTimer(endSeconds) : 'Take your time!',
    iconUrl: 'icon192.png',
    requireInteraction: true,
    silent: true,
    buttons: [],
  });
  state.tracker.timerNotificationId = notificationId;

  const timerIntervalId = isTimerEnabled ? window.setInterval(updateNotificationText, 500) : null;
  state.tracker.timerIntervalId = timerIntervalId;
  const problemStatusIntervalId = window.setInterval(checkProblemStatus, 2000);
  state.tracker.problemStatusIntervalId = problemStatusIntervalId;

  const cancelTimer = () => {
    clearInterval(timerIntervalId);
    clearInterval(problemStatusIntervalId);
  };

  async function updateNotificationText() {
    const now = Math.floor(new Date().getTime() / 1000);
    if (now > endSeconds) {
      cancelTimer();
    } else {
      await updateNotification(notificationId, {
        message: formatTimer(endSeconds),
      });
    }
  }

  async function checkProblemStatus() {
    if (await CodeForcesApi.isProblemSolved(handle, problemIndex, contestId)) {
      cancelTimer();
      await clearNotification(notificationId);
      state.tracker.congratulationsNotificationId = await createProblemSolvedNotification();
    }
  }
}

chrome.runtime.onMessage.addListener(async function(msg: Message) {
  console.debug(msg);

  if (isStartProblemTrackerMsg(msg)) {
    await handleStartProblemTrackerMsg(msg);
  } else {
    console.error('Unknown message', JSON.stringify(msg));
  }
});

chrome.notifications.onClosed.addListener(async notificationId => {
  if (notificationId === state.tracker.timerNotificationId) {
    await cancelTimerNotification();
  }
});

chrome.notifications.onButtonClicked.addListener(async (notificationId, buttonIndex) => {
  if (notificationId === state.tracker.congratulationsNotificationId) {
    if (buttonIndex === 0) {
      const lastMsg = state.lastStartProblemMsg;
      if (lastMsg != null) {
        const notificationId = await createNotification({
          type: 'basic',
          title: 'Selecting a problem...',
          message: 'Searching for a new problem',
          iconUrl: 'icon192.png',
        });
        const problem = await CodeForcesApi.getUnsolvedTaskUrlInRange(
          lastMsg.handle, lastMsg.minRating, lastMsg.maxRating,
        );
        await clearNotification(notificationId);
        if (problem == null) {
          await createNotification({
            type: 'basic',
            title: 'Unable to find a problem',
            message: "We did not find an unsolved problem. Maybe you've already solved all of them?",
            iconUrl: 'icon192.png',
          });
        } else {
          await handleStartProblemTrackerMsg({
            kind: lastMsg.kind,
            handle: lastMsg.handle,
            problemIndex: problem.index,
            contestId: problem.contestId,
            timerDurationSeconds: lastMsg.timerDurationSeconds,
            minRating: lastMsg.minRating,
            maxRating: lastMsg.maxRating,
          });
        }
      }
    }
  }
});
