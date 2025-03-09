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
        colorGroup: document.getElementById('color-group'),
        showTrendlines: document.getElementById('showTrendlines'),
        kValue: document.getElementById('k-value')
    };

    // Set default values
    if (controls.chartType) controls.chartType.value = 'wing_loading_mtow';
    if (controls.colorGroup) controls.colorGroup.value = 'category_type';

    // Add event listeners
    Object.entries(controls).forEach(([key, element]) => {
        if (element) {
            element.addEventListener('change', updateFlightDiagram);
        }
    });

    // Add event listener for trendlines checkbox
    if (controls.showTrendlines) {
        controls.showTrendlines.addEventListener('change', (e) => {
            const trendlineControls = document.getElementById('trendline-controls');
            if (trendlineControls) {
                trendlineControls.style.display = e.target.checked ? 'block' : 'none';
            }
            updateFlightDiagram();
        });
    }

    console.log('Flight diagram controls initialized successfully');
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

        // Load bird data from processed file
        const birdsResponse = await fetch('data/processed/birds_processed.json');
        let birdData = { birds: [] };
        if (birdsResponse.ok) {
            birdData = await birdsResponse.json();
            console.log('Bird data loaded:', birdData.birds.length, 'birds');
        } else {
            console.warn('Failed to load bird data:', birdsResponse.status);
        }

        // Combine data
        const allData = [
            ...aircraftData.aircraft.map(a => ({...a, type: 'aircraft'})),
            ...(birdData.birds || []).map(b => ({...b, type: 'bird'}))
        ];

        // Update flight diagram
        updateFlightDiagram(allData);
    } catch (error) {
        console.error('Error loading aircraft data:', error);
        showAlert('Error loading data: ' + error.message, 'danger');
    }
}

// Update flight diagram
function updateFlightDiagram(data) {
    console.log('Updating flight diagram...');
    
    // Get selected parameters
    const chartType = document.getElementById('x-axis-param')?.value;
    const colorGroup = document.getElementById('color-group')?.value;
    const showTrendlines = document.getElementById('showTrendlines')?.checked || false;
    
    if (!chartType || !colorGroup) {
        console.error('Missing parameters for flight diagram');
        return;
    }

    // Update trendline equation display
    updateTrendlineEquation(chartType);

    try {
        // Check if data is loaded
        if (!data || data.length === 0) {
            console.log('No data available for flight diagram...');
            return;
        }

        // Process data based on chart type
        let processedData = [];
        switch (chartType) {
            case 'wing_loading_mtow':
                processedData = processWingLoadingMTOWData(data, colorGroup);
                break;
            case 'speed_tas_mtow':
                processedData = processSpeedMTOWData(data, colorGroup, 'TAS');
                break;
            case 'speed_ve_mtow':
                processedData = processSpeedMTOWData(data, colorGroup, 'VE');
                break;
            case 'wing_loading_speed_tas':
                processedData = processWingLoadingSpeedData(data, colorGroup, 'TAS');
                break;
            case 'wing_loading_speed_ve':
                processedData = processWingLoadingSpeedData(data, colorGroup, 'VE');
                break;
        }

        console.log(`Processed ${processedData.length} valid data points for flight diagram`);
        renderFlightDiagram(processedData, chartType, colorGroup, showTrendlines);
    } catch (error) {
        console.error('Error updating flight diagram:', error);
        showAlert('Error updating flight diagram: ' + error.message, 'danger');
    }
}

// Process data for Wing Loading vs MTOW chart
function processWingLoadingMTOWData(data, colorGroup) {
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
        category: aircraft[colorGroup] || 'unknown'
    }));
}

// Process data for Speed vs MTOW chart
function processSpeedMTOWData(data, colorGroup, speedType) {
    return data.filter(aircraft => {
        const hasMTOW = aircraft.mtow_N !== undefined && aircraft.mtow_N !== null && !isNaN(aircraft.mtow_N);
        const hasSpeed = speedType === 'TAS' ? 
            (aircraft.cruise_speed_ms !== undefined && aircraft.cruise_speed_ms !== null && !isNaN(aircraft.cruise_speed_ms)) :
            (aircraft.VE_cruise_ms !== undefined && aircraft.VE_cruise_ms !== null && !isNaN(aircraft.VE_cruise_ms));
        
        if (!hasMTOW || !hasSpeed) {
            if (aircraft.category_type === 'ave') {
                console.log(`Bird ${aircraft.name} missing speed data: MTOW=${aircraft.mtow_N}, Speed=${speedType === 'TAS' ? aircraft.cruise_speed_ms : aircraft.VE_cruise_ms}`);
            }
            return false;
        }
        return true;
    }).map(aircraft => ({
        x: parseFloat(aircraft.mtow_N),
        y: speedType === 'TAS' ? parseFloat(aircraft.cruise_speed_ms) : parseFloat(aircraft.VE_cruise_ms),
        id: aircraft.id,
        name: aircraft.name,
        category: aircraft[colorGroup] || 'unknown',
        cruiseAltitude: aircraft.cruise_altitude_m
    }));
}

// Process data for Wing Loading vs Speed chart
function processWingLoadingSpeedData(data, colorGroup, speedType) {
    return data.filter(aircraft => {
        const hasMTOW = aircraft.mtow_N !== undefined && aircraft.mtow_N !== null && !isNaN(aircraft.mtow_N);
        const hasWingArea = aircraft.wing_area_m2 !== undefined && aircraft.wing_area_m2 !== null && !isNaN(aircraft.wing_area_m2);
        const hasSpeed = speedType === 'TAS' ? 
            (aircraft.cruise_speed_ms !== undefined && aircraft.cruise_speed_ms !== null && !isNaN(aircraft.cruise_speed_ms)) :
            (aircraft.VE_cruise_ms !== undefined && aircraft.VE_cruise_ms !== null && !isNaN(aircraft.VE_cruise_ms));
        
        if (!hasMTOW || !hasWingArea || !hasSpeed) {
            if (aircraft.category_type === 'ave') {
                console.log(`Bird ${aircraft.name} missing data: MTOW=${aircraft.mtow_N}, Wing Area=${aircraft.wing_area_m2}, Speed=${speedType === 'TAS' ? aircraft.cruise_speed_ms : aircraft.VE_cruise_ms}`);
            }
            return false;
        }
        return true;
    }).map(aircraft => ({
        x: speedType === 'TAS' ? parseFloat(aircraft.cruise_speed_ms) : parseFloat(aircraft.VE_cruise_ms),
        y: parseFloat(aircraft.mtow_N) / parseFloat(aircraft.wing_area_m2),
        id: aircraft.id,
        name: aircraft.name,
        category: aircraft[colorGroup] || 'unknown',
        cruiseAltitude: aircraft.cruise_altitude_m
    }));
}

// Render flight diagram
function renderFlightDiagram(data, chartType, colorGroup, showTrendlines) {
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
        speed_tas_mtow: {
            x: 'MTOW (N)',
            y: 'True Airspeed (m/s)'
        },
        speed_ve_mtow: {
            x: 'MTOW (N)',
            y: 'Equivalent Airspeed (m/s)'
        },
        wing_loading_speed_tas: {
            x: 'True Airspeed (m/s)',
            y: 'Wing Loading (N/m²)'
        },
        wing_loading_speed_ve: {
            x: 'Equivalent Airspeed (m/s)',
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
                    type: 'logarithmic',  // Always use log scale
                    position: 'bottom',
                    title: {
                        display: true,
                        text: axisLabels[chartType]?.x || ''
                    }
                },
                y: {
                    type: 'logarithmic',  // Always use log scale
                    title: {
                        display: true,
                        text: axisLabels[chartType]?.y || ''
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

// Update trendline equation display
function updateTrendlineEquation(chartType) {
    const equationElement = document.getElementById('trendline-equation');
    const kValueInput = document.getElementById('k-value');
    
    if (!equationElement || !kValueInput) return;

    let equation = '';
    let defaultK = 0;

    switch (chartType) {
        case 'wing_loading_mtow':
            equation = 'W/S = k × W^(1/3)';
            defaultK = 25;
            break;
        case 'wing_loading_speed_tas':
        case 'wing_loading_speed_ve':
            equation = 'W/S = k × V²';
            defaultK = 0.38;
            break;
        default:
            equation = '';
            defaultK = 0;
    }

    equationElement.innerHTML = equation;
    if (!kValueInput.value || chartType !== kValueInput.dataset.lastChartType) {
        kValueInput.value = defaultK;
        kValueInput.dataset.lastChartType = chartType;
    }
}

// Calculate trendlines for the data
function calculateTrendlines(data, chartType) {
    const trendlines = [];
    
    // Skip if no data
    if (data.length < 2) return trendlines;

    // Get min and max x values
    const minX = Math.min(...data.map(item => item.x));
    const maxX = Math.max(...data.map(item => item.x));
    const numPoints = 100;
    const trendlinePoints = [];

    // Get k value from input
    const kValueInput = document.getElementById('k-value');
    const k = kValueInput ? parseFloat(kValueInput.value) : (chartType === 'wing_loading_mtow' ? 25 : 0.38);

    // Generate points based on chart type
    switch (chartType) {
        case 'wing_loading_mtow': {
            // W/S = k * W^(1/3)
            for (let i = 0; i < numPoints; i++) {
                const x = minX * Math.pow(maxX / minX, i / (numPoints - 1));
                const y = k * Math.pow(x, 1/3);
                trendlinePoints.push({ x, y });
            }
            break;
        }
        case 'wing_loading_speed_tas':
        case 'wing_loading_speed_ve': {
            // W/S = k * V²
            for (let i = 0; i < numPoints; i++) {
                const x = minX * Math.pow(maxX / minX, i / (numPoints - 1));
                const y = k * x * x;
                trendlinePoints.push({ x, y });
            }
            break;
        }
        // No trendlines for other chart types
        default:
            return [];
    }

    trendlines.push({
        label: `Theoretical Trend (k=${k.toFixed(2)})`,
        data: trendlinePoints,
        borderColor: 'rgba(0, 0, 0, 0.7)',
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderDash: [5, 5],
        pointRadius: 0,
        fill: false,
        showLine: true
    });

    return trendlines;
} 