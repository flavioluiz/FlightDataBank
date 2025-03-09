// Global variables
let chartParameters = null;
let aircraftData = [];

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

    // Add event listeners
    const controls = {
        xParam: xSelect,
        yParam: ySelect,
        colorGroup: document.getElementById('color-group')
    };

    Object.values(controls).forEach(control => {
        if (control) {
            control.addEventListener('change', updateChart);
        }
    });
}

// Load aircraft data
async function loadAircraftData() {
    console.log('Loading aircraft and bird data...');
    
    try {
        // Load aircraft data
        console.log('Trying to load aircraft_processed.json...');
        const aircraftResponse = await fetch('data/processed/aircraft_processed.json');
        console.log('Aircraft_processed.json response status:', aircraftResponse.status);
        
        if (!aircraftResponse.ok) {
            throw new Error(`Failed to load aircraft data: ${aircraftResponse.status} - ${aircraftResponse.statusText}`);
        }
        
        const aircraftJson = await aircraftResponse.json();
        console.log('Aircraft data loaded successfully:', aircraftJson.aircraft.length, 'aircraft');

        // Load bird data
        console.log('Trying to load birds_processed.json...');
        const birdsResponse = await fetch('data/processed/birds_processed.json');
        console.log('Birds_processed.json response status:', birdsResponse.status);

        let birds = [];
        if (birdsResponse.ok) {
            const birdsJson = await birdsResponse.json();
            birds = birdsJson.birds || [];
            console.log('Bird data loaded successfully:', birds.length, 'birds');
        } else {
            console.warn('Failed to load bird data:', birdsResponse.status, birdsResponse.statusText);
        }

        // Process and combine data
        const processedAircraft = aircraftJson.aircraft.map(aircraft => categorizeAircraft({...aircraft}));
        const processedBirds = birds.map(bird => categorizeAircraft({...bird, category_type: 'ave'}));
        
        // Store data globally
        aircraftData = [...processedAircraft, ...processedBirds];
        console.log('Total processed data:', aircraftData.length, 'items');
        
        // Update chart
        updateChart();
    } catch (error) {
        console.error('Detailed error loading data:', error);
        console.error('Stack trace:', error.stack);
        showAlert('Error loading data: ' + error.message, 'danger');
    }
}

// Update chart
function updateChart() {
    const xParam = document.getElementById('x-param')?.value;
    const yParam = document.getElementById('y-param')?.value;
    const colorGroup = document.getElementById('color-group')?.value;

    if (!xParam || !yParam || !colorGroup || !chartParameters) {
        console.error('Missing parameters for chart update');
        return;
    }

    const xConfig = chartParameters.parameters[xParam];
    const yConfig = chartParameters.parameters[yParam];

    if (!xConfig || !yConfig) {
        console.error('Invalid parameters selected');
        return;
    }

    const data = aircraftData.filter(aircraft => {
        return aircraft[xParam] != null && aircraft[yParam] != null;
    }).map(aircraft => ({
        x: aircraft[xParam],
        y: aircraft[yParam],
        id: aircraft.id,
        name: aircraft.name,
        category: aircraft[colorGroup] || 'unknown'
    }));

    renderScatterChart(data, xParam, yParam, colorGroup);
}

// Render scatter chart
function renderScatterChart(data, xParam, yParam, colorGroup) {
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

    // Create chart
    new Chart(canvas, {
        type: 'scatter',
        data: { datasets },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    type: xConfig.scale === 'log' ? 'logarithmic' : 'linear',
                    title: {
                        display: true,
                        text: xConfig.label
                    }
                },
                y: {
                    type: yConfig.scale === 'log' ? 'logarithmic' : 'linear',
                    title: {
                        display: true,
                        text: yConfig.label
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

function createAircraftLink(aircraft) {
    return `<a href="aircraft_details.html#${aircraft.id}" target="_blank">${aircraft.name}</a>`;
} 