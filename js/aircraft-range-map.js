// Aircraft Range Map JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Initialize variables
    let map;
    let centerMarker = null;
    let rangeCircles = [];
    let selectedAircraft = [];
    let allAircraft = [];
    let centerPoint = null;
    const colors = [
        '#FF5733', '#33FF57', '#3357FF', '#F033FF', '#FF33F0', 
        '#33FFF0', '#F0FF33', '#FF8C33', '#8C33FF', '#33FF8C',
        '#FF3333', '#33FF33', '#3333FF', '#FFFF33', '#FF33FF',
        '#33FFFF', '#FF5733', '#33FF57', '#3357FF', '#F033FF'
    ];
    
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
            setMapCenter(e.latlng);
        });
        
        // Create a legend control
        const legend = L.control({position: 'bottomright'});
        
        legend.onAdd = function(map) {
            const div = L.DomUtil.create('div', 'legend');
            div.innerHTML = '<h6>Selected Aircraft</h6>';
            div.id = 'map-legend';
            return div;
        };
        
        legend.addTo(map);
        
        // Initialize UI elements
        document.getElementById('reset-center').addEventListener('click', resetCenter);
        document.getElementById('clear-all').addEventListener('click', clearAll);
        document.getElementById('aircraft-search').addEventListener('input', filterAircraftList);
    }
    
    // Load aircraft data
    function loadAircraftData() {
        fetch('data/processed/aircraft_processed.json')
            .then(response => response.json())
            .then(data => {
                allAircraft = data.aircraft.filter(aircraft => aircraft.range_km);
                populateAircraftList(allAircraft);
            })
            .catch(error => {
                console.error('Error loading aircraft data:', error);
                document.getElementById('aircraft-list').innerHTML = 
                    '<div class="alert alert-danger">Error loading aircraft data. Please try again later.</div>';
            });
    }
    
    // Populate the aircraft list
    function populateAircraftList(aircraft) {
        const aircraftListElement = document.getElementById('aircraft-list');
        aircraftListElement.innerHTML = '';
        
        aircraft.forEach(aircraft => {
            const listItem = document.createElement('button');
            listItem.className = 'list-group-item list-group-item-action d-flex justify-content-between align-items-center';
            listItem.dataset.id = aircraft.id;
            
            const nameSpan = document.createElement('span');
            nameSpan.textContent = aircraft.name;
            
            const rangeSpan = document.createElement('span');
            rangeSpan.className = 'badge bg-primary rounded-pill';
            rangeSpan.textContent = `${aircraft.range_km.toLocaleString()} km`;
            
            listItem.appendChild(nameSpan);
            listItem.appendChild(rangeSpan);
            
            listItem.addEventListener('click', function() {
                addAircraftToSelection(aircraft);
            });
            
            aircraftListElement.appendChild(listItem);
        });
    }
    
    // Filter the aircraft list based on search input
    function filterAircraftList() {
        const searchTerm = document.getElementById('aircraft-search').value.toLowerCase();
        const filteredAircraft = allAircraft.filter(aircraft => 
            aircraft.name.toLowerCase().includes(searchTerm) ||
            (aircraft.manufacturer && aircraft.manufacturer.toLowerCase().includes(searchTerm)) ||
            (aircraft.model && aircraft.model.toLowerCase().includes(searchTerm))
        );
        
        populateAircraftList(filteredAircraft);
    }
    
    // Add an aircraft to the selection
    function addAircraftToSelection(aircraft) {
        // Check if aircraft is already selected
        if (selectedAircraft.some(a => a.id === aircraft.id)) {
            return;
        }
        
        // Add to selected aircraft array
        selectedAircraft.push(aircraft);
        
        // Update the selected aircraft list UI
        updateSelectedAircraftList();
        
        // Draw range circle if center point is set
        if (centerPoint) {
            drawRangeCircles();
        }
    }
    
    // Remove an aircraft from the selection
    function removeAircraftFromSelection(aircraftId) {
        selectedAircraft = selectedAircraft.filter(a => a.id !== aircraftId);
        updateSelectedAircraftList();
        
        // Redraw range circles
        if (centerPoint) {
            drawRangeCircles();
        }
    }
    
    // Update the selected aircraft list UI
    function updateSelectedAircraftList() {
        const selectedListElement = document.getElementById('selected-aircraft-list');
        selectedListElement.innerHTML = '';
        
        if (selectedAircraft.length === 0) {
            selectedListElement.innerHTML = '<div class="text-muted">No aircraft selected</div>';
            return;
        }
        
        selectedAircraft.forEach((aircraft, index) => {
            const listItem = document.createElement('div');
            listItem.className = 'list-group-item d-flex justify-content-between align-items-center';
            
            const colorIndicator = document.createElement('span');
            colorIndicator.className = 'legend-color';
            colorIndicator.style.backgroundColor = colors[index % colors.length];
            
            const nameSpan = document.createElement('span');
            nameSpan.className = 'ms-2 me-auto';
            nameSpan.textContent = aircraft.name;
            
            const rangeSpan = document.createElement('span');
            rangeSpan.className = 'badge bg-primary rounded-pill me-2';
            rangeSpan.textContent = `${aircraft.range_km.toLocaleString()} km`;
            
            const removeButton = document.createElement('button');
            removeButton.className = 'btn btn-sm btn-outline-danger';
            removeButton.innerHTML = '&times;';
            removeButton.addEventListener('click', function() {
                removeAircraftFromSelection(aircraft.id);
            });
            
            listItem.appendChild(colorIndicator);
            listItem.appendChild(nameSpan);
            listItem.appendChild(rangeSpan);
            listItem.appendChild(removeButton);
            
            selectedListElement.appendChild(listItem);
        });
        
        // Update the legend
        updateLegend();
    }
    
    // Update the map legend
    function updateLegend() {
        const legendElement = document.getElementById('map-legend');
        legendElement.innerHTML = '<h6>Selected Aircraft</h6>';
        
        if (selectedAircraft.length === 0) {
            legendElement.innerHTML += '<div>No aircraft selected</div>';
            return;
        }
        
        selectedAircraft.forEach((aircraft, index) => {
            const item = document.createElement('div');
            item.className = 'legend-item';
            
            const colorIndicator = document.createElement('div');
            colorIndicator.className = 'legend-color';
            colorIndicator.style.backgroundColor = colors[index % colors.length];
            
            const nameSpan = document.createElement('span');
            nameSpan.textContent = `${aircraft.name} (${aircraft.range_km.toLocaleString()} km)`;
            
            item.appendChild(colorIndicator);
            item.appendChild(nameSpan);
            
            legendElement.appendChild(item);
        });
    }
    
    // Set the center point for range circles
    function setMapCenter(latlng) {
        centerPoint = latlng;
        
        // Update center marker
        if (centerMarker) {
            centerMarker.setLatLng(latlng);
        } else {
            centerMarker = L.marker(latlng).addTo(map);
        }
        
        // Update center location display
        document.getElementById('center-location').value = `${latlng.lat.toFixed(4)}, ${latlng.lng.toFixed(4)}`;
        
        // Draw range circles
        drawRangeCircles();
    }
    
    // Draw range circles for all selected aircraft
    function drawRangeCircles() {
        // Clear existing circles
        clearRangeCircles();
        
        // Draw new circles
        selectedAircraft.forEach((aircraft, index) => {
            const color = colors[index % colors.length];
            const rangeInMeters = aircraft.range_km * 1000; // Convert km to meters
            
            const circle = L.circle(centerPoint, {
                color: color,
                fillColor: color,
                fillOpacity: 0.1,
                weight: 2,
                radius: rangeInMeters
            }).addTo(map);
            
            // Add popup with aircraft info
            circle.bindPopup(`
                <strong>${aircraft.name}</strong><br>
                Range: ${aircraft.range_km.toLocaleString()} km<br>
                ${aircraft.manufacturer ? 'Manufacturer: ' + aircraft.manufacturer + '<br>' : ''}
                ${aircraft.first_flight_year ? 'First Flight: ' + aircraft.first_flight_year + '<br>' : ''}
                ${aircraft.cruise_speed_ms ? 'Cruise Speed: ' + (aircraft.cruise_speed_ms * 3.6).toFixed(0) + ' km/h<br>' : ''}
            `);
            
            rangeCircles.push(circle);
        });
    }
    
    // Clear all range circles
    function clearRangeCircles() {
        rangeCircles.forEach(circle => {
            map.removeLayer(circle);
        });
        rangeCircles = [];
    }
    
    // Reset the center point
    function resetCenter() {
        if (centerMarker) {
            map.removeLayer(centerMarker);
            centerMarker = null;
        }
        
        centerPoint = null;
        document.getElementById('center-location').value = '';
        
        clearRangeCircles();
    }
    
    // Clear all selections and reset the map
    function clearAll() {
        resetCenter();
        selectedAircraft = [];
        updateSelectedAircraftList();
        document.getElementById('aircraft-search').value = '';
        filterAircraftList();
    }
    
    // Initialize the application
    initMap();
    loadAircraftData();
}); 