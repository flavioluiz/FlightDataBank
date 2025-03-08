// Global variables
window.aircraftData = [];

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeControls();
    loadAircraftData();
});

// Initialize controls
function initializeControls() {
    console.log('Initializing flight diagram controls...');
    
    // Get controls
    const controls = {
        chartType: document.getElementById('x-axis-param'),
        showTrendlines: document.getElementById('showTrendlines'),
        xLogScale: document.getElementById('xLogScale'),
        yLogScale: document.getElementById('yLogScale')
    };

    // Set default values
    if (controls.chartType) controls.chartType.value = 'wing_loading_mtow';

    // Add event listeners
    Object.entries(controls).forEach(([key, element]) => {
        if (element) {
            element.addEventListener('change', updateFlightDiagram);
        }
    });

    console.log('Flight diagram controls initialized successfully');
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
        updateFlightDiagram();
    } catch (error) {
        console.error('Detailed error loading data:', error);
        console.error('Stack trace:', error.stack);
        showAlert('Error loading data: ' + error.message, 'danger');
    }
}

// Update flight diagram
function updateFlightDiagram() {
    console.log('Updating flight diagram...');
    
    // Get selected parameters
    const chartType = document.getElementById('x-axis-param')?.value;
    const showTrendlines = document.getElementById('showTrendlines')?.checked || false;
    const xLogScale = document.getElementById('xLogScale')?.checked || false;
    const yLogScale = document.getElementById('yLogScale')?.checked || false;
    
    if (!chartType) {
        console.error('Missing chart type for flight diagram');
        return;
    }

    try {
        // Check if data is loaded
        if (!window.aircraftData || window.aircraftData.length === 0) {
            console.log('No data available for flight diagram...');
            return;
        }

        // Process data based on chart type
        let data = [];
        switch (chartType) {
            case 'wing_loading_mtow':
                data = processWingLoadingMTOWData(window.aircraftData);
                break;
            case 'speed_mtow':
                data = processSpeedMTOWData(window.aircraftData);
                break;
            case 'wing_loading_speed':
                data = processWingLoadingSpeedData(window.aircraftData);
                break;
        }

        console.log(`Processed ${data.length} valid data points for flight diagram`);
        renderFlightDiagram(data, chartType, showTrendlines, xLogScale, yLogScale);
    } catch (error) {
        console.error('Error updating flight diagram:', error);
        showAlert('Error updating flight diagram: ' + error.message, 'danger');
    }
}

// Process data for Wing Loading vs MTOW chart
function processWingLoadingMTOWData(data) {
    return data.filter(aircraft => {
        const hasMTOW = aircraft.mtow_N !== undefined && aircraft.mtow_N !== null && !isNaN(aircraft.mtow_N);
        const hasWingArea = aircraft.wing_area_m2 !== undefined && aircraft.wing_area_m2 !== null && !isNaN(aircraft.wing_area_m2);
        
        if (!hasMTOW || !hasWingArea) {
            if (aircraft.category_type === 'ave') {
                console.log(`Bird ${aircraft.name} missing wing loading data: MTOW=${aircraft.mtow_N}, Wing Area=${aircraft.wing_area_m2}`);
            }
            return false;
        }
        return true;
    }).map(aircraft => ({
        x: parseFloat(aircraft.mtow_N),
        y: parseFloat(aircraft.mtow_N) / parseFloat(aircraft.wing_area_m2),
        id: aircraft.id,
        name: aircraft.name,
        category: aircraft.category_type
    }));
}

// Process data for Speed vs MTOW chart
function processSpeedMTOWData(data) {
    return data.filter(aircraft => {
        const hasMTOW = aircraft.mtow_N !== undefined && aircraft.mtow_N !== null && !isNaN(aircraft.mtow_N);
        const hasSpeed = aircraft.cruise_speed_ms !== undefined && aircraft.cruise_speed_ms !== null && !isNaN(aircraft.cruise_speed_ms);
        
        if (!hasMTOW || !hasSpeed) {
            if (aircraft.category_type === 'ave') {
                console.log(`Bird ${aircraft.name} missing speed data: MTOW=${aircraft.mtow_N}, Speed=${aircraft.cruise_speed_ms}`);
            }
            return false;
        }
        return true;
    }).map(aircraft => ({
        x: parseFloat(aircraft.mtow_N),
        y: parseFloat(aircraft.cruise_speed_ms),
        id: aircraft.id,
        name: aircraft.name,
        category: aircraft.category_type,
        cruiseAltitude: aircraft.cruise_altitude_m
    }));
}

// Process data for Wing Loading vs Speed chart
function processWingLoadingSpeedData(data) {
    return data.filter(aircraft => {
        const hasMTOW = aircraft.mtow_N !== undefined && aircraft.mtow_N !== null && !isNaN(aircraft.mtow_N);
        const hasWingArea = aircraft.wing_area_m2 !== undefined && aircraft.wing_area_m2 !== null && !isNaN(aircraft.wing_area_m2);
        const hasSpeed = aircraft.cruise_speed_ms !== undefined && aircraft.cruise_speed_ms !== null && !isNaN(aircraft.cruise_speed_ms);
        
        if (!hasMTOW || !hasWingArea || !hasSpeed) {
            if (aircraft.category_type === 'ave') {
                console.log(`Bird ${aircraft.name} missing data: MTOW=${aircraft.mtow_N}, Wing Area=${aircraft.wing_area_m2}, Speed=${aircraft.cruise_speed_ms}`);
            }
            return false;
        }
        return true;
    }).map(aircraft => ({
        x: parseFloat(aircraft.cruise_speed_ms),
        y: parseFloat(aircraft.mtow_N) / parseFloat(aircraft.wing_area_m2),
        id: aircraft.id,
        name: aircraft.name,
        category: aircraft.category_type,
        cruiseAltitude: aircraft.cruise_altitude_m
    }));
}

// Render flight diagram
function renderFlightDiagram(data, chartType, showTrendlines, xLogScale, yLogScale) {
    console.log(`Rendering flight diagram with ${data.length} items`);
    
    const canvas = document.getElementById('flight-diagram');
    if (!canvas) {
        console.error('Flight diagram canvas not found');
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

    // Add trendlines if requested
    if (showTrendlines) {
        datasets.push(...calculateTrendlines(data, chartType));
    }

    // Axis labels
    const axisLabels = {
        wing_loading_mtow: {
            x: 'MTOW (N)',
            y: 'Wing Loading (N/m²)'
        },
        speed_mtow: {
            x: 'MTOW (N)',
            y: 'Cruise Speed (m/s)'
        },
        wing_loading_speed: {
            x: 'Cruise Speed (m/s)',
            y: 'Wing Loading (N/m²)'
        }
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
                    type: xLogScale ? 'logarithmic' : 'linear',
                    title: {
                        display: true,
                        text: axisLabels[chartType]?.x || 'X'
                    }
                },
                y: {
                    type: yLogScale ? 'logarithmic' : 'linear',
                    title: {
                        display: true,
                        text: axisLabels[chartType]?.y || 'Y'
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const point = context.raw;
                            if (point.isTrendline) {
                                return point.name;
                            }
                            
                            let label = `${point.name}: `;
                            switch (chartType) {
                                case 'wing_loading_mtow':
                                    label += `MTOW ${point.x.toLocaleString()} N, Wing Loading ${point.y.toLocaleString()} N/m²`;
                                    break;
                                case 'speed_mtow':
                                    label += `MTOW ${point.x.toLocaleString()} N, Speed ${point.y.toFixed(1)} m/s`;
                                    if (point.cruiseAltitude) {
                                        label += ` (Alt: ${point.cruiseAltitude.toLocaleString()}m)`;
                                    }
                                    break;
                                case 'wing_loading_speed':
                                    label += `Speed ${point.x.toFixed(1)} m/s, Wing Loading ${point.y.toLocaleString()} N/m²`;
                                    if (point.cruiseAltitude) {
                                        label += ` (Alt: ${point.cruiseAltitude.toLocaleString()}m)`;
                                    }
                                    break;
                            }
                            return label;
                        }
                    }
                }
            },
            onClick: (e, elements) => {
                if (elements.length > 0) {
                    const index = elements[0].index;
                    const datasetIndex = elements[0].datasetIndex;
                    const point = datasets[datasetIndex].data[index];
                    if (!point.isTrendline) {
                        viewAircraftDetails(point.id);
                    }
                }
            }
        }
    });
}

// Calculate trendlines for the data
function calculateTrendlines(data, chartType) {
    const trendlines = [];
    const categories = [...new Set(data.map(item => item.category))];
    
    categories.forEach(category => {
        const categoryData = data.filter(item => item.category === category);
        if (categoryData.length < 2) return;

        // Calculate linear regression in log space
        const points = categoryData.map(item => ({
            x: Math.log(item.x),
            y: Math.log(item.y)
        }));

        const n = points.length;
        const sumX = points.reduce((sum, p) => sum + p.x, 0);
        const sumY = points.reduce((sum, p) => sum + p.y, 0);
        const sumXY = points.reduce((sum, p) => sum + p.x * p.y, 0);
        const sumX2 = points.reduce((sum, p) => sum + p.x * p.x, 0);

        const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;

        // Create trendline points
        const minX = Math.min(...categoryData.map(item => item.x));
        const maxX = Math.max(...categoryData.map(item => item.x));
        const numPoints = 100;
        const trendlinePoints = [];

        for (let i = 0; i < numPoints; i++) {
            const x = minX * Math.pow(maxX / minX, i / (numPoints - 1));
            const y = Math.exp(slope * Math.log(x) + intercept);
            trendlinePoints.push({
                x: x,
                y: y,
                isTrendline: true
            });
        }

        trendlines.push({
            label: `${getCategoryName(category)} Trend`,
            data: trendlinePoints,
            borderColor: categoryColors[category] || 'rgba(100, 100, 100, 0.7)',
            backgroundColor: 'transparent',
            borderWidth: 2,
            borderDash: [5, 5],
            pointRadius: 0,
            fill: false,
            showLine: true
        });
    });

    return trendlines;
} 