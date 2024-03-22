<template>
    <v-dialog v-model="editPerson" id="editPersonBox">
        <v-card>
            <v-card-title>Edit Person</v-card-title>
            <v-card-subtitle>Enter the name and address of the person</v-card-subtitle>
            <v-card-text>
                <v-text-field v-model="editingPerson.name" label="Name"
                    :rules="[v => !!v || 'Name is required']"></v-text-field>
                <v-text-field v-model="editingPerson.address" label="Address"
                    :rules="[v => !!v || 'Address is required']"></v-text-field>
                <v-select v-model="editingPerson.travelMethod" :items="travelOptions" label="Travel Method" outlined
                    dense item-title="text" item-value="value">
                </v-select>
            </v-card-text>
            <v-card-actions>
                <v-btn color="success" @click="saveEdit()"
                    :disabled="!editingPerson.name || !editingPerson.address">Save</v-btn>
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
    <v-dialog v-model="resultPanelVisible">
        <v-card>
            <v-card-title>Meeting Places</v-card-title>
            <v-card-subtitle>Places within the radius of the midpoint</v-card-subtitle>
            <v-card-text>
                <v-list>
                    <v-list-item v-for="place in placesResults" :key="place.name">
                        <v-list-item-title>{{ place.name }}</v-list-item-title>
                        <v-list-item-subtitle>{{ place.vicinity }}</v-list-item-subtitle>
                    </v-list-item>
                </v-list>

            </v-card-text>
        </v-card>
    </v-dialog>
    <v-dialog v-model="showSettingsDialog">
        <v-card>
            <v-icon class="ml-auto pa-2" @click="showSettingsDialog = false" size="20">mdi-close</v-icon>
            <v-card-actions v-if="radiusVisible">
                <v-slider v-model="radius" label="Search Radius" min="100" max="10000" step="10" thumb-label
                    thumb-size="20" :ticks="['always']" tick-size="2" tick-thickness="2" tick-color="grey"></v-slider>
            </v-card-actions>
            <v-card-actions v-if="locationTypeVisible">
                <v-select v-model="locationTypes" :items="locationOptions" label="Location Type" outlined dense
                    item-title="text" item-value="value" multiple></v-select>
            </v-card-actions>
        </v-card>
    </v-dialog>
    <v-container fluid class="fill-height">
        <v-row class="flex-container">
            <v-col cols="12" class="map-container">

                <v-snackbar v-model="snackbar" :timeout="snackbarTimeout" top>
                    {{ snackbarText }}
                    <template v-slot:action="{ attrs }">
                        <v-btn color="blue" text v-bind="attrs" @click="snackbar = false">
                            Close
                        </v-btn>
                    </template>
                </v-snackbar>
                <div id="map"></div>
            </v-col>
            <v-col cols="12" class="buttons-container">
                <v-card id="mapPanel">
                    <v-row justify="center" align="center" height="30">
                        <v-col cols="6" justify="center" align="center" class="panelButtons"
                            @click="toggleVisible('radiusVisible')">
                            Radius: {{ smartRadius }}
                        </v-col>
                        <v-col cols="6" justify="center" align="center" class="panelButtons"
                            @click="toggleVisible('locationTypeVisible')">
                            Type Choices: {{ LocationTypeCount }}
                        </v-col>
                    </v-row>
                    <v-row justify="center" align="center" height="70">
                        <v-col cols="4" justify="center" align="center" class="panelButtons"
                            @click="peopleDialog = true">
                            <div style="border-right: 1px solid lightgrey;">
                                <v-icon>mdi-account-group</v-icon>
                                <p>People</p>
                            </div>
                        </v-col>
                        <v-col cols="4" justify="center" align="center" class="panelButtons"
                            @click="showMeetingPlaces()">
                            <div>
                                <v-icon>mdi-map-search</v-icon>
                                <p>Search</p>
                            </div>
                        </v-col>
                        <v-col cols="4" justify="center" align="center" class="panelButtons"
                            @click="resultPanelVisible = true">
                            <div style="border-left: 1px solid lightgrey;">
                                <v-badge color="red" overlap v-if="resultCount > 0">
                                    <template v-slot:badge>
                                        <span class="badge-content">{{ resultCount }}</span>
                                    </template>
                                    <v-icon>mdi-map-marker</v-icon>
                                </v-badge>
                                <v-icon v-else>mdi-map-marker</v-icon>
                                <p>Results</p>
                            </div>
                        </v-col>
                    </v-row>
                </v-card>
                <v-card class="place-info" v-if="showPlaceInfo">
                    <v-row>
                        <v-col cols="2">
                            <v-img src="https://via.placeholder.com/50" :fill="true" class="info-img"></v-img>
                        </v-col>
                        <v-col cols="8">
                            <p>{{ selectedMarker.name }}</p>
                            <v-rating v-model="selectedMarker.rating" :half-increments="true" :readonly="true"
                                density="compact" color="warning"></v-rating>
                        </v-col>
                        <v-col cols="2" id="info-arrow" @click="findRoutes()">
                            <v-icon>mdi-arrow-right</v-icon>
                        </v-col>
                    </v-row>
                    <div class="results-container" v-if="routesFound">
                        <div class="person-details" v-for="(person, index) in people" :key="index">
                            <span>{{ person.name }}</span>
                            <span>{{ person.route.routes[0].legs[0].duration.text }} </span>
                            <span>{{ person.route.routes[0].legs[0].distance.text }}</span>
                        </div>
                    </div>
                </v-card>
            </v-col>
        </v-row>
    </v-container>
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
                    travelMethod: 'DRIVING',
                    marker: null,
                    markerVisible: true,
                    directions: null,
                    routeRenderer: null,
                    route: null,
                    colour: 'blue',
                },
            ],
            personMarkerSVG: 'data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" height="50px" width="50px"><title>map-marker-check</title><path d="M12,2C15.86,2 19,5.14 19,9C19,14.25 12,22 12,22C12,22 5,14.25 5,9C5,5.14 8.14,2 12,2M10.47,14L17,7.41L15.6,6L10.47,11.18L8.4,9.09L7,10.5L10.47,14Z" fill="black" /></svg>'),
            crowMarkerSVG: 'data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" height="50px" width="50px"><title>bullseye</title><path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M12,6A6,6 0 0,0 6,12A6,6 0 0,0 12,18A6,6 0 0,0 18,12A6,6 0 0,0 12,6M12,8A4,4 0 0,1 16,12A4,4 0 0,1 12,16A4,4 0 0,1 8,12A4,4 0 0,1 12,8M12,10A2,2 0 0,0 10,12A2,2 0 0,0 12,14A2,2 0 0,0 14,12A2,2 0 0,0 12,10Z" fill="red"/></svg>'),
            radius: 5000,
            travelMethod: { text: 'Driving', value: 'DRIVING' },
            travelOptions: [
                { text: 'Driving', value: 'DRIVING' },
                { text: 'Walking', value: 'WALKING' },
                { text: 'Bicycling', value: 'BICYCLING' },
                { text: 'Public Transport', value: 'TRANSIT' },
            ],
            locationTypes: [{ text: 'Cafe', value: 'cafe' }],
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
            placesService: null,
            editPerson: false,
            editingPerson: null,
            editingPersonindex: null,
            personEditCopy: null,
            placesMarkers: [],
            placesResults: [],
            showPlaceInfo: false,
            selectedMarker: {
                name: 'Example Name',
                rating: 3.5,
                photos: [],
            },
            showSettingsDialog: false,
            snackbar: false,
            snackbarText: '',
            snackbarTimeout: 3000,
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
            disableDefaultUI: true,
            zoomControl: false,
            mapTypeControl: false,
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
        showResultsPanel() {
            if (this.placesResults.length > 0) {
                this.resultPanelVisible = true;
            } else {
                this.snackbarText = 'Please search for places first';
                this.snackbar = true;
            }
        },
        toggleVisible(flag) {
            this.showSettingsDialog = !this.showSettingsDialog;
            this.radiusVisible = flag === 'radiusVisible';
            this.locationTypeVisible = flag === 'locationTypeVisible';
        },
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
        },
        addNewPerson() {
            this.people.push({
                name: "",
                address: "",
                lat: 0,
                lng: 0,
                located: 'not-located',
                travelMethod: 'DRIVING',
                marker: null,
                markerVisible: true,
                directions: null,
                routeRenderer: null,
                route: null,
                colour: 'blue',
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

                        // replace the fill colour set as 'fill="black"' in the SVG with the person's colour
                        const personMarkerSVG = this.personMarkerSVG.replace('fill="black"', `fill="${person.colour}"`);

                        // add them to the map
                        const marker = new google.maps.Marker({
                            position: { lat: person.lat, lng: person.lng },
                            map: this.map,
                            title: person.name,
                            icon: personMarkerSVG,
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
        // find the routes from each person to the selected place
        findRoutes() {
            // see if we've got a router already, if not make one
            if (!this.directionsService) {
                this.directionsService = new google.maps.DirectionsService();
            }

            // run through each person and find the route, make them a route renderer and show it
            this.people.forEach(person => {
                if (person.located === 'found') {
                    const request = {
                        origin: { lat: person.lat, lng: person.lng },
                        destination: { lat: this.selectedMarker.geometry.location.lat(), lng: this.selectedMarker.geometry.location.lng() },
                        travelMode: person.travelMethod,
                    };

                    this.directionsService.route(request, (result, status) => {
                        if (status === 'OK') {
                            if (person.routeRenderer) {
                                person.routeRenderer.setMap(null);
                            }
                            person.route = result;
                            person.routeRenderer = new google.maps.DirectionsRenderer({
                                map: this.map,
                                directions: result,
                                suppressMarkers: true,
                            });
                        }
                    });
                }
            });
            this.zoomToPeople();
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
                        icon: {
                            url: this.crowMarkerSVG,
                            anchor: new google.maps.Point(25, 25),
                        },
                        draggable: true,
                    });

                    // shift the polygon when the marker is dragged
                    marker.addListener('dragend', () => {
                        this.placesPolygon.setCenter({ lat: marker.getPosition().lat(), lng: marker.getPosition().lng() });
                        this.crowsCentre = { lat: marker.getPosition().lat(), lng: marker.getPosition().lng() };
                    });

                    this.midpointMarker = marker;
                }

                this.showMeetingArea();
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
        },
        showMeetingPlaces() {
            if (this.peopleCount > 1) {
                if (!this.placesService) {
                    // fire up a new places service
                    this.placesService = new google.maps.places.PlacesService(this.map);
                }
                this.placesResults = [];

                // remove anything already there
                this.removePlaces();

                // do a search using our midpoint and radius
                this.placesService.nearbySearch(
                    {
                        location: { lat: this.crowsCentre.lat, lng: this.crowsCentre.lng },
                        radius: this.radius,
                        type: [this.locationTypes],
                    },
                    (results, status) => {
                        if (status === google.maps.places.PlacesServiceStatus.OK) {
                            this.placesResults = results;
                            // create a marker with each of them
                            this.placesResults.forEach(result => {
                                this.createMarker(result);
                            });
                        }
                    }
                );
            } else {
                // do a snackbar here
                this.snackbarText = 'Please add at least 2 people to the map';
                this.snackbar = true;
            }
        },
        removePlaces() {
            this.placesMarkers.forEach(marker => {
                marker.setVisible(false);
                marker.setMap(null);
            });
            this.placesMarkers = [];
        },
        createMarker(place) {
            // create a marker for each place
            const marker = new google.maps.Marker({
                position: place.geometry.location,
                map: this.map,
                title: place.name,
                icon: {
                    url: place.icon,
                    scaledSize: new google.maps.Size(25, 25),
                },
            });

            // add a click listener to the marker
            marker.addListener("click", () => {
                this.selectedMarker = place;
                this.showPlaceInfo = true;
            });

            // add the marker to the placesMarkers array
            this.placesMarkers.push(marker);
        },
    },
    computed: {
        routesFound() {
            return this.people.every(person => person.route);
        },
        smartRadius() {
            if (this.radius < 1000) {
                return `${this.radius}m`;
            } else {
                const roundedRadius = Math.round((this.radius / 1000) * 10) / 10;
                return `${roundedRadius}km`;
            }
        },
        peopleCount() {
            return this.people.length;
        },
        resultCount() {
            return this.placesResults.length;
        },
        noResults() {
            if (this.resultCount === 0) {
                return true;
            } else {
                return false;
            }
        },
        LocationTypeCount() {
            return this.locationTypes.length;
        },
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
        radius(newRadius) {
            if (this.placesPolygon) {
                this.placesPolygon.setRadius(newRadius);
            }
        },
    },
};
</script>

<style scoped>
#mapPanel {
    position: absolute;
    z-index: 1;
    width: 100%;
    height: 15%;
    align-items: center;
    justify-content: center;
    bottom: 0;
    background-color: #62636b;
    border-radius: 0;
    padding: 10px;
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
    height: 70%;
    z-index: 2;
}


.options-icons {
    background-color: #62636b;
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

.panelButtons {
    padding: 10px;
    border: none;
    border-radius: 4px;
    background-color: #62636b;
    color: white;
    cursor: pointer;
    transition: background-color 0.3s ease;
}

.panelButtons:hover {
    background-color: #62636b;
}

.panelButtons:focus {
    outline: none;
}

.panelButtons:active {
    background-color: #7b7c83;
}

.panelButtons:hover {
    background-color: #7b7c83;
}

.panelButtons:focus {
    outline: none;
}

.panelButtons:active {
    background-color: 7b63b3;
}


.options-icons {
    background-color: #62636b;
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

.place-info {
    position: absolute !important;
    z-index: 1;
    transform: translateX(-50%);
    width: 90%;
    height: 10vh;
    margin: 10px;
    left: 50%;
    top: 0;
    right: 0;
    margin-left: auto;
    margin-right: auto;
}

.info-img {
    max-height: 75px;
    max-width: 75px;
}

#info-arrow {
    display: flex;
    justify-content: center;
    align-items: center;
}

.fill-height {
    height: 100vh;
    padding: 0;
    overflow: hidden;
}

.flex-container {
    display: flex;
    flex-direction: column;
    height: 100%;
    padding: 0;
    margin: 0;
    overflow: hidden;
}

.map-container {
    flex-grow: 1;
    flex-shrink: 0;
    max-height: 85vh;
    overflow: hidden;
    padding: 0;
}

.buttons-container {
    flex-grow: 0;
    flex-shrink: 1;
    height: auto;
    padding: 0;
    margin: 0;
    max-height: 15vh;
}

.results-container {
    overflow-x: auto;
    /* Enable horizontal scrolling */
    white-space: nowrap;
    /* Keep items in a single line */
}

.person-details {
    display: inline-flex;
    align-items: center;
    margin-right: 16px;
    /* Space between items */
    /* Additional styling as needed */
}
</style>
