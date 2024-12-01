<template>
  <div id="app">
    <header>
      <h1>Fantasy Football Dashboard</h1>
    </header>
    <main>
      <!-- This is where routed views will load -->
      <router-view v-slot="{ Component }">
        <component :is="Component" />
      </router-view>
    </main>
  </div>
</template>

<script>
export default {
  mounted() {
    console.log('App.vue mounted, router-view should load components.');
  },
};
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  text-align: center;
}
header {
  background: #333;
  color: #fff;
  padding: 1rem;
}
main {
  padding: 1rem;
}
</style>
