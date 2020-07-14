import NotificationOptions = chrome.notifications.NotificationOptions;

export async function createNotification(options: NotificationOptions): Promise<string> {
  return new Promise(resolve => chrome.notifications.create(options, resolve));
}

export async function updateNotification(notificationId: string, options: NotificationOptions): Promise<boolean> {
  return new Promise(resolve => chrome.notifications.update(notificationId, options, resolve));
}

export async function clearNotification(notificationId: string): Promise<boolean> {
  return new Promise(resolve => chrome.notifications.clear(notificationId, resolve));
}
