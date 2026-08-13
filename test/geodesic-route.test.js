const test = require('node:test');
const assert = require('node:assert/strict');
const {
    buildRouteSegments,
    interpolateGreatCircle,
    splitAtAntimeridian
} = require('../js/geodesic-route');

test('keeps an Atlantic route in a single segment', () => {
    const segments = buildRouteSegments(
        { lat: 40.7128, lng: -74.0060 },
        { lat: 51.5074, lng: -0.1278 }
    );

    assert.equal(segments.length, 1);
    assert.ok(Math.abs(segments[0][0].lat - 40.7128) < 1e-10);
    assert.ok(Math.abs(segments[0][0].lng - (-74.0060)) < 1e-10);
    assert.ok(Math.abs(segments[0].at(-1).lat - 51.5074) < 1e-10);
    assert.ok(Math.abs(segments[0].at(-1).lng - (-0.1278)) < 1e-10);
});

test('splits the Tokyo to Los Angeles route at the antimeridian', () => {
    const segments = buildRouteSegments(
        { lat: 35.6762, lng: 139.6503 },
        { lat: 34.0522, lng: -118.2437 }
    );

    assert.equal(segments.length, 2);
    assert.equal(segments[0].at(-1).lng, 180);
    assert.equal(segments[1][0].lng, -180);

    for (const segment of segments) {
        for (let index = 1; index < segment.length; index++) {
            assert.ok(Math.abs(segment[index].lng - segment[index - 1].lng) <= 180);
        }
    }
});

test('also splits an eastbound crossing in the reverse direction', () => {
    const points = interpolateGreatCircle(
        { lat: 34.0522, lng: -118.2437 },
        { lat: 35.6762, lng: 139.6503 }
    );
    const segments = splitAtAntimeridian(points);

    assert.equal(segments.length, 2);
    assert.equal(segments[0].at(-1).lng, -180);
    assert.equal(segments[1][0].lng, 180);
});
