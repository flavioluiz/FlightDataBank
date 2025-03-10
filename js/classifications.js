// Global classifications data
let classificationsData = null;

// Load classifications data
async function loadClassifications() {
    if (classificationsData) {
        return classificationsData;
    }

    try {
        const response = await fetch('data/classifications.json');
        if (!response.ok) {
            throw new Error(`Failed to load classifications: ${response.status}`);
        }
        
        classificationsData = await response.json();
        console.log('Classifications loaded successfully');
        return classificationsData;
    } catch (error) {
        console.error('Error loading classifications:', error);
        throw error;
    }
}

// Get classification by ID
function getClassification(id) {
    if (!classificationsData) {
        console.error('Classifications not loaded');
        return null;
    }
    
    return classificationsData.classifications.find(c => c.id === id);
}

// Get all classifications
function getAllClassifications() {
    if (!classificationsData) {
        console.error('Classifications not loaded');
        return [];
    }
    
    return classificationsData.classifications;
}

// Get color for a value in a classification
function getColorForValue(classificationId, value) {
    if (!classificationsData || !classificationsData.colorSchemes[classificationId]) {
        return '#777777'; // Default gray
    }
    
    return classificationsData.colorSchemes[classificationId][value] || '#777777';
}

// Get label for a value in a classification
function getLabelForValue(classificationId, value) {
    const classification = getClassification(classificationId);
    if (!classification) return value;
    
    const option = classification.options.find(opt => opt.value === value);
    return option ? option.label : value;
}

// Populate a select element with classification options
function populateSelectWithClassification(selectElement, classificationId, includeAllOption = true) {
    if (!selectElement) return;
    
    const classification = getClassification(classificationId);
    if (!classification) return;
    
    // Clear existing options
    selectElement.innerHTML = '';
    
    // Add "All" option if requested
    if (includeAllOption) {
        const allOption = document.createElement('option');
        allOption.value = 'all';
        allOption.textContent = `All ${classification.label}s`;
        selectElement.appendChild(allOption);
    }
    
    // Add options from classification
    classification.options.forEach(option => {
        const optElement = document.createElement('option');
        optElement.value = option.value;
        optElement.textContent = option.label;
        selectElement.appendChild(optElement);
    });
}

// Create filter buttons for a classification
function createFilterButtonsForClassification(containerId, classificationId, onFilterChange) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const classification = getClassification(classificationId);
    if (!classification) return;
    
    // Add heading
    const heading = document.createElement('h6');
    heading.textContent = classification.label;
    container.appendChild(heading);
    
    // Add buttons container
    const buttonsContainer = document.createElement('div');
    buttonsContainer.className = 'mb-3';
    container.appendChild(buttonsContainer);
    
    // Add buttons
    classification.options.forEach(option => {
        const btn = document.createElement('button');
        btn.className = 'btn btn-sm btn-outline-primary filter-btn';
        btn.textContent = option.label;
        btn.dataset.classification = classificationId;
        btn.dataset.value = option.value;
        btn.dataset.field = classification.field;
        
        btn.addEventListener('click', function() {
            this.classList.toggle('active');
            if (onFilterChange) onFilterChange();
        });
        
        buttonsContainer.appendChild(btn);
    });
}

// Get active filters from filter buttons
function getActiveFilters(container) {
    const activeFilters = {};
    
    const activeButtons = container.querySelectorAll('.filter-btn.active');
    activeButtons.forEach(btn => {
        const field = btn.dataset.field;
        const value = btn.dataset.value;
        
        if (!activeFilters[field]) {
            activeFilters[field] = [];
        }
        
        activeFilters[field].push(value);
    });
    
    return activeFilters;
}

// Apply filters to data
function applyFiltersToData(data, filters) {
    if (!filters || Object.keys(filters).length === 0) {
        return data;
    }
    
    return data.filter(item => {
        for (const [field, values] of Object.entries(filters)) {
            if (values.length === 0) continue;
            
            if (!item[field] || !values.includes(item[field])) {
                return false;
            }
        }
        
        return true;
    });
}

// Apply search filter to data
function applySearchToData(data, searchTerm, searchFields = ['name', 'manufacturer']) {
    if (!searchTerm) {
        return data;
    }
    
    const term = searchTerm.toLowerCase();
    
    return data.filter(item => {
        return searchFields.some(field => {
            return item[field] && item[field].toString().toLowerCase().includes(term);
        });
    });
} 