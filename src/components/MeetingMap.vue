<template>
    <v-dialog v-model="editPerson" id="editPersonBox">
        <v-card>
            <v-card-title>Edit Person</v-card-title>
            <v-card-subtitle>Enter the name and address of the person</v-card-subtitle>
            <v-card-text>
                <v-text-field v-model="editingPerson.name" label="Name"></v-text-field>
                <v-text-field v-model="editingPerson.address" label="Address"></v-text-field>
            </v-card-text>
            <v-card-actions>
                <v-btn color="success" @click="editPerson = false">Save</v-btn>
                <v-btn color="error" @click="editPerson = false">Cancel</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
    <v-dialog v-model="peopleDialog" id="peopleBox">
        <v-card>
            <v-card-title>People</v-card-title>
            <v-card-subtitle color="success" @click="addNewPerson()">Add New Person<v-icon
                    color="success">mdi-plus</v-icon></v-card-subtitle>
            <v-list lines="two">
                <v-list-item v-for="person in people" :key="person.name">
                    <template v-slot:prepend>
                        <v-avatar color="grey-lighten-1">
                            <v-icon color="white">mdi-account</v-icon>
                        </v-avatar>
                    </template>
                    <div>
                        <div @click="enableEdit(person)"><b>{{ person.name }}</b></div>
                        <div @click="enableEdit(person)">{{ person.address }}</div>
                    </div>
                    <template v-slot:append>
                        <v-btn color="success" icon="mdi-map-marker-plus" variant="text"></v-btn>
                        <v-btn color="warning" icon="mdi-map-marker-minus" variant="text"></v-btn>
                        <v-btn color="error" icon="mdi-delete" variant="text" @click="deletePerson(person)"></v-btn>
                    </template>
                    <v-divider></v-divider>
                </v-list-item>
            </v-list>

        </v-card>
    </v-dialog>
    <div id="container">
        <v-card id="options">
            <v-container>
                <v-row justify="center" align="center">
                    <v-col cols="4" justify="center" align="center">
                        <v-btn density="default" @click="this.peopleDialog = true">People</v-btn>
                    </v-col>
                    <v-col cols="4" justify="center" align="center">
                        <v-btn density="default">Options</v-btn>
                    </v-col>
                    <v-col cols="4" justify="center" align="center">
                        <v-btn density="default">Results</v-btn>
                    </v-col>
                </v-row>
            </v-container>
        </v-card>
        <div id="map"></div>
    </div>
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
            crowsCentre: null,
            peopleDialog: false,
            resultPanelVisible: false,
            map: null,
            people: [
                {
                    name: "Rosie",
                    address: "address",
                    lat: 0,
                    lng: 0,
                    located: 'not-located'
                },
                {
                    name: "Wren",
                    address: "address",
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
            resultRoute: null,
            directionsRenderer: null,
            directionsService: null,
            editPerson: false,
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
        enableEdit(person) {
            this.editPerson = true;
            this.editingPerson = person;
            console.log("Edit:", person);
        },
        addNewPerson() {
            this.people.push({
                name: "New Person",
                address: "address",
                lat: 0,
                lng: 0,
                located: 'not-located',
            });
        },
        deletePerson(person) {
            const index = this.people.indexOf(person);
            if (index > -1) {
                this.people.splice(index, 1);
            }
        },
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
        async findMeetingPlaces() {
            this.dialogVisible = false;
            try {
                // find the routes - just take the first one for now
                await this.findRoutes();
                // calculate the midpoint of the route
                await this.calculateMidpoint();
                // show the meeting area and the locations we've found for it
                this.showMeetingArea();
                this.resultPanelVisible = true;
            } catch (error) {
                console.error("Error finding meeting places:", error);
            }
        },
        async findRoutes() {
            // do this in a promise, we can't find the middle until we have the route
            return new Promise((resolve, reject) => {
                // make a nw directions service
                this.directionsService = new google.maps.DirectionsService();
                // make a request with the people and the travel method
                const request = {
                    origin: { lat: this.people[0].lat, lng: this.people[0].lng },
                    destination: { lat: this.people[1].lat, lng: this.people[1].lng },
                    travelMode: this.travelMethod,
                };

                // whack the route on the map
                this.directionsService.route(request, (result, status) => {
                    if (status == google.maps.DirectionsStatus.OK) {
                        this.resultRoute = result;
                        // get a renderer and show the route
                        this.directionsRenderer = new google.maps.DirectionsRenderer({
                            suppressMarkers: true,
                            suppressInfoWindows: true,
                        });
                        this.directionsRenderer.setMap(this.map);
                        this.directionsRenderer.setDirections(result);
                        // tell it we're done here
                        resolve(result);
                    } else {
                        reject(new Error("Failed to find driving route"));
                    }
                });
            });
        },
        async calculateMidpoint() {
            // do it in a promise as we can't find the locations without the mid point
            return new Promise((resolve) => {
                // get the route we're using
                const route = this.resultRoute.routes[0];
                // calculate the total duration of the route, add up each leg and step
                let totalDuration = 0;
                route.legs.forEach(leg => {
                    leg.steps.forEach(step => {
                        totalDuration += step.duration.value;
                    });
                });

                // find the halfway point
                const halfwayDuration = totalDuration / 2;
                let accumulatedDuration = 0;
                let midpoint;
                // run through the route again, adding up the duration until we reach the halfway point
                for (const leg of route.legs) {
                    for (const step of leg.steps) {
                        accumulatedDuration += step.duration.value;
                        if (accumulatedDuration >= halfwayDuration) {
                            const fraction = (halfwayDuration - (accumulatedDuration - step.duration.value)) / step.duration.value;
                            const polyline = google.maps.geometry.encoding.decodePath(step.polyline.points);
                            const index = Math.floor(fraction * (polyline.length - 1));
                            midpoint = polyline[index];
                            break;
                        }
                    }
                    // if we're there, break
                    if (midpoint) break;
                }
                // note the point
                this.crowsCentre = {
                    lat: midpoint.lat(),
                    lng: midpoint.lng(),
                };
                // we're done, crack on
                resolve();
            });
        },
        showMeetingArea() {
            // show a circle around the crowsCentre using the input radius
            this.placesPolygon = new google.maps.Circle({
                strokeColor: "#333333",
                strokeOpacity: 0.8,
                strokeWeight: 1,
                map: this.map,
                center: { lat: this.crowsCentre.lat, lng: this.crowsCentre.lng },
                radius: this.radius,
                // Add shadow options
                shadowColor: "#000000",
                shadowOpacity: 0.3,
                shadowRadius: 5,
                shadowOffset: {
                    width: 5,
                    height: 5,
                },
            });
            this.showMeetingPlaces();
        },
        showMeetingPlaces() {
            this.$refs.mapRef.$mapPromise.then((map) => {
                // fire up a new places service
                const service = new google.maps.places.PlacesService(map);

                // do a search using our midpoint and radius
                service.nearbySearch(
                    {
                        location: { lat: this.crowsCentre.lat, lng: this.crowsCentre.lng },
                        radius: this.radius,
                        type: [this.locationType],
                    },
                    (results, status) => {
                        if (status === google.maps.places.PlacesServiceStatus.OK) {
                            this.placesResults = results;
                            console.log(results);
                            // create a marker with each of them
                            for (let i = 0; i < results.length; i++) {
                                this.createMarker(results[i]);
                            }
                        }
                    }
                );
            });
        },
        createMarker(place) {
            // create a marker for the place with it's name
            this.$refs.mapRef.$mapPromise.then((map) => {
                const marker = new google.maps.Marker({
                    position: place.geometry.location,
                    map: map,
                    title: place.name,
                });

                const infowindow = new google.maps.InfoWindow({
                    content: place.name,
                });

                marker.addListener("click", () => {
                    infowindow.open(map, marker);
                });

                this.placesMarkers.push(marker);

            });
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
        start() {
            if (this.bothLocated && this.travelMethod && this.locationTypes && this.radius) {
                return true;
            } else {
                return false;
            }
        }
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
#container {
    position: relative;
    height: 100%;
    width: 100%;
}

#options {
    position: absolute;
    z-index: 1;
    width: 100%;
    height: 8%;
    align-items: center;
    justify-content: center;
    bottom: 0;
    background-color: #7d86dd;
}

#map {
    height: 100%;
    width: 100%;
}

#peopleBox {
    height: 50%;
    z-index: 1;
}

#editPersonBox {
    height: 50%;
    z-index: 2;
}

@media (min-width: 768px) {
    #peopleBox {
        width: 50%;
    }

    #editPersonBox {
        width: 50%;
    }
    
}

@media (max-width: 767px) {
    #peopleBox {
        width: 90%;
    }

    #editPersonBox {
        width: 90%;
    }
}
</style>