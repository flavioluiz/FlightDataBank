// Global variables
let chartParameters = null;
let aircraftData = [];

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
        console.error('Error initializing comparative charts:', error);
        showAlert('Error initializing comparative charts: ' + error.message, 'danger');
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
    if (!chartParameters) {
        console.error('Chart parameters not loaded');
        return;
    }

    const xSelect = document.getElementById('x-param');
    const ySelect = document.getElementById('y-param');
    
    if (!xSelect || !ySelect) {
        console.error('Parameter select elements not found');
        return;
    }

    // Clear existing options
    xSelect.innerHTML = '';
    ySelect.innerHTML = '';

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
        const xGroup = document.createElement('optgroup');
        const yGroup = document.createElement('optgroup');
        xGroup.label = categoryInfo.label;
        yGroup.label = categoryInfo.label;

        params.forEach(param => {
            const xOption = document.createElement('option');
            const yOption = document.createElement('option');
            xOption.value = param.key;
            yOption.value = param.key;
            xOption.textContent = param.label;
            yOption.textContent = param.label;
            xGroup.appendChild(xOption);
            yGroup.appendChild(yOption);
        });

        xSelect.appendChild(xGroup);
        ySelect.appendChild(yGroup);
    });

    // Set default values
    xSelect.value = 'mtow_N';
    ySelect.value = 'wing_loading_Nm2';

    // Add event listeners for all controls
    const controls = {
        xParam: xSelect,
        yParam: ySelect,
        colorGroup: document.getElementById('color-group'),
        xLogScale: document.getElementById('x-log-scale'),
        yLogScale: document.getElementById('y-log-scale')
    };

    Object.entries(controls).forEach(([key, element]) => {
        if (element) {
            element.addEventListener('change', updateScatterChart);
        }
    });

    // Set initial state from chart parameters if available
    if (chartParameters.defaultScales) {
        if (controls.xLogScale) {
            controls.xLogScale.checked = chartParameters.defaultScales.x === 'logarithmic';
        }
        if (controls.yLogScale) {
            controls.yLogScale.checked = chartParameters.defaultScales.y === 'logarithmic';
        }
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
        
        // Load bird data
        const birdResponse = await fetch('data/processed/birds_processed.json');
        if (!birdResponse.ok) {
            throw new Error(`Failed to load bird data: ${birdResponse.status}`);
        }
        
        const birdJson = await birdResponse.json();
        const birds = birdJson.birds || [];
        
        // Combine data
        aircraftData = [
            ...aircraft.map(a => ({
                ...a,
                type: 'aircraft',
                image_url: a.image_url
            })),
            ...birds.map(b => ({
                ...b,
                type: 'bird',
                category_type: 'ave',
                era: 'Biological', // Better label for birds
                engine_type: 'Biological', // Better label for birds
                image_url: b.image_url
            }))
        ];

        console.log('Total data points loaded:', aircraftData.length);
        
        // Update chart with initial values
        updateScatterChart();
    } catch (error) {
        console.error('Error loading aircraft data:', error);
        showAlert('Error loading data: ' + error.message, 'danger');
    }
}

// Update scatter chart
function updateScatterChart() {
    const xParam = document.getElementById('x-param')?.value;
    const yParam = document.getElementById('y-param')?.value;
    const colorGroup = document.getElementById('color-group')?.value;
    const xLogScale = document.getElementById('x-log-scale')?.checked || false;
    const yLogScale = document.getElementById('y-log-scale')?.checked || false;

    if (!xParam || !yParam || !colorGroup) {
        console.error('Missing chart parameters');
        return;
    }

    console.log('Updating scatter chart with parameters:', { xParam, yParam, colorGroup, xLogScale, yLogScale });

    // Filter and map data for chart
    const data = aircraftData.filter(aircraft => {
        return aircraft[xParam] != null && aircraft[yParam] != null;
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
            x: aircraft[xParam],
            y: aircraft[yParam],
            id: aircraft.id,
            name: aircraft.name,
            category: categoryValue,
            image_url: aircraft.image_url
        };
    });

    renderScatterChart(data, xParam, yParam, colorGroup, xLogScale, yLogScale);
}

// Render scatter chart
function renderScatterChart(data, xParam, yParam, colorGroup, xLogScale, yLogScale) {
    console.log(`Rendering scatter chart with ${data.length} items`);
    
    const canvas = document.getElementById('scatter-chart');
    if (!canvas) {
        console.error('Scatter chart canvas not found');
        return;
    }

    // Destroy existing chart
    const existingChart = Chart.getChart(canvas);
    if (existingChart) {
        existingChart.destroy();
    }

    // Get parameter configurations
    const xConfig = chartParameters.parameters[xParam];
    const yConfig = chartParameters.parameters[yParam];

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
    
    // Special handling for birds in era and engine_type
    if (colorGroup === 'era' || colorGroup === 'engine_type') {
        if (classificationsData && classificationsData.colorSchemes && classificationsData.colorSchemes[colorGroup]) {
            classificationsData.colorSchemes[colorGroup]['Biological'] = '#00BCD4'; // Use a nice teal color for birds
        }
    }

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
            } else if (category === 'Biological') {
                label = 'Biological';
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

    // Update chart configuration
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
                    type: xLogScale ? 'logarithmic' : 'linear',
                    position: 'bottom',
                    title: {
                        display: true,
                        text: xConfig?.label || xParam
                    }
                },
                y: {
                    type: yLogScale ? 'logarithmic' : 'linear',
                    title: {
                        display: true,
                        text: yConfig?.label || yParam
                    }
                }
            },
            plugins: {
                tooltip: {
                    enabled: false,
                    external: function(context) {
                        // Tooltip Element
                        let tooltipEl = document.getElementById('chartjs-tooltip');

                        // Create element on first render
                        if (!tooltipEl) {
                            tooltipEl = document.createElement('div');
                            tooltipEl.id = 'chartjs-tooltip';
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
    new Chart(canvas, config);
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