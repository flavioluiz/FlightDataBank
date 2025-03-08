// Global variables
window.aircraftData = [];

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeControls();
    loadAircraftData();
});

// Initialize controls
function initializeControls() {
    console.log('Initializing timeline controls...');
    
    // Get timeline controls
    const controls = {
        param: document.getElementById('timeline-param'),
        colorGroup: document.getElementById('color-group'),
        logScale: document.getElementById('timeline-log-scale')
    };
    
    // Set default values
    if (controls.param) {
        controls.param.value = 'cruise_speed_ms';
    }
    if (controls.colorGroup) {
        controls.colorGroup.value = 'category_type';
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
        window.aircraftData = [...processedAircraft, ...processedBirds];
        console.log('Total processed data:', window.aircraftData.length, 'items');
        
        // Update chart
        updateTimelineChart();
    } catch (error) {
        console.error('Detailed error loading data:', error);
        console.error('Stack trace:', error.stack);
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
    
    if (!param || !colorGroup) {
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

    // Parameter labels
    const paramLabels = {
        'mtow_N': 'MTOW (N)',
        'wing_area_m2': 'Wing Area (m²)',
        'wingspan_m': 'Wingspan (m)',
        'cruise_speed_ms': 'Cruise Speed (m/s)',
        'VE_cruise_ms': 'Equivalent Cruise Speed (m/s)',
        'takeoff_speed_ms': 'Takeoff Speed (m/s)',
        'landing_speed_ms': 'Landing Speed (m/s)',
        'service_ceiling_m': 'Service Ceiling (m)',
        'max_thrust': 'Max Thrust (kN)',
        'engine_count': 'Engine Count',
        'first_flight_year': 'First Flight Year',
        'range_km': 'Range (km)',
        'max_speed_ms': 'Max Speed (m/s)',
        'wing_loading_Nm2': 'Wing Loading (N/m²)',
        'CL_cruise': 'Lift Coefficient - Cruise',
        'CL_takeoff': 'Lift Coefficient - Takeoff',
        'CL_landing': 'Lift Coefficient - Landing',
        'aspect_ratio': 'Aspect Ratio'
    };

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
                        text: paramLabels[param] || param
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
                    viewAircraftDetails(point.id);
                }
            }
        }
    });
} 