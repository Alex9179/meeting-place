<template>
    <v-dialog v-model="editPerson" id="editPersonBox">
        <v-card>
            <v-card-title>Edit Person</v-card-title>
            <v-card-subtitle>Enter the name and address of the person</v-card-subtitle>
            <v-card-text>
                <v-text-field v-model="editingPerson.name" label="Name" :rules="[v => !!v || 'Name is required']"></v-text-field>
                <v-text-field v-model="editingPerson.address" label="Address" :rules="[v => !!v || 'Address is required']"></v-text-field>
            </v-card-text>
            <v-card-actions>
                <v-btn color="success" @click="saveEdit()" :disabled="!editingPerson.name || !editingPerson.address">Save</v-btn>
                <v-btn color="error" @click="cancelEdit()">Cancel</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
    <v-dialog v-model="peopleDialog" id="peopleBox">
        <v-card>
            <v-toolbar dense class="mb-6">
                <v-card-title class="mr-auto">People</v-card-title>
                <v-spacer></v-spacer>
                <v-icon class="mr-6" @click="peopleDialog = false">mdi-close</v-icon>
            </v-toolbar>
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
                        <div class="text-truncate" @click="enableEdit(person)"><b>{{ person.name }}</b></div>
                        <div class="text-truncate" @click="enableEdit(person)">{{ person.address }}</div>
                    </div>
                    <template v-slot:append>
                        <v-btn color="success" icon="mdi-map-marker-plus" variant="text" @click="addPersonToMap(person)"
                            :disabled="person.markerVisible"></v-btn>
                        <v-btn color="warning" icon="mdi-map-marker-minus" variant="text"
                            @click="removePersonFromMap(person)" :disabled="!person.markerVisible"></v-btn>
                        <v-btn color="error" icon="mdi-delete" variant="text" @click="deletePerson(person)"></v-btn>
                    </template>
                    <v-divider></v-divider>
                </v-list-item>
            </v-list>
        </v-card>
    </v-dialog>
    <div id="container">
        <v-slide-x-transition>
            <v-card id="optionsButtons" elevation="0" v-if="optionsVisible" key="options">
                <div class="d-flex align-center">
                    <v-card-actions class="options-icons" @click="methodVisible = !methodVisible">
                        <v-icon class="ml-1">mdi-train-car</v-icon>
                    </v-card-actions>
                    <v-select class="optionSelector" v-model="travelMethod" v-if="methodVisible" :items="travelOptions"
                        label="Travel Method" outlined dense item-title="text" item-value="value"></v-select>
                </div>
                <div class="d-flex align-center">
                    <v-card-actions class="options-icons" @click="radiusVisible = !radiusVisible">
                        <v-icon class="ml-1">mdi-radius-outline</v-icon>
                    </v-card-actions>
                    <v-slider v-model="radius" label="Radius" v-if="radiusVisible" min="1000" max="10000" step="1000"
                        thumb-label thumb-size="20" ticks="always" tick-size="2" tick-thickness="2"
                        tick-color="grey"></v-slider>
                </div>
                <div class="d-flex align-center">
                    <v-card-actions class="options-icons" @click="locationTypeVisible = !locationTypeVisible">
                        <v-icon class="ml-1">mdi-map-marker</v-icon>
                    </v-card-actions>
                    <v-select class="optionSelector" v-model="locationType" v-if="locationTypeVisible"
                        :items="locationOptions" label="Location Type" outlined dense item-title="text"
                        item-value="value"></v-select>
                </div>

            </v-card>
        </v-slide-x-transition>
        <v-card id="mapPanel">
            <v-container>
                <v-row justify="center" align="center">
                    <v-col cols="4" justify="center" align="center" class="panelButtons" @click="peopleDialog = true">
                        <v-icon>mdi-account-group</v-icon>
                        <p>People</p>
                    </v-col>
                    <v-col cols="4" justify="center" align="center" class="panelButtons"
                        @click="optionsVisible = !optionsVisible">
                        <v-icon>mdi-cog</v-icon>
                        <p>Options</p>
                    </v-col>
                    <v-col cols="4" justify="center" align="center" class="panelButtons" @click="resultPanelVisible = true">
                        <v-icon>mdi-map-marker</v-icon>
                        <p>Results</p>
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
            optionsVisible: false,
            methodVisible: false,
            radiusVisible: false,
            locationTypeVisible: false,
            map: null,
            people: [
                {
                    name: "You",
                    address: "Your Address",
                    lat: 0,
                    lng: 0,
                    located: 'not-located',
                    marker: null,
                    markerVisible: true,
                    route: null,
                },
            ],
            personMarkerSVG: 'data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" height="25px" width="25px"><title>map-marker-check</title><path d="M12,2C15.86,2 19,5.14 19,9C19,14.25 12,22 12,22C12,22 5,14.25 5,9C5,5.14 8.14,2 12,2M10.47,14L17,7.41L15.6,6L10.47,11.18L8.4,9.09L7,10.5L10.47,14Z" fill="green" /></svg>'),
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
            editingPerson: null,
            editingPersonindex: null,
            personEditCopy: null,
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

        // Get the user's location
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(function (position) {
                // set this to the first person location
                this.people[0].lat = position.coords.latitude;
                this.people[0].lng = position.coords.longitude;

                // then reverse geocode it to get the address
                axios.get(
                    `https://maps.googleapis.com/maps/api/geocode/json?latlng=${position.coords.latitude},${position.coords.longitude}&key=${process.env.VUE_APP_GOOGLE_MAPS_API_KEY}`
                ).then((response) => {
                    this.people[0].address = response.data.results[0].formatted_address;
                    this.people[0].located = 'found';
                    // add them to the map
                    const marker = new google.maps.Marker({
                        position: { lat: this.people[0].lat, lng: this.people[0].lng },
                        map: this.map,
                        title: this.people[0].name,
                        icon: this.personMarkerSVG,
                    });
                    this.people[0].marker = marker;
                    this.zoomToPeople();
                });

            }.bind(this), function (error) {
                console.error("Error Code = " + error.code + " - " + error.message);
            });
        } else {
            console.log("Geolocation is not supported by this browser.");
        }

    },
    methods: {
        cancelEdit() {
            this.editPerson = false;
            // if they've canceled, and either name or address is empty, rmeove the person
            if (!this.editingPerson.name || !this.editingPerson.address) {
                this.deletePerson(this.editingPerson);
            }
        },
        addPersonToMap(person) {
            // see if they have a marker already, if they do, show it, if not, make one
            if (person.marker) {
                person.marker.setVisible(true);
            } else {
                const marker = new google.maps.Marker({
                    position: { lat: person.lat, lng: person.lng },
                    map: this.map,
                    title: person.name,
                    icon: this.personMarkerSVG,
                });
                person.marker = marker;
            }
            person.markerVisible = true;
            this.zoomToPeople();
            this.calculateMidpoint();
        },
        removePersonFromMap(person) {
            // hide the marker from the map
            person.marker.setVisible(false);
            person.markerVisible = false;
            this.zoomToPeople();

            // if there's only one person left, hide the midpoint
            if (this.people.filter(person => person.markerVisible === true).length < 2 && this.midpointMarker) {
                this.midpointMarker.setVisible(false);
            }
            this.calculateMidpoint();
        },
        async saveEdit() {
            this.editPerson = false;
            // compare the person to the edit copy, if they're different, locate them 
            if (
                this.editingPerson.name !== this.personEditCopy.name ||
                this.editingPerson.address !== this.personEditCopy.address
            ) {
                this.editingPerson.located = 'not-located';
                await this.locateLocation(this.people.indexOf(this.editingPerson));

            }
        },
        enableEdit(person) {
            this.editPerson = true;
            this.editingPerson = person;
            // set the personEditCopy as a non reactive copy of the person
            this.personEditCopy = {
                name: person.name,
                address: person.address,
                located: person.located
            };
            console.log(this.personEditCopy);

        },
        addNewPerson() {
            this.people.push({
                name: "",
                address: "",
                lat: 0,
                lng: 0,
                located: 'not-located',
                marker: null,
                markerVisible: true,
                route: null,
            });
            // then add the edit dialog for this person
            this.editPerson = true;
            this.editingPerson = this.people[this.people.length - 1];
            this.personEditCopy = {
                name: this.editingPerson.name,
                address: this.editingPerson.address,
                located: this.editingPerson.located
            };

        },
        deletePerson(person) {
            const index = this.people.indexOf(person);
            if (index > -1) {
                // Hide the marker from the map if it exists
                if (person.marker) {
                    person.marker.setVisible(false);
                    person.marker.setMap(null);
                    this.marker = null;
                }

                // Remove the person from the people array
                this.people.splice(index, 1);
                this.zoomToPeople();

                // if there's only one person left, hide the midpoint
                if (this.people.filter(person => person.markerVisible === true).length < 2 && this.midpointMarker) {
                    this.midpointMarker.setVisible(false);
                }
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
                        person.marker = marker;
                        this.zoomToPeople();
                        this.calculateMidpoint();
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
                if (person.markerVisible === true) {
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
                this.calculateMidpoint();
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
        calculateMidpoint() {
            // calculate the average latitude and longitude
            const latitudes = this.people
                .filter(person => person.marker && person.markerVisible === true)
                .map(person => person.lat);
            const longitudes = this.people
                .filter(person => person.marker && person.markerVisible === true)
                .map(person => person.lng);
            const averageLatitude = latitudes.reduce((a, b) => a + b, 0) / latitudes.length;
            const averageLongitude = longitudes.reduce((a, b) => a + b, 0) / longitudes.length;

            // check if the average latitude and longitude are valid numbers
            if (isNaN(averageLatitude) || isNaN(averageLongitude)) {
                console.error("Invalid average latitude or longitude");
                return;
            }

            // set the midpoint as the crowsCentre
            this.crowsCentre = {
                lat: averageLatitude,
                lng: averageLongitude,
            };

            // check there is at least 2 people in this.people with a visible marker
            if (this.people.filter(person => person.markerVisible === true).length > 1) {

                // check if there's already a midpointMarker
                if (this.midpointMarker) {
                    // move the existing midpointMarker to the new position
                    this.midpointMarker.setPosition(this.crowsCentre);
                    // make sure it's visible
                    this.midpointMarker.setVisible(true);
                } else {
                    // create a new midpointMarker
                    const marker = new google.maps.Marker({
                        position: this.crowsCentre,
                        map: this.map,
                        title: 'Midpoint',
                    });
                    this.midpointMarker = marker;
                }
            }
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
    watch: {
        people: {
            handler() {
                if (this.people.every(person => person.markerVisible === false)) {
                    if (this.center && (this.map.getZoom() !== this.zoom || !this.map.getCenter().equals(new google.maps.LatLng(this.center.lat, this.center.lng)))) {
                        this.map.setCenter(new google.maps.LatLng(this.center.lat, this.center.lng));
                        this.map.setZoom(this.zoom);
                    }
                }
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

#mapPanel {
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

#optionsButtons {
    position: absolute !important;
    top: 120px;
    margin-left: 15px;
    z-index: 1;
    left: 0;
    background-color: transparent;
}

.panelButtons {
    padding: 10px;
    border: none;
    border-radius: 4px;
    background-color: #7d86dd;
    color: white;
    cursor: pointer;
    transition: background-color 0.3s ease;
}

.panelButtons:hover {
    background-color: #6c75c9;
}

.panelButtons:focus {
    outline: none;
}

.panelButtons:active {
    background-color: #5b63b3;
}

.panelButtons:hover {
    background-color: #6c75c9;
}

.panelButtons:focus {
    outline: none;
}

.panelButtons:active {
    background-color: 7b63b3;
}

.optionSelector {
    background-color: #6c75c9;
    color: white;
    border-radius: 4px;
    margin-left: 10px;
    height: 50px;
    width: 200px;
}

.options-icons {
    background-color: #7d86dd;
    border-radius: 50%;
    padding: 8px;
    margin-bottom: 10px;
    width: 50px;
    height: 50px;
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

.expanding-div {
    background-color: lightblue;
    padding: 20px;
    margin-top: 20px;
}
</style>
