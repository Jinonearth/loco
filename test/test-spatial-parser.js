import wkx from 'wkx';
import * as wellknown from 'wellknown';
import { Buffer } from 'buffer';
import isBase64Lib from 'is-base64';
import createSpatialParser from '../js/spatial-parser.js';

const { parse } = createSpatialParser(wkx, wellknown, { Buffer }, isBase64Lib);

// Simple assert function
function assert(condition, message) {
    if (!condition) {
        throw new Error(`Assertion failed: ${message}`);
    }
}

function assertEqual(actual, expected, message) {
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
        throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}: ${message}`);
    }
}

// Tests
const tests = [
    {
        name: 'WKT Point',
        run: () => {
            const result = parse('POINT (1 1)');
            assert(result.type === 'Point', 'Should parse WKT Point');
            assertEqual(result.coordinates, [1, 1], 'Point coordinates should be [1, 1]');
        }
    },
    {
        name: 'WKT LineString',
        run: () => {
            const result = parse('LINESTRING (0 0, 1 1, 2 2)');
            assert(result.type === 'LineString', 'Should parse WKT LineString');
            assert(result.coordinates.length === 3, 'LineString should have 3 points');
        }
    },
    {
        name: 'GeoJSON Point',
        run: () => {
            const result = parse('{"type":"Point","coordinates":[2,3]}');
            assert(result.type === 'Point', 'Should parse GeoJSON Point');
            assertEqual(result.coordinates, [2, 3], 'GeoJSON coordinates should match');
        }
    },
    {
        name: 'GeoJSON Feature',
        run: () => {
            const result = parse('{"type":"Feature","geometry":{"type":"Point","coordinates":[1,1]},"properties":{}}');
            assert(result.type === 'Feature', 'Should parse GeoJSON Feature');
            assert(result.geometry.type === 'Point', 'Feature geometry should be Point');
        }
    },
    {
        name: 'Hex WKB Point',
        run: () => {
            const result = parse('0101000000000000000000f03f000000000000f03f');
            assert(result.type === 'Point', 'Should parse Hex WKB Point');
            assertEqual(result.coordinates, [1, 1], 'Hex WKB coordinates should be [1, 1]');
        }
    },
    {
        name: 'Hex WKB with 0x prefix',
        run: () => {
            const result = parse('0x0101000000000000000000f03f000000000000f03f');
            assert(result.type === 'Point', 'Should parse Hex WKB with 0x prefix');
            assertEqual(result.coordinates, [1, 1], 'Coordinates should be [1, 1]');
        }
    },
    {
        name: 'Base64 WKB Point',
        run: () => {
            // Correct Base64 encoding of Point(1, 1)
            const hexPoint = '0101000000000000000000f03f000000000000f03f';
            const buffer = Buffer.from(hexPoint, 'hex');
            const base64Point = buffer.toString('base64');
            const result = parse(base64Point);
            assert(result.type === 'Point', 'Should parse Base64 WKB Point');
            assertEqual(result.coordinates, [1, 1], 'Base64 WKB coordinates should be [1, 1]');
        }
    },
    {
        name: 'Base64 encoded WKT',
        run: () => {
            const encoded = Buffer.from('POINT (5 5)').toString('base64');
            const result = parse(encoded);
            assert(result.type === 'Point', 'Should parse Base64 encoded WKT');
            assertEqual(result.coordinates, [5, 5], 'Decoded WKT coordinates should be [5, 5]');
        }
    },
    {
        name: 'Invalid input (number)',
        run: () => {
            try {
                parse(123);
                throw new Error('Should have thrown error for number input');
            } catch (e) {
                assert(e.message.includes('must be a string'), 'Should throw error for invalid type');
            }
        }
    },
    {
        name: 'Invalid input (empty string)',
        run: () => {
            try {
                parse('');
                throw new Error('Should have thrown error for empty input');
            } catch (e) {
                assert(e.message.includes('cannot be empty'), 'Should throw error for empty input');
            }
        }
    }
];

// Run tests
let passCount = 0;
let failCount = 0;

console.log('🧪 Spatial Parser Test Suite\n');

tests.forEach((test, index) => {
    try {
        test.run();
        console.log(`✅ Test ${index + 1}: ${test.name}`);
        passCount++;
    } catch (e) {
        console.log(`❌ Test ${index + 1}: ${test.name}`);
        console.log(`   Error: ${e.message}\n`);
        failCount++;
    }
});

console.log(`\n📊 Results: ${passCount} passed, ${failCount} failed (Total: ${tests.length})`);

if (failCount > 0) {
    process.exit(1);
}
