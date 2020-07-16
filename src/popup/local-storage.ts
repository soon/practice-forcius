import {getLocal, setLocal} from '../local-storage';
import {UserSettings} from './user-settings';

const USER_HANDLE_KEY = 'userHandle';

export async function getUserHandle(): Promise<string | null> {
  return await getLocal(USER_HANDLE_KEY);
}

export async function setUserHandle(value: string | null): Promise<void> {
  return setLocal(USER_HANDLE_KEY, value);
}

const USER_SETTINGS_KEY = 'userSettings';

export async function getUserSettings(): Promise<UserSettings | null> {
  return await getLocal(USER_SETTINGS_KEY);
}

export async function setUserSettings(value: UserSettings | null): Promise<void> {
  return setLocal(USER_SETTINGS_KEY, value);
}

