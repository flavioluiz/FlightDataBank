// Function to show alert messages
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

// Function to get category name
function getCategoryName(categoryType) {
    const categoryMap = {
        'comercial': 'Commercial Aviation',
        'executiva': 'Business Aircraft',
        'carga': 'Cargo Aviation',
        'militar': 'Military Aviation',
        'geral': 'General Aviation',
        'historica': 'Historical Aircraft',
        'experimental': 'Experimental Aircraft',
        'ave': 'Bird'
    };
    return categoryMap[categoryType] || categoryType;
}

// Function to get era category name
function getCategoryEra(era) {
    const eraMap = {
        'pioneiro': 'Pioneer',
        'entreguerras': 'Interwar',
        'ww2': 'World War II',
        'pos-guerra': 'Post-War',
        'jato': 'Jet Age',
        'moderno': 'Modern',
        'contemporaneo': 'Contemporary'
    };
    return eraMap[era] || era;
}

// Function to categorize aircraft
function categorizeAircraft(aircraft) {
    // Add any additional categorization logic here
    return aircraft;
}

// Function to view aircraft details
async function viewAircraftDetails(aircraftId) {
    try {
        console.log('Viewing aircraft details for ID:', aircraftId);
        console.log('Current aircraftData:', window.aircraftData);
        
        // Convert aircraftId to number since IDs in the data are numbers
        const numericId = parseInt(aircraftId, 10);
        console.log('Converted ID to number:', numericId);
        
        // Get the aircraft data from the global variable in aircraft-list.js
        const aircraft = window.aircraftData?.find(a => {
            console.log('Comparing aircraft:', a.id, numericId, a.id === numericId);
            return a.id === numericId;
        });
        
        if (!aircraft) {
            console.log('Available IDs:', window.aircraftData?.map(a => a.id));
            throw new Error('Aircraft not found');
        }

        const modalContent = document.getElementById('aircraft-details-content');
        if (!modalContent) {
            throw new Error('Modal content element not found');
        }

        // Get image URL
        const imageUrl = await getValidImageUrl(aircraft);

        // Helper function to format values with units
        const formatValue = (value, unit, decimals = 2) => {
            if (value === undefined || value === null) return '-';
            return `${Number(value).toLocaleString('en-US', { maximumFractionDigits: decimals })} ${unit}`;
        };

        // Convert speeds from m/s to km/h for better readability
        const msToKmh = (ms) => ms ? (ms * 3.6) : null;
        
        // Calculate derived values
        const wingLoading = aircraft.mtow_N && aircraft.wing_area_m2 
            ? (aircraft.mtow_N / aircraft.wing_area_m2)
            : null;
            
        const aspectRatio = aircraft.wingspan_m && aircraft.wing_area_m2 
            ? ((aircraft.wingspan_m * aircraft.wingspan_m) / aircraft.wing_area_m2)
            : null;

        // Create content HTML
        const content = `
            <div class="row">
                <div class="col-md-5">
                    <img src="${imageUrl}" class="img-fluid mb-3 rounded shadow" alt="${aircraft.name}" style="max-height: 300px; width: 100%; object-fit: cover;">
                    <div class="card mb-3">
                        <div class="card-body">
                            <h5 class="card-title">${aircraft.manufacturer} ${aircraft.model}</h5>
                            <p class="card-text">
                                <span class="badge bg-primary">${getCategoryName(aircraft.category_type)}</span>
                                <span class="badge bg-secondary">${getCategoryEra(aircraft.category_era)}</span>
                            </p>
                            <p class="card-text"><small class="text-muted">First Flight: ${aircraft.first_flight_year || '-'}</small></p>
                        </div>
                    </div>
                </div>
                <div class="col-md-7">
                    <nav>
                        <div class="nav nav-tabs" id="nav-tab" role="tablist">
                            <button class="nav-link active" data-bs-toggle="tab" data-bs-target="#specs" type="button">Specifications</button>
                            <button class="nav-link" data-bs-toggle="tab" data-bs-target="#performance" type="button">Performance</button>
                            <button class="nav-link" data-bs-toggle="tab" data-bs-target="#engine" type="button">Engine</button>
                        </div>
                    </nav>
                    <div class="tab-content pt-3" id="nav-tabContent">
                        <div class="tab-pane fade show active" id="specs">
                            <div class="row">
                                <div class="col-md-6">
                                    <h6>Weight</h6>
                                    <p><strong>MTOW:</strong> ${formatValue(aircraft.mtow_N / 9.81, 'kg')}</p>
                                    <p><strong>Empty Weight:</strong> ${formatValue(aircraft.empty_weight_N / 9.81, 'kg')}</p>
                                    <p><strong>Max Payload:</strong> ${formatValue(aircraft.max_payload_N / 9.81, 'kg')}</p>
                                </div>
                                <div class="col-md-6">
                                    <h6>Dimensions</h6>
                                    <p><strong>Wing Area:</strong> ${formatValue(aircraft.wing_area_m2, 'm²')}</p>
                                    <p><strong>Wingspan:</strong> ${formatValue(aircraft.wingspan_m, 'm')}</p>
                                    <p><strong>Length:</strong> ${formatValue(aircraft.length_m, 'm')}</p>
                                    <p><strong>Height:</strong> ${formatValue(aircraft.height_m, 'm')}</p>
                                </div>
                            </div>
                            <div class="row mt-3">
                                <div class="col-md-6">
                                    <h6>Wing Characteristics</h6>
                                    <p><strong>Wing Loading:</strong> ${formatValue(wingLoading, 'N/m²')}</p>
                                    <p><strong>Aspect Ratio:</strong> ${formatValue(aspectRatio, '', 1)}</p>
                                </div>
                            </div>
                        </div>
                        <div class="tab-pane fade" id="performance">
                            <div class="row">
                                <div class="col-md-6">
                                    <h6>Speeds</h6>
                                    <p><strong>Cruise Speed:</strong> ${formatValue(msToKmh(aircraft.cruise_speed_ms), 'km/h')}</p>
                                    <p><strong>Max Speed:</strong> ${formatValue(msToKmh(aircraft.max_speed_ms), 'km/h')}</p>
                                    <p><strong>Takeoff Speed:</strong> ${formatValue(msToKmh(aircraft.takeoff_speed_ms), 'km/h')}</p>
                                    <p><strong>Landing Speed:</strong> ${formatValue(msToKmh(aircraft.landing_speed_ms), 'km/h')}</p>
                                </div>
                                <div class="col-md-6">
                                    <h6>Flight Characteristics</h6>
                                    <p><strong>Service Ceiling:</strong> ${formatValue(aircraft.service_ceiling_m, 'm')}</p>
                                    <p><strong>Cruise Altitude:</strong> ${formatValue(aircraft.cruise_altitude_m, 'm')}</p>
                                    <p><strong>Range:</strong> ${formatValue(aircraft.range_km, 'km')}</p>
                                    <p><strong>Endurance:</strong> ${formatValue(aircraft.endurance_s / 3600, 'h')}</p>
                                </div>
                            </div>
                        </div>
                        <div class="tab-pane fade" id="engine">
                            <div class="row">
                                <div class="col-md-6">
                                    <h6>Engine Details</h6>
                                    <p><strong>Type:</strong> ${aircraft.engine_type || '-'}</p>
                                    <p><strong>Count:</strong> ${aircraft.engine_count || '-'}</p>
                                    <p><strong>Max Thrust:</strong> ${formatValue(aircraft.max_thrust, 'kN')}</p>
                                    <p><strong>Max Power:</strong> ${formatValue(aircraft.max_power_W / 1000, 'kW')}</p>
                                </div>
                                <div class="col-md-6">
                                    <h6>Fuel</h6>
                                    <p><strong>Fuel Capacity:</strong> ${formatValue(aircraft.fuel_capacity_N / 9.81, 'kg')}</p>
                                    <p><strong>Fuel Consumption:</strong> ${formatValue(aircraft.fuel_consumption_kgs, 'kg/s')}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Update modal content
        modalContent.innerHTML = content;

        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('aircraft-details-modal'));
        modal.show();
    } catch (error) {
        console.error('Error showing aircraft details:', error);
        showAlert('Error showing aircraft details: ' + error.message, 'danger');
    }
}

// Function to check if an image exists and provide a fallback
function getValidImageUrl(aircraft) {
    return new Promise((resolve) => {
        const DEFAULT_FALLBACK_IMAGE = '/images/default.jpg';
        const FALLBACK_IMAGES = {
            'comercial': '/images/commercial.jpg',
            'executiva': '/images/business.jpg',
            'carga': '/images/cargo.jpg',
            'militar': '/images/military.jpg',
            'geral': '/images/general.jpg',
            'historica': '/images/historical.jpg',
            'experimental': '/images/experimental.jpg',
            'ave': '/images/bird.jpg'
        };

        if (!aircraft || !aircraft.image_url) {
            const fallbackUrl = aircraft && aircraft.category_type ? 
                FALLBACK_IMAGES[aircraft.category_type] || DEFAULT_FALLBACK_IMAGE : 
                DEFAULT_FALLBACK_IMAGE;
            resolve(fallbackUrl);
            return;
        }

        // If the image URL is already a local path, use it directly
        if (aircraft.image_url.startsWith('/images/')) {
            resolve(aircraft.image_url);
            return;
        }

        // Check if the image exists
        const img = new Image();
        let resolved = false;

        // Set a timeout in case the image takes too long to load
        const timeout = setTimeout(() => {
            if (!resolved) {
                resolved = true;
                const fallbackUrl = aircraft.category_type ? 
                    FALLBACK_IMAGES[aircraft.category_type] || DEFAULT_FALLBACK_IMAGE : 
                    DEFAULT_FALLBACK_IMAGE;
                resolve(fallbackUrl);
            }
        }, 3000);

        img.onload = function() {
            if (!resolved) {
                resolved = true;
                clearTimeout(timeout);
                resolve(aircraft.image_url);
            }
        };

        img.onerror = function() {
            if (!resolved) {
                resolved = true;
                clearTimeout(timeout);
                const fallbackUrl = aircraft.category_type ? 
                    FALLBACK_IMAGES[aircraft.category_type] || DEFAULT_FALLBACK_IMAGE : 
                    DEFAULT_FALLBACK_IMAGE;
                resolve(fallbackUrl);
            }
        };

        img.src = aircraft.image_url;
    });
} 