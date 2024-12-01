import { createApp } from 'vue';
import App from './App.vue';
import router from './router'; // Import Vue Router configuration

// Create and mount the Vue app
createApp(App)
  .use(router) // Use Vue Router
  .mount('#app'); // Mount to the `#app` element in index.html
