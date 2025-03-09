// Function to load aircraft data
async function loadAircraftData() {
    try {
        const response = await fetch('data/processed/aircraft_processed.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data.aircraft;
    } catch (error) {
        console.error('Error loading aircraft data:', error);
        showError('Failed to load aircraft data. Please try again later.');
        return [];
    }
}

// Function to show error message
function showError(message) {
    const detailsContainer = document.getElementById('aircraft-details');
    detailsContainer.innerHTML = `
        <div class="alert alert-danger">
            <h4 class="alert-heading">Error</h4>
            <p>${message}</p>
            <hr>
            <p class="mb-0">
                <a href="aircraft-list.html" class="alert-link">Return to Aircraft List</a>
            </p>
        </div>
    `;
}

// Function to format numeric values with units
function formatValue(value, unit) {
    if (value === null || value === undefined) return 'N/A';
    return `${Number(value).toLocaleString(undefined, {maximumFractionDigits: 2})} ${unit}`;
}

// Function to create a detail row
function createDetailRow(label, value) {
    return `
        <div class="row mb-2">
            <div class="col-md-4 fw-bold">${label}:</div>
            <div class="col-md-8">${value}</div>
        </div>
    `;
}

// Function to display aircraft details
function displayAircraftDetails(aircraft) {
    if (!aircraft) {
        showError('Aircraft not found.');
        return;
    }

    const detailsContainer = document.getElementById('aircraft-details');
    
    const html = `
        <div class="card">
            <div class="card-header bg-primary text-white">
                <h2 class="mb-0">${aircraft.name}</h2>
            </div>
            <div class="card-body">
                <div class="row">
                    <div class="col-md-8">
                        <div class="details-section">
                            <h4>Basic Information</h4>
                            ${createDetailRow('Manufacturer', aircraft.manufacturer)}
                            ${createDetailRow('Model', aircraft.model)}
                            ${createDetailRow('First Flight Year', aircraft.first_flight_year)}
                            ${createDetailRow('Category', aircraft.category_type)}
                        </div>

                        <div class="details-section mt-4">
                            <h4>Physical Characteristics</h4>
                            ${createDetailRow('Maximum Takeoff Weight', formatValue(aircraft.mtow_N, 'N'))}
                            ${createDetailRow('Wing Area', formatValue(aircraft.wing_area_m2, 'm²'))}
                            ${createDetailRow('Wingspan', formatValue(aircraft.wingspan_m, 'm'))}
                            ${createDetailRow('Wing Loading', formatValue(aircraft.wing_loading_Nm2, 'N/m²'))}
                            ${createDetailRow('Aspect Ratio', formatValue(aircraft.aspect_ratio, ''))}
                            ${aircraft.length_m ? createDetailRow('Length', formatValue(aircraft.length_m, 'm')) : ''}
                            ${aircraft.height_m ? createDetailRow('Height', formatValue(aircraft.height_m, 'm')) : ''}
                        </div>

                        <div class="details-section mt-4">
                            <h4>Performance</h4>
                            ${createDetailRow('Cruise Speed (TAS)', formatValue(aircraft.cruise_speed_ms, 'm/s'))}
                            ${createDetailRow('Cruise Speed (VE)', formatValue(aircraft.VE_cruise_ms, 'm/s'))}
                            ${createDetailRow('Takeoff Speed', formatValue(aircraft.takeoff_speed_ms, 'm/s'))}
                            ${createDetailRow('Landing Speed', formatValue(aircraft.landing_speed_ms, 'm/s'))}
                            ${createDetailRow('Service Ceiling', formatValue(aircraft.service_ceiling_m, 'm'))}
                            ${createDetailRow('Cruise Altitude', formatValue(aircraft.cruise_altitude_m, 'm'))}
                            ${aircraft.range_km ? createDetailRow('Range', formatValue(aircraft.range_km, 'km')) : ''}
                            ${aircraft.max_roc_ms ? createDetailRow('Maximum Rate of Climb', formatValue(aircraft.max_roc_ms, 'm/s')) : ''}
                        </div>

                        <div class="details-section mt-4">
                            <h4>Aerodynamic Characteristics</h4>
                            ${createDetailRow('Cruise Lift Coefficient', formatValue(aircraft.CL_cruise, ''))}
                            ${aircraft.CL_takeoff ? createDetailRow('Takeoff Lift Coefficient', formatValue(aircraft.CL_takeoff, '')) : ''}
                            ${aircraft.CL_landing ? createDetailRow('Landing Lift Coefficient', formatValue(aircraft.CL_landing, '')) : ''}
                            ${aircraft.thrust_to_weight_ratio ? createDetailRow('Thrust-to-Weight Ratio', formatValue(aircraft.thrust_to_weight_ratio, '')) : ''}
                        </div>

                        <div class="details-section mt-4">
                            <h4>Propulsion</h4>
                            ${createDetailRow('Engine Type', aircraft.engine_type)}
                            ${createDetailRow('Number of Engines', aircraft.engine_count)}
                            ${aircraft.max_thrust_kN ? createDetailRow('Maximum Thrust', formatValue(aircraft.max_thrust_kN, 'kN')) : ''}
                            ${aircraft.max_power_kW ? createDetailRow('Maximum Power', formatValue(aircraft.max_power_kW, 'kW')) : ''}
                        </div>
                    </div>
                    <div class="col-md-4">
                        <img src="${aircraft.image_url}" class="img-fluid rounded" alt="${aircraft.name}">
                        ${aircraft.notes ? `<div class="mt-3"><h4>Notes</h4><p>${aircraft.notes}</p></div>` : ''}
                    </div>
                </div>
            </div>
        </div>
    `;

    detailsContainer.innerHTML = html;
}

// Function to handle URL hash changes
async function handleHashChange() {
    const aircraftId = window.location.hash.slice(1); // Remove the # from the hash
    
    if (!aircraftId) {
        window.location.href = 'aircraft-list.html';
        return;
    }

    try {
        const aircraft = await loadAircraftData();
        const selectedAircraft = aircraft.find(a => a.id.toString() === aircraftId);
        
        if (selectedAircraft) {
            displayAircraftDetails(selectedAircraft);
            document.title = `${selectedAircraft.name} - Aircraft Databank`;
        } else {
            showError(`Aircraft with ID ${aircraftId} not found.`);
        }
    } catch (error) {
        console.error('Error loading aircraft details:', error);
        showError('Failed to load aircraft details. Please try again later.');
    }
}

// Event listeners
window.addEventListener('hashchange', handleHashChange);
window.addEventListener('DOMContentLoaded', handleHashChange); 