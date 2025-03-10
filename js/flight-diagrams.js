// Global variables
let diagramConfig = null;
let aircraftData = [];
let currentChart = null;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', async function() {
    try {
        // First load configuration
        await loadDiagramConfig();
        
        // Then load data
        await loadAircraftData();
        
        // Finally initialize controls and update chart
        initializeControls();
    } catch (error) {
        console.error('Error during initialization:', error);
        showAlert('Error during initialization: ' + error.message, 'danger');
    }
});

// Load diagram configuration
async function loadDiagramConfig() {
    try {
        console.log('Loading diagram configuration...');
        const response = await fetch('data/flight_diagrams.json');
        if (!response.ok) {
            throw new Error(`Failed to load diagram configuration: ${response.status}`);
        }
        diagramConfig = await response.json();
        console.log('Diagram configuration loaded successfully');
    } catch (error) {
        console.error('Error loading diagram configuration:', error);
        showAlert('Error loading configuration: ' + error.message, 'danger');
        throw error;
    }
}

// Initialize controls
function initializeControls() {
    console.log('Initializing flight diagram controls...');
    
    if (!diagramConfig || !aircraftData) {
        console.error('Configuration or data not loaded');
        return;
    }

    // Get controls
    const controls = {
        diagramType: document.getElementById('x-axis-param'),
        colorGroup: document.getElementById('color-group'),
        showTrendlines: document.getElementById('showTrendlines'),
        kValue: document.getElementById('k-value'),
        trendlineControls: document.getElementById('trendline-controls'),
        trendlineEquation: document.getElementById('trendline-equation')
    };

    // Log control elements for debugging
    console.log('Control elements:', controls);

    // Populate diagram type select
    if (controls.diagramType) {
        controls.diagramType.innerHTML = '';
        Object.entries(diagramConfig.diagrams).forEach(([key, diagram]) => {
            const option = document.createElement('option');
            option.value = key;
            option.textContent = diagram.label;
            controls.diagramType.appendChild(option);
        });
        controls.diagramType.value = 'wing_loading_mtow';
        console.log(`Populated diagram types: ${controls.diagramType.options.length} options`);
    } else {
        console.error('Diagram type select element not found');
        return;
    }

    // Populate color group select
    if (controls.colorGroup) {
        controls.colorGroup.innerHTML = '';
        Object.entries(diagramConfig.colorGroups).forEach(([key, group]) => {
            const option = document.createElement('option');
            option.value = key;
            option.textContent = group.label;
            controls.colorGroup.appendChild(option);
        });
        controls.colorGroup.value = 'category_type';
        console.log(`Populated color groups: ${controls.colorGroup.options.length} options`);
    } else {
        console.error('Color group select element not found');
        return;
    }

    // Initialize trendline controls
    if (controls.showTrendlines) {
        controls.showTrendlines.checked = false;
    }
    if (controls.trendlineControls) {
        controls.trendlineControls.style.display = 'none';
    }

    // Add event listeners
    controls.diagramType?.addEventListener('change', () => {
        console.log('Diagram type changed:', controls.diagramType.value);
        updateTrendlineControls();
        updateChart();
    });

    controls.colorGroup?.addEventListener('change', () => {
        console.log('Color group changed:', controls.colorGroup.value);
        updateChart();
    });

    controls.showTrendlines?.addEventListener('change', (e) => {
        console.log('Show trendlines changed:', e.target.checked);
        if (controls.trendlineControls) {
            controls.trendlineControls.style.display = e.target.checked ? 'block' : 'none';
        }
        updateChart();
    });

    controls.kValue?.addEventListener('change', () => {
        console.log('K value changed:', controls.kValue.value);
        updateChart();
    });

    // Initial update of trendline controls and chart
    updateTrendlineControls();
    updateChart();

    console.log('Flight diagram controls initialized successfully');
}

// Update trendline controls visibility and values
function updateTrendlineControls() {
    const diagramType = document.getElementById('x-axis-param')?.value;
    const trendlineControls = document.getElementById('trendline-controls');
    const trendlineEquation = document.getElementById('trendline-equation');
    const kValue = document.getElementById('k-value');
    const showTrendlines = document.getElementById('showTrendlines');

    if (!diagramType || !diagramConfig.diagrams[diagramType]) return;

    const diagram = diagramConfig.diagrams[diagramType];
    const hasTrendline = !!diagram.trendline;

    // Update controls visibility
    if (trendlineControls) {
        trendlineControls.style.display = hasTrendline && showTrendlines.checked ? 'block' : 'none';
    }

    if (showTrendlines) {
        showTrendlines.disabled = !hasTrendline;
    }

    // Update equation and k value
    if (hasTrendline) {
        if (trendlineEquation) {
            trendlineEquation.innerHTML = diagram.trendline.equation;
        }
        if (kValue && (!kValue.value || diagramType !== kValue.dataset.lastDiagram)) {
            kValue.value = diagram.trendline.defaultK;
            kValue.dataset.lastDiagram = diagramType;
        }
    } else {
        if (trendlineEquation) trendlineEquation.innerHTML = '';
        if (kValue) kValue.value = '';
    }
}

// Load aircraft data
async function loadAircraftData() {
    try {
        console.log('Loading aircraft and bird data...');
        
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

        // Combine and process data
        aircraftData = [
            ...aircraft.map(a => ({
                ...a,
                type: 'aircraft',
                image_url: a.image_url,
                wing_loading_Nm2: a.mtow_N && a.wing_area_m2 ? a.mtow_N / a.wing_area_m2 : null
            })),
            ...birds.map(b => ({
                ...b,
                type: 'bird',
                category_type: 'ave',
                image_url: b.image_url,
                wing_loading_Nm2: b.mtow_N && b.wing_area_m2 ? b.mtow_N / b.wing_area_m2 : null
            }))
        ];

        console.log('Total data points loaded:', aircraftData.length);
    } catch (error) {
        console.error('Error loading aircraft data:', error);
        showAlert('Error loading data: ' + error.message, 'danger');
        throw error;
    }
}

// Update chart
function updateChart() {
    console.log('Updating flight diagram...', {
        hasConfig: !!diagramConfig,
        dataType: typeof aircraftData,
        isArray: Array.isArray(aircraftData),
        dataLength: aircraftData?.length
    });
    
    if (!diagramConfig) {
        console.error('Configuration not loaded');
        showAlert('Error: Configuration not loaded', 'danger');
        return;
    }

    if (!aircraftData || !Array.isArray(aircraftData)) {
        console.error('Aircraft data not properly loaded:', {
            data: aircraftData,
            type: typeof aircraftData
        });
        showAlert('Error: Data not properly loaded', 'danger');
        return;
    }

    // Get selected parameters
    const diagramType = document.getElementById('x-axis-param')?.value;
    const colorGroup = document.getElementById('color-group')?.value;
    const showTrendlines = document.getElementById('showTrendlines')?.checked || false;
    
    console.log('Selected parameters:', { diagramType, colorGroup, showTrendlines });

    if (!diagramType || !colorGroup) {
        console.error('Missing parameters for flight diagram:', {
            diagramType,
            colorGroup
        });
        showAlert('Error: Missing chart parameters', 'danger');
        return;
    }

    const diagram = diagramConfig.diagrams[diagramType];
    if (!diagram) {
        console.error('Invalid diagram type:', diagramType);
        showAlert('Error: Invalid diagram type', 'danger');
        return;
    }

    try {
        // Process data with detailed logging
        console.log('Processing data with params:', {
            xParam: diagram.x.param,
            yParam: diagram.y.param,
            dataPoints: aircraftData.length
        });

        const processedData = aircraftData.filter(aircraft => {
            if (!aircraft) return false;
            
            const hasX = aircraft[diagram.x.param] !== undefined && 
                        aircraft[diagram.x.param] !== null && 
                        !isNaN(aircraft[diagram.x.param]);
            const hasY = aircraft[diagram.y.param] !== undefined && 
                        aircraft[diagram.y.param] !== null && 
                        !isNaN(aircraft[diagram.y.param]);
            
            if (!hasX || !hasY) {
                console.debug(`Data point missing required values:`, {
                    name: aircraft.name,
                    category: aircraft.category_type,
                    xValue: aircraft[diagram.x.param],
                    yValue: aircraft[diagram.y.param]
                });
                return false;
            }
            return true;
        }).map(aircraft => ({
            ...aircraft,
            x: parseFloat(aircraft[diagram.x.param]),
            y: parseFloat(aircraft[diagram.y.param]),
            id: aircraft.id,
            name: aircraft.name,
            category: aircraft[colorGroup] || 'unknown',
            image_url: aircraft.image_url
        }));

        console.log(`Processed ${processedData.length} valid data points for flight diagram`);
        
        if (processedData.length === 0) {
            showAlert('No valid data points for selected parameters', 'warning');
            return;
        }

        renderChart(processedData, diagram, colorGroup, showTrendlines);
    } catch (error) {
        console.error('Error updating flight diagram:', error);
        showAlert('Error updating flight diagram: ' + error.message, 'danger');
    }
}

// Render chart
function renderChart(data, diagram, colorGroup, showTrendlines) {
    console.log(`Rendering flight diagram with ${data.length} items`);
    
    const canvas = document.getElementById('flight-diagram');
    if (!canvas) {
        console.error('Flight diagram canvas not found');
        return;
    }

    // Destroy existing chart
    if (currentChart) {
        currentChart.destroy();
    }

    // Get color palette
    const colorPalette = diagramConfig.colorGroups[colorGroup]?.colors || {};

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
        label: category,
        data: items,
        backgroundColor: colorPalette[category] || 'rgba(100, 100, 100, 0.7)',
        borderColor: colorPalette[category] || 'rgba(100, 100, 100, 0.7)',
        pointRadius: 5,
        pointHoverRadius: 8
    }));

    // Add trendline if requested
    if (showTrendlines && diagram.trendline) {
        const trendline = calculateTrendline(data, diagram);
        if (trendline) {
            datasets.push(trendline);
        }
    }

    // Create chart
    currentChart = new Chart(canvas, {
        type: 'scatter',
        data: { datasets },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    type: diagram.x.scale || 'linear',
                    position: 'bottom',
                    title: {
                        display: true,
                        text: diagram.x.label
                    }
                },
                y: {
                    type: diagram.y.scale || 'linear',
                    title: {
                        display: true,
                        text: diagram.y.label
                    }
                }
            },
            plugins: {
                tooltip: {
                    enabled: false,
                    external: function(context) {
                        // Tooltip Element
                        let tooltipEl = document.getElementById('chartjs-tooltip-flight');

                        // Create element on first render
                        if (!tooltipEl) {
                            tooltipEl = document.createElement('div');
                            tooltipEl.id = 'chartjs-tooltip-flight';
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
                                <div>${diagram.x.label}: ${point.x.toLocaleString()}</div>
                                <div>${diagram.y.label}: ${point.y.toLocaleString()}</div>
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
    });
}

// Calculate trendline
function calculateTrendline(data, diagram) {
    if (data.length < 2) return null;

    const minX = Math.min(...data.map(item => item.x));
    const maxX = Math.max(...data.map(item => item.x));
    const numPoints = 100;
    const trendlinePoints = [];

    const kValueInput = document.getElementById('k-value');
    const k = kValueInput ? parseFloat(kValueInput.value) : diagram.trendline.defaultK;

    // Generate points based on diagram type
    for (let i = 0; i < numPoints; i++) {
        const x = minX * Math.pow(maxX / minX, i / (numPoints - 1));
        let y;

        if (diagram.trendline.equation.includes('W^(1/3)')) {
            y = k * Math.pow(x, 1/3);  // W/S = k * W^(1/3)
        } else if (diagram.trendline.equation.includes('V²')) {
            y = k * x * x;  // W/S = k * V²
        }

        trendlinePoints.push({ x, y });
    }

    return {
        label: `Theoretical Trend (k=${k.toFixed(2)})`,
        data: trendlinePoints,
        borderColor: 'rgba(0, 0, 0, 0.7)',
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderDash: [5, 5],
        pointRadius: 0,
        fill: false,
        showLine: true
    };
} 