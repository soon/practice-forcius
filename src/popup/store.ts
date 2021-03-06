import Vue from 'vue';
import Vuex from 'vuex';
import CodeForcesApi from '../api/codeforces';
import {StartProblemTrackerMsg} from '../messages';
import {sendMessage} from '../utils/messages-utils';
import {getUserHandle, getUserSettings, setUserHandle, setUserSettings} from './local-storage';
import {UserSettings} from './user-settings';

Vue.use(Vuex);

type StateType = {
  selectingProblem: boolean;
  userSettings: UserSettings | null;
  userHandle: string | null;
  isUserHandleRequested: boolean;
  error: string;
}

export const store = new Vuex.Store<StateType>({
  state: {
    selectingProblem: false,
    userSettings: null,
    userHandle: null,
    isUserHandleRequested: false,
    error: '',
  },
  getters: {
    useTimer(state): boolean {
      return state?.userSettings?.useTimer ?? true;
    },
  },
  mutations: {
    async setUserHandle(state, handle: string | null) {
      state.userHandle = handle;
      await setUserHandle(handle);
    },

    async setIsUserHandleRequested(state, value: boolean) {
      state.isUserHandleRequested = value;
    },

    async setSelectingProblem(state, value: boolean) {
      state.selectingProblem = value;
    },

    async setError(state, value: string) {
      state.error = value;
    },

    async clearError(state) {
      state.error = '';
    },

    async setUserSettings(state, value: UserSettings | null) {
      state.userSettings = value;
    },

    async setUseTimer(state, value: boolean) {
      if (state.userSettings == null) {
        state.userSettings = {};
      }
      state.userSettings.useTimer = value;
      await setUserSettings(state.userSettings);
    },
  },
  actions: {
    async loadCachedDataFromLocalStorage({commit}) {
      commit('setUserHandle', await getUserHandle());
      commit('setUserSettings', await getUserSettings());
    },

    async requestUserHandle({commit}) {
      const handle = await CodeForcesApi.getUserHandle();
      commit('setUserHandle', handle);
      commit('setIsUserHandleRequested', true);
    },

    async findUnsolvedProblem({commit}, {rating}: { rating: { min: number; max?: number } }) {
      if (this.state.selectingProblem) {
        return;
      }
      commit('clearError');
      commit('setSelectingProblem', true);
      try {
        const problem = await CodeForcesApi.getUnsolvedTaskInRange(this.state.userHandle, rating.min, rating.max);
        let timer = null;
        if (this.getters.useTimer) {
          timer = Math.max(Math.ceil(problem.rating * 11 / 400 - 45 / 2), 5) * 60;
        }
        if (problem) {
          sendMessage<StartProblemTrackerMsg>({
            kind: 'StartProblemTrackerMsg',
            handle: this.state.userHandle,
            problemId: problem.id,
            problemIndex: problem.index,
            contestId: problem.contestId,
            timerDurationSeconds: timer,
            minRating: rating.min,
            maxRating: rating.max,
          });
        } else {
          commit('setError', 'Unable to find a problem, try different rating level.');
        }
      } finally {
        commit('setSelectingProblem', false);
      }
    },

    async setUseTimer({commit}, value) {
      commit('setUseTimer', value);
    },
  },
});
