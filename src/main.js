import { createApp } from 'vue'
import App from './App.vue'
import vuetify from './plugins/vuetify'
import { loadFonts } from './plugins/webfontloader'
import VueGoogleMaps from '@fawmi/vue-google-maps'

// Load fonts
loadFonts()

// Create Vue application
const app = createApp(App);

// Use Vuetify
app.use(vuetify);

// Use Vue Google Maps
app.use(VueGoogleMaps, {
  load: {
    key: process.env.VUE_APP_GOOGLE_MAPS_API_KEY, // Make sure to use your API key here
    // Add other Google Maps libraries or settings if needed
    // libraries: 'places',
  },
});

// Mount the application
app.mount('#app');
