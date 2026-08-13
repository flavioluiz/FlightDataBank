// Utilities for drawing shortest routes on a world map.
(function(root, factory) {
    const api = factory();

    if (typeof module === 'object' && module.exports) {
        module.exports = api;
    } else {
        root.GeodesicRoute = api;
    }
}(typeof globalThis !== 'undefined' ? globalThis : this, function() {
    const DEG_TO_RAD = Math.PI / 180;
    const RAD_TO_DEG = 180 / Math.PI;

    function normalizeLongitude(longitude) {
        const normalized = ((longitude + 180) % 360 + 360) % 360 - 180;
        return normalized === -180 && longitude > 0 ? 180 : normalized;
    }

    function interpolateGreatCircle(start, end, steps = 96) {
        const startLat = start.lat * DEG_TO_RAD;
        const startLng = start.lng * DEG_TO_RAD;
        const endLat = end.lat * DEG_TO_RAD;
        const endLng = end.lng * DEG_TO_RAD;

        const startVector = {
            x: Math.cos(startLat) * Math.cos(startLng),
            y: Math.cos(startLat) * Math.sin(startLng),
            z: Math.sin(startLat)
        };
        const endVector = {
            x: Math.cos(endLat) * Math.cos(endLng),
            y: Math.cos(endLat) * Math.sin(endLng),
            z: Math.sin(endLat)
        };

        const dotProduct = Math.max(-1, Math.min(1,
            startVector.x * endVector.x +
            startVector.y * endVector.y +
            startVector.z * endVector.z
        ));
        const angularDistance = Math.acos(dotProduct);
        const sinAngularDistance = Math.sin(angularDistance);
        const points = [];

        // Coincident and exactly antipodal points make spherical interpolation
        // indeterminate. A deterministic shortest-longitude interpolation keeps
        // the route drawable in those rare cases.
        if (Math.abs(sinAngularDistance) < 1e-12) {
            let longitudeDelta = end.lng - start.lng;
            if (longitudeDelta > 180) longitudeDelta -= 360;
            if (longitudeDelta < -180) longitudeDelta += 360;

            for (let index = 0; index <= steps; index++) {
                const fraction = index / steps;
                points.push({
                    lat: start.lat + (end.lat - start.lat) * fraction,
                    lng: normalizeLongitude(start.lng + longitudeDelta * fraction)
                });
            }
            return points;
        }

        for (let index = 0; index <= steps; index++) {
            const fraction = index / steps;
            const startWeight = Math.sin((1 - fraction) * angularDistance) / sinAngularDistance;
            const endWeight = Math.sin(fraction * angularDistance) / sinAngularDistance;
            const x = startWeight * startVector.x + endWeight * endVector.x;
            const y = startWeight * startVector.y + endWeight * endVector.y;
            const z = startWeight * startVector.z + endWeight * endVector.z;

            points.push({
                lat: Math.atan2(z, Math.sqrt(x * x + y * y)) * RAD_TO_DEG,
                lng: normalizeLongitude(Math.atan2(y, x) * RAD_TO_DEG)
            });
        }

        return points;
    }

    function splitAtAntimeridian(points) {
        if (points.length === 0) return [];

        const segments = [[points[0]]];

        for (let index = 1; index < points.length; index++) {
            const previous = points[index - 1];
            const current = points[index];
            const rawLongitudeDelta = current.lng - previous.lng;
            const activeSegment = segments[segments.length - 1];

            if (Math.abs(rawLongitudeDelta) <= 180) {
                activeSegment.push(current);
                continue;
            }

            // Unwrap the next point so the interpolation follows the short side
            // of the globe, then add matching points on both map edges.
            const unwrappedLongitude = current.lng + (rawLongitudeDelta > 180 ? -360 : 360);
            const boundaryLongitude = unwrappedLongitude > previous.lng ? 180 : -180;
            const fraction = (boundaryLongitude - previous.lng) /
                (unwrappedLongitude - previous.lng);
            const boundaryLatitude = previous.lat +
                (current.lat - previous.lat) * fraction;

            activeSegment.push({ lat: boundaryLatitude, lng: boundaryLongitude });
            segments.push([
                { lat: boundaryLatitude, lng: -boundaryLongitude },
                current
            ]);
        }

        return segments;
    }

    function buildRouteSegments(start, end, steps = 96) {
        return splitAtAntimeridian(interpolateGreatCircle(start, end, steps));
    }

    return {
        buildRouteSegments,
        interpolateGreatCircle,
        splitAtAntimeridian
    };
}));
