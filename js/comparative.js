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

    Object.values(controls).forEach(control => {
        if (control) {
            control.addEventListener('change', updateChart);
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
        updateChart();
    } catch (error) {
        console.error('Error loading aircraft data:', error);
        showAlert('Error loading data: ' + error.message, 'danger');
    }
}

// Update chart with current parameters
function updateChart() {
    if (!aircraftData || !chartParameters) {
        console.error('Data or parameters not loaded');
        return;
    }

    // Get current parameter values
    const xParam = document.getElementById('x-param')?.value;
    const yParam = document.getElementById('y-param')?.value;
    const colorGroup = document.getElementById('color-group')?.value;
    const xLogScale = document.getElementById('x-log-scale')?.checked;
    const yLogScale = document.getElementById('y-log-scale')?.checked;

    if (!xParam || !yParam || !colorGroup) {
        console.error('Missing chart parameters');
        return;
    }

    console.log('Updating chart with parameters:', { xParam, yParam, colorGroup, xLogScale, yLogScale });

    // Filter and map data for chart
    const data = aircraftData.filter(aircraft => {
        return aircraft[xParam] != null && aircraft[yParam] != null;
    }).map(aircraft => ({
        x: aircraft[xParam],
        y: aircraft[yParam],
        id: aircraft.id,
        name: aircraft.name,
        category: aircraft[colorGroup] || 'unknown',
        image_url: aircraft.image_url
    }));

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
                            tooltipEl.style.display = 'none';
                            return;
                        }

                        // Set Text
                        if (tooltipModel.body) {
                            const point = tooltipModel.dataPoints[0].raw;
                            const xLabel = xConfig?.label || xParam;
                            const yLabel = yConfig?.label || yParam;
                            
                            const innerHtml = `
                                <div>${point.name}</div>
                                <div>${xLabel}: ${point.x.toLocaleString()}</div>
                                <div>${yLabel}: ${point.y.toLocaleString()}</div>
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