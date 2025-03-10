// Global variables
let aircraftData = [];
let filteredData = [];
let chartParameters = null;
let currentChart = null;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', async function() {
    try {
        // Load classifications first
        await loadClassifications();
        
        // Then load chart parameters
        await loadChartParameters();
        
        // Initialize controls
        initializeControls();
        
        // Load aircraft data
        await loadAircraftData();
    } catch (error) {
        console.error('Error initializing historical charts:', error);
        showAlert('Error initializing historical charts: ' + error.message, 'danger');
    }
});

// Load chart parameters configuration
async function loadChartParameters() {
    try {
        const response = await fetch('data/chart_parameters.json');
        if (!response.ok) {
            throw new Error(`Failed to load chart parameters: ${response.status}`);
        }
        chartParameters = await response.json();
        return chartParameters;
    } catch (error) {
        console.error('Error loading chart parameters:', error);
        showAlert('Error loading chart parameters: ' + error.message, 'danger');
    }
}

// Initialize controls
function initializeControls() {
    console.log('Initializing timeline controls...');
    
    // Get timeline controls
    const controls = {
        param: document.getElementById('timeline-param'),
        colorGroup: document.getElementById('color-group'),
        logScale: document.getElementById('timeline-log-scale')
    };

    if (!chartParameters) {
        console.error('Chart parameters not loaded');
        return;
    }

    // Populate parameter select
    if (controls.param) {
        // Clear existing options
        controls.param.innerHTML = '';

        // Group parameters by category
        const parametersByCategory = {};
        Object.entries(chartParameters.parameters).forEach(([key, param]) => {
            if (!parametersByCategory[param.category]) {
                parametersByCategory[param.category] = [];
            }
            parametersByCategory[param.category].push({key, ...param});
        });

        // Add options grouped by category
        Object.entries(parametersByCategory).forEach(([category, params]) => {
            const categoryInfo = chartParameters.categories[category];
            const group = document.createElement('optgroup');
            group.label = categoryInfo.label;

            params.forEach(param => {
                const option = document.createElement('option');
                option.value = param.key;
                option.textContent = param.label;
                group.appendChild(option);
            });

            controls.param.appendChild(group);
        });

        // Set default value
        controls.param.value = 'cruise_speed_ms';
    }
    
    // Add event listeners
    Object.entries(controls).forEach(([key, element]) => {
        if (element) {
            element.addEventListener('change', updateTimelineChart);
        }
    });
    
    // Initialize filter controls
    initializeFilterControls();
    
    // Add reset zoom button
    const chartContainer = document.querySelector('.chart-container');
    if (chartContainer) {
        const resetZoomBtn = document.createElement('button');
        resetZoomBtn.id = 'reset-zoom';
        resetZoomBtn.className = 'btn btn-sm btn-outline-secondary position-absolute';
        resetZoomBtn.style.top = '10px';
        resetZoomBtn.style.right = '10px';
        resetZoomBtn.style.display = 'none';
        resetZoomBtn.innerHTML = '<i class="fas fa-search-minus"></i> Reset Zoom';
        resetZoomBtn.addEventListener('click', resetZoom);
        chartContainer.appendChild(resetZoomBtn);
    }
    
    console.log('Timeline controls initialized successfully');
}

// Initialize filter controls
function initializeFilterControls() {
    console.log('Initializing filter controls...');
    
    // Get filter elements
    const filters = {
        categoryType: document.getElementById('category-type-filter'),
        era: document.getElementById('era-filter'),
        engineType: document.getElementById('engine-type-filter'),
        size: document.getElementById('size-filter'),
        search: document.getElementById('aircraft-search'),
        clearFilters: document.getElementById('clear-filters')
    };

    // Populate select elements with classifications
    populateSelectWithClassification(filters.categoryType, 'category_type');
    populateSelectWithClassification(filters.era, 'era');
    populateSelectWithClassification(filters.engineType, 'engine_type');
    populateSelectWithClassification(filters.size, 'size');

    // Add event listeners to filters
    Object.entries(filters).forEach(([key, element]) => {
        if (element && key !== 'clearFilters') {
            if (key === 'search') {
                element.addEventListener('input', applyFilters);
            } else {
                element.addEventListener('change', applyFilters);
            }
        }
    });

    // Add event listener for clear filters button
    if (filters.clearFilters) {
        filters.clearFilters.addEventListener('click', clearFilters);
    }
    
    console.log('Filter controls initialized successfully');
}

// Clear all filters
function clearFilters() {
    console.log('Clearing all filters');
    
    // Reset filter selects
    document.getElementById('category-type-filter').value = 'all';
    document.getElementById('era-filter').value = 'all';
    document.getElementById('engine-type-filter').value = 'all';
    document.getElementById('size-filter').value = 'all';
    
    // Clear search input
    document.getElementById('aircraft-search').value = '';
    
    // Reset filtered data
    filteredData = [...aircraftData];
    
    // Update chart
    updateTimelineChart();
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
    
    // Update filtered data
    filteredData = filtered;
    
    // Update chart
    updateTimelineChart();
}

// Reset zoom function
function resetZoom() {
    if (currentChart) {
        currentChart.resetZoom();
        document.getElementById('reset-zoom').style.display = 'none';
    }
}

// Load aircraft data
async function loadAircraftData() {
    try {
        console.log('Loading aircraft data...');
        
        // Load aircraft data
        const aircraftResponse = await fetch('data/processed/aircraft_processed.json');
        if (!aircraftResponse.ok) {
            throw new Error(`Failed to load aircraft data: ${aircraftResponse.status}`);
        }
        
        const aircraftJson = await aircraftResponse.json();
        const aircraft = aircraftJson.aircraft || [];
        
        // Filter out aircraft without first_flight_year
        aircraftData = aircraft.filter(a => a.first_flight_year != null).map(a => ({
            ...a,
            type: 'aircraft',
            image_url: a.image_url
        }));
        
        // Initialize filtered data
        filteredData = [...aircraftData];

        console.log('Total data points loaded:', aircraftData.length);
        
        // Update chart with initial values
        updateTimelineChart();
    } catch (error) {
        console.error('Error loading aircraft data:', error);
        showAlert('Error loading data: ' + error.message, 'danger');
    }
}

// Update timeline chart
function updateTimelineChart() {
    const param = document.getElementById('timeline-param')?.value;
    const colorGroup = document.getElementById('color-group')?.value;
    const logScale = document.getElementById('timeline-log-scale')?.checked || false;

    if (!param || !colorGroup) {
        console.error('Missing chart parameters');
        return;
    }

    console.log('Updating timeline chart with parameters:', { param, colorGroup, logScale });

    // Filter and map data for chart
    const data = filteredData.filter(aircraft => {
        return aircraft[param] != null && aircraft.first_flight_year != null;
    }).map(aircraft => {
        // Get the category value
        let categoryValue = aircraft[colorGroup] || 'Unknown';
        
        // For era and engine_type, use the standardized values from classifications
        if (colorGroup === 'era' || colorGroup === 'engine_type') {
            // For aircraft, map to standard values if needed
            if (categoryValue !== 'Unknown') {
                const classification = getClassification(colorGroup);
                if (classification) {
                    // Check if the value exists in the classification options
                    const option = classification.options.find(opt => 
                        opt.value === categoryValue || opt.label === categoryValue);
                    
                    // If not found, try to map to a standard value
                    if (!option) {
                        // Map era values to standard values
                        if (colorGroup === 'era') {
                            if (categoryValue.includes('Pioneer')) categoryValue = 'Pioneer Era';
                            else if (categoryValue.includes('Golden')) categoryValue = 'Interwar Period';
                            else if (categoryValue.includes('World War')) categoryValue = 'World War II';
                            else if (categoryValue.includes('Post-War')) categoryValue = 'Post-War Era';
                            else if (categoryValue.includes('Jet')) categoryValue = 'Jet Age';
                            else if (categoryValue.includes('Modern')) categoryValue = 'Modern Era';
                            else if (categoryValue.includes('Digital') || categoryValue.includes('Contemporary')) 
                                categoryValue = 'Contemporary Era';
                        }
                        // Map engine types to standard values
                        else if (colorGroup === 'engine_type') {
                            if (categoryValue.includes('Piston')) categoryValue = 'Piston';
                            else if (categoryValue.includes('Turboprop')) categoryValue = 'Turboprop';
                            else if (categoryValue.includes('Turbofan')) categoryValue = 'Turbofan';
                            else if (categoryValue.includes('Jet')) categoryValue = 'Jet';
                            else if (categoryValue.includes('Electric')) categoryValue = 'Electric';
                        }
                    }
                }
            }
        }
        
        return {
            x: aircraft.first_flight_year,
            y: aircraft[param],
            id: aircraft.id,
            name: aircraft.name,
            category: categoryValue,
            image_url: aircraft.image_url
        };
    });

    renderTimelineChart(data, param, colorGroup, logScale);
}

// Render timeline chart
function renderTimelineChart(data, param, colorGroup, logScale) {
    console.log(`Rendering timeline chart with ${data.length} items`);
    
    const canvas = document.getElementById('timeline-chart');
    if (!canvas) {
        console.error('Timeline chart canvas not found');
        return;
    }

    // Destroy existing chart
    if (currentChart) {
        currentChart.destroy();
    }

    // Group data by category
    const groupedData = data.reduce((acc, item) => {
        const category = item.category || 'Unknown';
        if (!acc[category]) {
            acc[category] = [];
        }
        acc[category].push(item);
        return acc;
    }, {});

    console.log('Data grouped by categories:', Object.keys(groupedData));

    // Get the classification to use for colors
    const classification = getClassification(colorGroup);

    // Create datasets
    const datasets = Object.entries(groupedData).map(([category, items]) => {
        // Get color from classifications
        let color = getColorForValue(colorGroup, category) || 'rgba(100, 100, 100, 0.7)';
        
        // Convert hex to rgba if needed
        const rgba = color.startsWith('#') 
            ? hexToRgba(color, 0.7)
            : color;
        
        // Get proper label from classification if available
        let label = category;
        if (classification) {
            const option = classification.options.find(opt => opt.value === category);
            if (option) {
                label = option.label;
            }
        } else {
            label = getLabelForValue(colorGroup, category) || category;
        }
            
        return {
            label: label,
            data: items,
            backgroundColor: rgba,
            borderColor: rgba,
            pointRadius: 5,
            pointHoverRadius: 8
        };
    });

    // Get parameter configuration from chart_parameters.json
    const paramConfig = chartParameters.parameters[param];
    const yAxisLabel = paramConfig?.label || param;

    // Create chart configuration
    const config = {
        type: 'scatter',
        data: {
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    type: 'linear',
                    position: 'bottom',
                    title: {
                        display: true,
                        text: 'Ano'
                    }
                },
                y: {
                    type: logScale ? 'logarithmic' : 'linear',
                    title: {
                        display: true,
                        text: yAxisLabel
                    }
                }
            },
            plugins: {
                zoom: {
                    pan: {
                        enabled: true,
                        mode: 'xy'
                    },
                    zoom: {
                        wheel: {
                            enabled: true
                        },
                        pinch: {
                            enabled: true
                        },
                        mode: 'xy',
                        onZoomComplete: function() {
                            document.getElementById('reset-zoom').style.display = 'block';
                        }
                    }
                },
                tooltip: {
                    enabled: false,
                    external: function(context) {
                        // Tooltip Element
                        let tooltipEl = document.getElementById('chartjs-tooltip-timeline');

                        // Create element on first render
                        if (!tooltipEl) {
                            tooltipEl = document.createElement('div');
                            tooltipEl.id = 'chartjs-tooltip-timeline';
                            tooltipEl.className = 'chartjs-tooltip';
                            document.body.appendChild(tooltipEl);
                        }

                        // Hide if no tooltip
                        const tooltipModel = context.tooltip;
                        if (tooltipModel.opacity === 0) {
                            tooltipEl.style.opacity = 0;
                            return;
                        }

                        // Set Text
                        if (tooltipModel.body) {
                            // Get the data point directly from the raw data
                            const dataPoint = tooltipModel.dataPoints[0].raw;
                            
                            let innerHtml = `
                                <div class="tooltip-header">
                                    <strong>${dataPoint.name || 'Unknown'}</strong>
                                </div>
                                <div class="tooltip-body">
                            `;
                            
                            if (dataPoint.image_url) {
                                innerHtml += `<img src="${dataPoint.image_url}" alt="${dataPoint.name}" style="max-width: 150px; max-height: 100px;"><br>`;
                            }
                            
                            innerHtml += `
                                    <strong>Ano:</strong> ${dataPoint.x}<br>
                                    <strong>${yAxisLabel}:</strong> ${dataPoint.y.toLocaleString()}<br>
                                </div>
                            `;
                            
                            tooltipEl.innerHTML = innerHtml;
                        }

                        // Position tooltip
                        const position = context.chart.canvas.getBoundingClientRect();
                        tooltipEl.style.opacity = 1;
                        tooltipEl.style.position = 'absolute';
                        tooltipEl.style.left = position.left + window.pageXOffset + tooltipModel.caretX + 'px';
                        tooltipEl.style.top = position.top + window.pageYOffset + tooltipModel.caretY + 'px';
                        tooltipEl.style.pointerEvents = 'none';
                    }
                },
                legend: {
                    position: 'right'
                }
            },
            onClick: (e, elements) => {
                if (elements.length > 0) {
                    const index = elements[0].index;
                    const datasetIndex = elements[0].datasetIndex;
                    const point = datasets[datasetIndex].data[index];
                    window.open(`aircraft_details.html#${point.id}`, '_blank');
                }
            }
        }
    };

    // Create chart
    currentChart = new Chart(canvas, config);
}

// Convert hex color to rgba
function hexToRgba(hex, alpha = 1) {
    if (!hex) return `rgba(100, 100, 100, ${alpha})`;
    
    // Remove # if present
    hex = hex.replace('#', '');
    
    // Parse hex values
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    // Return rgba
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
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