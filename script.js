/* =========================================================
   VISHNU SOCIETY NAVIGATION
   Exact GPS Location + Navigation
   ========================================================= */

let map;

let userMarker = null;
let accuracyCircle = null;

let routeLine = null;
let connectorLine = null;

let destinationMarker = null;

let currentPosition = null;
let selectedDestination = null;

let gpsWatchId = null;

let locationReady = false;
let isRouting = false;


/* =========================================================
   LOCATIONS
   ========================================================= */

const locations = [

    {
        name: "SVECW",
        type: "Institution",
        icon: "🎓",
        lat: 16.5672,
        lng: 81.5225
    },

    {
        name: "VIT",
        type: "Institution",
        icon: "🏫",
        lat: 16.5662,
        lng: 81.5235
    },

    {
        name: "Vishnu Dental",
        type: "Institution",
        icon: "🦷",
        lat: 16.5680,
        lng: 81.5208
    },

    {
        name: "SVCP",
        type: "Institution",
        icon: "💊",
        lat: 16.5657,
        lng: 81.5220
    },

    {
        name: "BVR College",
        type: "Institution",
        icon: "📘",
        lat: 16.5648,
        lng: 81.5230
    },

    {
        name: "Smt. B. Seetha Polytechnic",
        type: "Institution",
        icon: "🏫",
        lat: 16.5675,
        lng: 81.5250
    },

    {
        name: "Vishnu School Bhimavaram",
        type: "Institution",
        icon: "🏫",
        lat: 16.5655,
        lng: 81.5205
    },

    {
        name: "VEDIC Lake View",
        type: "Facility",
        icon: "🌊",
        lat: 16.5628,
        lng: 81.5260
    },

    {
        name: "Boys Hostels",
        type: "Hostel",
        icon: "🏠",
        lat: 16.5692,
        lng: 81.5240
    },

    {
        name: "Girls Hostels",
        type: "Hostel",
        icon: "🏠",
        lat: 16.5688,
        lng: 81.5232
    },

    {
        name: "Sports Complex",
        type: "Facility",
        icon: "🏟️",
        lat: 16.5635,
        lng: 81.5225
    },

    {
        name: "Food Courts",
        type: "Facility",
        icon: "🍴",
        lat: 16.5658,
        lng: 81.5215
    },

    {
        name: "Fitness Centre",
        type: "Facility",
        icon: "🏋️",
        lat: 16.5640,
        lng: 81.5235
    },

    {
        name: "Swimming Pool",
        type: "Facility",
        icon: "🏊",
        lat: 16.5638,
        lng: 81.5245
    },

    {
        name: "Central Library",
        type: "Facility",
        icon: "📚",
        lat: 16.5668,
        lng: 81.5222
    },

    {
        name: "Indian Bank & ATMs",
        type: "Facility",
        icon: "🏦",
        lat: 16.5678,
        lng: 81.5245
    },

    {
        name: "Health Care",
        type: "Facility",
        icon: "🏥",
        lat: 16.5682,
        lng: 81.5205
    },

    {
        name: "Brewista",
        type: "Facility",
        icon: "☕",
        lat: 16.5658,
        lng: 81.5240
    }

];


/* =========================================================
   PAGE LOAD
   ========================================================= */

document.addEventListener("DOMContentLoaded", function () {

    initializeMap();

    renderCampusCards();

    renderLocationList();

    setupSearch();

    startGPS();

    setTimeout(function () {

        const preloader =
            document.getElementById("preloader");

        if (preloader) {
            preloader.classList.add("hidden");
        }

    }, 1500);

});


/* =========================================================
   MAP
   ========================================================= */

function initializeMap() {

    map = L.map("map", {
        zoomControl: true
    }).setView(
        [16.5672, 81.5225],
        16
    );

    L.tileLayer(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
        maxZoom: 20,
        attribution: "&copy; OpenStreetMap contributors"
    }
).addTo(map);

    setTimeout(function () {

        map.invalidateSize();

    }, 500);
}


/* =========================================================
   CAMPUS CARDS
   ========================================================= */

function renderCampusCards() {

    const container =
        document.getElementById("campusGrid");

    if (!container) return;

    container.innerHTML = "";

    locations.forEach(function (location, index) {

        const card =
            document.createElement("div");

        card.className = "campus-card";

        card.innerHTML = `

            <div class="campus-icon">
                ${location.icon}
            </div>

            <h3>
                ${location.name}
            </h3>

            <p>
                ${location.type} • Bhimavaram
            </p>

            <div class="campus-buttons">

                <button
                    onclick="showDestination(${index})"
                >
                    View
                </button>

                <button
                    class="navigate-button"
                    onclick="navigateToLocation(${index})"
                >
                    Navigate
                </button>

            </div>
        `;

        container.appendChild(card);

    });

}


/* =========================================================
   LOCATION LIST
   ========================================================= */

function renderLocationList(
    filteredLocations = locations
) {

    const list =
        document.getElementById("locationList");

    const count =
        document.getElementById("locationCount");

    if (!list) return;

    list.innerHTML = "";

    if (count) {

        count.textContent =
            filteredLocations.length +
            " locations";

    }

    filteredLocations.forEach(function (location) {

        const originalIndex =
            locations.indexOf(location);

        const item =
            document.createElement("div");

        item.className = "location-item";

        item.innerHTML = `

            <div class="location-icon">
                ${location.icon}
            </div>

            <div class="location-info">

                <h3>
                    ${location.name}
                </h3>

                <p>
                    ${location.type} • Bhimavaram
                </p>

                <div class="location-buttons">

                    <button
                        onclick="showDestination(${originalIndex})"
                    >
                        View
                    </button>

                    <button
                        onclick="navigateToLocation(${originalIndex})"
                    >
                        Navigate
                    </button>

                </div>

            </div>
        `;

        list.appendChild(item);

    });

}


/* =========================================================
   SEARCH
   ========================================================= */

function setupSearch() {

    const search =
        document.getElementById("locationSearch");

    if (!search) return;

    search.addEventListener(
        "input",
        function () {

            const text =
                search.value
                    .trim()
                    .toLowerCase();

            if (!text) {

                renderLocationList(locations);

                return;
            }

            const filtered =
                locations.filter(
                    function (location) {

                        return (

                            location.name
                                .toLowerCase()
                                .includes(text)

                            ||

                            location.type
                                .toLowerCase()
                                .includes(text)

                        );

                    }
                );

            renderLocationList(filtered);

        }
    );

}


/* =========================================================
   SHOW DESTINATION
   ========================================================= */

function showDestination(index) {

    const location =
        locations[index];

    if (!location) return;

    selectedDestination =
        location;

    const destinationLatLng =
        L.latLng(
            location.lat,
            location.lng
        );

    map.setView(
        destinationLatLng,
        18,
        {
            animate: true
        }
    );

    if (destinationMarker) {

        map.removeLayer(
            destinationMarker
        );

    }

    destinationMarker =
        L.marker(
            destinationLatLng
        )
        .addTo(map)
        .bindPopup(
            `<b>📍 ${location.name}</b>`
        )
        .openPopup();

}


/* =========================================================
   START GPS
   ========================================================= */

function startGPS() {

    if (!navigator.geolocation) {

        updateGPSStatus(
            "GPS is not supported by this browser"
        );

        return;
    }

    updateGPSStatus(
        "Finding your exact location..."
    );

    gpsWatchId =
        navigator.geolocation.watchPosition(

            function (position) {

                handlePosition(position);

            },

            function (error) {

                handleGPSError(error);

            },

            {

                enableHighAccuracy: true,

                maximumAge: 0,

                timeout: 20000

            }

        );

}


/* =========================================================
   HANDLE GPS
   ========================================================= */

function handlePosition(position) {

    const lat =
        position.coords.latitude;

    const lng =
        position.coords.longitude;

    const accuracy =
        position.coords.accuracy;


    currentPosition = {

        lat: lat,
        lng: lng,
        accuracy: accuracy

    };

    locationReady = true;


    const userLatLng =
        L.latLng(lat, lng);


    /* ==============================================
       EXACT USER DOT
       ============================================== */

    if (!userMarker) {

        userMarker =
            L.circleMarker(
                userLatLng,
                {

                    radius: 8,

                    color: "#ffffff",

                    weight: 3,

                    fillColor: "#2563eb",

                    fillOpacity: 1

                }
            )
            .addTo(map);

        userMarker.bindTooltip(
            "📍 You are here",
            {
                permanent: false,
                direction: "top"
            }
        );

    }
    else {

        userMarker.setLatLng(
            userLatLng
        );

    }


    /* ==============================================
       ACCURACY CIRCLE
       ============================================== */

    if (!accuracyCircle) {

        accuracyCircle =
            L.circle(
                userLatLng,
                {

                    radius: accuracy,

                    color: "#2563eb",

                    weight: 2,

                    fillColor: "#3b82f6",

                    fillOpacity: 0.10

                }
            )
            .addTo(map);

    }
    else {

        accuracyCircle.setLatLng(
            userLatLng
        );

        accuracyCircle.setRadius(
            accuracy
        );

    }


    /* ==============================================
       GPS STATUS
       ============================================== */

    updateGPSStatus(
        "Navigation active • GPS accuracy ± " +
        Math.round(accuracy) +
        " m"
    );


    const status =
        document.getElementById(
            "locationStatus"
        );

    if (status) {

        status.textContent =
            "Your exact GPS location is active. Choose a destination to navigate.";

    }


    /* ==============================================
       UPDATE ACTIVE ROUTE
       ============================================== */

    if (
        selectedDestination &&
        !isRouting
    ) {

        calculateRoute(
            selectedDestination
        );

    }

}


/* =========================================================
   GPS ERROR
   ========================================================= */

function handleGPSError(error) {

    let message =
        "Unable to get your location.";

    if (error.code === 1) {

        message =
            "Location permission denied. Allow location access.";

    }

    else if (error.code === 2) {

        message =
            "Location unavailable. Turn on device location.";

    }

    else if (error.code === 3) {

        message =
            "GPS timed out. Trying again...";

    }

    updateGPSStatus(message);

}


/* =========================================================
   GPS STATUS
   ========================================================= */

function updateGPSStatus(message) {

    const gps =
        document.getElementById(
            "gpsStatus"
        );

    if (!gps) return;

    gps.innerHTML = `

        <span class="gps-dot"></span>

        ${message}

    `;

}


/* =========================================================
   MY LOCATION BUTTON
   ========================================================= */

function locateMe() {

    if (!navigator.geolocation) {

        alert(
            "Your browser does not support GPS."
        );

        return;
    }

    updateGPSStatus(
        "Getting your exact location..."
    );

    navigator.geolocation.getCurrentPosition(

        function (position) {

            handlePosition(position);

            const lat =
                position.coords.latitude;

            const lng =
                position.coords.longitude;

            map.setView(
                [lat, lng],
                19,
                {
                    animate: true
                }
            );

            if (userMarker) {

                userMarker
                    .bindPopup(
                        "<b>📍 Your exact current location</b>"
                    )
                    .openPopup();

            }

            if (selectedDestination) {

                calculateRoute(
                    selectedDestination
                );

            }

        },

        function (error) {

            handleGPSError(error);

            alert(
                "Could not find your location.\n\n" +
                "Please allow location permission for this website and try again."
            );

        },

        {

            enableHighAccuracy: true,

            timeout: 30000,

            maximumAge: 0

        }

    );

}


/* =========================================================
   NAVIGATE TO LOCATION
   ========================================================= */

function navigateToLocation(index) {

    const destination =
        locations[index];

    if (!destination) {

        alert(
            "Destination not found."
        );

        return;
    }

    selectedDestination =
        destination;


    showDestination(index);


    const mapSection =
        document.getElementById(
            "map-section"
        );

    if (mapSection) {

        mapSection.scrollIntoView(
            {
                behavior: "smooth"
            }
        );

    }


    if (currentPosition) {

        calculateRoute(
            destination
        );

    }
    else {

        locateMe();

    }

}


/* =========================================================
   CALCULATE ROUTE
   ========================================================= */

async function calculateRoute(destination) {

    if (!currentPosition) {

        updateGPSStatus(
            "Waiting for exact GPS position..."
        );

        return;

    }

    if (!destination) return;

    if (isRouting) return;

    isRouting = true;


    updateRoutePanel(
        destination,
        "Finding route from your exact location..."
    );


    const startLat =
        currentPosition.lat;

    const startLng =
        currentPosition.lng;

    const endLat =
        destination.lat;

    const endLng =
        destination.lng;


    /*
       IMPORTANT

       OSRM snaps the GPS point to the nearest
       routable road.

       We keep the EXACT GPS point visible and
       draw a short connector between the exact
       GPS point and the road route.
    */

   const url =
    "https://router.project-osrm.org/route/v1/driving/" +
    startLng + "," + startLat +
    ";" +
    endLng + "," + endLat +
    "?overview=full&geometries=geojson&steps=true";

    try {

        const response =
            await fetch(url);

        if (!response.ok) {

            throw new Error(
                "Routing server error"
            );

        }


        const data =
            await response.json();


        if (
            data.code !== "Ok" ||
            !data.routes ||
            data.routes.length === 0
        ) {

            throw new Error(
                "No route found"
            );

        }


        const route =
            data.routes[0];


        clearRouteLayers();


        /* =========================================
           ROUTE COORDINATES
           ========================================= */

        const coordinates =
            route.geometry.coordinates.map(
                function (point) {

                    return [
                        point[1],
                        point[0]
                    ];

                }
            );


        /* =========================================
           MAIN ROAD ROUTE
           ========================================= */

        routeLine =
            L.polyline(
                coordinates,
                {

                    color: "#2563eb",

                    weight: 7,

                    opacity: 0.90,

                    lineCap: "round",

                    lineJoin: "round"

                }
            )
            .addTo(map);


        /* =========================================
           EXACT GPS POINT
           ========================================= */

        const exactUserPoint =
            L.latLng(
                startLat,
                startLng
            );


        /*
           OSRM's first route coordinate is the
           point where the road route begins.
        */

        const roadStartPoint =
            L.latLng(
                coordinates[0][0],
                coordinates[0][1]
            );


        /* =========================================
           CONNECT EXACT GPS TO ROAD
           ========================================= */

        connectorLine =
            L.polyline(
                [
                    exactUserPoint,
                    roadStartPoint
                ],
                {

                    color: "#2563eb",

                    weight: 5,

                    opacity: 0.9,

                    dashArray: "6, 8",

                    lineCap: "round"

                }
            )
            .addTo(map);


        /* =========================================
           DESTINATION
           ========================================= */

        if (destinationMarker) {

            map.removeLayer(
                destinationMarker
            );

        }


        destinationMarker =
            L.marker(
                [
                    endLat,
                    endLng
                ]
            )
            .addTo(map)
            .bindPopup(
                `<b>📍 ${destination.name}</b>`
            );


        /* =========================================
           DISTANCE
           ========================================= */

        const distanceMeters =
            route.distance;

        const distanceKm =
            distanceMeters / 1000;


        let distanceText;

        if (distanceKm < 1) {

            distanceText =
                Math.round(
                    distanceMeters
                ) +
                " m";

        }
        else {

            distanceText =
                distanceKm.toFixed(2) +
                " km";

        }


        /* =========================================
           TIME
           ========================================= */

        const durationMinutes =
            Math.ceil(
                route.duration / 60
            );


        let timeText;

        if (durationMinutes < 60) {

            timeText =
                durationMinutes +
                " min";

        }
        else {

            const hours =
                Math.floor(
                    durationMinutes / 60
                );

            const minutes =
                durationMinutes % 60;

            timeText =
                hours +
                " hr " +
                minutes +
                " min";

        }


        /* =========================================
           ROUTE PANEL
           ========================================= */

        updateRoutePanel(
            destination,
            "Route starts from your exact GPS position"
        );


        const distanceElement =
            document.getElementById(
                "routeDistance"
            );

        const timeElement =
            document.getElementById(
                "routeTime"
            );


        if (distanceElement) {

            distanceElement.textContent =
                distanceText;

        }


        if (timeElement) {

            timeElement.textContent =
                timeText;

        }


        /* =========================================
           MAP VIEW
           ========================================= */

        const bounds =
            L.latLngBounds([]);

        bounds.extend(
            [startLat, startLng]
        );

        bounds.extend(
            [endLat, endLng]
        );

        coordinates.forEach(
            function (point) {

                bounds.extend(point);

            }
        );


        map.fitBounds(
            bounds,
            {
                padding: [
                    80,
                    80
                ]
            }
        );


        const panel =
            document.getElementById(
                "routePanel"
            );

        if (panel) {

            panel.classList.remove(
                "hidden"
            );

        }


        isRouting = false;

    }
    catch (error) {

        console.error(
            "ROUTE ERROR:",
            error
        );


        updateRoutePanel(
            destination,
            "Unable to calculate route"
        );


        isRouting = false;

    }

}


/* =========================================================
   ROUTE PANEL
   ========================================================= */

function updateRoutePanel(
    destination,
    status
) {

    const destinationElement =
        document.getElementById(
            "routeDestination"
        );

    const statusElement =
        document.getElementById(
            "routeStatus"
        );


    if (destinationElement) {

        destinationElement.textContent =
            destination.name;

    }


    if (statusElement) {

        statusElement.textContent =
            status;

    }


    const panel =
        document.getElementById(
            "routePanel"
        );


    if (panel) {

        panel.classList.remove(
            "hidden"
        );

    }

}


/* =========================================================
   CLEAR ROUTE LAYERS
   ========================================================= */

function clearRouteLayers() {

    if (routeLine) {

        map.removeLayer(
            routeLine
        );

        routeLine = null;

    }


    if (connectorLine) {

        map.removeLayer(
            connectorLine
        );

        connectorLine = null;

    }

}


/* =========================================================
   CLEAR ROUTE
   ========================================================= */

function clearRoute() {

    clearRouteLayers();


    if (destinationMarker) {

        map.removeLayer(
            destinationMarker
        );

        destinationMarker = null;

    }


    selectedDestination = null;


    const panel =
        document.getElementById(
            "routePanel"
        );

    if (panel) {

        panel.classList.add(
            "hidden"
        );

    }


    const distance =
        document.getElementById(
            "routeDistance"
        );

    const time =
        document.getElementById(
            "routeTime"
        );


    if (distance) {

        distance.textContent = "--";

    }


    if (time) {

        time.textContent = "--";

    }

}


/* =========================================================
   HERO NAVIGATION
   ========================================================= */

function startNavigationFromHero() {

    const mapSection =
        document.getElementById(
            "map-section"
        );


    if (mapSection) {

        mapSection.scrollIntoView(
            {
                behavior: "smooth"
            }
        );

    }


    setTimeout(
        function () {

            locateMe();

        },
        700
    );

}


/* =========================================================
   CLEANUP
   ========================================================= */

window.addEventListener(
    "beforeunload",
    function () {

        if (gpsWatchId !== null) {

            navigator.geolocation.clearWatch(
                gpsWatchId
            );

        }

    }
);