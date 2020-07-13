import Vue from 'vue';
import Vuex from 'vuex';
import CodeForcesApi from '../api/codeforces';
import {getUserHandle, setUserHandle} from '../local-storage';
import {createNotification, updateNotification} from '../utils/notification-utils';
import {createNewTab} from '../utils/tabs-utils';

Vue.use(Vuex);

type StateType = {
  selectingProblem: boolean;
  userHandle: string | null;
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

export const store = new Vuex.Store<StateType>({
  state: {
    selectingProblem: false,
    userHandle: null,
  },
  mutations: {
    async setUserHandle(state, handle: string | null) {
      state.userHandle = handle;
      await setUserHandle(handle);
    },

    async setSelectingProblem(state, value: boolean) {
      state.selectingProblem = value;
    },
  },
  actions: {
    async loadCachedDataFromLocalStorage({commit}) {
      commit('setUserHandle', await getUserHandle());
    },

    async requestUserHandle({commit}) {
      const handle = await CodeForcesApi.getUserHandle();
      commit('setUserHandle', handle);
    },

    async findUnsolvedProblem({commit}, {rating}: { rating: { min: number; max?: number } }) {
      if (this.state.selectingProblem) {
        return;
      }
      commit('setSelectingProblem', true);
      try {
        const url = await CodeForcesApi.getUnsolvedTaskUrlInRange(this.state.userHandle, rating.min, rating.max);
        if (url) {
          const endSeconds = Math.floor(new Date().getTime() / 1000 + 5 * 60);
          const notificationId = await createNotification({
            type: 'basic',
            title: 'Go go go!',
            message: formatTimer(endSeconds),
            iconUrl: 'icon128.png',
            requireInteraction: true,
            silent: true,
            buttons: [],
          });
          const intervalId = setInterval(updateNotificationText, 500);

          async function updateNotificationText() {
            const now = Math.floor(new Date().getTime() / 1000);
            if (now > endSeconds) {
              clearInterval(intervalId)
            } else {
              await updateNotification(notificationId, {
                message: formatTimer(endSeconds)
              });
            }
          }

          await createNewTab({url});
        }
      } finally {
        commit('setSelectingProblem', false);
      }
    },
  },
});
