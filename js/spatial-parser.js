window.LocoSpatialParser = (function(wkx, wellknown, buffer) {

    function cleanupHexPrefix(s) {
        if (typeof s !== 'string') {
            return s;
        }
        if (s.toLowerCase().startsWith('0x')) {
            return s.substring(2).trim();
        }
        if (s.startsWith('\\x')) {
            return s.replace(/\\x/g, '');
        }
        return s;
    }

    function parse(rawInput) {
        let input = rawInput.trim();
        let geojson;
        let isBinary = false;

        // 1. Handle potential Base64 encoding
        if (!input.startsWith('{') &&
            !input.toLowerCase().startsWith('0x') &&
            !input.startsWith('\\x') &&
            !/^[0-9a-fA-F]+$/.test(input) &&
            /^[A-Za-z0-9+\/]+={0,2}$/.test(input)) {
            
            const bufferData = buffer.Buffer.from(input, 'base64');
            const decodedStr = bufferData.toString('utf8').trim();
            
            const checkStr = cleanupHexPrefix(decodedStr);

            if (checkStr.startsWith('{') || (/^[A-Z]/.test(checkStr) && checkStr.includes('(')) || /^[0-9a-fA-F]+$/.test(checkStr)) {
                input = decodedStr;
            } else {
                input = bufferData;
                isBinary = true;
            }
        }
        
        // 2. Clean up hex prefix if it's a string
        if (!isBinary) {
            input = cleanupHexPrefix(input);
        }

        // 3. Parse to GeoJSON (logic from processInput)
        if (isBinary || (input instanceof Uint8Array || (buffer && buffer.Buffer.isBuffer(input)))) {
            const geometry = wkx.Geometry.parse(input);
            geojson = geometry.toGeoJSON();
        } else if (typeof input === 'string') {
            if (input.startsWith('{')) {
                geojson = JSON.parse(input);
            } else if (/^[0-9a-fA-F]+$/.test(input)) {
                const bufferData = buffer.Buffer.from(input, 'hex');
                const geometry = wkx.Geometry.parse(bufferData);
                geojson = geometry.toGeoJSON();
            } else if (input) { // It's not an empty string
                // Assume WKT
                geojson = wellknown.parse(input);
            }
        }

        if (!geojson) {
            throw new Error("Could not parse input data.");
        }

        return geojson;
    }

    return { 
        parse 
    };

})(window.wkx, window.wellknown, window.buffer);
