// Global variables
let aircraftData = [];
let chartParameters = null;

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
    
    console.log('Timeline controls initialized successfully');
}

// Load aircraft data
async function loadAircraftData() {
    try {
        // Load aircraft data from processed file
        const aircraftResponse = await fetch('data/processed/aircraft_processed.json');
        if (!aircraftResponse.ok) {
            throw new Error(`Failed to load aircraft data: ${aircraftResponse.status}`);
        }
        const aircraftJson = await aircraftResponse.json();
        const aircraft = aircraftJson.aircraft || [];
        console.log('Aircraft data loaded:', aircraft.length, 'aircraft');

        // Load bird data from processed file
        const birdsResponse = await fetch('data/processed/birds_processed.json');
        let birds = [];
        if (birdsResponse.ok) {
            const birdsJson = await birdsResponse.json();
            birds = birdsJson.birds || [];
            console.log('Bird data loaded:', birds.length, 'birds');
        } else {
            console.warn('Failed to load bird data:', birdsResponse.status);
        }

        // Combine data
        aircraftData = [
            ...aircraft.map(a => ({...a, type: 'aircraft'})),
            ...birds.map(b => ({...b, type: 'bird', category_type: 'ave'}))
        ];
        
        console.log('Total data points:', aircraftData.length);

        // Update chart with initial data
        updateTimelineChart();
    } catch (error) {
        console.error('Error loading aircraft data:', error);
        showAlert('Error loading data: ' + error.message, 'danger');
    }
}

// Update timeline chart
function updateTimelineChart() {
    if (!aircraftData || !chartParameters) {
        console.error('Data or parameters not loaded');
        return;
    }

    // Get current parameter values
    const param = document.getElementById('timeline-param')?.value;
    const colorGroup = document.getElementById('color-group')?.value;
    const logScale = document.getElementById('timeline-log-scale')?.checked;

    if (!param || !colorGroup) {
        console.error('Missing chart parameters');
        return;
    }

    console.log('Updating timeline chart with parameters:', { param, colorGroup, logScale });

    // Filter and map data for chart
    const data = aircraftData.filter(aircraft => {
        return aircraft[param] != null && aircraft.first_flight_year != null;
    }).map(aircraft => ({
        x: aircraft.first_flight_year,
        y: aircraft[param],
        id: aircraft.id,
        name: aircraft.name,
        category: aircraft[colorGroup] || 'unknown',
        image_url: aircraft.image_url
    }));

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
    const existingChart = Chart.getChart(canvas);
    if (existingChart) {
        existingChart.destroy();
    }

    // Group data by category
    const datasets = Object.entries(
        data.reduce((acc, item) => {
            if (!acc[item.category]) {
                acc[item.category] = [];
            }
            acc[item.category].push(item);
            return acc;
        }, {})
    ).map(([category, items]) => {
        // Get color from classifications
        const color = getColorForValue(colorGroup, category) || 'rgba(100, 100, 100, 0.7)';
        // Convert hex to rgba if needed
        const rgba = color.startsWith('#') 
            ? hexToRgba(color, 0.7)
            : color;
            
        return {
            label: getLabelForValue(colorGroup, category) || category,
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
                            tooltipEl.style.display = 'none';
                            return;
                        }

                        // Set Text
                        if (tooltipModel.body) {
                            const point = tooltipModel.dataPoints[0].raw;
                            
                            const innerHtml = `
                                <div>${point.name}</div>
                                <div>Ano: ${point.x}</div>
                                <div>${yAxisLabel}: ${point.y.toLocaleString()}</div>
                                ${point.image_url ? `<img src="${point.image_url}" alt="${point.name}">` : ''}
                            `;
                            tooltipEl.innerHTML = innerHtml;
                        }

                        // Position tooltip
                        const position = context.chart.canvas.getBoundingClientRect();
                        const bodyFont = context.chart.options.font;

                        // Calculate tooltip dimensions
                        tooltipEl.style.display = 'block';
                        tooltipEl.style.position = 'absolute';
                        
                        // Get tooltip dimensions
                        const tooltipRect = tooltipEl.getBoundingClientRect();
                        const tooltipWidth = tooltipRect.width;
                        const tooltipHeight = tooltipRect.height;
                        
                        // Calculate initial position
                        let left = position.left + window.pageXOffset + tooltipModel.caretX + 10;
                        let top = position.top + window.pageYOffset + tooltipModel.caretY;
                        
                        // Check right edge
                        if (left + tooltipWidth > window.innerWidth) {
                            left = position.left + window.pageXOffset + tooltipModel.caretX - tooltipWidth - 10;
                        }
                        
                        // Check bottom edge
                        if (top + tooltipHeight > window.innerHeight + window.pageYOffset) {
                            top = window.innerHeight + window.pageYOffset - tooltipHeight - 10;
                        }
                        
                        // Check top edge
                        if (top < window.pageYOffset) {
                            top = window.pageYOffset + 10;
                        }

                        tooltipEl.style.left = left + 'px';
                        tooltipEl.style.top = top + 'px';
                    }
                },
                legend: {
                    position: 'right',
                    labels: {
                        padding: 20
                    }
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

// Helper function to convert hex to rgba
function hexToRgba(hex, alpha = 1) {
    // Remove # if present
    hex = hex.replace('#', '');
    
    // Parse hex values
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    // Return rgba string
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