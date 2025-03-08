// Global variables
window.aircraftData = [];

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeControls();
    loadAircraftData();
});

// Initialize controls
function initializeControls() {
    console.log('Initializing comparative chart controls...');
    
    // Get chart controls
    const controls = {
        xParam: document.getElementById('x-param'),
        yParam: document.getElementById('y-param'),
        xLogScale: document.getElementById('x-log-scale'),
        yLogScale: document.getElementById('y-log-scale')
    };

    // Set default values
    if (controls.xParam) controls.xParam.value = 'mtow_N';
    if (controls.yParam) controls.yParam.value = 'cruise_speed_ms';

    // Add event listeners
    Object.entries(controls).forEach(([key, element]) => {
        if (element) {
            element.addEventListener('change', updateScatterChart);
        }
    });

    console.log('Comparative chart controls initialized successfully');
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
        updateScatterChart();
    } catch (error) {
        console.error('Detailed error loading data:', error);
        console.error('Stack trace:', error.stack);
        showAlert('Error loading data: ' + error.message, 'danger');
    }
}

// Update scatter chart
function updateScatterChart() {
    console.log('Updating scatter chart...');
    
    // Get selected parameters
    const xParam = document.getElementById('x-param')?.value;
    const yParam = document.getElementById('y-param')?.value;
    
    if (!xParam || !yParam) {
        console.error('Missing parameters for scatter chart');
        return;
    }

    try {
        // Check if data is loaded
        if (!window.aircraftData || window.aircraftData.length === 0) {
            console.log('No data available for scatter chart...');
            return;
        }

        // Process data for the chart
        const data = window.aircraftData.filter(aircraft => {
            const hasXParam = aircraft[xParam] !== undefined && aircraft[xParam] !== null && !isNaN(aircraft[xParam]);
            const hasYParam = aircraft[yParam] !== undefined && aircraft[yParam] !== null && !isNaN(aircraft[yParam]);
            
            if (!hasXParam || !hasYParam) {
                if (aircraft.category_type === 'ave') {
                    console.log(`Bird ${aircraft.name} missing data: ${xParam}=${aircraft[xParam]}, ${yParam}=${aircraft[yParam]}`);
                }
                return false;
            }
            return true;
        }).map(aircraft => ({
            x: parseFloat(aircraft[xParam]),
            y: parseFloat(aircraft[yParam]),
            id: aircraft.id,
            name: aircraft.name,
            category: aircraft.category_type
        }));

        console.log(`Processed ${data.length} valid data points for scatter plot`);
        renderScatterChart(data, xParam, yParam);
    } catch (error) {
        console.error('Error updating scatter chart:', error);
        showAlert('Error updating scatter chart: ' + error.message, 'danger');
    }
}

// Render scatter chart
function renderScatterChart(data, xParam, yParam) {
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

    // Get log scale settings
    const xLogScale = document.getElementById('x-log-scale')?.checked || false;
    const yLogScale = document.getElementById('y-log-scale')?.checked || false;

    // Create chart
    new Chart(canvas, {
        type: 'scatter',
        data: { datasets },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    type: xLogScale ? 'logarithmic' : 'linear',
                    title: {
                        display: true,
                        text: paramLabels[xParam] || xParam
                    }
                },
                y: {
                    type: yLogScale ? 'logarithmic' : 'linear',
                    title: {
                        display: true,
                        text: paramLabels[yParam] || yParam
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