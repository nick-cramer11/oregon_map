// Load the metadata.json dynamically
fetch('metadata.json')
  .then((response) => {
    if (!response.ok) {
      alert(`Error fetching metadata.json: ${response.status} ${response.statusText}`);
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  })
  .then((metadata) => {
    alert('Successfully loaded metadata.json');
    initializeMap(metadata);
  })
  .catch((error) => {
    alert(`Error loading metadata.json: ${error.message}`);
    console.error('Error loading metadata.json:', error);
  });

function initializeMap(metadata) {
  // Initialize the map
  const map = L.map('map', {
    center: [44.15, -120.514],
    zoom: 7,
  });

  alert('Map initialized successfully');

  // Add a basemap (e.g., OpenStreetMap)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap contributors',
  }).addTo(map);

  alert('Basemap added successfully');

  // Placeholder for the tile layer
  let rasterLayer;

  // Create the slider control
  const slider = L.control({ position: 'topright' });
  slider.onAdd = function () {
    const div = L.DomUtil.create('div', 'slider-container');
    div.innerHTML = `
      <label for="year-slider">Year:</label>
      <input type="range" id="year-slider" min="1918" max="2023" value="1918" step="1">
      <span id="year-label">1918</span>
    `;
    return div;
  };
  slider.addTo(map);

  alert('Slider control added successfully');

  // Event listener for the slider
  const sliderElement = document.getElementById('year-slider');
  const yearLabel = document.getElementById('year-label');

  sliderElement.addEventListener('input', (event) => {
    const selectedYear = parseInt(event.target.value);
    yearLabel.textContent = selectedYear;

    alert(`Year slider changed to ${selectedYear}`);

    // Update the raster layer based on the selected year
    updateRasterLayer(metadata, selectedYear);
  });

  function updateRasterLayer(metadata, year) {
    alert(`Attempting to update raster layer for year ${year}`);
    
    // Find the corresponding metadata entry
    const entry = metadata.find((item) => item.year === year);
    if (!entry) {
      alert(`No metadata entry found for year ${year}`);
      console.error(`No metadata entry found for year ${year}`);
      return;
    }

    alert(`Metadata entry found for year ${year}: ${JSON.stringify(entry)}`);

    // Remove the existing raster layer, if any
    if (rasterLayer) {
      map.removeLayer(rasterLayer);
      alert('Existing raster layer removed');
    }

    // Add the new raster layer using the tile URL
    const tileUrl = `path/to/tiles/${entry.file.replace('.tif', '')}/{z}/{x}/{y}.png`;
    rasterLayer = L.tileLayer(tileUrl, {
      bounds: L.latLngBounds(
        [entry.bbox[1], entry.bbox[0]], // SW corner
        [entry.bbox[3], entry.bbox[2]]  // NE corner
      ),
      maxZoom: 19,
      attribution: `Raster Data © Year ${year}`,
    });

    rasterLayer
      .on('tileerror', (e) => {
        alert(`Tile error: ${e.error.message}`);
        console.error('Tile loading error:', e);
      })
      .addTo(map);

    alert(`Raster layer added successfully for year ${year}`);

    // Fit map to the raster bounds (optional)
    map.fitBounds(rasterLayer.options.bounds);
    alert(`Map bounds updated for year ${year}`);
  }

  // Initialize with the first year's data
  alert(`Initializing map with year ${sliderElement.value}`);
  updateRasterLayer(metadata, parseInt(sliderElement.value));
}
