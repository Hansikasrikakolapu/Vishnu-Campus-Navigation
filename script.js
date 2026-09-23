/* =========================================================
   VISHNU SOCIETY NAVIGATION
   GPS + OSRM Navigation + ADSA GRAPH + DIJKSTRA
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


/* =========================================================
   LOCATIONS
   These locations are the VERTICES of our graph.
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
   =========================================================
   ADSA GRAPH IMPLEMENTATION
   =========================================================
   =========================================================

   Graph representation:

   Vertex  = Campus location
   Edge    = Connection between two locations
   Weight  = Distance between locations

   We use an ADJACENCY LIST representation.

   Example:

   SVECW
      |
      | distance
      |
   Central Library
      |
      |
     VIT

   Dijkstra's algorithm is then used to find the
   minimum-distance path.
   */


/* =========================================================
   GRAPH CLASS
   ========================================================= */

class Graph {

    constructor() {

        /*
         * Adjacency list.
         *
         * Example:
         *
         * graph.get(0) =
         * [
         *   { node: 1, weight: 150 },
         *   { node: 2, weight: 250 }
         * ]
         */

        this.adjacencyList = new Map();

    }


    /* -----------------------------------------------------
       Add a vertex
       ----------------------------------------------------- */

    addVertex(vertex) {

        if (!this.adjacencyList.has(vertex)) {

            this.adjacencyList.set(
                vertex,
                []
            );

        }

    }


    /* -----------------------------------------------------
       Add an UNDIRECTED weighted edge
       ----------------------------------------------------- */

    addEdge(vertex1, vertex2, weight) {

        this.addVertex(vertex1);
        this.addVertex(vertex2);


        this.adjacencyList
            .get(vertex1)
            .push({
                node: vertex2,
                weight: weight
            });


        this.adjacencyList
            .get(vertex2)
            .push({
                node: vertex1,
                weight: weight
            });

    }


    /* -----------------------------------------------------
       Dijkstra's Shortest Path Algorithm
       ----------------------------------------------------- */

    dijkstra(start, target) {

        const distances = {};
        const previous = {};

        const visited = new Set();


        /*
         * Initialize distances.
         *
         * Distance to source = 0
         * Distance to every other vertex = Infinity
         */

        for (
            const vertex of this.adjacencyList.keys()
        ) {

            distances[vertex] = Infinity;
            previous[vertex] = null;

        }


        distances[start] = 0;


        /*
         * Priority Queue implemented using an array.
         *
         * Each element:
         *
         * {
         *     node: vertex,
         *     distance: current shortest distance
         * }
         */

        const priorityQueue = [

            {
                node: start,
                distance: 0
            }

        ];


        while (priorityQueue.length > 0) {


            /*
             * Find the vertex with the smallest distance.
             */

            priorityQueue.sort(
                function (a, b) {

                    return a.distance - b.distance;

                }
            );


            const current =
                priorityQueue.shift();


            const currentNode =
                current.node;


            if (
                visited.has(currentNode)
            ) {

                continue;

            }


            visited.add(currentNode);


            /*
             * If destination is reached,
             * shortest distance is finalized.
             */

            if (
                currentNode === target
            ) {

                break;

            }


            /*
             * Examine all neighboring vertices.
             */

            const neighbors =
                this.adjacencyList
                    .get(currentNode) || [];


            for (
                const edge of neighbors
            ) {

                if (
                    visited.has(edge.node)
                ) {

                    continue;

                }


                const newDistance =
                    distances[currentNode] +
                    edge.weight;


                /*
                 * Relaxation step.
                 *
                 * If new path is shorter,
                 * update distance and predecessor.
                 */

                if (
                    newDistance <
                    distances[edge.node]
                ) {

                    distances[edge.node] =
                        newDistance;


                    previous[edge.node] =
                        currentNode;


                    priorityQueue.push({

                        node: edge.node,

                        distance: newDistance

                    });

                }

            }

        }


        /*
         * Reconstruct shortest path.
         */

        const path = [];

        let currentNode = target;


        while (
            currentNode !== null
        ) {

            path.unshift(
                currentNode
            );


            currentNode =
                previous[currentNode];

        }


        /*
         * If the source is not connected
         * to the destination.
         */

        if (
            path.length === 0 ||
            path[0] !== start
        ) {

            return {

                distance: Infinity,

                path: []

            };

        }


        return {

            distance:
                distances[target],

            path: path

        };

    }

}


/* =========================================================
   HAVERSINE DISTANCE
   Calculates geographical distance between
   two latitude/longitude coordinates.
   ========================================================= */

function calculateDistance(
    lat1,
    lon1,
    lat2,
    lon2
) {

    const R = 6371000;

    const lat1Rad =
        lat1 * Math.PI / 180;

    const lat2Rad =
        lat2 * Math.PI / 180;


    const deltaLat =
        (lat2 - lat1) *
        Math.PI / 180;

    const deltaLon =
        (lon2 - lon1) *
        Math.PI / 180;


    const a =
        Math.sin(deltaLat / 2) *
        Math.sin(deltaLat / 2) +

        Math.cos(lat1Rad) *
        Math.cos(lat2Rad) *

        Math.sin(deltaLon / 2) *
        Math.sin(deltaLon / 2);


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
   ========================================================= */

function createCampusGraph() {

    const graph =
        new Graph();


    /*
     * Add every campus location as a vertex.
     */

    for (
        let i = 0;
        i < locations.length;
        i++
    ) {

        graph.addVertex(i);

    }


    /*
     * Connect every location to its
     * nearest 3 locations.
     *
     * This creates a realistic weighted
     * campus graph without manually entering
     * every road.
     */

    const numberOfConnections = 3;


    for (
        let i = 0;
        i < locations.length;
        i++
    ) {

        const nearest = [];


        for (
            let j = 0;
            j < locations.length;
            j++
        ) {

            if (i === j) {

                continue;

            }


            const distance =
                calculateDistance(

                    locations[i].lat,
                    locations[i].lng,

                    locations[j].lat,
                    locations[j].lng

                );


            nearest.push({

                index: j,

                distance: distance

            });

        }


        /*
         * Sort by distance.
         */

        nearest.sort(
            function (a, b) {

                return (
                    a.distance -
                    b.distance
                );

            }
        );


        /*
         * Add nearest 3 edges.
         */

        for (
            let k = 0;
            k < Math.min(
                numberOfConnections,
                nearest.length
            );
            k++
        ) {

            graph.addEdge(

                i,

                nearest[k].index,

                nearest[k].distance

            );

        }

    }


    return graph;

}


/* =========================================================
   CREATE GRAPH
   ========================================================= */

const campusGraph =
    createCampusGraph();


/* =========================================================
   FIND NEAREST GRAPH VERTEX
   ========================================================= */

function findNearestLocation(
    latitude,
    longitude
) {

    let nearestIndex = 0;

    let shortestDistance =
        Infinity;


    for (
        let i = 0;
        i < locations.length;
        i++
    ) {

        const distance =
            calculateDistance(

                latitude,
                longitude,

                locations[i].lat,
                locations[i].lng

            );


        if (
            distance <
            shortestDistance
        ) {

            shortestDistance =
                distance;

            nearestIndex =
                i;

        }

    }


    return nearestIndex;

}


/* =========================================================
   RUN DIJKSTRA FOR CURRENT NAVIGATION
   ========================================================= */

function runDijkstra(
    destination
) {

    if (!currentPosition) {

        return null;

    }


    /*
     * The user's GPS position is not necessarily
     * one of our campus vertices.
     *
     * Therefore we find the nearest campus vertex.
     */

    const startVertex =
        findNearestLocation(

            currentPosition.lat,
            currentPosition.lng

        );


    const destinationVertex =
        locations.indexOf(
            destination
        );


    if (
        destinationVertex === -1
    ) {

        return null;

    }


    /*
     * Run Dijkstra.
     */

    const result =
        campusGraph.dijkstra(

            startVertex,

            destinationVertex

        );


    /*
     * Console output is useful for
     * demonstrating the ADSA implementation.
     */

    console.log(
        "========== ADSA DIJKSTRA =========="
    );


    console.log(
        "Source Vertex:",
        locations[startVertex].name
    );


    console.log(
        "Destination Vertex:",
        destination.name
    );


    console.log(
        "Shortest Distance:",
        result.distance.toFixed(2),
        "meters"
    );


    console.log(
        "Shortest Path:"
    );


    console.log(

        result.path
            .map(
                function (index) {

                    return locations[index].name;

                }
            )
            .join(" → ")

    );


    console.log(
        "===================================="
    );


    return result;

}


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
   MAP
   ========================================================= */

function initializeMap() {

    map =
        L.map("map", {

            zoomControl: true

        })
        .setView(

            [
                16.5672,
                81.5225
            ],

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


    if (!container) {

        return;

    }


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


            container.appendChild(card);

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


    if (!list) {

        return;

    }


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


            list.appendChild(item);

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


    if (!search) {

        return;

    }


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


    if (!location) {

        return;

    }


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
   HANDLE GPS
   ========================================================= */

function handlePosition(
    position
) {

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
        L.latLng(
            lat,
            lng
        );


    /* -----------------------------------------------------
       EXACT USER DOT
       ----------------------------------------------------- */

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


    /* -----------------------------------------------------
       ACCURACY CIRCLE
       ----------------------------------------------------- */

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


    /* -----------------------------------------------------
       GPS STATUS
       ----------------------------------------------------- */

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


    /* -----------------------------------------------------
       UPDATE ACTIVE ROUTE
       ----------------------------------------------------- */

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

function handleGPSError(
    error
) {

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

function updateGPSStatus(
    message
) {

    const gps =
        document.getElementById(
            "gpsStatus"
        );


    if (!gps) {

        return;

    }


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

function navigateToLocation(
    index
) {

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


    showDestination(
        index
    );


    const mapSection =
        document.getElementById(
            "map-section"
        );


    if (mapSection) {

        mapSection.scrollIntoView({

            behavior: "smooth"

        });

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


    updateRoutePanel(

        destination,

        "Finding shortest path..."

    );


    /*
     * =====================================================
     * ADSA PART
     * =====================================================
     *
     * First run Dijkstra on our campus graph.
     *
     * This is the actual ADSA graph algorithm.
     */

    const dijkstraResult =
        runDijkstra(
            destination
        );


    /*
     * Display Dijkstra information in console.
     *
     * This does not interfere with the
     * actual OSRM road route.
     */

    if (
        dijkstraResult &&
        dijkstraResult.path.length > 0
    ) {

        console.log(
            "ADSA shortest path successfully calculated."
        );

    }


    /* =====================================================
       REAL GPS + OSRM ROUTING
       ===================================================== */

    const startLat =
        currentPosition.lat;


    const startLng =
        currentPosition.lng;


    const endLat =
        destination.lat;


    const endLng =
        destination.lng;


    /*
     * OSRM snaps GPS position to the nearest
     * routable road.
     *
     * Exact GPS point is still displayed.
     */

    const url =

        "https://router.project-osrm.org/route/v1/driving/" +

        startLng +
        "," +
        startLat +

        ";" +

        endLng +
        "," +
        endLat +

        "?overview=full&geometries=geojson&steps=true";


    try {

        const response =
            await fetch(
                url
            );


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


        /* =================================================
           ROUTE COORDINATES
           ================================================= */

        const coordinates =
            route.geometry.coordinates.map(

                function (point) {

                    return [

                        point[1],

                        point[0]

                    ];

                }

            );


        /* =================================================
           MAIN ROAD ROUTE
           ================================================= */

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


        /* =================================================
           EXACT GPS POINT
           ================================================= */

        const exactUserPoint =
            L.latLng(

                startLat,

                startLng

            );


        const roadStartPoint =
            L.latLng(

                coordinates[0][0],

                coordinates[0][1]

            );


        /* =================================================
           CONNECT GPS TO ROAD
           ================================================= */

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
           DESTINATION
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


        /* =================================================
           TIME
           ================================================= */

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


        /* =================================================
           ROUTE PANEL
           ================================================= */

        let statusText =
            "Route starts from your exact GPS position";


        /*
         * Add ADSA information to the status
         * without changing your existing UI structure.
         */

        if (
            dijkstraResult &&
            dijkstraResult.path.length > 0
        ) {

            statusText +=
                " • Dijkstra shortest path calculated";

        }


        updateRoutePanel(

            destination,

            statusText

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


        bounds.extend(

            [

                startLat,

                startLng

            ]

        );


        bounds.extend(

            [

                endLat,

                endLng

            ]

        );


        coordinates.forEach(

            function (point) {

                bounds.extend(
                    point
                );

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

        mapSection.scrollIntoView({

            behavior: "smooth"

        });

    }


    setTimeout(

        function () {

            locateMe();

        },

        700

    );

}


/* =========================================================
   ADSA DEBUG FUNCTION
   =========================================================
   
   You can call this from the browser console:

   showGraph();

   It prints all graph vertices and edges.

   This is useful when demonstrating your
   ADSA implementation to your professor.
   ========================================================= */

function showGraph() {

    console.log(
        "========== VISHNU CAMPUS GRAPH =========="
    );


    for (
        const [
            vertex,
            edges
        ]
        of campusGraph.adjacencyList
    ) {

        console.log(

            locations[vertex].name +
            " → " +

            edges
                .map(
                    function (edge) {

                        return (

                            locations[edge.node].name +

                            " (" +

                            edge.weight.toFixed(1) +

                            " m)"

                        );

                    }
                )
                .join(", ")

        );

    }


    console.log(
        "=========================================="
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
