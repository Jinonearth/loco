const L = window.L;
let currentLayer = null;

function renderOnMap(map, geojson) {
    if (currentLayer) {
        map.removeLayer(currentLayer);
    }
    
    currentLayer = L.geoJSON(geojson).addTo(map);
    
    const bounds = currentLayer.getBounds();
    if (bounds.isValid()) {
        map.fitBounds(bounds, { maxZoom: 16, padding: [50, 50] });
    }
}

function clearMap(map) {
    if (currentLayer) {
        map.removeLayer(currentLayer);
        currentLayer = null;
    }
}

export const LocoMapRenderer = {
    render: renderOnMap,
    clear: clearMap,
};
