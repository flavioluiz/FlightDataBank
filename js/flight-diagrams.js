// Global variables
let diagramConfig = null;
let aircraftData = [];
let filteredData = [];
let currentChart = null;
let classifications = null;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', async function() {
    try {
        // First load configuration
        await loadDiagramConfig();
        
        // Then load data
        await loadAircraftData();
        
        // Finally initialize controls and update chart
        initializeControls();
    } catch (error) {
        console.error('Error during initialization:', error);
        showAlert('Error during initialization: ' + error.message, 'danger');
    }
});

// Load diagram configuration
async function loadDiagramConfig() {
    try {
        console.log('Loading diagram configuration...');
        
        // First load classifications
        await loadClassifications();
        console.log('Classifications loaded via classifications.js');
        
        // Then load diagram config
        const response = await fetch('data/flight_diagrams.json');
        if (!response.ok) {
            throw new Error(`Failed to load configuration: ${response.status} ${response.statusText}`);
        }
        
        diagramConfig = await response.json();
        console.log('Diagram configuration loaded:', diagramConfig);
        
        // Initialize controls after loading configuration
        initializeControls();
        
        // Load aircraft data
        await loadAircraftData();
        
        // Update chart with default values
        updateChart();
    } catch (error) {
        console.error('Error loading configuration:', error);
        showAlert('Error loading configuration: ' + error.message, 'danger');
    }
}

// Initialize controls
function initializeControls() {
    console.log('Initializing controls...');
    
    // Get control elements
    const diagramSelect = document.getElementById('x-axis-param');
    const colorGroupSelect = document.getElementById('color-group');
    const trendlineControls = document.getElementById('trendline-controls');
    const showTrendlinesCheckbox = document.getElementById('showTrendlines');
    const trendlineKInput = document.getElementById('trendline-k');
    const trendlineEquation = document.getElementById('trendline-equation');
    
    console.log('Control elements:', { 
        diagramSelect, 
        colorGroupSelect, 
        trendlineControls, 
        showTrendlinesCheckbox 
    });
    
    if (!diagramSelect || !colorGroupSelect) {
        console.error('Required control elements not found');
        showAlert('Error: Required control elements not found', 'danger');
        return;
    }
    
    // Clear existing options
    diagramSelect.innerHTML = '';
    colorGroupSelect.innerHTML = '';
    
    // Add diagram options
    for (const [id, diagram] of Object.entries(diagramConfig.diagrams)) {
        const option = document.createElement('option');
        option.value = id;
        option.textContent = diagram.label;
        diagramSelect.appendChild(option);
    }
    
    // Set default diagram
    if (diagramSelect.options.length > 0) {
        diagramSelect.value = 'wing_loading_mtow';
    }
    
    // Add color group options
    for (const [id, group] of Object.entries(diagramConfig.colorGroups)) {
        const option = document.createElement('option');
        option.value = id;
        option.textContent = group.label;
        colorGroupSelect.appendChild(option);
    }
    
    // Set default color group
    if (colorGroupSelect.options.length > 0) {
        colorGroupSelect.value = 'category_type';
    }
    
    // Initialize trendline controls
    if (trendlineControls) {
        trendlineControls.style.display = 'none';
    }
    
    // Add event listeners
    diagramSelect.addEventListener('change', () => {
        updateTrendlineControls();
        updateChart();
    });
    
    colorGroupSelect.addEventListener('change', updateChart);
    
    if (showTrendlinesCheckbox) {
        showTrendlinesCheckbox.addEventListener('change', () => {
            if (trendlineKInput) {
                trendlineKInput.disabled = !showTrendlinesCheckbox.checked;
            }
            updateChart();
        });
    }
    
    if (trendlineKInput) {
        trendlineKInput.addEventListener('change', updateChart);
    }
    
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
    
    // Initialize trendline controls based on selected diagram
    updateTrendlineControls();
    
    // Trigger initial chart update
    console.log('Controls initialized successfully');
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
    updateChart();
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
    updateChart();
}

// Reset zoom function
function resetZoom() {
    if (currentChart) {
        currentChart.resetZoom();
        document.getElementById('reset-zoom').style.display = 'none';
    }
}

// Update trendline controls based on selected diagram
function updateTrendlineControls() {
    const diagramType = document.getElementById('x-axis-param')?.value;
    const trendlineControls = document.getElementById('trendline-controls');
    const trendlineKInput = document.getElementById('trendline-k');
    const trendlineEquation = document.getElementById('trendline-equation');
    const showTrendlinesCheckbox = document.getElementById('showTrendlines');
    
    if (!diagramType || !diagramConfig || !diagramConfig.diagrams[diagramType]) {
        if (trendlineControls) trendlineControls.style.display = 'none';
        return;
    }
    
    const diagram = diagramConfig.diagrams[diagramType];
    
    if (diagram.trendline) {
        if (trendlineControls) trendlineControls.style.display = 'block';
        if (trendlineEquation) trendlineEquation.textContent = diagram.trendline.equation;
        if (trendlineKInput) {
            trendlineKInput.value = diagram.trendline.defaultK;
            trendlineKInput.disabled = !showTrendlinesCheckbox?.checked;
        }
    } else {
        if (trendlineControls) trendlineControls.style.display = 'none';
        if (showTrendlinesCheckbox) showTrendlinesCheckbox.checked = false;
    }
}

// Load aircraft data
async function loadAircraftData() {
    try {
        console.log('Loading aircraft data...');
        
        // Load aircraft data
        const aircraftResponse = await fetch('data/processed/aircraft_processed.json');
        if (!aircraftResponse.ok) {
            throw new Error(`Failed to load aircraft data: ${aircraftResponse.status} ${aircraftResponse.statusText}`);
        }
        
        const aircraftJson = await aircraftResponse.json();
        const aircraft = aircraftJson.aircraft || [];
        
        // Load bird data
        const birdResponse = await fetch('data/processed/birds_processed.json');
        if (!birdResponse.ok) {
            throw new Error(`Failed to load bird data: ${birdResponse.status} ${birdResponse.statusText}`);
        }
        
        const birdJson = await birdResponse.json();
        const birds = birdJson.birds || [];
        
        // Combine data
        aircraftData = [
            ...aircraft.map(a => ({
                ...a,
                type: 'aircraft',
                image_url: a.image_url,
                wing_loading_Nm2: a.mtow_N && a.wing_area_m2 ? a.mtow_N / a.wing_area_m2 : null
            })),
            ...birds.map(b => ({
                ...b,
                type: 'bird',
                category_type: 'ave',
                era: 'Biological', // Better label for birds
                engine_type: 'Biological', // Better label for birds
                image_url: b.image_url,
                wing_loading_Nm2: b.mtow_N && b.wing_area_m2 ? b.mtow_N / b.wing_area_m2 : null
            }))
        ];
        
        // Initialize filtered data
        filteredData = [...aircraftData];

        console.log('Total data points loaded:', aircraftData.length);
    } catch (error) {
        console.error('Error loading aircraft data:', error);
        showAlert('Error loading data: ' + error.message, 'danger');
        throw error;
    }
}

// Update chart
function updateChart() {
    console.log('Updating flight diagram...', {
        hasConfig: !!diagramConfig,
        dataType: typeof filteredData,
        isArray: Array.isArray(filteredData),
        dataLength: filteredData?.length
    });
    
    if (!diagramConfig) {
        console.error('Configuration not loaded');
        showAlert('Error: Configuration not loaded', 'danger');
        return;
    }

    if (!filteredData || !Array.isArray(filteredData)) {
        console.error('Aircraft data not properly loaded:', {
            data: filteredData,
            type: typeof filteredData
        });
        showAlert('Error: Data not properly loaded', 'danger');
        return;
    }

    // Get selected parameters
    const diagramType = document.getElementById('x-axis-param')?.value;
    const colorGroup = document.getElementById('color-group')?.value;
    const showTrendlines = document.getElementById('showTrendlines')?.checked || false;
    
    console.log('Selected parameters:', { diagramType, colorGroup, showTrendlines });

    if (!diagramType || !colorGroup) {
        console.error('Missing parameters for flight diagram:', {
            diagramType,
            colorGroup
        });
        showAlert('Error: Missing chart parameters', 'danger');
        return;
    }

    const diagram = diagramConfig.diagrams[diagramType];
    if (!diagram) {
        console.error('Invalid diagram type:', diagramType);
        showAlert('Error: Invalid diagram type', 'danger');
        return;
    }

    try {
        // Process data with detailed logging
        console.log('Processing data with params:', {
            xParam: diagram.x.param,
            yParam: diagram.y.param,
            dataPoints: filteredData.length
        });

        const processedData = filteredData.filter(aircraft => {
            if (!aircraft) return false;
            
            const hasX = aircraft[diagram.x.param] !== undefined && 
                        aircraft[diagram.x.param] !== null && 
                        !isNaN(aircraft[diagram.x.param]);
            const hasY = aircraft[diagram.y.param] !== undefined && 
                        aircraft[diagram.y.param] !== null && 
                        !isNaN(aircraft[diagram.y.param]);
            
            if (!hasX || !hasY) {
                console.debug(`Data point missing required values:`, {
                    name: aircraft.name,
                    category: aircraft.category_type,
                    xValue: aircraft[diagram.x.param],
                    yValue: aircraft[diagram.y.param]
                });
                return false;
            }
            return true;
        }).map(aircraft => {
            // Get the category value
            let categoryValue = aircraft[colorGroup] || 'Unknown';
            
            // For era and engine_type, use the standardized values from classifications
            if (colorGroup === 'era' || colorGroup === 'engine_type') {
                // For birds, use 'Biological'
                if (aircraft.type === 'bird') {
                    categoryValue = 'Biological';
                } 
                // For aircraft, map to standard values if needed
                else if (categoryValue !== 'Unknown') {
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
                ...aircraft,
                x: parseFloat(aircraft[diagram.x.param]),
                y: parseFloat(aircraft[diagram.y.param]),
                id: aircraft.id,
                name: aircraft.name,
                category: categoryValue
            };
        });

        console.log(`Processed ${processedData.length} data points for rendering`);

        // Get trendline parameter if applicable
        let trendlineK = null;
        if (showTrendlines && diagram.trendline) {
            const trendlineKInput = document.getElementById('trendline-k');
            trendlineK = trendlineKInput ? parseFloat(trendlineKInput.value) : diagram.trendline.defaultK;
        }

        // Render chart
        renderChart(processedData, diagram, colorGroup, showTrendlines, trendlineK);
    } catch (error) {
        console.error('Error updating chart:', error);
        showAlert('Error updating chart: ' + error.message, 'danger');
    }
}

// Render chart
function renderChart(data, diagram, colorGroup, showTrendlines, trendlineK) {
    console.log(`Rendering flight diagram with ${data.length} items`);
    
    const canvas = document.getElementById('flight-diagram');
    if (!canvas) {
        console.error('Flight diagram canvas not found');
        return;
    }

    // Destroy existing chart
    if (currentChart) {
        currentChart.destroy();
    }

    // Get color palette from classifications
    let colorPalette = {};
    
    // Get the classification to use for colors
    const classification = getClassification(colorGroup);
    if (classification) {
        console.log('Using classification for colors:', classification.id);
        
        // Get colors from colorSchemes
        if (classificationsData && classificationsData.colorSchemes && classificationsData.colorSchemes[colorGroup]) {
            colorPalette = classificationsData.colorSchemes[colorGroup];
            console.log('Using color palette from classifications:', colorPalette);
        }
        
        // Add special color for birds
        if (colorGroup === 'era' || colorGroup === 'engine_type') {
            colorPalette['Biological'] = '#00BCD4'; // Use a nice teal color for birds
        }
    } else {
        // Fallback to colors from flight_diagrams.json
        if (diagramConfig.colorGroups[colorGroup]?.colors) {
            colorPalette = diagramConfig.colorGroups[colorGroup].colors;
            console.log('Using color palette from diagramConfig:', colorPalette);
        }
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

    // Create datasets
    const datasets = Object.entries(groupedData).map(([category, items]) => {
        // Get color from palette or generate a fallback color
        const color = colorPalette[category] || 
                     `rgba(${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, 0.7)`;
        
        // Get proper label from classification if available
        let label = category;
        if (classification) {
            const option = classification.options.find(opt => opt.value === category);
            if (option) {
                label = option.label;
            } else if (category === 'Biological') {
                label = 'Biological';
            }
        }
        
        return {
            label: label,
            data: items,
            backgroundColor: color,
            borderColor: color,
            pointRadius: 5,
            pointHoverRadius: 8
        };
    });

    // Add trendline if requested
    if (showTrendlines && diagram.trendline) {
        const trendline = calculateTrendline(data, diagram, trendlineK);
        if (trendline) {
            datasets.push(trendline);
        }
    }

    // Create chart
    currentChart = new Chart(canvas, {
        type: 'scatter',
        data: { datasets },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    type: diagram.x.scale || 'linear',
                    position: 'bottom',
                    title: {
                        display: true,
                        text: diagram.x.label
                    }
                },
                y: {
                    type: diagram.y.scale || 'linear',
                    title: {
                        display: true,
                        text: diagram.y.label
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
                        let tooltipEl = document.getElementById('chartjs-tooltip-flight');

                        // Create element on first render
                        if (!tooltipEl) {
                            tooltipEl = document.createElement('div');
                            tooltipEl.id = 'chartjs-tooltip-flight';
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
                                    <strong>X:</strong> ${dataPoint.x.toLocaleString()}<br>
                                    <strong>Y:</strong> ${dataPoint.y.toLocaleString()}<br>
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
            }
        }
    });
}

// Calculate trendline
function calculateTrendline(data, diagram, k) {
    if (!diagram.trendline || !diagram.trendline.equation) {
        return null;
    }
    
    // Use provided k or default
    const kValue = k || diagram.trendline.defaultK;
    console.log(`Calculating trendline with k=${kValue}`);
    
    // Get min and max x values
    const xValues = data.map(d => d.x);
    const minX = Math.min(...xValues);
    const maxX = Math.max(...xValues);
    
    // Generate points for trendline
    const numPoints = 100;
    const step = (maxX - minX) / numPoints;
    
    const trendlineData = [];
    for (let i = 0; i <= numPoints; i++) {
        const x = minX + (step * i);
        let y;
        
        // Calculate y based on equation
        if (diagram.trendline.equation.includes('W^(1/3)')) {
            // Wing loading vs MTOW: W/S = k × W^(1/3)
            y = kValue * Math.pow(x, 1/3);
        } else if (diagram.trendline.equation.includes('V²')) {
            // Wing loading vs Speed: W/S = k × V²
            y = kValue * Math.pow(x, 2);
        } else {
            console.warn('Unknown trendline equation:', diagram.trendline.equation);
            continue;
        }
        
        trendlineData.push({ x, y });
    }
    
    return {
        label: `Trendline (k=${kValue})`,
        data: trendlineData,
        showLine: true,
        fill: false,
        borderColor: 'rgba(255, 0, 0, 0.8)',
        backgroundColor: 'rgba(0, 0, 0, 0)',
        borderWidth: 2,
        pointRadius: 0,
        borderDash: [5, 5]
    };
} 