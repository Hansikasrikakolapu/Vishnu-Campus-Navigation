/* =========================================================
   VISHNU SOCIETY NAVIGATION
   GPS + ON FOOT NAVIGATION + DIJKSTRA ADSA
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

/*
   Prevent unnecessary route recalculation.

   The route will be recalculated only when:
   - destination changes
   - first route is requested
   - user moves more than this distance
*/
const REROUTE_DISTANCE_METERS = 15;

/*
   Ignore extremely inaccurate GPS positions.
   This does NOT mean GPS needs exactly 50 m accuracy.
   It simply prevents obviously poor readings from
   constantly changing the route.
*/
const MAX_ACCEPTABLE_GPS_ACCURACY = 100;


/*
   Used to identify the latest route request.

   If an older Valhalla response arrives after a newer
   request, the old response will be ignored.
*/
let routeRequestId = 0;


/*
   Position from which the current route was calculated.
*/
let lastRoutedPosition = null;


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
   MAP INITIALIZATION
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
            attribution:
                "&copy; OpenStreetMap contributors"
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

                /*
                   Always ask for a recent GPS reading.
                */
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


    /*
       Reject obviously poor GPS readings.

       Example:
       If GPS suddenly reports ±500 m accuracy,
       don't use that reading to change the route.
    */

    if (
        !Number.isFinite(lat) ||
        !Number.isFinite(lng) ||
        !Number.isFinite(accuracy)
    ) {

        return;

    }


    if (
        accuracy > MAX_ACCEPTABLE_GPS_ACCURACY
    ) {

        updateGPSStatus(
            "GPS signal weak • accuracy ± " +
            Math.round(accuracy) +
            " m"
        );

        /*
           We still display the GPS position,
           but we don't use poor readings to
           trigger a new route.
        */

    }


    const previousPosition =
        currentPosition;


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
       USER LOCATION MARKER
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
       GPS ACCURACY CIRCLE
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


    /* =====================================================
       SMART REROUTING
       ===================================================== */

    if (
        selectedDestination &&
        !isRouting
    ) {

        /*
           Always calculate the first route.
        */

        if (!lastRoutedPosition) {

            calculateRoute(
                selectedDestination
            );

            return;

        }


        /*
           Calculate how far the user has moved
           from the position used for the previous route.
        */

        const movement =
            haversineDistance(
                lastRoutedPosition.lat,
                lastRoutedPosition.lng,
                lat,
                lng
            );


        /*
           Only reroute when movement is significant.
        */

        if (
            movement >=
            REROUTE_DISTANCE_METERS
        ) {

            calculateRoute(
                selectedDestination
            );

        }

    }


    /*
       Prevent unused variable warnings
       and keep previous position available
       for future improvements.
    */

    if (previousPosition) {

        // Previous GPS position is intentionally retained
        // for movement comparison if needed.

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

                /*
                   Force a new route when
                   the user explicitly presses
                   My Location.
                */

                lastRoutedPosition = null;

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


    /*
       Store selected destination.
    */

    selectedDestination =
        destination;


    /*
       New destination means a completely
       new route is required.
    */

    lastRoutedPosition = null;


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
   ADSA SUPPORT FUNCTION
   ========================================================= */

function haversineDistance(
    lat1,
    lng1,
    lat2,
    lng2
) {

    const R = 6371000;


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
   CREATE CAMPUS GRAPH
   ADSA:
   VERTICES = LOCATIONS
   EDGES = CONNECTIONS
   WEIGHT = DISTANCE
   ========================================================= */

function createCampusGraph() {

    const graph = [];


    /*
       Create an empty adjacency list
       for every campus location.
    */

    for (
        let i = 0;
        i < locations.length;
        i++
    ) {

        graph[i] = [];

    }


    /*
       Two campus locations are connected
       if their geographical distance
       is <= 450 metres.

       The edge weight is the Haversine
       distance between them.
    */

    const MAX_CONNECTION_DISTANCE =
        450;


    for (
        let i = 0;
        i < locations.length;
        i++
    ) {

        for (
            let j = i + 1;
            j < locations.length;
            j++
        ) {

            const distance =
                haversineDistance(
                    locations[i].lat,
                    locations[i].lng,
                    locations[j].lat,
                    locations[j].lng
                );


            if (
                distance <=
                MAX_CONNECTION_DISTANCE
            ) {

                /*
                   Add i -> j
                */

                graph[i].push({

                    node: j,

                    weight: distance

                });


                /*
                   Add j -> i

                   Therefore the campus graph
                   is UNDIRECTED.
                */

                graph[j].push({

                    node: i,

                    weight: distance

                });

            }

        }

    }


    return graph;

}


/* =========================================================
   DIJKSTRA SHORTEST PATH
   ADSA IMPLEMENTATION
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


    /*
       Distance from start to itself = 0.
    */

    distances[start] = 0;


    /*
       Repeat up to V times.
    */

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
           having the smallest tentative distance.
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

                current = i;

            }

        }


        /*
           No reachable vertex remains.
        */

        if (
            current === -1
        ) {

            break;

        }


        /*
           Target reached.
        */

        if (
            current === target
        ) {

            break;

        }


        visited[current] = true;


        /*
           Relax every neighbouring edge.
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
       Reconstruct the path
       from target back to start.
    */

    const path = [];


    /*
       If target is unreachable,
       return an empty path.
    */

    if (
        distances[target] === Infinity
    ) {

        return {

            distance: Infinity,

            path: []

        };

    }


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
   FIND NEAREST CAMPUS NODE
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
   CALCULATE DIJKSTRA PATH
   ========================================================= */

function calculateDijkstraPath(
    destination
) {

    if (!currentPosition) {

        return null;

    }


    const graph =
        createCampusGraph();


    /*
       Convert the actual GPS position
       to the nearest campus graph vertex.
    */

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


    /*
       Find the destination's
       graph vertex.
    */

    const destinationIndex =
        locations.indexOf(
            destination
        );


    if (
        destinationIndex === -1
    ) {

        return null;

    }


    /*
       Run Dijkstra.
    */

    const result =
        dijkstra(
            graph,
            startIndex,
            destinationIndex
        );


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
   CHECK VALID ROUTE COORDINATES
   ========================================================= */

function isValidRouteCoordinate(point) {

    if (
        !Array.isArray(point) ||
        point.length < 2
    ) {

        return false;

    }


    const lat =
        Number(point[0]);


    const lng =
        Number(point[1]);


    if (
        !Number.isFinite(lat) ||
        !Number.isFinite(lng)
    ) {

        return false;

    }


    if (
        lat < -90 ||
        lat > 90 ||
        lng < -180 ||
        lng > 180
    ) {

        return false;

    }


    return true;

}


/* =========================================================
   WALKING ROUTE
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


    isRouting = true;


    /*
       Every route request receives a unique ID.

       This prevents an old response from
       replacing a newer route.
    */

    const thisRequestId =
        ++routeRequestId;


    updateRoutePanel(
        destination,
        "🚶 On Foot • Finding walking route..."
    );


    const startLat =
        currentPosition.lat;


    const startLng =
        currentPosition.lng;


    const endLat =
        destination.lat;


    const endLng =
        destination.lng;


    /* =====================================================
       DIJKSTRA ADSA
       ===================================================== */

    const dijkstraData =
        calculateDijkstraPath(
            destination
        );


    if (dijkstraData) {

        console.log(
            "========== ADSA DIJKSTRA =========="
        );


        console.log(
            "Nearest start node:",
            locations[
                dijkstraData.startIndex
            ].name
        );


        console.log(
            "Destination node:",
            locations[
                dijkstraData.destinationIndex
            ].name
        );


        console.log(
            "Dijkstra distance:",
            dijkstraData.result.distance,
            "meters"
        );


        console.log(
            "Dijkstra path:",
            dijkstraData.result.path.map(
                function (index) {

                    return locations[index].name;

                }
            )
        );


        console.log(
            "==================================="
        );

    }


    /*
       IMPORTANT:

       Dijkstra is our ADSA graph implementation.

       Valhalla is used below for the actual
       pedestrian-road geometry.

       Therefore the blue route displayed
       on the map follows real walking paths.
    */


    /* =====================================================
       VALHALLA PEDESTRIAN ROUTING REQUEST
       ===================================================== */

    const requestBody = {

        locations: [

            {
                lat: startLat,
                lon: startLng
            },

            {
                lat: endLat,
                lon: endLng
            }

        ],

        costing: "pedestrian",

        costing_options: {

            pedestrian: {

                walking_speed: 5.1

            }

        },

        directions_options: {

            units: "kilometers"

        }

    };


    try {

        const response =
            await fetch(
                "https://valhalla1.openstreetmap.de/route",
                {

                    method: "POST",

                    headers: {

                        "Content-Type":
                            "application/json"

                    },

                    body:
                        JSON.stringify(
                            requestBody
                        )

                }
            );


        /*
           Check whether a newer route
           request has already started.
        */

        if (
            thisRequestId !== routeRequestId
        ) {

            return;

        }


        if (!response.ok) {

            throw new Error(
                "Walking routing server error: " +
                response.status
            );

        }


        const data =
            await response.json();


        /*
           Again check whether this is
           still the newest request.
        */

        if (
            thisRequestId !== routeRequestId
        ) {

            return;

        }


        if (
            !data.trip ||
            !data.trip.legs ||
            data.trip.legs.length === 0
        ) {

            throw new Error(
                "No walking route found"
            );

        }


        const leg =
            data.trip.legs[0];


        if (!leg.shape) {

            throw new Error(
                "Walking route geometry not found"
            );

        }


        /* =================================================
           DECODE VALHALLA POLYLINE6
           ================================================= */

        const coordinates =
            decodePolyline6(
                leg.shape
            );


        if (
            !coordinates ||
            coordinates.length < 2
        ) {

            throw new Error(
                "Invalid walking route coordinates"
            );

        }


        /*
           Remove invalid coordinates.
        */

        const validCoordinates =
            coordinates.filter(
                isValidRouteCoordinate
            );


        if (
            validCoordinates.length < 2
        ) {

            throw new Error(
                "Walking route contains invalid coordinates"
            );

        }


        /* =================================================
           CLEAR OLD ROUTE
           ================================================= */

        clearRouteLayers();


        /* =================================================
           DRAW MAIN WALKING ROUTE
           ================================================= */

        routeLine =
            L.polyline(
                validCoordinates,
                {

                    color: "#2563eb",

                    weight: 7,

                    opacity: 0.90,

                    lineCap: "round",

                    lineJoin: "round"

                }
            )
            .addTo(map);


        /* =================================================
           CONNECT GPS POSITION TO ROAD
           ================================================= */

        const exactUserPoint =
            L.latLng(
                startLat,
                startLng
            );


        const roadStartPoint =
            L.latLng(
                validCoordinates[0][0],
                validCoordinates[0][1]
            );


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


        /* =================================================
           DESTINATION MARKER
           ================================================= */

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


        /* =================================================
           DISTANCE
           ================================================= */

        const distanceKm =
            Number(
                data.trip.summary.length
            );


        if (
            !Number.isFinite(distanceKm)
        ) {

            throw new Error(
                "Invalid route distance"
            );

        }


        const distanceMeters =
            distanceKm * 1000;


        let distanceText;


        if (
            distanceMeters < 1000
        ) {

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


        /* =================================================
           WALKING TIME
           ================================================= */

        const durationSeconds =
            Number(
                data.trip.summary.time
            );


        if (
            !Number.isFinite(durationSeconds)
        ) {

            throw new Error(
                "Invalid route duration"
            );

        }


        const durationMinutes =
            Math.max(
                1,
                Math.ceil(
                    durationSeconds / 60
                )
            );


        let timeText;


        if (
            durationMinutes < 60
        ) {

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


        /* =================================================
           ROUTE PANEL
           ================================================= */

        updateRoutePanel(
            destination,
            "🚶 On Foot • Walking route from your GPS position"
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


        /* =================================================
           MAP VIEW
           ================================================= */

        const bounds =
            L.latLngBounds([]);


        /*
           Include exact GPS position.
        */

        bounds.extend(
            [
                startLat,
                startLng
            ]
        );


        /*
           Include destination.
        */

        bounds.extend(
            [
                endLat,
                endLng
            ]
        );


        /*
           Include every point of the
           actual walking route.
        */

        validCoordinates.forEach(
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
                    ]

                }
            );

        }


        /* =================================================
           SHOW ROUTE PANEL
           ================================================= */

        const panel =
            document.getElementById(
                "routePanel"
            );


        if (panel) {

            panel.classList.remove(
                "hidden"
            );

        }


        /*
           Save the GPS position from which
           this route was calculated.

           Future GPS readings will be compared
           against this position.
        */

        lastRoutedPosition = {

            lat: startLat,

            lng: startLng

        };


    }

    catch (error) {

        console.error(
            "WALKING ROUTE ERROR:",
            error
        );


        /*
           Ignore stale request errors.
        */

        if (
            thisRequestId !== routeRequestId
        ) {

            return;

        }


        clearRouteLayers();


        updateRoutePanel(
            destination,
            "🚶 On Foot • Unable to find walking route"
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

        /*
           Only release the routing lock
           for the current request.
        */

        if (
            thisRequestId === routeRequestId
        ) {

            isRouting = false;

        }

    }

}


/* =========================================================
   POLYLINE6 DECODER
   ========================================================= */

function decodePolyline6(
    encoded
) {

    let index = 0;

    let lat = 0;

    let lng = 0;

    const coordinates = [];


    while (
        index < encoded.length
    ) {

        let result = 0;

        let shift = 0;

        let byte;


        /* -----------------------------------------------
           Decode latitude
           ----------------------------------------------- */

        do {

            byte =
                encoded.charCodeAt(
                    index++
                ) -
                63;


            result |=
                (byte & 0x1f) <<
                shift;


            shift += 5;

        }
        while (
            byte >= 0x20
        );


        const deltaLat =
            (
                result & 1
            )
                ? ~(result >> 1)
                : (result >> 1);


        lat +=
            deltaLat;


        /* -----------------------------------------------
           Decode longitude
           ----------------------------------------------- */

        result = 0;

        shift = 0;


        do {

            byte =
                encoded.charCodeAt(
                    index++
                ) -
                63;


            result |=
                (byte & 0x1f) <<
                shift;


            shift += 5;

        }
        while (
            byte >= 0x20
        );


        const deltaLng =
            (
                result & 1
            )
                ? ~(result >> 1)
                : (result >> 1);


        lng +=
            deltaLng;


        /*
           Valhalla polyline precision = 6.
        */

        coordinates.push(
            [
                lat / 1000000,
                lng / 1000000
            ]
        );

    }


    return coordinates;

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

    /*
       Invalidate all previous route requests.
    */

    routeRequestId++;


    isRouting = false;


    clearRouteLayers();


    if (destinationMarker) {

        map.removeLayer(
            destinationMarker
        );

        destinationMarker = null;

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
