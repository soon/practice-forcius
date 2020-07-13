<template>
  <div class="popup">
    <h1 v-if="$store.state.userHandle">
      Welcome back, {{ $store.state.userHandle }}
    </h1>
    <h1 v-else>
      Checking your handle...
    </h1>

    <div class="levels-btns-list">
      <button
        v-for="level in problemRatingLevels"
        :key="level.title"
        class="problem-level-btn"
        :disabled="$store.state.selectingProblem"
        @click="findProblemWithLevel(level)"
      >
        <fa icon="bolt"/>
        {{ level.title }}
      </button>
    </div>
    <small v-if="$store.state.selectingProblem">Selecting problem...</small>
  </div>
</template>

<script lang="ts">
  import Vue from 'vue';
  import Component from 'vue-class-component';
  import './style.scss';

  @Component
  export default class App extends Vue {
    problemRatingLevels = [
      {title: '1k', range: [750, 1250]},
      {title: '1.5k', range: [1250, 1750]},
      {title: '2k', range: [1750, 2250]},
      {title: '2.5k', range: [2250, 2750]},
      {title: '3k', range: [2750, 3250]},
      {title: '>3k', range: [3250, null]},
    ];

    async created() {
      await this.$store.dispatch('loadCachedDataFromLocalStorage');
      await this.$store.dispatch('requestUserHandle');
    }

    async findProblemWithLevel(level) {
      await this.$store.dispatch('findUnsolvedProblem', {
        rating: {
          min: level.range[0],
          max: level.range[1],
        }
      });
    }
  }
</script>

<style scoped lang="scss">
  h1 {
    text-transform: uppercase;
    margin-block-start: 4px;
    margin-block-end: 8px;
    text-overflow: ellipsis;
    overflow: hidden;
  }

  .popup {
    width: 300px;
    padding: 8px;
  }

  .levels-btns-list {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    margin-left: -4px;
    margin-right: -4px;
  }

  .problem-level-btn {
    flex-grow: 1;
    flex-basis: 86px;
    margin: 4px;
  }
</style>
