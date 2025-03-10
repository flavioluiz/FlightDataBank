// Global variables
window.aircraftData = [];

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeControls();
    loadAircraftData();
});

// Initialize controls
function initializeControls() {
    console.log('Initializing aircraft list controls...');
    
    // Get filter elements
    const filters = {
        categoryType: document.getElementById('category-type-filter'),
        categoryEra: document.getElementById('category-era-filter'),
        categoryEngine: document.getElementById('category-engine-filter'),
        categorySize: document.getElementById('category-size-filter'),
        search: document.getElementById('aircraft-search')
    };

    // Add event listeners to filters
    Object.entries(filters).forEach(([key, element]) => {
        if (element) {
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
            ...(birdData.birds || []).map(b => ({...b, type: 'bird'}))
        ];

        // Sort by name
        allData.sort((a, b) => a.name.localeCompare(b.name));

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
        
        // Add category data attributes for filtering
        row.setAttribute('data-category-type', aircraft.category_type || '');
        row.setAttribute('data-category-era', aircraft.category_era || '');
        row.setAttribute('data-category-engine', aircraft.category_engine || '');
        row.setAttribute('data-category-size', aircraft.category_size || '');

        // Create row content with direct link opening in new tab
        row.innerHTML = `
            <td class="aircraft-name"></td>
            <td>${getCategoryName(aircraft.category_type)}</td>
            <td>${getCategoryEra(aircraft.category_era)}</td>
            <td>${aircraft.first_flight_year || '-'}</td>
            <td>${aircraft.mtow_N?.toLocaleString() || '-'}</td>
            <td>${aircraft.wing_area_m2?.toLocaleString() || '-'}</td>
            <td>${aircraft.wingspan_m?.toLocaleString() || '-'}</td>
            <td>${aircraft.cruise_speed_ms?.toLocaleString() || '-'}</td>
            <td>${aircraft.range_km?.toLocaleString() || '-'}</td>
        `;

        // Add aircraft link with tooltip
        const nameCell = row.querySelector('.aircraft-name');
        const link = createAircraftLink(aircraft);
        nameCell.appendChild(link);

        tbody.appendChild(row);
    });

    // Apply any existing filters
    applyFilters();
}

// Apply filters
function applyFilters() {
    console.log('Applying filters...');
    
    const selectedType = document.getElementById('category-type-filter')?.value || 'all';
    const selectedEra = document.getElementById('category-era-filter')?.value || 'all';
    const selectedEngine = document.getElementById('category-engine-filter')?.value || 'all';
    const selectedSize = document.getElementById('category-size-filter')?.value || 'all';
    const searchTerm = document.getElementById('aircraft-search')?.value.toLowerCase() || '';
    
    const rows = document.querySelectorAll('#aircraft-table-body tr');
    
    rows.forEach(row => {
        const name = row.querySelector('.aircraft-name')?.textContent.toLowerCase() || '';
        const type = row.getAttribute('data-category-type') || '';
        const era = row.getAttribute('data-category-era') || '';
        const engine = row.getAttribute('data-category-engine') || '';
        const size = row.getAttribute('data-category-size') || '';
        
        const matchesSearch = name.includes(searchTerm);
        const matchesType = selectedType === 'all' || type === selectedType;
        const matchesEra = selectedEra === 'all' || era === selectedEra;
        const matchesEngine = selectedEngine === 'all' || engine === selectedEngine;
        const matchesSize = selectedSize === 'all' || size === selectedSize;
        
        row.style.display = 
            matchesSearch && matchesType && matchesEra && 
            matchesEngine && matchesSize ? '' : 'none';
    });
}

// Sort table
function sortTable(column) {
    console.log('Sorting table by', column);
    
    const tbody = document.querySelector('#aircraft-table-body');
    const rows = Array.from(tbody.querySelectorAll('tr'));
    
    // Get current sort direction
    const header = document.querySelector(`th[data-sort="${column}"]`);
    const isAscending = !header.classList.contains('sort-asc');
    
    // Update sort indicators
    document.querySelectorAll('th[data-sort]').forEach(th => {
        th.classList.remove('sort-asc', 'sort-desc');
    });
    header.classList.add(isAscending ? 'sort-asc' : 'sort-desc');
    
    // Sort rows
    rows.sort((a, b) => {
        let aValue = getCellValue(a, column);
        let bValue = getCellValue(b, column);
        
        // Handle numeric values
        if (!isNaN(aValue) && !isNaN(bValue)) {
            aValue = parseFloat(aValue);
            bValue = parseFloat(bValue);
        }
        
        if (aValue === bValue) return 0;
        if (isAscending) {
            return aValue > bValue ? 1 : -1;
        } else {
            return aValue < bValue ? 1 : -1;
        }
    });
    
    // Reorder rows in the table
    rows.forEach(row => tbody.appendChild(row));
}

// Helper function to get cell value for sorting
function getCellValue(row, column) {
    const cell = row.querySelector(`td:nth-child(${getColumnIndex(column) + 1})`);
    return cell ? cell.textContent.trim() : '';
}

// Helper function to get column index
function getColumnIndex(column) {
    const headers = document.querySelectorAll('#aircraft-table th');
    for (let i = 0; i < headers.length; i++) {
        if (headers[i].getAttribute('data-sort') === column) {
            return i;
        }
    }
    return 0;
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