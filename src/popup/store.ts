import Vue from 'vue';
import Vuex from 'vuex';
import CodeForcesApi from '../api/codeforces';
import {getUserHandle, setUserHandle} from '../local-storage';
import {StartProblemTrackerMsg} from '../messages';
import {getProblemUrl} from '../utils/codeforces-utils';
import {sendMessage} from '../utils/messages-utils';
import {createNewTab} from '../utils/tabs-utils';

Vue.use(Vuex);

type StateType = {
  selectingProblem: boolean;
  userHandle: string | null;
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
        const problem = await CodeForcesApi.getUnsolvedTaskUrlInRange(this.state.userHandle, rating.min, rating.max);
        if (problem) {
          sendMessage<StartProblemTrackerMsg>({
            kind: 'StartProblemTrackerMsg',
            handle: this.state.userHandle,
            problemIndex: problem.index,
            contestId: problem.contestId,
            timerDurationSeconds: 15 * 60
          })
          await createNewTab({url: getProblemUrl(problem)});
        }
      } finally {
        commit('setSelectingProblem', false);
      }
    },
  },
});
