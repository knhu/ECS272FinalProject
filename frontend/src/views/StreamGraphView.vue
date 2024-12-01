<template>
  <div>
    <h2>Stream Graph</h2>
    <StreamGraph :data="weeklyData" @filter-position="filterPosition" />
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { loadCSV } from '../utils/dataLoader';
import StreamGraph from '../components/StreamGraph.vue';

export default {
  components: { StreamGraph },
  setup() {
    const weeklyData = ref([]);

    onMounted(async () => {
      weeklyData.value = await loadCSV('weekly_player_data.csv');
    });

    const filterPosition = (position) => {
      console.log(`Filtered by position: ${position}`);
      // Future: Drill-down functionality can go here
    };

    return { weeklyData, filterPosition };
  },
};
</script>
