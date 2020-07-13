import CreateProperties = chrome.tabs.CreateProperties;
import Tab = chrome.tabs.Tab;

export async function createNewTab(properties: CreateProperties): Promise<Tab> {
  return new Promise(resolve => chrome.tabs.create(properties, resolve));
}
