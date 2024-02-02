<template>
  <div id="map" style="height: 100%; width: 100%;"></div>
</template>

<script>
/* global google */

import { ref, onMounted } from 'vue';


export default {
  setup() {
    const map = ref(null);

    onMounted(() => {
      // Ensure that the Google Maps API is loaded and available
      if (typeof google === 'undefined') {
        console.error("Google Maps API not available.");
        return;
      }

      // Initialize the map
      map.value = new google.maps.Map(document.getElementById('map'), {
        center: { lat: 37.7749, lng: -122.4194 }, 
        zoom: 10, 
      });
    });

    return { map };
  },
};
</script>