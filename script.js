//CONSTANTS
const TILE_LAYER = 'https://cartocdn-gusc.global.ssl.fastly.net/opmbuilder/api/v1/map/named/opm-mars-basemap-v0-2/all/{z}/{x}/{y}.png';
const DATA1 = 'data/mars-landing-sites.json';
const DATA2 = 'data/opm_mars_contours_200m_polygons.json';
const ICON = L.icon({
    iconUrl: 'lib/images/custom-marker-icon.png',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
});

//FUNCTIONS
//define map and define boundaries
function startMap() {
    const southwest = L.latLng(-85.05112877980659, -180);
    const northeast = L.latLng(85.05112877980659, 180);
    const bounds = L.latLngBounds(southwest, northeast);

    const map = L.map('map', {
        maxBounds: bounds,
        minZoom: 2,
        maxZoom: 10
    }).setView([0, 0], 3);

    return map;
}

//add OpenPlanetaryMap basemap
function addTileLayer(map) {
    L.tileLayer(TILE_LAYER, {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openplanetary.org/opm/">OpenPlanetaryMap</a>'
    }).addTo(map);
}

//fetch landing sites data
async function fetchGeoJSON1() {
    const response = await fetch(DATA1);
    if (!response.ok) {
        throw new Error('Network response was bad.');
    }
    return await response.json();
}

//fetch contour lines polygon data
async function fetchGeoJSON2() {
    const response = await fetch(DATA2);
    if (!response.ok) {
        throw new Error('Network response was bad.');
    }
    return await response.json();
}

//add landing sites data and customize (add popup)
function addLayer1(map, data) {
    L.geoJSON(data, {
        pointToLayer: function (feature, latlng) {
            return L.marker(latlng, {
                icon: ICON,
            });
        },
        onEachFeature: function (feature, layer) {
            layer.bindPopup('<b>Landing Site: </b>' + feature.properties.name + '<br><b>Source: </b>' + feature.properties.note);
        }
    }).addTo(map);
}

//add contour lines data and customize (add transparency)
function addLayer2(map, polygonData) {
    L.geoJSON(polygonData, {
        style: function (feature) {
            return {
                fillColor: 'transparent',
                color: 'transparent',
            };
        }
    }).addTo(map);
}

//fill polygons based on elevation
function fillPolygons(map, polygonData, elevationLevel) {
    //clear previously filled polygons
    map.eachLayer(layer => {
        if (layer instanceof L.Path && layer.options.fillOpacity !== 0) {
            map.removeLayer(layer);
        }
    });

    //filter and fill polygons (lowest to highest elevation)
    polygonData.features.forEach(polygon => {
        const polygonElevation = polygon.properties.elevation; //get the elevation of the current polygon
        if (polygonElevation <= elevationLevel) {
            L.geoJSON(polygon, {
                style: {
                    fillColor: 'blue',
                    color: 'blue',
                    weight: 1,
                    opacity: 0.7,
                    fillOpacity: 0.7
                }
            }).addTo(map);
        }
    });
}

//add scale bar
function addScale(map) {
    L.control.scale({ imperial: true, metric: true }).addTo(map);
}

//add title card
function addTitle(map) {
    const title = L.control({ position: 'topright' });

    title.onAdd = function () {
        const div = L.DomUtil.create('div', 'title-card');
        div.innerHTML = '<h2>Mars Sea Level Simulation</h2><p>Made by Nicholas Cramer</p>';
        return div;
    };

    title.addTo(map);
}

//add toggle button
function addToggle(map, landingSitesLayer) {
    const toggleControl = L.control({ position: 'topleft' });

    toggleControl.onAdd = function () {
        const div = L.DomUtil.create('div', 'toggle-control');
        const button = L.DomUtil.create('button', 'button', div);
        button.textContent = 'Toggle Landing Sites';
        
        //enable button clicking
        button.onclick = function () {
            if (map.hasLayer(landingSitesLayer)) {
                map.removeLayer(landingSitesLayer);
            } else {
                landingSitesLayer.addTo(map);
            }
            button.classList.toggle('pressed'); //toggle the 'pressed' class
        };
        return div;
    };

    toggleControl.addTo(map);
}

//add elevation slider
function addSlider(map, polygonData) {
    const slider = document.getElementById('elevation-slider');
    const elevationDisplay = document.getElementById('elevation-value');

    //set the initial value to minimum
    slider.value = slider.min;

    //event listener for slider input changes
    slider.addEventListener('input', function (event) {
        const elevationLevel = parseInt(event.target.value);
        fillPolygons(map, polygonData, elevationLevel);

        //update the elevation display
        elevationDisplay.textContent = elevationLevel;
    });
}

//convert text to normal case
function toNormalCase(text) {
    return text.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
}

//MAIN EXECUTION
function main() {
    const map = startMap();

    addTileLayer(map);

    fetchGeoJSON1()
        .then(data => {
            const landingSitesLayer = L.geoJSON(data, {
                pointToLayer: function (feature, latlng) {
                    return L.marker(latlng, { icon: ICON });
                },
                onEachFeature: function (feature, layer) {
                    layer.bindPopup('<b>Landing Site: </b>' + feature.properties.name + '<br><b>Source: </b>' + feature.properties.note);
                }
            });

            addToggle(map, landingSitesLayer); //add toggle control
            landingSitesLayer.addTo(map); //add landing sites initially
        })
        .catch(error => {
            console.error('Error fetching GeoJSON:', error);
            //display an error message to the user
            const errorMessage = 'Failed to load GeoJSON data. Sorry!';
            const errorElement = document.getElementById('error-message');
            if (errorElement) {
                errorElement.textContent = errorMessage;
                errorElement.style.display = 'block'; //show the error message
            }
        });

    fetchGeoJSON2()
        .then(data => {
            //add the transparent polygon layer
            addLayer2(map, data);
            //create slider and handle polygon filling
            addSlider(map, data);

            //set initial slider value after adding the event listener
            const slider = document.getElementById('elevation-slider');
            slider.value = slider.min;
        })
        .catch(error => {
            console.error('Error fetching GeoJSON:', error);
            //display an error message to the user
            const errorMessage = 'Failed to load GeoJSON data. Sorry!';
            const errorElement = document.getElementById('error-message');
            if (errorElement) {
                errorElement.textContent = errorMessage;
                errorElement.style.display = 'block'; //show the error message
            }
        });

    addScale(map);
    addTitle(map);
}

//start the application
main();
