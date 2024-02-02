<template>
<!--     <v-dialog v-model="dialogVisible">
        <v-card>
            <v-card-title>Meeting Place</v-card-title>
            <v-card-text>
                <v-text-field label="Location" v-model="center.lat"></v-text-field>
                <v-text-field label="Location" v-model="center.lng"></v-text-field>
            </v-card-text>
            <v-card-actions>
                <v-btn @click="dialogVisible = false">Close</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog> -->
    <MapComponent />

</template>

<script>
import MapComponent from './MapComponent.vue';

export default {
    name: 'MeetingMap',
    props: {},
    data() {
        return {
            zoom: 6,
            center: { lat: 54.503624731909646, lng: -5.806912193676821 },
            dialogVisible: false,
            map: null,
        };
    },
    components: {
        MapComponent,
    },
};
</script>

<style scoped></style>
