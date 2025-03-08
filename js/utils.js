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

        // Create content HTML
        const content = `
            <div class="row">
                <div class="col-md-6">
                    <img src="${imageUrl}" class="img-fluid mb-3" alt="${aircraft.name}">
                </div>
                <div class="col-md-6">
                    <h3>${aircraft.name}</h3>
                    <p><strong>Category:</strong> ${getCategoryName(aircraft.category_type)}</p>
                    <p><strong>Era:</strong> ${getCategoryEra(aircraft.category_era)}</p>
                    <p><strong>First Flight:</strong> ${aircraft.first_flight_year}</p>
                    <p><strong>MTOW:</strong> ${aircraft.mtow_N?.toLocaleString()} N</p>
                    <p><strong>Wing Area:</strong> ${aircraft.wing_area_m2?.toLocaleString()} m²</p>
                    <p><strong>Wingspan:</strong> ${aircraft.wingspan_m?.toLocaleString()} m</p>
                    <p><strong>Cruise Speed:</strong> ${aircraft.cruise_speed_ms?.toLocaleString()} m/s</p>
                    <p><strong>Range:</strong> ${aircraft.range_km?.toLocaleString()} km</p>
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