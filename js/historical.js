// Global variables
window.aircraftData = [];
let chartParameters = null;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    loadChartParameters().then(() => {
        initializeControls();
        loadAircraftData();
    });
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
        const aircraftData = await aircraftResponse.json();
        console.log('Aircraft data loaded:', aircraftData.aircraft.length, 'aircraft');

        // Load bird data from processed file
        const birdsResponse = await fetch('data/processed/birds_processed.json');
        let birdData = { birds: [] };
        if (birdsResponse.ok) {
            birdData = await birdsResponse.json();
            console.log('Bird data loaded:', birdData.birds.length, 'birds');
        } else {
            console.warn('Failed to load bird data:', birdsResponse.status);
        }

        // Combine and sort data by first flight year
        window.aircraftData = [
            ...aircraftData.aircraft.map(a => ({...a, type: 'aircraft'})),
            ...(birdData.birds || []).map(b => ({...b, type: 'bird', category_type: 'ave'}))
        ].filter(item => item.first_flight_year != null)
         .sort((a, b) => a.first_flight_year - b.first_flight_year);

        console.log('Combined data:', window.aircraftData.length, 'total items');

        // Update chart with initial data
        updateTimelineChart();
    } catch (error) {
        console.error('Error loading aircraft data:', error);
        showAlert('Error loading data: ' + error.message, 'danger');
    }
}

// Update timeline chart
function updateTimelineChart() {
    console.log('Updating timeline chart...');
    
    // Get selected parameter and scale
    const param = document.getElementById('timeline-param')?.value;
    const colorGroup = document.getElementById('color-group')?.value;
    const logScale = document.getElementById('timeline-log-scale')?.checked || false;
    
    if (!param || !colorGroup || !chartParameters) {
        console.error('Missing parameters for timeline chart');
        return;
    }

    try {
        // Check if data is loaded
        if (!window.aircraftData || window.aircraftData.length === 0) {
            console.log('No data available for timeline chart...');
            return;
        }

        // Process data for the chart
        const data = window.aircraftData.filter(aircraft => {
            const hasParam = aircraft[param] !== undefined && aircraft[param] !== null && !isNaN(aircraft[param]);
            const hasYear = aircraft.first_flight_year !== undefined && 
                          aircraft.first_flight_year !== null && 
                          !isNaN(aircraft.first_flight_year);
            
            if (!hasParam || !hasYear) {
                if (aircraft.category_type === 'ave') {
                    console.log(`Bird ${aircraft.name} missing timeline data: ${param}=${aircraft[param]}, year=${aircraft.first_flight_year}`);
                }
                return false;
            }
            return true;
        }).map(aircraft => ({
            x: parseInt(aircraft.first_flight_year),
            y: parseFloat(aircraft[param]),
            id: aircraft.id,
            name: aircraft.name,
            category: aircraft[colorGroup] || 'unknown'
        }));

        console.log(`Processed ${data.length} valid data points for timeline`);
        renderTimelineChart(data, param, colorGroup, logScale);
    } catch (error) {
        console.error('Error updating timeline chart:', error);
        showAlert('Error updating timeline chart: ' + error.message, 'danger');
    }
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

    // Color palettes for different groupings
    const colorPalettes = {
        category_type: {
            'ave': 'rgba(255, 99, 132, 0.7)',
            'comercial': 'rgba(54, 162, 235, 0.7)',
            'militar': 'rgba(255, 206, 86, 0.7)',
            'geral': 'rgba(75, 192, 192, 0.7)',
            'historica': 'rgba(153, 102, 255, 0.7)',
            'executiva': 'rgba(255, 159, 64, 0.7)',
            'carga': 'rgba(201, 203, 207, 0.7)',
            'experimental': 'rgba(255, 99, 71, 0.7)'
        },
        category_era: {
            'pioneiro': 'rgba(141, 110, 99, 0.7)',
            'classico': 'rgba(120, 144, 156, 0.7)',
            'jato': 'rgba(38, 166, 154, 0.7)',
            'moderno': 'rgba(121, 134, 203, 0.7)',
            'contemporaneo': 'rgba(3, 169, 244, 0.7)',
            'ave': 'rgba(255, 99, 132, 0.7)'
        },
        category_size: {
            'muito_leve': 'rgba(156, 204, 101, 0.7)',
            'regional': 'rgba(255, 183, 77, 0.7)',
            'medio': 'rgba(229, 115, 115, 0.7)',
            'grande': 'rgba(124, 77, 255, 0.7)',
            'muito_grande': 'rgba(0, 151, 167, 0.7)'
        },
        engine_type: {
            'pistao': 'rgba(141, 110, 99, 0.7)',
            'turboprop': 'rgba(96, 125, 139, 0.7)',
            'jato': 'rgba(0, 151, 167, 0.7)',
            'eletrico': 'rgba(76, 175, 80, 0.7)',
            'foguete': 'rgba(244, 67, 54, 0.7)',
            'nenhum': 'rgba(189, 189, 189, 0.7)'
        }
    };

    // Get the appropriate color palette
    const categoryColors = colorPalettes[colorGroup] || {};

    // Get the appropriate category name function
    const getCategoryLabel = (category) => {
        switch (colorGroup) {
            case 'category_type':
                return getCategoryName(category);
            case 'category_era':
                return getCategoryEra(category);
            case 'category_size':
                return getCategorySize(category);
            case 'engine_type':
                return category.charAt(0).toUpperCase() + category.slice(1);
            default:
                return category;
        }
    };

    // Group data by category
    const datasets = Object.entries(
        data.reduce((acc, item) => {
            if (!acc[item.category]) {
                acc[item.category] = [];
            }
            acc[item.category].push(item);
            return acc;
        }, {})
    ).map(([category, items]) => ({
        label: getCategoryLabel(category),
        data: items,
        backgroundColor: categoryColors[category] || 'rgba(100, 100, 100, 0.7)',
        borderColor: categoryColors[category] || 'rgba(100, 100, 100, 0.7)',
        pointRadius: 5,
        pointHoverRadius: 8
    }));

    // Get parameter configuration from chart_parameters.json
    const paramConfig = chartParameters.parameters[param];
    const yAxisLabel = paramConfig ? paramConfig.label : param;

    // Create chart
    new Chart(canvas, {
        type: 'scatter',
        data: { datasets },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    type: 'linear',
                    position: 'bottom',
                    title: {
                        display: true,
                        text: 'First Flight Year'
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
                    callbacks: {
                        label: function(context) {
                            const point = context.raw;
                            return `${point.name}: ${point.x.toLocaleString()}, ${point.y.toLocaleString()}`;
                        }
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
    });
}

function createTimelineItem(aircraft) {
    return `
        <div class="timeline-item">
            <div class="timeline-content">
                <h3>${aircraft.first_flight_year}</h3>
                <h4><a href="aircraft_details.html#${aircraft.id}" target="_blank">${aircraft.name}</a></h4>
                <p>${aircraft.manufacturer} ${aircraft.model}</p>
            </div>
        </div>
    `;
} 