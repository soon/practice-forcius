import {createNotification, updateNotification} from '../utils/notification-utils';

export async function createProblemSolvedNotification(): Promise<string> {
  return createNotification({
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

function formatTimer(endSeconds: number): string {
  const now = Math.floor(new Date().getTime() / 1000);
  if (endSeconds < now) {
    return '';
  }
  const minutes = Math.floor((endSeconds - now) / 60);
  const seconds = (endSeconds - now) % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')} remaining`;
}

export async function createTimerNotification(endSeconds?: number): Promise<string> {
  const isTimerEnabled = endSeconds != null;
  return createNotification({
    type: 'basic',
    title: isTimerEnabled ? 'Go go go!' : `A new problem to solve!`,
    message: isTimerEnabled ? formatTimer(endSeconds) : 'Take your time!',
    iconUrl: 'icon192.png',
    requireInteraction: true,
    silent: true,
    buttons: [],
  });
}

export async function updateTimerNotification(notificationId: string, endSeconds: number): Promise<boolean> {
  return updateNotification(notificationId, {
    message: formatTimer(endSeconds),
  });
}


export async function createUnableToFindProblemNotification(): Promise<string> {
  return createNotification({
    type: 'basic',
    title: 'Unable to find a problem',
    message: "We did not find an unsolved problem. Maybe you've already solved all of them?",
    iconUrl: 'icon192.png',
  });
}

export async function createSelectingProblemNotification(): Promise<string> {
  return createNotification({
    type: 'basic',
    title: 'Selecting a problem...',
    message: 'Searching for a new problem',
    iconUrl: 'icon192.png',
  });
}
