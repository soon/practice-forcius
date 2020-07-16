import CodeForcesApi from '../api/codeforces';
import {isStartProblemTrackerMsg, Message, StartProblemTrackerMsg} from '../messages';
import {sendMessage} from '../utils/messages-utils';
import {clearNotification} from '../utils/notification-utils';
import {createSelectingProblemNotification, createUnableToFindProblemNotification} from './notifications';
import {cancelTimerNotification, startProblemTrackerMsg} from './problem-tracker';
import {getState} from './state';

chrome.runtime.onMessage.addListener(async function(msg: Message) {
  console.debug(msg);

  if (isStartProblemTrackerMsg(msg)) {
    await startProblemTrackerMsg(msg);
  } else {
    console.error('Unknown message', JSON.stringify(msg));
  }
});

chrome.notifications.onClosed.addListener(async notificationId => {
  const state = await getState();
  if (notificationId === state.tracker.timerNotificationId) {
    await cancelTimerNotification();
  }
});

chrome.notifications.onButtonClicked.addListener(async (notificationId, buttonIndex) => {
  const state = await getState();
  if (notificationId === state.tracker.congratulationsNotificationId) {
    if (buttonIndex === 0) {
      const lastMsg = state.lastStartProblemMsg;
      if (lastMsg != null) {
        const notificationId = await createSelectingProblemNotification();
        const problem = await CodeForcesApi.getUnsolvedTaskUrlInRange(
          lastMsg.handle, lastMsg.minRating, lastMsg.maxRating,
        );
        await clearNotification(notificationId);
        if (problem == null) {
          await createUnableToFindProblemNotification();
        } else {
          sendMessage<StartProblemTrackerMsg>({
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
