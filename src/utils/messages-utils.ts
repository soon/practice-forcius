import {Message} from '../messages';

export function sendMessage<T extends Message>(message: T, responseCallback?: (response: any) => void) {
  chrome.runtime.sendMessage(message, responseCallback);
}
