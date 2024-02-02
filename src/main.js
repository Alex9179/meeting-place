import { createApp } from 'vue'
import App from './App.vue'
import vuetify from './plugins/vuetify'
import { loadFonts } from './plugins/webfontloader'
import './global.css';

// Create a script tag
const script = document.createElement('script')

// Set the src attribute with the Google Maps API URL, including your API key
script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.VUE_APP_GOOGLE_MAPS_API_KEY}&libraries=places,drawing,geometry`

// Set async and defer attributes
script.async = true
script.defer = true

// Create a promise that resolves when the script has loaded
const scriptLoaded = new Promise((resolve) => {
  script.addEventListener('load', resolve)
})

// Append the script tag to the head of the document
document.head.appendChild(script)

// Wait for the script to load before creating the Vue app
scriptLoaded.then(() => {
  // Load fonts
  loadFonts()

  // Create Vue application
  const app = createApp(App)

  // Use Vuetify
  app.use(vuetify)

  // Mount the application
  app.mount('#app')
})