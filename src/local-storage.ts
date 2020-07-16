export async function getLocal<T = any>(key: string): Promise<T> {
  return new Promise(resolve => {
    chrome.storage.local.get(key, items => resolve(items[key]));
  });
}

export async function setLocal<T = any>(key: string, value: T): Promise<void> {
  return new Promise(resolve => {
    chrome.storage.local.set({[key]: value}, resolve);
  });
}

