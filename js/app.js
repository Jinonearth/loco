window.addEventListener('DOMContentLoaded', (event) => {

    // Dependencies are expected to be loaded globally from index.html
    const L = window.L;
    const LocoSpatialParser = window.LocoSpatialParser;
    const LocoMapRenderer = window.LocoMapRenderer;

    // Map initialization
    const map = L.map('map').setView([37.5665, 126.9780], 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    const dataInput = document.getElementById('dataInput');
    const errorMessage = document.getElementById('errorMessage');
    const clearButton = document.getElementById('clearButton');

    let debounceTimer;

    dataInput.addEventListener('input', function() {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(handleDataInput, 1000);
    });

    function handleDataInput() {
        const input = dataInput.value;
        if (!input.trim()) {
            errorMessage.textContent = '';
            return;
        }

        try {
            errorMessage.textContent = '';
            console.log("Loco Debug: Processing input...");
            const geojson = LocoSpatialParser.parse(input);
            if (geojson) {
                LocoMapRenderer.render(map, geojson);
            }
        } catch (e) {
            console.error("Loco Error:", e);
            let message = e.message;
            if (e.message && /GeometryType \d+ not supported/.test(e.message)) {
                message = 'Unsupported WKB geometry type. Use standard types (Point, LineString, Polygon, etc.).';
            }
            errorMessage.textContent = 'Error: ' + message;
        }
    }

    clearButton.addEventListener('click', function() {
        LocoMapRenderer.clear(map);
        dataInput.value = '';
        errorMessage.textContent = '';
    });
});
