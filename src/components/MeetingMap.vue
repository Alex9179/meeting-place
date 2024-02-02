<template>
    <GMapMap
    :center="center"
    :zoom="zoom"
    map-type-id="terrain"
    style="width: 100%; height: 100%; position: absolute; top: 0; left: 0;"
  ></GMapMap>
</template>

<script>
export default {
  name: 'MeetingMap', 
  props: {
  },
  data() {
    return {
    zoom: 6,
    center: { lat: 54.503624731909646, lng: -5.806912193676821 },
    };
  },
  methods: {
  },
  computed: {
  }
};
</script>

<style scoped>
</style>
