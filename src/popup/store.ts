import Vue from 'vue';
import Vuex from 'vuex';
import CodeForcesApi from '../api/codeforces';
import {getUserHandle, getUserSettings, setUserHandle, setUserSettings} from '../local-storage';
import {StartProblemTrackerMsg} from '../messages';
import {UserSettings} from '../user-settings';
import {sendMessage} from '../utils/messages-utils';

Vue.use(Vuex);

type StateType = {
  selectingProblem: boolean;
  userSettings: UserSettings | null;
  userHandle: string | null;
}

export const store = new Vuex.Store<StateType>({
  state: {
    selectingProblem: false,
    userSettings: null,
    userHandle: null,
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

    async setSelectingProblem(state, value: boolean) {
      state.selectingProblem = value;
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
    },

    async findUnsolvedProblem({commit}, {rating, timer}: { rating: { min: number; max?: number }, timer: number }) {
      if (this.state.selectingProblem) {
        return;
      }
      commit('setSelectingProblem', true);
      try {
        const problem = await CodeForcesApi.getUnsolvedTaskUrlInRange(this.state.userHandle, rating.min, rating.max);
        if (problem) {
          sendMessage<StartProblemTrackerMsg>({
            kind: 'StartProblemTrackerMsg',
            handle: this.state.userHandle,
            problemIndex: problem.index,
            contestId: problem.contestId,
            timerDurationSeconds: this.getters.useTimer ? timer : null,
            minRating: rating.min,
            maxRating: rating.max,
          });
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
