<template>
    <v-dialog v-model="dialogVisible" class="custom-dialog" persistent>
        <v-card class="mapSettings">
            <v-card-title>Meeting Place</v-card-title>
            <v-card-actions>
                <v-card-text>
                    <v-card-subtitle>Let's start by find who's meeting</v-card-subtitle>
                    <v-row>
                        <v-col cols="12" sm="6">
                            <v-text-field label="Where are you?" v-model="people[0].address" outlined @keyup.enter="locateLocation(0)">
                                <template v-slot:append>
                                    <v-icon :color="getLocatorIconColor(0)">
                                        {{ getLocatorIcon(0) }}
                                    </v-icon>
                                    <v-btn icon @click="locateLocation(0)">
                                        <v-icon>mdi-map-search</v-icon>
                                    </v-btn>
                                </template>
                            </v-text-field>
                        </v-col>
                        <v-col cols="12" sm="6">
                            <v-text-field label="Where are they?" v-model="people[1].address" outlined
                                @keyup.enter="locateLocation(1)">
                                <template v-slot:append>
                                    <v-icon :color="getLocatorIconColor(1)">
                                        {{ getLocatorIcon(1) }}
                                    </v-icon>
                                    <v-btn icon @click="locateLocation(1)">
                                        <v-icon>mdi-map-search</v-icon>
                                    </v-btn>
                                </template>
                            </v-text-field>
                        </v-col>
                    </v-row>
                    <v-expand-transition>
                        <div v-if="bothLocated">
                            <v-row>
                                <v-col cols="12">
                                    <v-card-subtitle>What are we looking for?</v-card-subtitle>
                                </v-col>
                            </v-row>
                            <v-row>
                                <v-col cols="12" sm="4">
                                    <v-text-field type="number" id="radius" v-model="radius" outlined label="Search Area (m)" dense />
                                </v-col>
                                <v-col cols="12" sm="4">
                                    <v-select v-model="travelMethod" :items="travelOptions" item-title="text" item-value="value"
                                        label="Travel Method" outlined dense></v-select>
                                </v-col>
                                <v-col cols="12" sm="4">
                                    <v-select v-model="locationTypes" :items="locationOptions" item-title="text" item-value="value"
                                        label="Location Type" outlined dense multiple/>
                                </v-col>
                            </v-row>
                        </div>
                    </v-expand-transition>
                </v-card-text>
            </v-card-actions>
        </v-card>
    </v-dialog>
    <div id="map" style="height: 100%; width: 100%;"></div>
</template>

<script>
/* global google */
import axios from 'axios';

export default {
    name: 'MeetingMap',
    props: {},
    data() {
        return {
            zoom: 6,
            center: { lat: 54.0466045367799, lng: -1.8115606773446735 },
            dialogVisible: true,
            map: null,
            people: [
                {
                    name: "You",
                    address: "",
                    lat: 0,
                    lng: 0,
                    located: 'not-located'
                },
                {
                    name: "Them",
                    address: "",
                    lat: 0,
                    lng: 0,
                    located: 'not-located',
                },
            ],
            personMarkerSVG: 'data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" height="25px" width="25px"><title>map-marker-check</title><path d="M12,2C15.86,2 19,5.14 19,9C19,14.25 12,22 12,22C12,22 5,14.25 5,9C5,5.14 8.14,2 12,2M10.47,14L17,7.41L15.6,6L10.47,11.18L8.4,9.09L7,10.5L10.47,14Z" fill="green" /></svg>'),
            peopleMarkers: [],
            radius: 5000,
            travelMethod: null,
            travelOptions: [
                { text: 'Driving', value: 'DRIVING' },
                { text: 'Walking', value: 'WALKING' },
                { text: 'Bicycling', value: 'BICYCLING' },
                { text: 'Public Transport', value: 'TRANSIT' },
            ],
            locationTypes: null,
            locationOptions: [
                { text: 'Theme Park', value: 'amusement_park' },
                { text: 'Aquarium', value: 'aquarium' },
                { text: 'Art Gallery', value: 'art_gallery' },
                { text: 'Bakery', value: 'bakery' },
                { text: 'Pub/Bar', value: 'bar' },
                { text: 'Salon', value: 'beauty_salon' },
                { text: 'Book Shop', value: 'book_store' },
                { text: 'Bowling Alley', value: 'bowling_alley' },
                { text: 'Cafe', value: 'cafe' },
                { text: 'Camping', value: 'campground' },
                { text: 'Casino', value: 'casino' },
                { text: 'Church', value: 'church' },
                { text: 'Gym', value: 'gym' },
                { text: 'Hairdresser', value: 'hair_care' },
                { text: 'Library', value: 'library' },
                { text: 'Accomodation', value: 'lodging' },
                { text: 'Takeaway', value: 'meal_takeaway' },
                { text: 'Cinema', value: 'movie_theater' },
                { text: 'Museum', value: 'museum' },
                { text: 'Night Club', value: 'night_club' },
                { text: 'Park', value: 'park' },
                { text: 'Parking', value: 'parking' },
                { text: 'Restaurant', value: 'restaurant' },
                { text: 'Shopping Mall', value: 'shopping_mall' },
                { text: 'Spa', value: 'spa' },
                { text: 'Stadium', value: 'stadium' },
                { text: 'Tourism', value: 'tourist_attraction' },
                { text: 'Zoo', value: 'zoo' }
            ],
        };
    },
    components: {
    },
    setup() {
    },
    mounted() {
        // Initialize the map
        this.map = new google.maps.Map(document.getElementById('map'), {
            center: this.center,
            zoom: this.zoom,
        });
    },
    methods: {
        openDialog() {
            this.dialogVisible = true;
        },
        getLocatorIconColor(personIndex) {
            if (this.people[personIndex].located === 'not-located') {
                return 'grey';
            } else if (this.people[personIndex].located === 'locating') {
                return 'orange';
            } else if (this.people[personIndex].located === 'found') {
                return 'green';
            } else if (this.people[personIndex].located === 'not-found') {
                return 'red';
            }
        },
        getLocatorIcon(personIndex) {
            if (this.people[personIndex].located === 'not-located') {
                return 'mdi-map-marker-question';
            } else if (this.people[personIndex].located === 'locating') {
                return 'mdi-map-marker-question';
            } else if (this.people[personIndex].located === 'found') {
                return 'mdi-map-marker-check';
            } else if (this.people[personIndex].located === 'not-found') {
                return 'mdi-map-marker-remove';
            }
        },
          async locateLocation(personIndex) {
            // grab out the person we're dealing with
            const person = this.people[personIndex];
            if (person) {
                // say we're locating them
                person.located = 'locating';
                try {
                    // geocode the address, restricted to the UK
                    const response = await axios.get(
                        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
                            person.address
                        )}&components=country:GB&bounds=49.82380908513249,-10.8544921875|59.478568831926395,2.63671875&key=${process.env.VUE_APP_GOOGLE_MAPS_API_KEY}`
                    );

                    const { results } = response.data;
                    console.log(results);
                    if (results.length > 0) {
                        const { lat, lng } = results[0].geometry.location;
                        person.lat = lat;
                        person.lng = lng;
                        person.located = 'found';

                        // add them to the map
                        const marker = new google.maps.Marker({
                            position: { lat: person.lat, lng: person.lng },
                            map: this.map,
                            title: person.name,
                            icon: this.personMarkerSVG,
                        });
                        this.peopleMarkers.push(marker);
                        this.zoomToPeople();
                    } else {
                        person.located = 'not-found';
                        console.log("No results found");
                    }
                } catch (error) {
                    console.error("Error geocoding address:", error);
                }
            }
        },
        zoomToPeople() {
            const bounds = new google.maps.LatLngBounds();
            this.people.forEach(person => {
                if (person.located === 'found') {
                    bounds.extend({ lat: person.lat, lng: person.lng });
                }
            });
            this.map.fitBounds(bounds);

            // Set a maximum zoom level so we don't dissapear into the map
            const maxZoom = 15;
            if (this.map.getZoom() > maxZoom) {
                this.map.setZoom(maxZoom);
            }
        },
    },
    computed: {
        bothLocated() {
            if (this.people.every(person => person.located === 'found')) {
                return true;
            } else {
                return false;
            }
        },
    },
    // add a watcher to console log out the location Types every time the value changes
    watch: {
        locationTypes: {
            handler: function (newVal) {
                console.log("Location Types:", newVal);
            },
            deep: true,
        },
    },
};
</script>

<style scoped>
.mapSettings {
    overflow-y: hidden !important;
}

.custom-dialog {
    border: 1px solid #e0e0e0;
    box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.2);
}
</style>
