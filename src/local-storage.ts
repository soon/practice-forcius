async function getLocal(key: string): Promise<any> {
  return new Promise(resolve => {
    chrome.storage.local.get(key, items => resolve(items[key]));
  });
}

async function setLocal(key: string, value: any): Promise<void> {
  return new Promise(resolve => {
    chrome.storage.local.set({[key]: value}, resolve);
  });
}

const USER_HANDLE_KEY = 'userHandle';

export async function getUserHandle(): Promise<string | null> {
  return await getLocal(USER_HANDLE_KEY);
}

export async function setUserHandle(value: string | null): Promise<void> {
  return setLocal(USER_HANDLE_KEY, value);
}
