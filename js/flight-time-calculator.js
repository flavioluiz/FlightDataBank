// Flight Time Calculator JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Initialize variables
    let map;
    let pointA = null;
    let pointB = null;
    let pointAMarker = null;
    let pointBMarker = null;
    let routeLine = null;
    let allAircraft = [];
    let clickCounter = 0;
    const greenIcon = createCustomIcon('#4CAF50');
    const redIcon = createCustomIcon('#F44336');
    
    // Initialize the map and UI controls
    initMap();
    loadAircraftData();
    setupEventListeners();
    toggleWindControls();
    
    // Initialize the map
    function initMap() {
        // Create map centered on the world
        map = L.map('map').setView([20, 0], 2);
        
        // Add OpenStreetMap tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);
        
        // Add click event to the map
        map.on('click', function(e) {
            handleMapClick(e.latlng);
        });
    }
    
    // Create custom icon for map markers
    function createCustomIcon(color) {
        return L.icon({
            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-' + color.substring(1) + '.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
        });
    }
    
    // Set up event listeners for UI controls
    function setupEventListeners() {
        document.getElementById('reset-points').addEventListener('click', resetPoints);
        document.getElementById('search-a').addEventListener('click', function() {
            geocodeLocation(document.getElementById('point-a').value, 'A');
        });
        document.getElementById('search-b').addEventListener('click', function() {
            geocodeLocation(document.getElementById('point-b').value, 'B');
        });
        document.getElementById('calculate-btn').addEventListener('click', calculateFlightTimes);
        document.getElementById('enable-wind').addEventListener('change', toggleWindControls);
        document.getElementById('show-all-aircraft').addEventListener('change', function() {
            // Recalculate to show/hide aircraft without enough range
            calculateFlightTimes();
        });
        
        // Set up aircraft filter controls
        document.getElementById('aircraft-classification').addEventListener('change', updateAircraftFilters);
        document.getElementById('aircraft-search').addEventListener('input', updateAircraftFilters);
        document.getElementById('select-all-aircraft').addEventListener('click', selectAllAircraft);
        document.getElementById('clear-all-aircraft').addEventListener('click', clearAllAircraft);
        
        // Set up collapse panels icon rotation
        document.querySelectorAll('.card-header[data-bs-toggle="collapse"]').forEach(header => {
            const icon = header.querySelector('i.fas');
            const targetId = header.getAttribute('href');
            const targetPanel = document.querySelector(targetId);
            
            // Add Bootstrap collapse event listeners
            targetPanel.addEventListener('shown.bs.collapse', function() {
                icon.classList.remove('fa-chevron-down');
                icon.classList.add('fa-chevron-up');
            });
            
            targetPanel.addEventListener('hidden.bs.collapse', function() {
                icon.classList.remove('fa-chevron-up');
                icon.classList.add('fa-chevron-down');
            });
        });
        
        // Add event listeners for the example buttons
        document.querySelectorAll('.load-example').forEach(button => {
            button.addEventListener('click', function() {
                loadExample(this.dataset.example);
            });
        });
    }
    
    // Toggle wind controls visibility
    function toggleWindControls() {
        const enabled = document.getElementById('enable-wind').checked;
        const container = document.getElementById('wind-controls-container');
        container.style.opacity = enabled ? '1' : '0.5';
        container.style.pointerEvents = enabled ? 'auto' : 'none';
    }
    
    // Handle map clicks to set points A and B
    function handleMapClick(latlng) {
        clickCounter++;
        
        if (clickCounter % 2 === 1) {
            // First click - set point A
            setPointA(latlng);
        } else {
            // Second click - set point B
            setPointB(latlng);
            
            // Draw the route line and update distance
            drawRouteLine();
            updateDistanceInfo();
        }
    }
    
    // Set point A (departure)
    function setPointA(latlng) {
        pointA = latlng;
        
        // Update UI
        document.getElementById('point-a-coords').textContent = 
            `Latitude: ${latlng.lat.toFixed(4)}, Longitude: ${latlng.lng.toFixed(4)}`;
        
        // Clear existing marker if any
        if (pointAMarker) {
            map.removeLayer(pointAMarker);
        }
        
        // Add marker for point A (simple marker with no popup)
        pointAMarker = L.marker(latlng, {icon: greenIcon}).addTo(map);
    }
    
    // Set point B (destination)
    function setPointB(latlng) {
        pointB = latlng;
        
        // Update UI
        document.getElementById('point-b-coords').textContent = 
            `Latitude: ${latlng.lat.toFixed(4)}, Longitude: ${latlng.lng.toFixed(4)}`;
        
        // Clear existing marker if any
        if (pointBMarker) {
            map.removeLayer(pointBMarker);
        }
        
        // Add marker for point B (simple marker with no popup)
        pointBMarker = L.marker(latlng, {icon: redIcon}).addTo(map);
    }
    
    // Draw a line between points A and B
    function drawRouteLine() {
        // Remove existing line if any
        if (routeLine) {
            map.removeLayer(routeLine);
        }
        
        // Draw new line if both points are set
        if (pointA && pointB) {
            routeLine = L.polyline([pointA, pointB], {
                color: 'blue',
                weight: 3,
                opacity: 0.7,
                dashArray: '10, 10'
            }).addTo(map);
            
            // Fit map bounds to show both points
            map.fitBounds(routeLine.getBounds(), {
                padding: [50, 50]
            });
        }
    }
    
    // Calculate great circle distance between two points
    function calculateDistance(lat1, lng1, lat2, lng2) {
        // Check if we're receiving objects or individual coordinates
        if (typeof lat1 === 'object' && lat1 !== null) {
            // We received latlng objects
            const point1 = lat1;
            const point2 = lng1;
            return calculateDistance(point1.lat, point1.lng, point2.lat, point2.lng);
        }
        
        // Convert from degrees to radians
        const latRad1 = lat1 * Math.PI / 180;
        const lngRad1 = lng1 * Math.PI / 180;
        const latRad2 = lat2 * Math.PI / 180;
        const lngRad2 = lng2 * Math.PI / 180;
        
        // Haversine formula
        const dlon = lngRad2 - lngRad1;
        const dlat = latRad2 - latRad1;
        const a = Math.pow(Math.sin(dlat / 2), 2) + Math.cos(latRad1) * Math.cos(latRad2) * Math.pow(Math.sin(dlon / 2), 2);
        const c = 2 * Math.asin(Math.sqrt(a));
        
        // Radius of Earth in kilometers
        const r = 6371;
        
        // Calculate the distance
        return c * r;
    }
    
    // Update distance information display
    function updateDistanceInfo() {
        if (pointA && pointB) {
            const distance = calculateDistance(pointA, pointB);
            const safetyDistance = parseFloat(document.getElementById('safety-distance').value) || 0;
            const totalDistance = distance + safetyDistance;
            
            // Hide instruction text and show route details
            document.getElementById('instruction-text').style.display = 'none';
            document.getElementById('route-details').style.display = 'block';
            
            // Update the fixed route elements with values
            document.getElementById('departure-info').textContent = 
                `${document.getElementById('point-a').value || 'Selected Point'} (${pointA.lat.toFixed(4)}, ${pointA.lng.toFixed(4)})`;
            
            document.getElementById('destination-info').textContent = 
                `${document.getElementById('point-b').value || 'Selected Point'} (${pointB.lat.toFixed(4)}, ${pointB.lng.toFixed(4)})`;
            
            document.getElementById('distance-info').textContent = distance.toFixed(2);
            document.getElementById('safety-margin-info').textContent = safetyDistance;
            document.getElementById('total-range-info').textContent = totalDistance.toFixed(2);
        }
    }
    
    // Reset map points and clear route
    function resetPoints() {
        pointA = null;
        pointB = null;
        clickCounter = 0;
        
        // Clear markers and route line
        if (pointAMarker) map.removeLayer(pointAMarker);
        if (pointBMarker) map.removeLayer(pointBMarker);
        if (routeLine) map.removeLayer(routeLine);
        
        // Reset UI
        document.getElementById('point-a-coords').textContent = '';
        document.getElementById('point-b-coords').textContent = '';
        
        // Reset route information
        document.getElementById('instruction-text').style.display = 'block';
        document.getElementById('route-details').style.display = 'none';
        document.getElementById('wind-info-container').style.display = 'none';
        
        // Clear aircraft filters
        clearAircraftList();
        
        // Hide results section
        document.getElementById('results-section').style.display = 'none';
    }
    
    // Load aircraft data
    function loadAircraftData() {
        fetch('data/processed/aircraft_processed.json')
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                console.log('Aircraft data loaded successfully');
                
                let aircraftWithRange = [];
                
                // Check what format the data is in
                if (data.aircraft) {
                    // If in expected format with "aircraft" array
                    aircraftWithRange = data.aircraft.filter(aircraft => aircraft.range_km);
                } else if (Array.isArray(data)) {
                    // If direct array of aircraft objects
                    aircraftWithRange = data.filter(aircraft => aircraft.range_km);
                } else {
                    // Try to find aircraft data in other structures
                    const possibleArrays = Object.values(data).filter(val => Array.isArray(val));
                    if (possibleArrays.length > 0) {
                        // Use the largest array found
                        const largestArray = possibleArrays.reduce((a, b) => 
                            a.length > b.length ? a : b);
                        aircraftWithRange = largestArray.filter(aircraft => aircraft.range_km);
                    }
                }
                
                // Process all aircraft with range data
                allAircraft = aircraftWithRange.map(aircraft => {
                    const aircraftCopy = {...aircraft}; // Create a copy to avoid modifying original data
                    
                    // Check if aircraft has cruise_speed_ms and convert to km/h
                    if (aircraftCopy.cruise_speed_ms) {
                        // Convert m/s to km/h (multiply by 3.6)
                        aircraftCopy.cruise_speed_kmh = aircraftCopy.cruise_speed_ms * 3.6;
                        console.log(`Converted speed for ${aircraftCopy.name}: ${aircraftCopy.cruise_speed_ms} m/s = ${aircraftCopy.cruise_speed_kmh} km/h`);
                    }
                    
                    // Determine aircraft classification if not provided
                    if (!aircraftCopy.classification) {
                        aircraftCopy.classification = determineAircraftClassification(aircraftCopy);
                    }
                    
                    return aircraftCopy;
                });
                
                // Filter out aircraft without speed data
                allAircraft = allAircraft.filter(aircraft => aircraft.cruise_speed_kmh);
                
                // Log the number of usable aircraft
                console.log(`Found ${allAircraft.length} aircraft with both range and speed data`);
                
                // Get speeds distribution for debugging
                const speedGroups = allAircraft.reduce((groups, aircraft) => {
                    const speed = aircraft.cruise_speed_kmh;
                    if (speed < 300) groups.slow++;
                    else if (speed < 600) groups.medium++;
                    else if (speed < 900) groups.fast++;
                    else groups.veryFast++;
                    return groups;
                }, {slow: 0, medium: 0, fast: 0, veryFast: 0});
                
                console.log(`Speed distribution: Slow (<300km/h): ${speedGroups.slow}, Medium (300-600km/h): ${speedGroups.medium}, Fast (600-900km/h): ${speedGroups.fast}, Very Fast (>900km/h): ${speedGroups.veryFast}`);
                
                // If no aircraft data found
                if (allAircraft.length === 0) {
                    showAlert('No aircraft data with range information found. Please check the data source.', 'warning');
                }
            })
            .catch(error => {
                console.error('Error loading aircraft data:', error);
                showAlert(`Error loading aircraft data: ${error.message}. Please try again later.`, 'danger');
            });
    }
    
    // Determine aircraft classification based on available data
    function determineAircraftClassification(aircraft) {
        const name = aircraft.name.toLowerCase();
        const type = aircraft.type ? aircraft.type.toLowerCase() : '';
        const cruiseSpeed = aircraft.cruise_speed_kmh || 0;
        
        // Check for military aircraft
        if (name.includes('fighter') || name.includes('military') || 
            type.includes('fighter') || type.includes('military') ||
            name.includes('f-') || name.includes('su-') || name.includes('mig-')) {
            return 'military';
        }
        
        // Check for helicopters
        if (name.includes('helicopter') || name.includes('chopper') || 
            type.includes('helicopter') || type.includes('rotor') ||
            cruiseSpeed < 300) {
            return 'helicopter';
        }
        
        // Check for business jets
        if (name.includes('business') || name.includes('corporate') || 
            name.includes('private') || name.includes('learjet') ||
            name.includes('citation') || name.includes('gulfstream') ||
            type.includes('business') || type.includes('corporate')) {
            return 'business';
        }
        
        // Check for turboprops
        if (name.includes('turboprop') || name.includes('prop') || 
            type.includes('turboprop') || type.includes('prop') ||
            (cruiseSpeed >= 300 && cruiseSpeed < 500)) {
            return 'turboprop';
        }
        
        // Check for piston aircraft
        if (name.includes('piston') || name.includes('cessna') || 
            name.includes('piper') || name.includes('beechcraft') ||
            type.includes('piston') || type.includes('general aviation') ||
            cruiseSpeed < 400) {
            return 'piston';
        }
        
        // Default to airliner for commercial jets
        if (cruiseSpeed >= 700 || 
            name.includes('boeing') || name.includes('airbus') || 
            name.includes('a3') || name.includes('a2') || 
            name.includes('737') || name.includes('747') || 
            name.includes('777') || name.includes('787')) {
            return 'airliner';
        }
        
        // If can't determine, default to airliner
        return 'airliner';
    }
    
    // Format flight time from hours to hours:minutes
    function formatFlightTime(timeInHours) {
        const hours = Math.floor(timeInHours);
        const minutes = Math.round((timeInHours - hours) * 60);
        return `${hours}h ${minutes}m`;
    }
    
    // Calculate flight times for all eligible aircraft
    function calculateFlightTimes() {
        // Check if we have valid points
        if (!pointA || !pointB) {
            showAlert('Please select two points on the map first.', 'warning');
            return;
        }
        
        // Get user settings
        const showAllAircraft = document.getElementById('show-all-aircraft').checked;
        const distanceKm = calculateDistance(pointA, pointB);
        
        // Filter eligible aircraft based on range
        let eligibleAircraft = allAircraft.filter(aircraft => {
            // Show all aircraft if checkbox is checked or only those with sufficient range
            return showAllAircraft || aircraft.range_km >= distanceKm;
        });
        
        // Apply aircraft selection filters
        eligibleAircraft = applyAircraftFilters(eligibleAircraft);
        
        // Update the aircraft selection list
        populateAircraftList(eligibleAircraft);
        
        // Get wind parameters
        const windEnabled = document.getElementById('enable-wind').checked;
        const windSpeed = parseFloat(document.getElementById('wind-speed').value) || 0;
        const windType = document.getElementById('wind-type').value;
        
        // Calculate flight time for each aircraft
        const results = eligibleAircraft.map(aircraft => {
            // Base cruise speed in km/h
            const cruiseSpeed = Math.round(aircraft.cruise_speed_kmh);
            
            // Default values
            let groundSpeed = cruiseSpeed;
            let groundSpeedWithWind = cruiseSpeed;
            let flightTimeHours = distanceKm / cruiseSpeed;
            let flightTimeWithWindHours = flightTimeHours;
            
            // Apply wind effects if enabled
            if (windEnabled && windSpeed > 0) {
                switch (windType) {
                    case 'headwind':
                        groundSpeedWithWind = Math.max(cruiseSpeed - windSpeed, 50); // Minimum ground speed of 50 km/h
                        flightTimeWithWindHours = distanceKm / groundSpeedWithWind;
                        break;
                    case 'tailwind':
                        groundSpeedWithWind = cruiseSpeed + windSpeed;
                        flightTimeWithWindHours = distanceKm / groundSpeedWithWind;
                        break;
                    case 'crosswind':
                        // Simplified crosswind effect (approximately 10-20% of the wind speed as headwind)
                        const crosswindEffect = windSpeed * 0.15;
                        groundSpeedWithWind = Math.max(cruiseSpeed - crosswindEffect, 50);
                        flightTimeWithWindHours = distanceKm / groundSpeedWithWind;
                        break;
                }
            }
            
            // Format the time from hours to hours:minutes
            const formattedTime = formatFlightTime(flightTimeHours);
            const formattedTimeWithWind = formatFlightTime(flightTimeWithWindHours);
            
            return {
                aircraft: aircraft,
                groundSpeed: cruiseSpeed,
                groundSpeedWithWind: Math.round(groundSpeedWithWind),
                flightTimeHours: flightTimeHours,
                flightTimeWithWindHours: flightTimeWithWindHours,
                formattedTime: formattedTime,
                formattedTimeWithWind: formattedTimeWithWind,
                hasRange: aircraft.range_km >= distanceKm
            };
        });
        
        // Sort results by flight time (shortest first)
        results.sort((a, b) => {
            if (windEnabled) {
                // When wind is enabled, sort by wind-adjusted time
                return a.flightTimeWithWindHours - b.flightTimeWithWindHours;
            } else {
                // When wind is disabled, sort by regular flight time
                return a.flightTimeHours - b.flightTimeHours;
            }
        });
        
        // Display the results
        displayResults(results);
        
        return results;
    }
    
    // Display flight time results
    function displayResults(results) {
        const resultsContainer = document.getElementById('results-container');
        
        // Show the results section
        document.getElementById('results-section').style.display = 'block';
        
        // Update wind info if enabled
        const windEnabled = document.getElementById('enable-wind').checked;
        if (windEnabled) {
            const windSpeed = document.getElementById('wind-speed').value;
            const windType = document.getElementById('wind-type').value;
            
            // Show wind info
            document.getElementById('wind-info-container').style.display = 'block';
            document.getElementById('wind-info').textContent = 
                `${windType.charAt(0).toUpperCase() + windType.slice(1)} at ${windSpeed} km/h`;
        } else {
            // Hide wind info if disabled
            document.getElementById('wind-info-container').style.display = 'none';
        }
        
        // Clear previous results
        resultsContainer.innerHTML = '';
        
        // Add each aircraft card
        results.forEach(result => {
            const card = document.createElement('div');
            card.className = 'col-md-4 col-lg-3';
            
            // Add a warning class if the aircraft doesn't have enough range
            const rangeWarning = !result.hasRange ? 
                `<div class="alert alert-warning mt-2 mb-0">
                    <small><i class="fas fa-exclamation-triangle me-1"></i> Insufficient range for this distance</small>
                </div>` : '';
            
            // Create wind effect content
            let windContent = '';
            if (windEnabled) {
                const windSpeed = document.getElementById('wind-speed').value;
                const windType = document.getElementById('wind-type').value;
                
                let windEffectClass = '';
                if (windType === 'tailwind') {
                    windEffectClass = 'text-success';
                } else if (windType === 'headwind') {
                    windEffectClass = 'text-danger';
                } else {
                    windEffectClass = 'text-info';
                }
                
                windContent = `
                    <div class="mt-3 pt-3 border-top">
                        <div class="d-flex justify-content-between mb-2">
                            <span>No Wind:</span>
                            <span><strong>${result.formattedTime}</strong></span>
                        </div>
                        <div class="d-flex justify-content-between mb-2">
                            <span>With ${windType}:</span>
                            <span><strong>${result.formattedTimeWithWind}</strong></span>
                        </div>
                        <div class="d-flex justify-content-between mb-2">
                            <span>Ground Speed:</span>
                            <span><strong>${result.groundSpeedWithWind} km/h</strong></span>
                        </div>
                        <div class="${windEffectClass}">
                            <i class="fas fa-wind me-1"></i> ${windSpeed} km/h ${windType}
                        </div>
                    </div>
                `;
            }
            
            // Get image URL if available
            const imageUrl = result.aircraft.image_url || 'images/aircraft-placeholder.jpg';
            
            card.innerHTML = `
                <div class="card result-card">
                    <div class="card-header bg-${result.hasRange ? 'success' : 'secondary'} text-white">
                        <h6 class="card-title mb-0">${result.aircraft.name}</h6>
                    </div>
                    <img src="${imageUrl}" class="card-img-top" alt="${result.aircraft.name}" style="height: 150px; object-fit: cover;">
                    <div class="card-body">
                        <div class="d-flex justify-content-between mb-2">
                            <span><i class="fas fa-tachometer-alt me-1"></i> ${result.groundSpeed} km/h</span>
                            <span><i class="fas fa-route me-1"></i> ${result.aircraft.range_km.toLocaleString()} km</span>
                        </div>
                        <h5 class="mb-0 text-center py-2">
                            <i class="far fa-clock me-1"></i> ${windEnabled ? result.formattedTimeWithWind : result.formattedTime}
                        </h5>
                        ${windContent}
                        ${rangeWarning}
                    </div>
                </div>
            `;
            
            resultsContainer.appendChild(card);
        });
        
        // Scroll to results section
        document.getElementById('results-section').scrollIntoView({ behavior: 'smooth' });
    }
    
    // Geocode a location name to coordinates
    function geocodeLocation(locationName, pointType) {
        if (!locationName.trim()) {
            showAlert('Please enter a location name.', 'warning');
            return;
        }
        
        const apiUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationName)}`;
        
        fetch(apiUrl)
            .then(response => response.json())
            .then(data => {
                if (data && data.length > 0) {
                    const result = data[0];
                    const latlng = L.latLng(parseFloat(result.lat), parseFloat(result.lon));
                    
                    if (pointType === 'A') {
                        setPointA(latlng);
                        document.getElementById('point-a').value = result.display_name;
                    } else {
                        setPointB(latlng);
                        document.getElementById('point-b').value = result.display_name;
                    }
                    
                    // If both points are set, draw route and update distance
                    if (pointA && pointB) {
                        drawRouteLine();
                        updateDistanceInfo();
                    }
                    
                    // Center and zoom the map
                    map.setView(latlng, 10);
                } else {
                    showAlert(`Location "${locationName}" not found. Please try a different search.`, 'warning');
                }
            })
            .catch(error => {
                console.error('Error geocoding location:', error);
                showAlert('Error searching for location. Please try again.', 'danger');
            });
    }
    
    // Load predefined examples
    function loadExample(exampleType) {
        resetPoints();
        
        let pointAData, pointBData, windSettings;
        
        switch (exampleType) {
            case 'atlantic':
                // New York to London
                pointAData = { latlng: L.latLng(40.7128, -74.0060), name: 'New York, USA' };
                pointBData = { latlng: L.latLng(51.5074, -0.1278), name: 'London, UK' };
                windSettings = { enabled: true, speed: 120, type: 'tailwind' };
                break;
                
            case 'pacific':
                // Tokyo to Los Angeles
                pointAData = { latlng: L.latLng(35.6762, 139.6503), name: 'Tokyo, Japan' };
                pointBData = { latlng: L.latLng(34.0522, -118.2437), name: 'Los Angeles, USA' };
                windSettings = { enabled: true, speed: 100, type: 'tailwind' };
                break;
                
            case 'extreme':
                // Chicago to Boston (winter jet stream)
                pointAData = { latlng: L.latLng(41.8781, -87.6298), name: 'Chicago, USA' };
                pointBData = { latlng: L.latLng(42.3601, -71.0589), name: 'Boston, USA' };
                windSettings = { enabled: true, speed: 200, type: 'headwind' };
                break;
                
            default:
                return;
        }
        
        // Set points
        document.getElementById('point-a').value = pointAData.name;
        document.getElementById('point-b').value = pointBData.name;
        
        // Set markers
        setPointA(pointAData.latlng);
        setPointB(pointBData.latlng);
        
        // Configure wind settings
        document.getElementById('enable-wind').checked = windSettings.enabled;
        document.getElementById('wind-speed').value = windSettings.speed;
        document.getElementById('wind-type').value = windSettings.type;
        
        // Make sure wind panel is expanded when using an example with wind
        if (windSettings.enabled) {
            const windPanel = document.getElementById('windConditionsPanel');
            const bootstrap = window.bootstrap || {};
            
            // Check if Bootstrap's Collapse is available
            if (bootstrap.Collapse) {
                const collapse = bootstrap.Collapse.getInstance(windPanel);
                if (collapse) {
                    collapse.show();
                } else {
                    new bootstrap.Collapse(windPanel, { show: true });
                }
            } else {
                // Fallback if Bootstrap is not fully loaded
                windPanel.classList.add('show');
            }
        }
        
        // Update UI
        drawRouteLine();
        updateDistanceInfo();
        toggleWindControls();
        
        // Calculate flight times
        calculateFlightTimes();
    }
    
    // Show alert messages
    function showAlert(message, type = 'info') {
        const alertContainer = document.createElement('div');
        alertContainer.className = `alert alert-${type} alert-dismissible fade show`;
        alertContainer.setAttribute('role', 'alert');
        alertContainer.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;
        
        // Add alert to the page
        const container = document.querySelector('.container');
        if (container) {
            container.insertBefore(alertContainer, container.firstChild);
        }
        
        // Auto-dismiss after 5 seconds
        setTimeout(() => {
            alertContainer.remove();
        }, 5000);
    }
    
    // Populate the aircraft list for filtering
    function populateAircraftList(aircraftList) {
        const listContainer = document.getElementById('aircraft-list');
        
        // Clear previous content
        while (listContainer.firstChild) {
            listContainer.removeChild(listContainer.firstChild);
        }
        
        if (aircraftList.length === 0) {
            // Show placeholder if no aircraft
            const placeholder = document.createElement('div');
            placeholder.className = 'text-center text-muted py-4';
            placeholder.innerHTML = `
                <i class="fas fa-plane-slash fa-2x mb-2"></i>
                <p>No matching aircraft found</p>
            `;
            listContainer.appendChild(placeholder);
            return;
        }
        
        // Create checkbox for each aircraft
        aircraftList.forEach((aircraft, index) => {
            const item = document.createElement('div');
            item.className = 'form-check';
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'form-check-input aircraft-checkbox';
            checkbox.id = `aircraft-${index}`;
            checkbox.value = aircraft.id || index;
            checkbox.dataset.name = aircraft.name;
            checkbox.checked = true; // Default to checked
            checkbox.addEventListener('change', () => calculateFlightTimes());
            
            const label = document.createElement('label');
            label.className = 'form-check-label';
            label.htmlFor = `aircraft-${index}`;
            label.textContent = aircraft.name;
            
            item.appendChild(checkbox);
            item.appendChild(label);
            listContainer.appendChild(item);
        });
    }
    
    // Clear the aircraft list
    function clearAircraftList() {
        const listContainer = document.getElementById('aircraft-list');
        
        // Clear the container and add placeholder
        listContainer.innerHTML = `
            <div class="text-center text-muted py-4">
                <i class="fas fa-plane-slash fa-2x mb-2"></i>
                <p>Aircraft will appear after selecting points on the map</p>
            </div>
        `;
    }
    
    // Update aircraft filters based on classification and search
    function updateAircraftFilters() {
        // If no points selected yet, nothing to filter
        if (!pointA || !pointB) return;
        
        // Get current filter values
        const classification = document.getElementById('aircraft-classification').value;
        const searchTerm = document.getElementById('aircraft-search').value.toLowerCase();
        
        // Get showAllAircraft setting for range filter
        const showAllAircraft = document.getElementById('show-all-aircraft').checked;
        const distanceKm = calculateDistance(pointA, pointB);
        
        // Apply filters
        let filteredAircraft = allAircraft.filter(aircraft => {
            // Filter by range if needed
            if (!showAllAircraft && aircraft.range_km < distanceKm) {
                return false;
            }
            
            // Filter by classification if not set to "all"
            if (classification !== 'all' && aircraft.classification !== classification) {
                return false;
            }
            
            // Filter by search term
            if (searchTerm && !aircraft.name.toLowerCase().includes(searchTerm)) {
                return false;
            }
            
            return true;
        });
        
        // Update the aircraft list
        populateAircraftList(filteredAircraft);
    }
    
    // Apply selected aircraft filters to the eligible aircraft list
    function applyAircraftFilters(eligibleAircraft) {
        // Get all checked aircraft
        const checkedBoxes = document.querySelectorAll('.aircraft-checkbox:checked');
        const selectedNames = Array.from(checkedBoxes).map(checkbox => checkbox.dataset.name);
        
        // If no checkboxes exist yet, return all eligible aircraft
        if (document.querySelectorAll('.aircraft-checkbox').length === 0) {
            return eligibleAircraft;
        }
        
        // Filter to only show selected aircraft
        return eligibleAircraft.filter(aircraft => selectedNames.includes(aircraft.name));
    }
    
    // Select all aircraft in the filter list
    function selectAllAircraft() {
        document.querySelectorAll('.aircraft-checkbox').forEach(checkbox => {
            checkbox.checked = true;
        });
        calculateFlightTimes();
    }
    
    // Clear all aircraft in the filter list
    function clearAllAircraft() {
        document.querySelectorAll('.aircraft-checkbox').forEach(checkbox => {
            checkbox.checked = false;
        });
        calculateFlightTimes();
    }
}); 