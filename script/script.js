// JavaScript - Historical Map Viewer

const slider = document.getElementById('year-slider');
const yearDisplay = document.getElementById('year-display');
const resetZoomButton = document.getElementById('reset-zoom');
const canvas = document.getElementById('map-canvas');
const ctx = canvas.getContext('2d');

const loadingScreen = document.getElementById('loading-screen');
const container = document.querySelector('.container');

// Offscreen canvas (for performance optimization)
const offscreenCanvas = document.createElement('canvas');
const offscreenCtx = offscreenCanvas.getContext('2d');

// List of available years
const availableYears = [
    1918, 1919, 1920, 1921, 1922, 1923, 1924, 1925, 1926, 1927, 1928, 1929, 1930,
    1931, 1932, 1933, 1934, 1935, 1936, 1937, 1938, 1939, 1940, 1941, 1942, 1945,
    1946, 1948, 1949, 1950, 1951, 1952, 1953, 1954, 1955, 1956, 1957, 1958, 1959,
    1960, 1961, 1962, 1963, 1964, 1965, 1966, 1967, 1968, 1969, 1970, 1971, 1972,
    1973, 1974, 1975, 1976, 1977, 1978, 1979, 1980, 1981, 1982, 1983, 1984, 1985,
    1986, 1988, 1989, 1990, 1991, 1992, 1993, 1995, 1997, 1998, 1999, 2001, 2003,
    2005, 2007, 2023
];

// Preloaded images and metadata (for performance optimization)
const images = {};
const metadata = {};

// Variables for zoom and pan
let scale = 1;      // Default zoom level
let translateX = 0; // Default pan offset in X
let translateY = 0; // Default pan offset in Y
let isPanning = false;
let startX, startY;

// Function to parse GeoTransform
function parseGeoTransform(geoTransform, imgWidth, imgHeight) {
    const [topLeftX, pixelWidth, , topLeftY, , pixelHeight] = geoTransform
        .split(',')
        .map(Number);

    const minX = topLeftX;
    const maxX = topLeftX + pixelWidth * imgWidth;
    const maxY = topLeftY;
    const minY = topLeftY + pixelHeight * imgHeight;

    return { minX, maxX, minY, maxY };
}

// Load georeferencing data and images
function loadGeoreferencingData() {
    let loadedMaps = 0;

    availableYears.forEach(year => {
        const img = new Image();
        img.src = `maps/Oregon_${year}.png`;

        img.onload = () => {
            images[year] = img;
            console.log(`Map loaded: Oregon_${year}.png`);

            fetch(`maps/Oregon_${year}.png.aux.xml`)
                .then(response => response.text())
                .then(data => {
                    const parser = new DOMParser();
                    const xmlDoc = parser.parseFromString(data, 'text/xml');
                    const geoTransform = xmlDoc.querySelector('GeoTransform').textContent;

                    metadata[year] = parseGeoTransform(geoTransform, img.width, img.height);
                    console.log(`Metadata loaded: Oregon_${year}.png.aux.xml`);

                    loadedMaps++;

                    if (loadedMaps === availableYears.length) {
                        console.log('All maps and metadata loaded.');
                        initializeMap();
                        loadingScreen.style.display = 'none';
                        container.style.display = 'flex';
                    }
                })
                .catch(error => console.error(`Error loading aux.xml for year ${year}:`, error));
        };

        img.onerror = () => {
            console.error(`Error loading image for year ${year}.`);
        };
    });
}

// Draw the map onto the offscreen canvas and copy it to the visible canvas
function drawMap(year) {
    const img = images[year];
    const { minX, maxX, minY, maxY } = metadata[year];
    const { globalMinX, globalMaxX, globalMinY, globalMaxY } = computeGlobalBounds();

    const scaleX = offscreenCanvas.width / (globalMaxX - globalMinX);
    const scaleY = offscreenCanvas.height / (globalMaxY - globalMinY);

    const x = (minX - globalMinX) * scaleX;
    const y = (globalMaxY - maxY) * scaleY;
    const width = (maxX - minX) * scaleX;
    const height = (maxY - minY) * scaleY;

    offscreenCtx.clearRect(0, 0, offscreenCanvas.width, offscreenCanvas.height);
    offscreenCtx.drawImage(img, x, y, width, height);

    ctx.save();
    ctx.setTransform(scale, 0, 0, scale, translateX, translateY);
    ctx.clearRect(-translateX / scale, -translateY / scale, canvas.width / scale, canvas.height / scale);
    ctx.drawImage(offscreenCanvas, 0, 0);
    ctx.restore();
}

// Initialize the map viewer
function initializeMap() {
    const initialYear = availableYears[0];
    yearDisplay.textContent = `Year: ${initialYear}`;
    drawMap(initialYear);

    slider.addEventListener('input', () => {
        const year = availableYears[slider.value];
        yearDisplay.textContent = `Year: ${year}`;
        drawMap(year);
    });

    resetZoomButton.addEventListener('click', () => {
        scale = 1;
        translateX = 0;
        translateY = 0;
        drawMap(availableYears[slider.value]);
    });
}

// Set up canvas dimensions
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
offscreenCanvas.width = canvas.width;
offscreenCanvas.height = canvas.height;

// Load georeferencing data
loadGeoreferencingData();
