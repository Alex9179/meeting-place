<template>
  <v-app>
    <v-main>
      <MeetingMap/>
    </v-main>
  </v-app>
</template>

<script>
import MeetingMap from './components/MeetingMap.vue'

export default {
  name: 'App',

  components: {
    MeetingMap,
  },

  data: () => ({
    //
  }),
}
</script>
