// Global variables
let aircraftData = [];
let filteredData = [];
let activeFilters = {
    search: '',
    categories: [],
    eras: [],
    engineTypes: []
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', async function() {
    try {
        // Load aircraft data
        await loadAircraftData();
        
        // Initialize filters
        initializeFilters();
        
        // Initialize event listeners
        initializeEventListeners();
        
        // Render gallery
        renderGallery(aircraftData);
    } catch (error) {
        console.error('Error initializing gallery:', error);
        showAlert('Error initializing gallery: ' + error.message, 'danger');
    }
});

// Load aircraft data
async function loadAircraftData() {
    try {
        document.getElementById('loading').style.display = 'flex';
        
        // Load aircraft data from processed file
        const aircraftResponse = await fetch('data/processed/aircraft_processed.json');
        if (!aircraftResponse.ok) {
            throw new Error(`Failed to load aircraft data: ${aircraftResponse.status}`);
        }
        
        const aircraftJson = await aircraftResponse.json();
        let aircraft = aircraftJson.aircraft || [];
        
        // Load bird data from processed file
        const birdsResponse = await fetch('data/processed/birds_processed.json');
        let birds = [];
        if (birdsResponse.ok) {
            const birdsJson = await birdsResponse.json();
            birds = birdsJson.birds || [];
            console.log(`Loaded ${birds.length} birds`);
        } else {
            console.warn('Failed to load bird data:', birdsResponse.status);
        }
        
        // Combine aircraft and birds
        const combinedData = [
            ...aircraft.map(a => ({
                ...a,
                type: 'aircraft',
                image_url: a.image_url
            })),
            ...birds.map(b => ({
                ...b,
                type: 'bird',
                category_type: 'ave',
                image_url: b.image_url
            }))
        ];
        
        // Filter out items without images
        aircraftData = combinedData.filter(item => item.image_url);
        
        console.log(`Loaded ${aircraft.length} aircraft and ${birds.length} birds`);
        console.log(`Total items with images: ${aircraftData.length}`);
        
        document.getElementById('loading').style.display = 'none';
        
        if (aircraftData.length === 0) {
            showAlert('No aircraft or birds with images found', 'warning');
        }
        
        return aircraftData;
    } catch (error) {
        document.getElementById('loading').style.display = 'none';
        console.error('Error loading data:', error);
        showAlert('Error loading data: ' + error.message, 'danger');
        throw error;
    }
}

// Initialize filters
function initializeFilters() {
    // Extract unique values for filters
    const categories = [...new Set(aircraftData.map(a => a.category_type).filter(Boolean))];
    const eras = [...new Set(aircraftData.map(a => a.era).filter(Boolean))];
    const engineTypes = [...new Set(aircraftData.map(a => a.engine_type).filter(Boolean))];
    
    // Create category filter buttons
    const categoryFiltersContainer = document.getElementById('category-filters');
    categories.forEach(category => {
        const btn = createFilterButton(category, 'category');
        categoryFiltersContainer.appendChild(btn);
    });
    
    // Create era filter buttons
    const eraFiltersContainer = document.getElementById('era-filters');
    eras.forEach(era => {
        const btn = createFilterButton(era, 'era');
        eraFiltersContainer.appendChild(btn);
    });
    
    // Create engine type filter buttons
    const engineFiltersContainer = document.getElementById('engine-filters');
    engineTypes.forEach(engineType => {
        const btn = createFilterButton(engineType, 'engine');
        engineFiltersContainer.appendChild(btn);
    });
}

// Create a filter button
function createFilterButton(value, type) {
    const btn = document.createElement('button');
    btn.className = 'btn btn-sm btn-outline-primary filter-btn';
    btn.textContent = value;
    btn.dataset.value = value;
    btn.dataset.type = type;
    
    btn.addEventListener('click', function() {
        toggleFilter(this);
    });
    
    return btn;
}

// Toggle filter state
function toggleFilter(button) {
    const value = button.dataset.value;
    const type = button.dataset.type;
    
    button.classList.toggle('active');
    
    if (button.classList.contains('active')) {
        // Add filter
        if (type === 'category') {
            activeFilters.categories.push(value);
        } else if (type === 'era') {
            activeFilters.eras.push(value);
        } else if (type === 'engine') {
            activeFilters.engineTypes.push(value);
        }
    } else {
        // Remove filter
        if (type === 'category') {
            activeFilters.categories = activeFilters.categories.filter(v => v !== value);
        } else if (type === 'era') {
            activeFilters.eras = activeFilters.eras.filter(v => v !== value);
        } else if (type === 'engine') {
            activeFilters.engineTypes = activeFilters.engineTypes.filter(v => v !== value);
        }
    }
    
    applyFilters();
}

// Initialize event listeners
function initializeEventListeners() {
    // Search input
    const searchInput = document.getElementById('search-input');
    searchInput.addEventListener('input', function() {
        activeFilters.search = this.value.trim().toLowerCase();
        applyFilters();
    });
    
    // Clear filters button
    const clearFiltersBtn = document.getElementById('clear-filters');
    clearFiltersBtn.addEventListener('click', function() {
        clearFilters();
    });
}

// Clear all filters
function clearFilters() {
    // Reset active filters
    activeFilters = {
        search: '',
        categories: [],
        eras: [],
        engineTypes: []
    };
    
    // Reset search input
    document.getElementById('search-input').value = '';
    
    // Reset filter buttons
    document.querySelectorAll('.filter-btn.active').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Render all aircraft
    renderGallery(aircraftData);
}

// Apply filters to aircraft data
function applyFilters() {
    filteredData = aircraftData.filter(aircraft => {
        // Apply search filter
        if (activeFilters.search && 
            !aircraft.name.toLowerCase().includes(activeFilters.search) &&
            !aircraft.manufacturer?.toLowerCase().includes(activeFilters.search)) {
            return false;
        }
        
        // Apply category filter
        if (activeFilters.categories.length > 0 && 
            !activeFilters.categories.includes(aircraft.category_type)) {
            return false;
        }
        
        // Apply era filter
        if (activeFilters.eras.length > 0 && 
            !activeFilters.eras.includes(aircraft.era)) {
            return false;
        }
        
        // Apply engine type filter
        if (activeFilters.engineTypes.length > 0 && 
            !activeFilters.engineTypes.includes(aircraft.engine_type)) {
            return false;
        }
        
        return true;
    });
    
    renderGallery(filteredData);
}

// Render gallery with filtered data
function renderGallery(data) {
    const galleryGrid = document.getElementById('gallery-grid');
    const noResults = document.getElementById('no-results');
    
    // Clear gallery
    galleryGrid.innerHTML = '';
    
    if (data.length === 0) {
        galleryGrid.style.display = 'none';
        noResults.style.display = 'block';
        return;
    }
    
    galleryGrid.style.display = 'block';
    noResults.style.display = 'none';
    
    // Create gallery items
    data.forEach(aircraft => {
        const item = createGalleryItem(aircraft);
        galleryGrid.appendChild(item);
    });
}

// Create a gallery item
function createGalleryItem(aircraft) {
    const item = document.createElement('div');
    item.className = 'gallery-item';
    item.dataset.id = aircraft.id;
    
    // Create image
    const img = document.createElement('img');
    img.className = 'gallery-img';
    img.src = aircraft.image_url;
    img.alt = aircraft.name;
    img.loading = 'lazy';
    
    // Create caption
    const caption = document.createElement('div');
    caption.className = 'gallery-caption';
    
    // Add bird icon for birds
    const isBird = aircraft.category_type === 'ave';
    caption.innerHTML = `
        <div class="fw-bold">${aircraft.name} ${isBird ? '<i class="fas fa-feather-alt ms-1" title="Bird"></i>' : ''}</div>
        <div>${aircraft.manufacturer || (isBird ? 'Bird Species' : '')}</div>
    `;
    
    // Add click event to open modal
    item.addEventListener('click', function() {
        openAircraftDetails(aircraft);
    });
    
    // Add elements to item
    item.appendChild(img);
    item.appendChild(caption);
    
    return item;
}

// Open aircraft details modal
function openAircraftDetails(aircraft) {
    const modal = new bootstrap.Modal(document.getElementById('aircraft-details-modal'));
    const modalContent = document.getElementById('aircraft-details-content');
    
    // Check if it's a bird
    const isBird = aircraft.category_type === 'ave';
    
    // Create content
    modalContent.innerHTML = `
        <div class="row">
            <div class="col-md-6">
                <img src="${aircraft.image_url}" alt="${aircraft.name}" class="img-fluid rounded">
            </div>
            <div class="col-md-6">
                <h4>${aircraft.name} ${isBird ? '<i class="fas fa-feather-alt ms-1" title="Bird"></i>' : ''}</h4>
                ${isBird ? 
                    `<p><strong>Type:</strong> Bird Species</p>` : 
                    `<p><strong>Manufacturer:</strong> ${aircraft.manufacturer || 'N/A'}</p>
                     <p><strong>Category:</strong> ${aircraft.category_type || 'N/A'}</p>
                     <p><strong>Era:</strong> ${aircraft.era || 'N/A'}</p>
                     <p><strong>Engine Type:</strong> ${aircraft.engine_type || 'N/A'}</p>
                     <p><strong>First Flight:</strong> ${aircraft.first_flight_year || 'N/A'}</p>`
                }
                <p><strong>MTOW:</strong> ${aircraft.mtow_kg ? (aircraft.mtow_kg / 1000).toFixed(2) + ' tons' : 'N/A'}</p>
                <p><strong>Cruise Speed:</strong> ${aircraft.cruise_speed_ms ? (aircraft.cruise_speed_ms * 3.6).toFixed(0) + ' km/h' : 'N/A'}</p>
                <p><strong>Wing Area:</strong> ${aircraft.wing_area_m2 ? aircraft.wing_area_m2.toFixed(1) + ' m²' : 'N/A'}</p>
                ${isBird ? 
                    `<p><strong>Wing Loading:</strong> ${aircraft.wing_loading_Nm2 ? aircraft.wing_loading_Nm2.toFixed(1) + ' N/m²' : 'N/A'}</p>` : 
                    ''
                }
            </div>
        </div>
    `;
    
    // Show modal
    modal.show();
}

// Helper function to show alerts
function showAlert(message, type = 'info') {
    const alertsContainer = document.createElement('div');
    alertsContainer.className = 'alerts-container';
    alertsContainer.style.position = 'fixed';
    alertsContainer.style.top = '10px';
    alertsContainer.style.right = '10px';
    alertsContainer.style.zIndex = '1050';
    
    // Check if container already exists
    const existingContainer = document.querySelector('.alerts-container');
    const container = existingContainer || alertsContainer;
    
    if (!existingContainer) {
        document.body.appendChild(container);
    }
    
    const alert = document.createElement('div');
    alert.className = `alert alert-${type} alert-dismissible fade show`;
    alert.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    container.appendChild(alert);
    
    // Auto-dismiss after 5 seconds
    setTimeout(() => {
        alert.classList.remove('show');
        setTimeout(() => {
            alert.remove();
            if (container.children.length === 0) {
                container.remove();
            }
        }, 150);
    }, 5000);
} 