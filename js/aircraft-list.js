// Global variables
let aircraftData = [];
let filteredData = [];
let sortColumn = 'name';
let sortDirection = 'asc';

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', async function() {
    try {
        // Load classifications first
        await loadClassifications();
        
        // Initialize controls
        initializeControls();
        
        // Load aircraft data
        await loadAircraftData();
    } catch (error) {
        console.error('Error initializing aircraft list:', error);
        showAlert('Error initializing aircraft list: ' + error.message, 'danger');
    }
});

// Initialize controls
function initializeControls() {
    console.log('Initializing aircraft list controls...');
    
    // Get filter elements
    const filters = {
        categoryType: document.getElementById('category-type-filter'),
        era: document.getElementById('era-filter'),
        engineType: document.getElementById('engine-type-filter'),
        size: document.getElementById('size-filter'),
        search: document.getElementById('aircraft-search')
    };

    // Populate select elements with classifications
    populateSelectWithClassification(filters.categoryType, 'category_type');
    populateSelectWithClassification(filters.era, 'era');
    populateSelectWithClassification(filters.engineType, 'engine_type');
    populateSelectWithClassification(filters.size, 'size');

    // Add event listeners to filters
    Object.entries(filters).forEach(([key, element]) => {
        if (element && key !== 'search') {
            element.addEventListener('change', applyFilters);
        }
    });

    // Add event listener for search input
    if (filters.search) {
        filters.search.addEventListener('input', applyFilters);
    }

    // Add event listeners for table sorting
    const tableHeaders = document.querySelectorAll('#aircraft-table th[data-sort]');
    tableHeaders.forEach(header => {
        header.addEventListener('click', () => {
            const sortKey = header.getAttribute('data-sort');
            sortTable(sortKey);
        });
    });

    console.log('Aircraft list controls initialized successfully');
}

// Load aircraft data
async function loadAircraftData() {
    try {
        // Load aircraft data from processed file
        const aircraftResponse = await fetch('data/processed/aircraft_processed.json');
        if (!aircraftResponse.ok) {
            throw new Error(`Failed to load aircraft data: ${aircraftResponse.status}`);
        }
        const aircraftData = await aircraftResponse.json();

        // Load bird data from processed file
        const birdsResponse = await fetch('data/processed/birds_processed.json');
        let birdData = { birds: [] };
        if (birdsResponse.ok) {
            birdData = await birdsResponse.json();
            console.log('Bird data loaded:', birdData.birds.length, 'birds');
        } else {
            console.warn('Failed to load bird data:', birdsResponse.status);
        }

        // Combine and sort data
        const allData = [
            ...aircraftData.aircraft.map(a => ({...a, type: 'aircraft'})),
            ...(birdData.birds || []).map(b => ({...b, type: 'bird', category_type: 'ave'}))
        ];

        // Sort by name
        allData.sort((a, b) => a.name.localeCompare(b.name));
        
        // Store data globally
        this.aircraftData = allData;

        // Render table
        renderTable(allData);
    } catch (error) {
        console.error('Error loading aircraft data:', error);
        showAlert('Error loading data: ' + error.message, 'danger');
    }
}

// Render table
function renderTable(data) {
    console.log('Rendering table with', data.length, 'items');
    
    const tbody = document.getElementById('aircraft-table-body');
    if (!tbody) {
        console.error('Table body element not found');
        return;
    }

    // Clear existing content
    tbody.innerHTML = '';

    // Create table rows
    data.forEach(aircraft => {
        const row = document.createElement('tr');
        
        // Name column with link
        const nameCell = document.createElement('td');
        nameCell.className = 'aircraft-name';
        const nameLink = createAircraftLink(aircraft);
        nameCell.appendChild(nameLink);
        row.appendChild(nameCell);
        
        // Category type column
        const categoryCell = document.createElement('td');
        categoryCell.textContent = getLabelForValue('category_type', aircraft.category_type) || 'N/A';
        row.appendChild(categoryCell);
        
        // Era column
        const eraCell = document.createElement('td');
        eraCell.textContent = getLabelForValue('era', aircraft.era) || 'N/A';
        row.appendChild(eraCell);
        
        // First flight column
        const firstFlightCell = document.createElement('td');
        firstFlightCell.textContent = aircraft.first_flight_year || 'N/A';
        row.appendChild(firstFlightCell);
        
        // MTOW column
        const mtowCell = document.createElement('td');
        mtowCell.textContent = aircraft.mtow_N ? aircraft.mtow_N.toLocaleString() : 'N/A';
        row.appendChild(mtowCell);
        
        // Wing area column
        const wingAreaCell = document.createElement('td');
        wingAreaCell.textContent = aircraft.wing_area_m2 ? aircraft.wing_area_m2.toFixed(1) : 'N/A';
        row.appendChild(wingAreaCell);
        
        // Wingspan column
        const wingspanCell = document.createElement('td');
        wingspanCell.textContent = aircraft.wingspan_m ? aircraft.wingspan_m.toFixed(1) : 'N/A';
        row.appendChild(wingspanCell);
        
        // Cruise speed column
        const speedCell = document.createElement('td');
        speedCell.textContent = aircraft.cruise_speed_ms ? aircraft.cruise_speed_ms.toFixed(1) : 'N/A';
        row.appendChild(speedCell);
        
        // Range column
        const rangeCell = document.createElement('td');
        rangeCell.textContent = aircraft.range_km ? aircraft.range_km.toLocaleString() : 'N/A';
        row.appendChild(rangeCell);
        
        tbody.appendChild(row);
    });
    
    // Update filtered data
    filteredData = data;
    
    // Show message if no results
    if (data.length === 0) {
        const emptyRow = document.createElement('tr');
        const emptyCell = document.createElement('td');
        emptyCell.colSpan = 9;
        emptyCell.textContent = 'No aircraft match your search criteria.';
        emptyCell.className = 'text-center py-3';
        emptyRow.appendChild(emptyCell);
        tbody.appendChild(emptyRow);
    }
}

// Apply filters
function applyFilters() {
    const categoryType = document.getElementById('category-type-filter')?.value;
    const era = document.getElementById('era-filter')?.value;
    const engineType = document.getElementById('engine-type-filter')?.value;
    const size = document.getElementById('size-filter')?.value;
    const searchTerm = document.getElementById('aircraft-search')?.value.toLowerCase();
    
    console.log('Applying filters:', { categoryType, era, engineType, size, searchTerm });
    
    let filtered = [...aircraftData];
    
    // Apply category type filter
    if (categoryType && categoryType !== 'all') {
        filtered = filtered.filter(aircraft => aircraft.category_type === categoryType);
    }
    
    // Apply era filter
    if (era && era !== 'all') {
        filtered = filtered.filter(aircraft => aircraft.era === era);
    }
    
    // Apply engine type filter
    if (engineType && engineType !== 'all') {
        filtered = filtered.filter(aircraft => aircraft.engine_type === engineType);
    }
    
    // Apply size filter
    if (size && size !== 'all') {
        filtered = filtered.filter(aircraft => aircraft.WTC === size);
    }
    
    // Apply search filter
    if (searchTerm) {
        filtered = filtered.filter(aircraft => {
            return (
                (aircraft.name && aircraft.name.toLowerCase().includes(searchTerm)) ||
                (aircraft.manufacturer && aircraft.manufacturer.toLowerCase().includes(searchTerm))
            );
        });
    }
    
    // Render filtered data
    renderTable(filtered);
}

// Sort table
function sortTable(column) {
    // Toggle sort direction if same column
    if (sortColumn === column) {
        sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
        sortColumn = column;
        sortDirection = 'asc';
    }
    
    // Update header classes
    const headers = document.querySelectorAll('#aircraft-table th[data-sort]');
    headers.forEach(header => {
        header.classList.remove('sort-asc', 'sort-desc');
        if (header.getAttribute('data-sort') === column) {
            header.classList.add(sortDirection === 'asc' ? 'sort-asc' : 'sort-desc');
        }
    });
    
    // Sort data
    filteredData.sort((a, b) => {
        const aValue = getCellValue(a, column);
        const bValue = getCellValue(b, column);
        
        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;
        
        if (typeof aValue === 'number' && typeof bValue === 'number') {
            return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
        } else {
            const aStr = String(aValue).toLowerCase();
            const bStr = String(bValue).toLowerCase();
            return sortDirection === 'asc' ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
        }
    });
    
    // Render sorted data
    renderTable(filteredData);
}

// Get cell value for sorting
function getCellValue(row, column) {
    return row[column];
}

// Create link to aircraft details
function createAircraftLink(aircraft) {
    const link = document.createElement('a');
    link.href = `aircraft_details.html#${aircraft.id}`;
    link.target = '_blank';
    link.textContent = aircraft.name;
    
    // Add tooltip using the tooltip.js utility
    addAircraftTooltip(link, aircraft);
    
    return link;
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