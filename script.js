/* =========================================================
   VISHNU SOCIETY NAVIGATION
   CAMPUS GPS + CAMPUS-ONLY DIJKSTRA NAVIGATION
   ========================================================= */


/* =========================================================
   GLOBAL VARIABLES
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

let routeRequestId = 0;

let lastRoutedPosition = null;


/*
   User must move at least this much before
   the route is recalculated.
*/
const REROUTE_DISTANCE_METERS = 20;


/*
   Very poor GPS readings are ignored for
   route recalculation.
*/
const MAX_ACCEPTABLE_GPS_ACCURACY = 100;


/* =========================================================
   CAMPUS LOCATIONS
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
   CAMPUS BOUNDARY
   =========================================================

   This is used as a safety boundary.

   The route is not allowed to use locations
   outside this campus area.

   IMPORTANT:
   These coordinates define the working
   campus area used by this project.
   ========================================================= */

const CAMPUS_BOUNDARY = [

    [16.5698, 81.5198],

    [16.5698, 81.5262],

    [16.5624, 81.5262],

    [16.5624, 81.5198]

];


/* =========================================================
   CAMPUS GRAPH CONNECTIONS
   =========================================================

   IMPORTANT:

   We are NOT automatically connecting every
   location based only on geographical distance.

   Instead, we define campus connections.

   This prevents Dijkstra from creating an
   unrealistic connection through an outside road.

   Each connection is an UNDIRECTED edge.

   Example:

   SVECW <-> Library

   means:

   SVECW -> Library
   Library -> SVECW
   ========================================================= */

const CAMPUS_CONNECTIONS = [

    ["SVECW", "Central Library"],
    ["SVECW", "VIT"],
    ["SVECW", "Food Courts"],
    ["SVECW", "Girls Hostels"],

    ["VIT", "Central Library"],
    ["VIT", "Brewista"],
    ["VIT", "BVR College"],
    ["VIT", "Indian Bank & ATMs"],

    ["Vishnu Dental", "Health Care"],
    ["Vishnu Dental", "Central Library"],

    ["SVCP", "Food Courts"],
    ["SVCP", "Central Library"],
    ["SVCP", "BVR College"],
    ["SVCP", "Vishnu School Bhimavaram"],
    ["SVCP", "VIT"],

    ["BVR College", "Fitness Centre"],
    ["BVR College", "SVCP"],
    ["BVR College", "Brewista"],
    ["BVR College", "Sports Complex"],
    ["BVR College", "VIT"],

    ["Smt. B. Seetha Polytechnic", "Indian Bank & ATMs"],
    ["Smt. B. Seetha Polytechnic", "VIT"],
    ["Smt. B. Seetha Polytechnic", "Boys Hostels"],
    ["Smt. B. Seetha Polytechnic", "Girls Hostels"],
    ["Smt. B. Seetha Polytechnic", "Brewista"],

    ["Vishnu School Bhimavaram", "Food Courts"],
    ["Vishnu School Bhimavaram", "SVCP"],
    ["Vishnu School Bhimavaram", "Central Library"],

    ["VEDIC Lake View", "Swimming Pool"],
    ["VEDIC Lake View", "Fitness Centre"],
    ["VEDIC Lake View", "Sports Complex"],
    ["VEDIC Lake View", "BVR College"],

    ["Boys Hostels", "Girls Hostels"],
    ["Boys Hostels", "Indian Bank & ATMs"],
    ["Boys Hostels", "Smt. B. Seetha Polytechnic"],
    ["Boys Hostels", "SVECW"],

    ["Girls Hostels", "Indian Bank & ATMs"],
    ["Girls Hostels", "SVECW"],
    ["Girls Hostels", "Smt. B. Seetha Polytechnic"],

    ["Sports Complex", "Fitness Centre"],
    ["Sports Complex", "BVR College"],
    ["Sports Complex", "Swimming Pool"],
    ["Sports Complex", "SVCP"],

    ["Food Courts", "SVCP"],
    ["Food Courts", "Vishnu School Bhimavaram"],
    ["Food Courts", "Central Library"],
    ["Food Courts", "SVECW"],
    ["Food Courts", "BVR College"],

    ["Fitness Centre", "BVR College"],
    ["Fitness Centre", "Swimming Pool"],
    ["Fitness Centre", "Sports Complex"],
    ["Fitness Centre", "Brewista"],

    ["Swimming Pool", "Fitness Centre"],
    ["Swimming Pool", "VEDIC Lake View"],
    ["Swimming Pool", "Sports Complex"],
    ["Swimming Pool", "BVR College"],

    ["Central Library", "SVECW"],
    ["Central Library", "SVCP"],
    ["Central Library", "Food Courts"],
    ["Central Library", "VIT"],
    ["Central Library", "Vishnu Dental"],

    ["Indian Bank & ATMs", "Smt. B. Seetha Polytechnic"],
    ["Indian Bank & ATMs", "Boys Hostels"],
    ["Indian Bank & ATMs", "Girls Hostels"],
    ["Indian Bank & ATMs", "VIT"],

    ["Health Care", "Vishnu Dental"],
    ["Health Care", "Central Library"],

    ["Brewista", "VIT"],
    ["Brewista", "BVR College"],
    ["Brewista", "Fitness Centre"],
    ["Brewista", "SVCP"],
    ["Brewista", "Smt. B. Seetha Polytechnic"]

];


/* =========================================================
   PAGE LOAD
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        initializeMap();

        renderCampusCards();

        renderLocationList();

        setupSearch();

        startGPS();

        setTimeout(
            function () {

                const preloader =
                    document.getElementById(
                        "preloader"
                    );

                if (preloader) {

                    preloader.classList.add(
                        "hidden"
                    );

                }

            },
            1500
        );

    }
);


/* =========================================================
   MAP INITIALIZATION
   ========================================================= */

function initializeMap() {

    map =
        L.map(
            "map",
            {
                zoomControl: true
            }
        ).setView(
            [16.5672, 81.5225],
            16
        );


    L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {

            maxZoom: 20,

            attribution:
                "&copy; OpenStreetMap contributors"

        }
    ).addTo(map);


    setTimeout(
        function () {

            map.invalidateSize();

        },
        500
    );

}


/* =========================================================
   CAMPUS CARDS
   ========================================================= */

function renderCampusCards() {

    const container =
        document.getElementById(
            "campusGrid"
        );

    if (!container) return;


    container.innerHTML = "";


    locations.forEach(
        function (location, index) {

            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "campus-card";


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


            container.appendChild(
                card
            );

        }
    );

}


/* =========================================================
   LOCATION LIST
   ========================================================= */

function renderLocationList(
    filteredLocations = locations
) {

    const list =
        document.getElementById(
            "locationList"
        );


    const count =
        document.getElementById(
            "locationCount"
        );


    if (!list) return;


    list.innerHTML = "";


    if (count) {

        count.textContent =
            filteredLocations.length +
            " locations";

    }


    filteredLocations.forEach(
        function (location) {

            const originalIndex =
                locations.indexOf(
                    location
                );


            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "location-item";


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


            list.appendChild(
                item
            );

        }
    );

}


/* =========================================================
   SEARCH
   ========================================================= */

function setupSearch() {

    const search =
        document.getElementById(
            "locationSearch"
        );


    if (!search) return;


    search.addEventListener(
        "input",
        function () {

            const text =
                search.value
                    .trim()
                    .toLowerCase();


            if (!text) {

                renderLocationList(
                    locations
                );

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


            renderLocationList(
                filtered
            );

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
   GPS
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

                handlePosition(
                    position
                );

            },

            function (error) {

                handleGPSError(
                    error
                );

            },

            {

                enableHighAccuracy: true,

                maximumAge: 0,

                timeout: 20000

            }

        );

}


/* =========================================================
   HANDLE GPS POSITION
   ========================================================= */

function handlePosition(position) {

    const lat =
        position.coords.latitude;


    const lng =
        position.coords.longitude;


    const accuracy =
        position.coords.accuracy;


    if (
        !Number.isFinite(lat) ||
        !Number.isFinite(lng) ||
        !Number.isFinite(accuracy)
    ) {

        return;

    }


    currentPosition = {

        lat: lat,

        lng: lng,

        accuracy: accuracy

    };


    locationReady = true;


    const userLatLng =
        L.latLng(
            lat,
            lng
        );


    /* =====================================================
       USER MARKER
       ===================================================== */

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


    /* =====================================================
       ACCURACY CIRCLE
       ===================================================== */

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


    if (
        accuracy >
        MAX_ACCEPTABLE_GPS_ACCURACY
    ) {

        updateGPSStatus(
            "GPS signal weak • accuracy ± " +
            Math.round(accuracy) +
            " m"
        );

    }
    else {

        updateGPSStatus(
            "Navigation active • GPS accuracy ± " +
            Math.round(accuracy) +
            " m"
        );

    }


    const status =
        document.getElementById(
            "locationStatus"
        );


    if (status) {

        status.textContent =
            "Your exact GPS location is active. Choose a destination to navigate.";

    }


    /* =====================================================
       SMART REROUTING
       ===================================================== */

    if (
        selectedDestination &&
        !isRouting &&
        accuracy <= MAX_ACCEPTABLE_GPS_ACCURACY
    ) {

        if (!lastRoutedPosition) {

            calculateRoute(
                selectedDestination
            );

            return;

        }


        const movement =
            haversineDistance(
                lastRoutedPosition.lat,
                lastRoutedPosition.lng,
                lat,
                lng
            );


        if (
            movement >=
            REROUTE_DISTANCE_METERS
        ) {

            calculateRoute(
                selectedDestination
            );

        }

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


    updateGPSStatus(
        message
    );

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
   MY LOCATION
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

            handlePosition(
                position
            );


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

                lastRoutedPosition =
                    null;


                calculateRoute(
                    selectedDestination
                );

            }

        },

        function (error) {

            handleGPSError(
                error
            );


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


    /*
       New destination means a new route.
    */

    lastRoutedPosition =
        null;


    showDestination(
        index
    );


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
   HAVERSINE DISTANCE
   ========================================================= */

function haversineDistance(
    lat1,
    lng1,
    lat2,
    lng2
) {

    const R =
        6371000;


    const dLat =
        (lat2 - lat1) *
        Math.PI / 180;


    const dLng =
        (lng2 - lng1) *
        Math.PI / 180;


    const a =
        Math.sin(dLat / 2) *
        Math.sin(dLat / 2) +

        Math.cos(
            lat1 * Math.PI / 180
        ) *

        Math.cos(
            lat2 * Math.PI / 180
        ) *

        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);


    const c =
        2 *
        Math.atan2(
            Math.sqrt(a),
            Math.sqrt(1 - a)
        );


    return R * c;

}


/* =========================================================
   CAMPUS GRAPH
   ========================================================= */

function createCampusGraph() {

    const graph = [];


    /*
       Create empty adjacency list.
    */

    for (
        let i = 0;
        i < locations.length;
        i++
    ) {

        graph[i] = [];

    }


    /*
       Convert location names into
       graph connections.
    */

    CAMPUS_CONNECTIONS.forEach(
        function (connection) {

            const nameA =
                connection[0];


            const nameB =
                connection[1];


            const indexA =
                locations.findIndex(
                    function (location) {

                        return (
                            location.name ===
                            nameA
                        );

                    }
                );


            const indexB =
                locations.findIndex(
                    function (location) {

                        return (
                            location.name ===
                            nameB
                        );

                    }
                );


            if (
                indexA === -1 ||
                indexB === -1
            ) {

                return;

            }


            const distance =
                haversineDistance(
                    locations[indexA].lat,
                    locations[indexA].lng,
                    locations[indexB].lat,
                    locations[indexB].lng
                );


            /*
               A -> B
            */

            graph[indexA].push({

                node: indexB,

                weight: distance

            });


            /*
               B -> A

               This makes the graph UNDIRECTED.
            */

            graph[indexB].push({

                node: indexA,

                weight: distance

            });

        }
    );


    return graph;

}


/* =========================================================
   DIJKSTRA SHORTEST PATH
   ========================================================= */

function dijkstra(
    graph,
    start,
    target
) {

    const distances =
        new Array(
            graph.length
        ).fill(
            Infinity
        );


    const previous =
        new Array(
            graph.length
        ).fill(
            null
        );


    const visited =
        new Array(
            graph.length
        ).fill(
            false
        );


    distances[start] =
        0;


    for (
        let count = 0;
        count < graph.length;
        count++
    ) {

        let current =
            -1;


        let smallestDistance =
            Infinity;


        /*
           Find the unvisited vertex
           with the smallest distance.
        */

        for (
            let i = 0;
            i < graph.length;
            i++
        ) {

            if (
                !visited[i] &&
                distances[i] <
                smallestDistance
            ) {

                smallestDistance =
                    distances[i];


                current =
                    i;

            }

        }


        if (
            current === -1
        ) {

            break;

        }


        if (
            current === target
        ) {

            break;

        }


        visited[current] =
            true;


        /*
           Relax neighbouring edges.
        */

        graph[current].forEach(
            function (edge) {

                const newDistance =
                    distances[current] +
                    edge.weight;


                if (
                    newDistance <
                    distances[edge.node]
                ) {

                    distances[edge.node] =
                        newDistance;


                    previous[edge.node] =
                        current;

                }

            }
        );

    }


    /*
       Target cannot be reached.
    */

    if (
        distances[target] ===
        Infinity
    ) {

        return {

            distance: Infinity,

            path: []

        };

    }


    /*
       Reconstruct path.
    */

    const path = [];


    let current =
        target;


    while (
        current !== null &&
        current !== -1
    ) {

        path.unshift(
            current
        );


        current =
            previous[current];

    }


    return {

        distance:
            distances[target],

        path:
            path

    };

}


/* =========================================================
   FIND NEAREST CAMPUS LOCATION
   ========================================================= */

function findNearestLocation(
    lat,
    lng
) {

    let nearestIndex =
        -1;


    let nearestDistance =
        Infinity;


    locations.forEach(
        function (location, index) {

            const distance =
                haversineDistance(
                    lat,
                    lng,
                    location.lat,
                    location.lng
                );


            if (
                distance <
                nearestDistance
            ) {

                nearestDistance =
                    distance;


                nearestIndex =
                    index;

            }

        }
    );


    return nearestIndex;

}


/* =========================================================
   POINT INSIDE CAMPUS
   ========================================================= */

function isPointInsideCampus(
    lat,
    lng
) {

    let inside =
        false;


    for (
        let i = 0,
        j = CAMPUS_BOUNDARY.length - 1;

        i < CAMPUS_BOUNDARY.length;

        j = i++
    ) {

        const latI =
            CAMPUS_BOUNDARY[i][0];


        const lngI =
            CAMPUS_BOUNDARY[i][1];


        const latJ =
            CAMPUS_BOUNDARY[j][0];


        const lngJ =
            CAMPUS_BOUNDARY[j][1];


        const intersect =
            (
                (lngI > lng) !==
                (lngJ > lng)
            )
            &&
            (
                lat <
                (
                    (latJ - latI) *
                    (lng - lngI) /
                    (lngJ - lngI) +
                    latI
                )
            );


        if (intersect) {

            inside =
                !inside;

        }

    }


    return inside;

}


/* =========================================================
   CHECK GRAPH PATH
   ========================================================= */

function validateCampusPath(
    path
) {

    if (
        !path ||
        path.length < 1
    ) {

        return false;

    }


    for (
        let i = 0;
        i < path.length;
        i++
    ) {

        const location =
            locations[path[i]];


        if (!location) {

            return false;

        }


        if (
            !isPointInsideCampus(
                location.lat,
                location.lng
            )
        ) {

            return false;

        }

    }


    return true;

}


/* =========================================================
   CALCULATE CAMPUS DIJKSTRA
   ========================================================= */

function calculateDijkstraPath(
    destination
) {

    if (!currentPosition) {

        return null;

    }


    const graph =
        createCampusGraph();


    const startIndex =
        findNearestLocation(
            currentPosition.lat,
            currentPosition.lng
        );


    if (
        startIndex === -1
    ) {

        return null;

    }


    const destinationIndex =
        locations.indexOf(
            destination
        );


    if (
        destinationIndex === -1
    ) {

        return null;

    }


    const result =
        dijkstra(
            graph,
            startIndex,
            destinationIndex
        );


    if (
        !validateCampusPath(
            result.path
        )
    ) {

        return null;

    }


    return {

        startIndex:
            startIndex,

        destinationIndex:
            destinationIndex,

        result:
            result

    };

}


/* =========================================================
   DRAW CAMPUS DIJKSTRA ROUTE
   ========================================================= */

function drawCampusRoute(
    dijkstraData,
    destination
) {

    if (
        !dijkstraData ||
        !dijkstraData.result ||
        !dijkstraData.result.path ||
        dijkstraData.result.path.length === 0
    ) {

        return false;

    }


    const path =
        dijkstraData.result.path;


    const coordinates = [];


    /*
       Start from exact GPS position.
    */

    coordinates.push(
        [
            currentPosition.lat,
            currentPosition.lng
        ]
    );


    /*
       Add every campus graph vertex
       selected by Dijkstra.
    */

    path.forEach(
        function (index) {

            coordinates.push(
                [
                    locations[index].lat,
                    locations[index].lng
                ]
            );

        }
    );


    /*
       Safety check.
    */

    for (
        let i = 1;
        i < coordinates.length;
        i++
    ) {

        if (
            !isPointInsideCampus(
                coordinates[i][0],
                coordinates[i][1]
            )
        ) {

            console.error(
                "Unsafe campus coordinate detected."
            );

            return false;

        }

    }


    clearRouteLayers();


    /*
       Main campus route.
    */

    routeLine =
        L.polyline(
            coordinates,
            {

                color: "#2563eb",

                weight: 7,

                opacity: 0.92,

                lineCap: "round",

                lineJoin: "round"

            }
        )
        .addTo(map);


    /*
       Exact GPS -> nearest campus node.
    */

    const nearestIndex =
        dijkstraData.startIndex;


    const nearestLocation =
        locations[
            nearestIndex
        ];


    connectorLine =
        L.polyline(
            [

                [
                    currentPosition.lat,
                    currentPosition.lng
                ],

                [
                    nearestLocation.lat,
                    nearestLocation.lng
                ]

            ],
            {

                color: "#2563eb",

                weight: 5,

                opacity: 0.85,

                dashArray: "6,8",

                lineCap: "round"

            }
        )
        .addTo(map);


    /*
       Destination marker.
    */

    if (destinationMarker) {

        map.removeLayer(
            destinationMarker
        );

    }


    destinationMarker =
        L.marker(
            [
                destination.lat,
                destination.lng
            ]
        )
        .addTo(map)
        .bindPopup(
            `<b>📍 ${destination.name}</b>`
        );


    /*
       Calculate distance.
    */

    let totalDistance =
        haversineDistance(
            currentPosition.lat,
            currentPosition.lng,
            nearestLocation.lat,
            nearestLocation.lng
        );


    totalDistance +=
        dijkstraData.result.distance;


    let distanceText;


    if (
        totalDistance < 1000
    ) {

        distanceText =
            Math.round(
                totalDistance
            ) +
            " m";

    }
    else {

        distanceText =
            (
                totalDistance / 1000
            ).toFixed(2) +
            " km";

    }


    /*
       Estimate walking time.

       5.1 km/h = approximately
       1.416 m/s.
    */

    const walkingSpeed =
        5.1 * 1000 / 3600;


    const walkingSeconds =
        totalDistance /
        walkingSpeed;


    const walkingMinutes =
        Math.max(
            1,
            Math.ceil(
                walkingSeconds / 60
            )
        );


    let timeText;


    if (
        walkingMinutes < 60
    ) {

        timeText =
            walkingMinutes +
            " min";

    }
    else {

        const hours =
            Math.floor(
                walkingMinutes / 60
            );


        const minutes =
            walkingMinutes % 60;


        timeText =
            hours +
            " hr " +
            minutes +
            " min";

    }


    /*
       Update route panel.
    */

    updateRoutePanel(
        destination,
        "🚶 On Foot • Campus shortest path"
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


    /*
       Fit map to route.
    */

    const bounds =
        L.latLngBounds([]);


    coordinates.forEach(
        function (point) {

            bounds.extend(
                point
            );

        }
    );


    if (
        bounds.isValid()
    ) {

        map.fitBounds(
            bounds,
            {

                padding: [
                    80,
                    80
                ],

                maxZoom: 18

            }
        );

    }


    /*
       Log ADSA result.
    */

    console.log(
        "========== CAMPUS DIJKSTRA =========="
    );


    console.log(
        "Start:",
        locations[
            dijkstraData.startIndex
        ].name
    );


    console.log(
        "Destination:",
        destination.name
    );


    console.log(
        "Shortest campus distance:",
        Math.round(
            dijkstraData.result.distance
        ),
        "meters"
    );


    console.log(
        "Campus path:",
        dijkstraData.result.path.map(
            function (index) {

                return locations[index].name;

            }
        )
    );


    console.log(
        "======================================"
    );


    return true;

}


/* =========================================================
   MAIN ROUTE CALCULATION
   ========================================================= */

async function calculateRoute(
    destination
) {

    if (!currentPosition) {

        updateGPSStatus(
            "Waiting for exact GPS position..."
        );

        return;

    }


    if (!destination) {

        return;

    }


    if (isRouting) {

        return;

    }


    isRouting =
        true;


    const thisRequestId =
        ++routeRequestId;


    updateRoutePanel(
        destination,
        "🚶 On Foot • Finding campus shortest path..."
    );


    try {

        /*
           Check whether GPS position itself
           is inside the campus area.
        */

        const userInsideCampus =
            isPointInsideCampus(
                currentPosition.lat,
                currentPosition.lng
            );


        if (!userInsideCampus) {

            clearRouteLayers();


            updateRoutePanel(
                destination,
                "📍 Your GPS position is outside the campus"
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
                    "--";

            }


            if (timeElement) {

                timeElement.textContent =
                    "--";

            }


            alert(
                "Your current GPS position appears to be outside the Vishnu campus.\n\n" +
                "Please enter the campus before starting campus navigation."
            );


            return;

        }


        /*
           Calculate Dijkstra.
        */

        const dijkstraData =
            calculateDijkstraPath(
                destination
            );


        if (!dijkstraData) {

            throw new Error(
                "No safe campus path found."
            );

        }


        /*
           Make sure this request is
           still the newest request.
        */

        if (
            thisRequestId !==
            routeRequestId
        ) {

            return;

        }


        /*
           DRAW ONLY THE CAMPUS GRAPH ROUTE.

           We intentionally do NOT send the
           destination to Valhalla.

           This prevents Valhalla from choosing
           the highway/public road outside campus.
        */

        const success =
            drawCampusRoute(
                dijkstraData,
                destination
            );


        if (!success) {

            throw new Error(
                "Campus route validation failed."
            );

        }


        /*
           Save position from which this
           route was calculated.
        */

        lastRoutedPosition = {

            lat:
                currentPosition.lat,

            lng:
                currentPosition.lng

        };


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

    catch (error) {

        console.error(
            "CAMPUS ROUTE ERROR:",
            error
        );


        if (
            thisRequestId !==
            routeRequestId
        ) {

            return;

        }


        clearRouteLayers();


        updateRoutePanel(
            destination,
            "🚶 On Foot • Campus route unavailable"
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
                "--";

        }


        if (timeElement) {

            timeElement.textContent =
                "--";

        }

    }

    finally {

        if (
            thisRequestId ===
            routeRequestId
        ) {

            isRouting =
                false;

        }

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


        routeLine =
            null;

    }


    if (connectorLine) {

        map.removeLayer(
            connectorLine
        );


        connectorLine =
            null;

    }

}


/* =========================================================
   CLEAR ROUTE
   ========================================================= */

function clearRoute() {

    /*
       Invalidate old route requests.
    */

    routeRequestId++;


    isRouting =
        false;


    clearRouteLayers();


    if (destinationMarker) {

        map.removeLayer(
            destinationMarker
        );


        destinationMarker =
            null;

    }


    selectedDestination =
        null;


    lastRoutedPosition =
        null;


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

        distance.textContent =
            "--";

    }


    if (time) {

        time.textContent =
            "--";

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

        if (
            gpsWatchId !== null
        ) {

            navigator.geolocation.clearWatch(
                gpsWatchId
            );

        }

    }
);
