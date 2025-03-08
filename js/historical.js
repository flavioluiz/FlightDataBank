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
        logScale: document.getElementById('timeline-log-scale')
    };
    
    // Set default values
    if (controls.param) {
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
    console.log('Loading aircraft and bird data...');
    
    try {
        // Load aircraft data
        console.log('Trying to load aircraft.json...');
        const aircraftResponse = await fetch('data/aircraft.json');
        console.log('Aircraft.json response status:', aircraftResponse.status);
        
        if (!aircraftResponse.ok) {
            throw new Error(`Failed to load aircraft data: ${aircraftResponse.status} - ${aircraftResponse.statusText}`);
        }
        
        const aircraftJson = await aircraftResponse.json();
        console.log('Aircraft data loaded successfully:', aircraftJson.aircraft.length, 'aircraft');

        // Load bird data
        console.log('Trying to load birds.json...');
        const birdsResponse = await fetch('data/birds.json');
        console.log('Birds.json response status:', birdsResponse.status);

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
    const logScale = document.getElementById('timeline-log-scale')?.checked || false;
    
    if (!param) {
        console.error('Missing parameter for timeline chart');
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
            category: aircraft.category_type
        }));

        console.log(`Processed ${data.length} valid data points for timeline`);
        renderTimelineChart(data, param, logScale);
    } catch (error) {
        console.error('Error updating timeline chart:', error);
        showAlert('Error updating timeline chart: ' + error.message, 'danger');
    }
}

// Render timeline chart
function renderTimelineChart(data, param, logScale) {
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

    // Category colors
    const categoryColors = {
        'ave': 'rgba(255, 99, 132, 0.7)',
        'comercial': 'rgba(54, 162, 235, 0.7)',
        'militar': 'rgba(255, 206, 86, 0.7)',
        'geral': 'rgba(75, 192, 192, 0.7)',
        'historica': 'rgba(153, 102, 255, 0.7)',
        'executiva': 'rgba(255, 159, 64, 0.7)',
        'carga': 'rgba(201, 203, 207, 0.7)',
        'experimental': 'rgba(255, 99, 71, 0.7)'
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
        label: getCategoryName(category),
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
        'takeoff_speed_ms': 'Takeoff Speed (m/s)',
        'landing_speed_ms': 'Landing Speed (m/s)',
        'service_ceiling_m': 'Service Ceiling (m)',
        'max_thrust': 'Max Thrust (kN)',
        'engine_count': 'Engine Count',
        'first_flight_year': 'First Flight Year',
        'range_km': 'Range (km)',
        'max_speed_ms': 'Max Speed (m/s)'
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