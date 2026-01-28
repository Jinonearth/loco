const createSpatialParser = (function(wkx, wellknown, buffer, isBase64Lib) {

    // Helper to check for different formats
    const isWkt = s => typeof s === 'string' && /^[A-Z]/.test(s) && s.includes('(');
    const isGeoJson = s => typeof s === 'string' && s.startsWith('{');
    const isHex = s => typeof s === 'string' && /^[0-9a-fA-F]+$/.test(s);
    
    // Use is-base64 library for robust Base64 validation
    const isBase64 = s => {
        if (typeof s !== 'string') {
            return false;
        }
        // Exclude WKT and GeoJSON
        if (isWkt(s) || isGeoJson(s)) {
            return false;
        }
        // Exclude pure hex
        if (isHex(cleanupHexPrefix(s))) {
            return false;
        }
        // Use the library function
        return isBase64Lib(s);
    };

    // Format checkers
    const stringFormats = [
        { name: 'GeoJSON', check: isGeoJson },
        { name: 'WKT', check: isWkt }
    ];

    const binaryFormats = [
        { name: 'Hex', check: isHex }
    ];

    /**
     * Checks if string matches any string-based format
     */
    function isStringFormat(s) {
        return stringFormats.some(fmt => fmt.check(s));
    }

    /**
     * Checks if string matches any binary format
     */
    function isBinaryFormat(s) {
        return binaryFormats.some(fmt => fmt.check(s));
    }

    /**
     * Cleans '0x' or '\x' prefixes from a hex string.
     * @param {string} s The string to clean.
     * @returns {string} The cleaned string.
     */
    function cleanupHexPrefix(s) {
        if (typeof s !== 'string') return s;
        if (s.toLowerCase().startsWith('0x')) return s.substring(2).trim();
        if (s.startsWith('\\x')) return s.replace(/\\x/g, '').trim();
        return s;
    }

    /**
     * Prepares the input by decoding Base64 if necessary and determining
     * if the final format is binary (Buffer) or string-based.
     * @param {*} rawInput The initial user input.
     * @returns {{input: Buffer|string, isBinary: boolean}}
     */
    function prepareInput(rawInput) {
        let input = typeof rawInput === 'string' ? rawInput.trim() : rawInput;
        
        if (typeof input !== 'string') {
            throw new Error("Input must be a string.");
        }
        
        // Decode Base64 if needed
        if (isBase64(input)) {
            input = buffer.Buffer.from(input, 'base64');
        }
        
        // Convert Buffer to string if applicable
        let strInput = typeof input === 'string' ? input : input.toString('utf8').trim();
        
        // Clean up hex prefix (after decoding Base64)
        strInput = cleanupHexPrefix(strInput);
        
        // Check string-based formats
        if (isStringFormat(strInput)) {
            return { input: strInput, isBinary: false };
        }
        
        // Check binary formats
        if (isBinaryFormat(strInput)) {
            // For Hex, convert to Buffer
            if (isHex(strInput)) {
                return { input: buffer.Buffer.from(strInput, 'hex'), isBinary: true };
            }
        }
        
        // If still a Buffer, return as binary
        if (buffer && buffer.Buffer.isBuffer(input)) {
            return { input, isBinary: true };
        }
        
        return { input: strInput, isBinary: false };
    }

    /**
     * Parses a spatial data string (WKT, GeoJSON, WKB-hex, WKB-Base64) into a GeoJSON object.
     * @param {*} rawInput The spatial data.
     * @returns {object} A GeoJSON object.
     */
    function parse(rawInput) {
        if (!rawInput) {
            throw new Error("Input cannot be empty.");
        }

        const { input, isBinary } = prepareInput(rawInput);

        let geojson;

        if (isBinary) {
            const geometry = wkx.Geometry.parse(input);
            geojson = geometry.toGeoJSON({ shortCrs: true });
        } else if (typeof input === 'string') {
            if (isGeoJson(input)) {
                geojson = JSON.parse(input);
            } else if (isWkt(input)) {
                geojson = wellknown.parse(input);
            }
        }

        if (!geojson) {
            throw new Error("Could not parse input data into a valid GeoJSON object.");
        }

        return geojson;
    }

    return { 
        parse 
    };
});

// Node.js compatibility
export default createSpatialParser;