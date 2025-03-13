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
    let selectedAircraft = []; // Track selected aircraft
    let clickCounter = 0;
    let classifications = []; // Store classifications data
    const greenIcon = createCustomIcon('#4CAF50');
    const redIcon = createCustomIcon('#F44336');
    
    // Initialize the map and UI controls
    initMap();
    setupEventListeners();
    toggleWindControls();
    
    // Load aircraft data and classifications after setting up UI
    loadAircraft()
        .then(() => {
            console.log(`Loaded ${allAircraft.length} aircraft`);
            return loadClassifications();
        })
        .then(() => {
            console.log('Loaded classifications');
        })
        .catch(err => {
            console.error('Failed to load data:', err);
            showAlert('Failed to load data. Please refresh the page.', 'danger');
        });
    
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
        document.getElementById('calculate-btn').addEventListener('click', function() {
            if (!pointA || !pointB) {
                showAlert('Please select both departure and destination points on the map.', 'warning');
                return;
            }
            
            if (selectedAircraft.length === 0) {
                showAlert('Please select at least one aircraft to calculate flight times.', 'warning');
                return;
            }
            
            calculateFlightTimes();
        });
        document.getElementById('enable-wind').addEventListener('change', toggleWindControls);
        document.getElementById('show-all-range').addEventListener('change', function() {
            // Don't recalculate, just update the aircraft list
            updateAircraftList();
        });
        
        // Set up aircraft filter controls
        document.getElementById('aircraft-classification').addEventListener('change', updateAircraftFilters);
        
        // First step: search for matching aircraft and display them
        document.getElementById('search-btn').addEventListener('click', function(e) {
            e.preventDefault();
            searchAircraft();
        });
        
        // Also search when pressing Enter
        document.getElementById('aircraft-search').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                searchAircraft();
            }
        });
        
        // Set up select all and clear all buttons with proper event listeners
        document.getElementById('select-all-btn').addEventListener('click', function(e) {
            e.preventDefault(); // Prevent default form submission
            selectAllAircraft();
        });
        
        document.getElementById('clear-all-btn').addEventListener('click', function(e) {
            e.preventDefault(); // Prevent default form submission
            clearAllAircraft();
        });
        
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
            
            // Add all aircraft that can reach the distance by default
            const filteredAircraft = allAircraft.filter(aircraft => {
                return aircraft.range_km >= totalDistance;
            });
            
            // Update the list with filtered aircraft
            populateAircraftList(filteredAircraft);
        }
    }
    
    // Reset points and clear results
    function resetPoints() {
        // Clear markers, reset forms, etc...
        pointA = null;
        pointB = null;
        
        // Remove markers from map
        if (pointAMarker) map.removeLayer(pointAMarker);
        if (pointBMarker) map.removeLayer(pointBMarker);
        pointAMarker = null;
        pointBMarker = null;
        
        // Clear route line
        if (routeLine) map.removeLayer(routeLine);
        routeLine = null;
        
        // Reset form fields
        document.getElementById('point-a').value = '';
        document.getElementById('point-b').value = '';
        
        // Clear distance and results
        document.getElementById('distance-info').innerHTML = '';
        document.getElementById('flight-time-results').innerHTML = '';
        document.getElementById('aircraft-list').innerHTML = '';
        
        // Clear search results
        document.getElementById('aircraft-search').value = '';
        document.getElementById('aircraft-search-results').innerHTML = '';
        document.getElementById('aircraft-search-results').classList.add('d-none');
        
        // Reset aircraft list to all aircraft
        selectedAircraft = [...allAircraft];
        populateAircraftList(selectedAircraft);
        
        calculateFlightTimes();
    }
    
    // Load aircraft data
    function loadAircraft() {
        return fetch('data/processed/aircraft_processed.json')
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
                    if (!aircraftCopy.category_type) {
                        aircraftCopy.category_type = determineAircraftClassification(aircraftCopy);
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
    
    // Load classifications data
    function loadClassifications() {
        return fetch('data/classifications.json')
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                console.log('Classifications loaded successfully');
                classifications = data.classifications;
                
                // Update the classification dropdown
                populateClassificationsDropdown();
                return data; // Return data for chaining
            })
            .catch(error => {
                console.error('Error loading classifications:', error);
                // Fallback to default classifications if loading fails
                populateDefaultClassifications();
                throw error; // Re-throw to handle in the main catch
            });
    }
    
    // Populate classifications dropdown from loaded data
    function populateClassificationsDropdown() {
        const dropdown = document.getElementById('aircraft-classification');
        
        // Clear existing options, except the first one (All Classifications)
        while (dropdown.options.length > 1) {
            dropdown.remove(1);
        }
        
        // Find the category type classification
        const categoryType = classifications.find(c => c.id === 'category_type');
        
        if (categoryType && categoryType.options) {
            // Add each classification option
            categoryType.options.forEach(option => {
                const optElement = document.createElement('option');
                optElement.value = option.value;
                optElement.textContent = option.label;
                dropdown.appendChild(optElement);
            });
        } else {
            // Fallback to default classifications
            populateDefaultClassifications();
        }
    }
    
    // Fallback classifications if the JSON file couldn't be loaded
    function populateDefaultClassifications() {
        const dropdown = document.getElementById('aircraft-classification');
        const defaultOptions = [
            { value: 'comercial', label: 'Commercial Aviation' },
            { value: 'executiva', label: 'Business Aircraft' },
            { value: 'carga', label: 'Cargo Aviation' },
            { value: 'militar', label: 'Military Aviation' },
            { value: 'geral', label: 'General Aviation' },
            { value: 'historica', label: 'Historical Aircraft' }
        ];
        
        // Add each default option
        defaultOptions.forEach(option => {
            const optElement = document.createElement('option');
            optElement.value = option.value;
            optElement.textContent = option.label;
            dropdown.appendChild(optElement);
        });
    }
    
    // Determine aircraft classification based on available data
    function determineAircraftClassification(aircraft) {
        // If the aircraft already has a category_type field, use that
        if (aircraft.category_type) {
            return aircraft.category_type;
        }
        
        const name = aircraft.name.toLowerCase();
        const type = aircraft.type ? aircraft.type.toLowerCase() : '';
        const cruiseSpeed = aircraft.cruise_speed_kmh || 0;
        
        // Map to standard category_type values from classifications.json
        
        // Check for military aircraft
        if (name.includes('fighter') || name.includes('military') || 
            type.includes('fighter') || type.includes('military') ||
            name.includes('f-') || name.includes('su-') || name.includes('mig-')) {
            return 'militar';
        }
        
        // Check for business jets
        if (name.includes('business') || name.includes('corporate') || 
            name.includes('private') || name.includes('learjet') ||
            name.includes('citation') || name.includes('gulfstream') ||
            type.includes('business') || type.includes('corporate')) {
            return 'executiva';
        }
        
        // Check for cargo
        if (name.includes('cargo') || name.includes('freight') ||
            type.includes('cargo') || type.includes('freight')) {
            return 'carga';
        }
        
        // Check for general aviation
        if (name.includes('cessna') || name.includes('piper') || 
            name.includes('beechcraft') || cruiseSpeed < 400 ||
            type.includes('piston') || type.includes('general aviation')) {
            return 'geral';
        }
        
        // Check for historical aircraft
        if (name.includes('historic') || type.includes('historic') ||
            name.includes('ww2') || name.includes('wwii') ||
            name.includes('vintage')) {
            return 'historica';
        }
        
        // Default to commercial for most larger aircraft
        return 'comercial';
    }
    
    // Format flight time from hours to hours:minutes
    function formatFlightTime(timeInHours) {
        const hours = Math.floor(timeInHours);
        const minutes = Math.round((timeInHours - hours) * 60);
        return `${hours}h ${minutes}m`;
    }
    
    // Calculate and display flight times
    function calculateFlightTimes() {
        const resultsContainer = document.getElementById('flight-time-results');
        resultsContainer.innerHTML = '';
        
        if (!pointA || !pointB) {
            showAlert('Please set both origin and destination points first.', 'warning');
            return;
        }
        
        // Get the distance in kilometers
        const distanceKm = calculateDistance(pointA, pointB);
        
        // Check if there are selected aircraft
        if (selectedAircraft.length === 0) {
            showAlert('Please add at least one aircraft to the list.', 'warning');
            return;
        }
        
        // Get wind settings
        const enableWind = document.getElementById('enable-wind').checked;
        const windSpeed = enableWind ? parseFloat(document.getElementById('wind-speed').value) : 0;
        const windType = document.getElementById('wind-type').value;
        const windFactor = windType === 'headwind' ? -1 : 1;
        
        // Calculate flight time for each selected aircraft
        const flightTimes = selectedAircraft.map(aircraft => {
            // Calculate base flight time without wind
            const baseFlightTimeHours = distanceKm / aircraft.cruise_speed_kmh;
            
            // Calculate effective speed with wind if enabled
            let effectiveSpeed = aircraft.cruise_speed_kmh;
            let windFlightTimeHours = baseFlightTimeHours;
            
            if (enableWind && windSpeed > 0) {
                effectiveSpeed += (windFactor * windSpeed);
                // Ensure speed doesn't become negative or too small
                if (effectiveSpeed < 50) effectiveSpeed = 50;
                windFlightTimeHours = distanceKm / effectiveSpeed;
            }
            
            return {
                aircraft: aircraft.name,
                cruiseSpeed: aircraft.cruise_speed_kmh,
                effectiveSpeed: effectiveSpeed,
                baseFlightTimeHours: baseFlightTimeHours,
                windFlightTimeHours: windFlightTimeHours,
                range: aircraft.range_km,
                rangeLimit: aircraft.range_km < distanceKm,
                category: aircraft.category_type || 'Unknown',
                imageUrl: aircraft.image_url || getAircraftImageUrl(aircraft.category_type || 'Unknown')
            };
        });
        
        // Sort by flight time (with wind if enabled, otherwise base time)
        flightTimes.sort((a, b) => enableWind ? 
            a.windFlightTimeHours - b.windFlightTimeHours : 
            a.baseFlightTimeHours - b.baseFlightTimeHours
        );
        
        // Create results header
        const resultsHeader = document.createElement('div');
        resultsHeader.className = 'card mb-4';
        resultsHeader.innerHTML = `
            <div class="card-header bg-primary text-white">
                <h5 class="mb-0">
                    <i class="fas fa-clock me-2"></i>Flight Time Results
                    ${enableWind ? ` (${windType} ${windSpeed} km/h)` : ''}
                </h5>
            </div>
        `;
        resultsContainer.appendChild(resultsHeader);
        
        // Create row for aircraft cards
        const row = document.createElement('div');
        row.className = 'row g-3';
        
        // Create a card for each aircraft
        flightTimes.forEach(item => {
            const col = document.createElement('div');
            col.className = 'col-md-6';
            
            const timeDifference = enableWind ? 
                Math.abs(item.windFlightTimeHours - item.baseFlightTimeHours) * 60 : 0;
            
            const card = document.createElement('div');
            card.className = 'card h-100' + (item.rangeLimit ? ' border-warning' : '');
            
            // Create a more compact layout with flexbox
            card.innerHTML = `
                <div class="card-body p-3">
                    <div class="row g-0">
                        <div class="col-md-4">
                            <div class="position-relative" style="height: 140px;">
                                <img src="${item.imageUrl}" 
                                     class="position-absolute w-100 h-100" 
                                     alt="${item.aircraft}"
                                     style="object-fit: cover; border-radius: 4px;">
                            </div>
                        </div>
                        <div class="col-md-8 ps-md-3">
                            <h5 class="mb-2 text-primary">${item.aircraft}</h5>
                            <div class="d-flex align-items-center mb-2">
                                <i class="fas fa-tachometer-alt me-2 text-muted"></i>
                                <span>${Math.round(item.cruiseSpeed)} km/h</span>
                            </div>
                            <div class="d-flex align-items-center mb-2">
                                <i class="fas fa-route me-2 text-muted"></i>
                                <span>${item.range.toLocaleString()} km</span>
                                ${item.rangeLimit ? 
                                    '<span class="badge bg-warning text-dark ms-2">Insufficient range</span>' : 
                                    ''}
                            </div>
                            <div class="mt-2">
                                <div class="d-flex align-items-center">
                                    <i class="fas fa-clock me-2 text-muted"></i>
                                    <span class="h5 mb-0">
                                        ${formatFlightTime(enableWind ? item.windFlightTimeHours : item.baseFlightTimeHours)}
                                    </span>
                                </div>
                                ${enableWind ? `
                                    <div class="small text-muted mt-1">
                                        <div>No Wind: ${formatFlightTime(item.baseFlightTimeHours)}</div>
                                        <div>Ground Speed: ${Math.round(item.effectiveSpeed)} km/h</div>
                                        <div class="text-${windType === 'headwind' ? 'danger' : 'success'}">
                                            <i class="fas fa-wind me-1"></i>
                                            ${windType === 'headwind' ? '+' : '-'}${Math.round(timeDifference)} minutes
                                        </div>
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            col.appendChild(card);
            row.appendChild(col);
        });
        
        resultsContainer.appendChild(row);
        resultsContainer.style.display = 'block';
        resultsContainer.scrollIntoView({ behavior: 'smooth' });
    }
    
    // Helper function to get aircraft image URL based on category
    function getAircraftImageUrl(category) {
        const imageMap = {
            'comercial': '/images/aircraft/commercial.jpg',
            'executiva': '/images/aircraft/business.jpg',
            'carga': '/images/aircraft/cargo.jpg',
            'militar': '/images/aircraft/military.jpg',
            'geral': '/images/aircraft/general.jpg',
            'historica': '/images/aircraft/historical.jpg'
        };
        return imageMap[category] || '/images/aircraft/default.jpg';
    }
    
    // Helper function to capitalize first letter
    function capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
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
            // Try using Bootstrap's collapse API first
            try {
                const windPanel = document.getElementById('windConditionsPanel');
                if (typeof bootstrap !== 'undefined' && bootstrap.Collapse) {
                    const collapse = new bootstrap.Collapse(windPanel, { show: true });
                } else {
                    // Fallback for when Bootstrap isn't fully loaded
                    windPanel.classList.add('show');
                    const icon = document.querySelector('[href="#windConditionsPanel"] i.fas');
                    if (icon) {
                        icon.classList.remove('fa-chevron-down');
                        icon.classList.add('fa-chevron-up');
                    }
                }
            } catch (e) {
                console.warn('Failed to show wind panel:', e);
            }
        }
        
        // Update UI
        drawRouteLine();
        updateDistanceInfo(); // This will automatically populate the aircraft list
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
    
    // Populate the aircraft list in the UI
    function populateAircraftList(aircraftList) {
        const listContainer = document.getElementById('aircraft-list');
        
        // Clear previous content
        listContainer.innerHTML = '';
        
        if (aircraftList.length === 0) {
            // Show empty state message
            listContainer.innerHTML = `
                <div class="text-center text-muted py-3">
                    <i class="fas fa-plane-slash fa-2x mb-2"></i>
                    <p>No aircraft selected. Use the search feature to add aircraft.</p>
                </div>
            `;
            return;
        }
        
        // Create a list element for the aircraft
        const list = document.createElement('ul');
        list.className = 'list-group';
        
        // Add each aircraft to the list with a remove button
        aircraftList.forEach(aircraft => {
            const listItem = document.createElement('li');
            listItem.className = 'list-group-item d-flex justify-content-between align-items-center';
            
            // Create name span
            const nameSpan = document.createElement('span');
            nameSpan.textContent = aircraft.name;
            listItem.appendChild(nameSpan);
            
            // Create remove button
            const removeBtn = document.createElement('button');
            removeBtn.className = 'btn btn-sm btn-outline-danger';
            removeBtn.innerHTML = '<i class="fas fa-times"></i>';
            removeBtn.title = 'Remove aircraft';
            removeBtn.type = 'button';
            
            // Add click handler to remove aircraft from selection
            removeBtn.addEventListener('click', function() {
                // Find index of aircraft to remove
                const index = selectedAircraft.findIndex(a => a.name === aircraft.name);
                
                if (index !== -1) {
                    // Remove from selected aircraft array
                    selectedAircraft.splice(index, 1);
                    
                    // Update the list display
                    populateAircraftList(selectedAircraft);
                    
                    // Recalculate flight times
                    calculateFlightTimes();
                }
            });
            
            listItem.appendChild(removeBtn);
            list.appendChild(listItem);
        });
        
        // Add the list to the container
        listContainer.appendChild(list);
        
        // Store the current aircraft list
        selectedAircraft = [...aircraftList];
    }
    
    // Updated filter function
    function updateAircraftFilters() {
        if (!pointA || !pointB) return;
        
        // Get current filter settings
        const showAllAircraft = document.getElementById('show-all-range').checked;
        const distanceKm = calculateDistance(pointA, pointB);
        const classification = document.getElementById('aircraft-classification').value;
        
        // Filter aircraft based on current filters
        let filteredAircraft = [...selectedAircraft];
        
        // Apply range filter if needed
        if (!showAllAircraft) {
            filteredAircraft = filteredAircraft.filter(aircraft => aircraft.range_km >= distanceKm);
            
            if (filteredAircraft.length === 0 && selectedAircraft.length > 0) {
                showAlert('No aircraft with sufficient range for this distance. Enable "Show All Aircraft" to see all options.', 'warning');
            }
        }
        
        // Apply classification filter if needed
        if (classification !== 'all') {
            const classFiltered = filteredAircraft.filter(aircraft => {
                const aircraftClassification = aircraft.category_type || aircraft.classification;
                return aircraftClassification === classification;
            });
            
            if (classFiltered.length === 0 && filteredAircraft.length > 0) {
                showAlert(`No aircraft matching the "${classification}" classification with sufficient range.`, 'info');
            } else {
                filteredAircraft = classFiltered;
            }
        }
        
        // Update the UI with filtered aircraft
        populateAircraftList(filteredAircraft);
        
        // Recalculate flight times
        calculateFlightTimes();
    }
    
    // Select all aircraft in the filter list
    function selectAllAircraft() {
        // Add all aircraft that meet filter criteria
        const showAllAircraft = document.getElementById('show-all-range').checked;
        const classification = document.getElementById('aircraft-classification').value;
        let filteredAircraft = [];
        
        if (pointA && pointB) {
            const distanceKm = calculateDistance(pointA, pointB);
            
            // Filter aircraft by range and classification
            filteredAircraft = allAircraft.filter(aircraft => {
                // Filter by range if needed
                if (!showAllAircraft && aircraft.range_km < distanceKm) {
                    return false;
                }
                
                // Filter by classification if not set to "all"
                if (classification !== 'all') {
                    const aircraftClassification = aircraft.category_type || aircraft.classification;
                    if (aircraftClassification !== classification) {
                        return false;
                    }
                }
                
                return true;
            });
        } else {
            // If no points selected, include all aircraft based on classification
            filteredAircraft = allAircraft.filter(aircraft => {
                if (classification !== 'all') {
                    const aircraftClassification = aircraft.category_type || aircraft.classification;
                    return aircraftClassification === classification;
                }
                return true;
            });
        }
        
        // Update the list
        populateAircraftList(filteredAircraft);
        showAlert(`Added ${filteredAircraft.length} aircraft to your selection.`, 'success');
    }
    
    // Clear all aircraft in the filter list
    function clearAllAircraft() {
        selectedAircraft = [];
        populateAircraftList([]);
        showAlert('All aircraft removed from your selection.', 'info');
    }
    
    // Get names of all selected aircraft
    function getSelectedAircraftNames() {
        // Simply return the names from our selectedAircraft array
        return selectedAircraft.map(aircraft => aircraft.name);
    }
    
    // Update the aircraft list based on current filters
    function updateAircraftList() {
        // If no points selected yet, nothing to filter
        if (!pointA || !pointB) return;
        
        // Get showAllAircraft setting for range filter
        const showAllAircraft = document.getElementById('show-all-range').checked;
        const distanceKm = calculateDistance(pointA, pointB);
        
        // Get classification filter
        const classification = document.getElementById('aircraft-classification').value;
        
        // Filter aircraft by range and classification
        let filteredAircraft = allAircraft.filter(aircraft => {
            // Filter by range if needed
            if (!showAllAircraft && aircraft.range_km < distanceKm) {
                return false;
            }
            
            // Filter by classification if not set to "all"
            if (classification !== 'all') {
                const aircraftClassification = aircraft.category_type || aircraft.classification;
                if (aircraftClassification !== classification) {
                    return false;
                }
            }
            
            return true;
        });
        
        // Populate the aircraft list
        populateAircraftList(filteredAircraft);
    }
    
    // New function: Search for aircraft and display results
    function searchAircraft() {
        const searchTerm = document.getElementById('aircraft-search').value.toLowerCase().trim();
        
        if (!searchTerm) {
            showAlert('Please enter a search term.', 'warning');
            return;
        }
        
        // Clear previous search results
        const resultsContainer = document.getElementById('aircraft-search-results');
        resultsContainer.innerHTML = '';
        
        // Get filter settings
        const showAllAircraft = document.getElementById('show-all-range').checked;
        const distanceKm = pointA && pointB ? calculateDistance(pointA, pointB) : 0;
        const classification = document.getElementById('aircraft-classification').value;
        
        // Filter aircraft based on search term, range, and classification
        const matchingAircraft = allAircraft.filter(aircraft => {
            if (!aircraft.name.toLowerCase().includes(searchTerm)) return false;
            if (pointA && pointB && !showAllAircraft && aircraft.range_km < distanceKm) return false;
            if (classification !== 'all') {
                const aircraftClassification = aircraft.category_type || aircraft.classification;
                if (aircraftClassification !== classification) return false;
            }
            return true;
        });
        
        if (matchingAircraft.length > 0) {
            // Create header for search results
            const header = document.createElement('h6');
            header.className = 'mb-2';
            header.textContent = `Found ${matchingAircraft.length} aircraft matching "${searchTerm}"`;
            resultsContainer.appendChild(header);
            
            // Create list of matching aircraft
            const resultsList = document.createElement('ul');
            resultsList.className = 'list-group mb-3';
            
            // Create list items for each matching aircraft
            matchingAircraft.forEach(aircraft => {
                const listItem = document.createElement('li');
                listItem.className = 'list-group-item d-flex justify-content-between align-items-center';
                
                // Check if this aircraft is already in the selected list
                const isAlreadySelected = selectedAircraft.some(a => a.name === aircraft.name);
                
                // Create aircraft name display
                const nameSpan = document.createElement('span');
                nameSpan.textContent = aircraft.name;
                listItem.appendChild(nameSpan);
                
                // Create add button or "Added" indicator
                if (isAlreadySelected) {
                    const badge = document.createElement('span');
                    badge.className = 'badge bg-success';
                    badge.textContent = 'Already added';
                    listItem.appendChild(badge);
                } else {
                    const addBtn = document.createElement('button');
                    addBtn.className = 'btn btn-sm btn-primary';
                    addBtn.textContent = 'Add';
                    addBtn.addEventListener('click', function() {
                        if (addAircraftToList(aircraft)) {
                            // Update this button to show added state
                            addBtn.disabled = true;
                            addBtn.textContent = 'Added';
                            addBtn.className = 'btn btn-sm btn-success';
                        }
                    });
                    listItem.appendChild(addBtn);
                }
                
                resultsList.appendChild(listItem);
            });
            
            resultsContainer.appendChild(resultsList);
            
            // Add "Add All" button if there are any unselected aircraft
            const unselectedAircraft = matchingAircraft.filter(
                aircraft => !selectedAircraft.some(a => a.name === aircraft.name)
            );
            
            if (unselectedAircraft.length > 0) {
                const addAllBtn = document.createElement('button');
                addAllBtn.className = 'btn btn-sm btn-outline-primary';
                addAllBtn.textContent = `Add All Matching Aircraft (${unselectedAircraft.length})`;
                addAllBtn.addEventListener('click', function() {
                    let addedCount = 0;
                    
                    unselectedAircraft.forEach(aircraft => {
                        if (addAircraftToList(aircraft)) {
                            addedCount++;
                        }
                    });
                    
                    if (addedCount > 0) {
                        // Update search results to reflect that all have been added
                        searchAircraft();
                        
                        // Notify user
                        const plural = addedCount > 1 ? 's' : '';
                        showAlert(`Added ${addedCount} aircraft${plural} to your selection.`, 'success');
                    } else {
                        showAlert('All matching aircraft already added.', 'info');
                    }
                });
                
                resultsContainer.appendChild(addAllBtn);
            }
            
            // Show the results container
            resultsContainer.classList.remove('d-none');
        } else {
            // No matching aircraft found
            const noResults = document.createElement('div');
            noResults.className = 'alert alert-warning';
            noResults.textContent = `No aircraft found matching "${searchTerm}"`;
            resultsContainer.appendChild(noResults);
            resultsContainer.classList.remove('d-none');
        }
    }
    
    // Add an aircraft to the selected list if not already present
    function addAircraftToList(aircraft) {
        // Check if aircraft is already in the selected list
        const existingIndex = selectedAircraft.findIndex(a => a.name === aircraft.name);
        
        if (existingIndex === -1) {
            // Add to selected aircraft list
            selectedAircraft.push(aircraft);
            
            // Re-populate the list with the updated selection
            populateAircraftList(selectedAircraft);
            
            // Return true to indicate aircraft was added
            return true;
        }
        
        // Return false to indicate aircraft was already in the list
        return false;
    }
}); 