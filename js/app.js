import createSpatialParser from './spatial-parser.js';
import { LocoMapRenderer } from './map-renderer.js';

window.addEventListener('DOMContentLoaded', (event) => {

    // Dependencies are loaded globally from index.html, but we need to pass them to the factory
    const L = window.L;
    const wkx = window.wkx;
    const wellknown = window.wellknown;
    const buffer = window.buffer;

    // A simple isBase64 check for the browser context, since the lib isn't imported here
    const isBase64Browser = (s) => {
        // Basic check from the original implementation
        if (typeof s !== 'string' || s.length % 4 !== 0) return false;
        // Allows for characters used in Base64 encoding
        return /^[A-Za-z0-9+\/]*={0,2}$/.test(s);
    };

    // Initialize the parser by calling the factory function with its dependencies
    const LocoSpatialParser = createSpatialParser(wkx, wellknown, buffer, isBase64Browser);

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
