// Configuração da API
const API_URL = 'api';
const DEV_API_URL = 'http://localhost:5001/api';
const JSON_DATA_PATH = 'data/aircraft.json';

// Configurações globais
const FALLBACK_IMAGES = {
    'comercial': 'images/fallback/comercial.jpg',
    'executiva': 'images/fallback/executiva.jpg',
    'carga': 'images/fallback/carga.jpg',
    'militar': 'images/fallback/militar.jpg',
    'geral': 'images/fallback/geral.jpg',
    'historica': 'images/fallback/historica.jpg',
    'experimental': 'images/fallback/experimental.jpg',
    'ave': 'images/fallback/ave.jpg'
};

const DEFAULT_FALLBACK_IMAGE = 'images/fallback/geral.jpg';

// Make aircraftData globally available
window.aircraftData = [];

// Elementos DOM
const navLinks = document.querySelectorAll('.nav-link');
const pages = document.querySelectorAll('.page');
const aircraftTableBody = document.getElementById('aircraft-table-body');
const aircraftSearch = document.getElementById('aircraft-search');
const btnAddAircraft = document.getElementById('btn-add-aircraft');
const btnImportSample = document.getElementById('btn-import-sample');
const saveAircraftBtn = document.getElementById('save-aircraft');
const aircraftForm = document.getElementById('aircraft-form');
let aircraftModal;
let aircraftDetailsModal;

// Elementos para gráficos
const xParamSelect = document.getElementById('x-param');
const yParamSelect = document.getElementById('y-param');
const timelineParamSelect = document.getElementById('timeline-param');
const xAxisParamSelect = document.getElementById('x-axis-param');
const scatterChart = document.getElementById('scatter-chart');
const timelineChart = document.getElementById('timeline-chart');
const flightDiagramChart = document.getElementById('flight-diagram-chart');
const selectedAircraftDetails = document.getElementById('selected-aircraft-details');

// Elementos para escala logarítmica
const xLogScale = document.getElementById('x-log-scale');
const yLogScale = document.getElementById('y-log-scale');
const timelineLogScale = document.getElementById('timeline-log-scale');

// Variáveis globais
let aircraftData = [];
let scatterChartInstance = null;
let timelineChartInstance = null;
let flightDiagramChartInstance = null;
let parameters = [];
let showEquivalentSpeed = false;
let speedWeightChartInstance = null;
let speedYearChartInstance = null;
let speedType = 'tas'; // 'tas' para True Airspeed, 've' para Equivalent Airspeed

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    // Initialize components
    initializeNavigation();
    initializeFilters();
    initializeTable();
    initializeCharts();
    initializeTimeline();
    initializeAircraftModal();
    
    // Load data
    loadAircraftData();
});

// Function to initialize navigation
function initializeNavigation() {
    console.log('Initializing navigation...');
    setupNavigation();
    
    // Set initial active page
    const defaultPage = 'scatter-plot';
    const defaultLink = document.querySelector(`[data-page="${defaultPage}"]`);
    if (defaultLink) {
        defaultLink.classList.add('active');
        pages.forEach(page => {
            page.classList.toggle('d-none', page.id !== defaultPage);
        });
    }
    
    console.log('Navigation initialized successfully');
}

// Function to initialize filters
function initializeFilters() {
    console.log('Initializing filters...');
    
    // Get filter elements
    const categoryTypeFilter = document.getElementById('category-type-filter');
    const categoryEraFilter = document.getElementById('category-era-filter');
    const categoryEngineFilter = document.getElementById('category-engine-filter');
    const categorySizeFilter = document.getElementById('category-size-filter');
    
    // Add event listeners to filters
    [categoryTypeFilter, categoryEraFilter, categoryEngineFilter, categorySizeFilter].forEach(filter => {
        if (filter) {
            filter.addEventListener('change', applyFilters);
        }
    });
    
    // Add search functionality
    const searchInput = document.getElementById('aircraft-search');
    if (searchInput) {
        searchInput.addEventListener('input', applyFilters);
    }
    
    console.log('Filters initialized successfully');
}

// Function to apply filters
function applyFilters() {
    const searchTerm = document.getElementById('aircraft-search')?.value.toLowerCase() || '';
    const selectedType = document.getElementById('category-type-filter')?.value || 'all';
    const selectedEra = document.getElementById('category-era-filter')?.value || 'all';
    const selectedEngine = document.getElementById('category-engine-filter')?.value || 'all';
    const selectedSize = document.getElementById('category-size-filter')?.value || 'all';
    
    const rows = document.querySelectorAll('#aircraft-table-body tr');
    
    rows.forEach(row => {
        const name = row.querySelector('.aircraft-name')?.textContent.toLowerCase() || '';
        const type = row.getAttribute('data-category-type') || '';
        const era = row.getAttribute('data-category-era') || '';
        const engine = row.getAttribute('data-category-engine') || '';
        const size = row.getAttribute('data-category-size') || '';
        
        const matchesSearch = name.includes(searchTerm);
        const matchesType = selectedType === 'all' || type === selectedType;
        const matchesEra = selectedEra === 'all' || era === selectedEra;
        const matchesEngine = selectedEngine === 'all' || engine === selectedEngine;
        const matchesSize = selectedSize === 'all' || size === selectedSize;
        
        row.style.display = 
            matchesSearch && matchesType && matchesEra && 
            matchesEngine && matchesSize ? '' : 'none';
    });
}

// Function to initialize table
function initializeTable() {
    console.log('Initializing table...');
    
    // Get table header cells
    const tableHeaders = document.querySelectorAll('#aircraft-table th[data-sort]');
    
    // Initialize sorting state
    let currentSortColumn = null;
    let currentSortDirection = 'asc';
    
    // Add click event listeners to sortable headers
    tableHeaders.forEach(header => {
        header.addEventListener('click', () => {
            const sortKey = header.getAttribute('data-sort');
            
            // Toggle sort direction if clicking the same column
            if (currentSortColumn === sortKey) {
                currentSortDirection = currentSortDirection === 'asc' ? 'desc' : 'asc';
            } else {
                currentSortDirection = 'asc';
            }
            currentSortColumn = sortKey;
            
            // Remove sort indicators from all headers
            tableHeaders.forEach(h => {
                h.classList.remove('sort-asc', 'sort-desc');
            });
            
            // Add sort indicator to current header
            header.classList.add(`sort-${currentSortDirection}`);
            
            // Sort the table
            sortTable(sortKey, currentSortDirection);
        });
    });
    
    console.log('Table initialized successfully');
}

// Function to sort table
function sortTable(column, direction) {
    const tbody = document.querySelector('#aircraft-table-body');
    const rows = Array.from(tbody.querySelectorAll('tr'));
    
    // Sort rows
    rows.sort((a, b) => {
        let aValue = getCellValue(a, column);
        let bValue = getCellValue(b, column);
        
        // Handle numeric values
        if (!isNaN(aValue) && !isNaN(bValue)) {
            aValue = parseFloat(aValue);
            bValue = parseFloat(bValue);
        }
        
        if (aValue === bValue) return 0;
        if (direction === 'asc') {
            return aValue > bValue ? 1 : -1;
        } else {
            return aValue < bValue ? 1 : -1;
        }
    });
    
    // Reorder rows in the table
    rows.forEach(row => tbody.appendChild(row));
}

// Helper function to get cell value for sorting
function getCellValue(row, column) {
    const cell = row.querySelector(`td:nth-child(${getColumnIndex(column) + 1})`);
    return cell ? cell.textContent.trim() : '';
}

// Helper function to get column index
function getColumnIndex(column) {
    const headers = document.querySelectorAll('#aircraft-table th');
    for (let i = 0; i < headers.length; i++) {
        if (headers[i].getAttribute('data-sort') === column) {
            return i;
        }
    }
    return 0;
}

// Função para carregar dados de aeronaves
async function loadAircraftData() {
    console.log('Loading aircraft and bird data...');
    
    try {
        // Carregar aeronaves e aves
        console.log('Trying to load aircraft_processed.json...');
        const aircraftResponse = await fetch('data/processed/aircraft_processed.json');
        console.log('Aircraft_processed.json response status:', aircraftResponse.status);
        
        if (!aircraftResponse.ok) {
            throw new Error(`Failed to load aircraft data: ${aircraftResponse.status} - ${aircraftResponse.statusText}`);
        }
        
        const aircraftData = await aircraftResponse.json();
        console.log('Aircraft data loaded successfully:', aircraftData.aircraft.length, 'aircraft');

        console.log('Trying to load birds_processed.json...');
        const birdsResponse = await fetch('data/processed/birds_processed.json');
        console.log('Birds_processed.json response status:', birdsResponse.status);

        let birds = [];
        if (birdsResponse.ok) {
            const birdsData = await birdsResponse.json();
            birds = birdsData.birds || [];
            console.log('Bird data loaded successfully:', birds.length, 'birds');
        } else {
            console.warn('Failed to load bird data:', birdsResponse.status, birdsResponse.statusText);
        }

        // Processar e combinar dados
        const processedAircraft = aircraftData.aircraft.map(categorizeAircraft);
        const processedBirds = birds.map(bird => categorizeAircraft({...bird, category_type: 'ave'}));
        
        // Combinar e armazenar dados
        window.aircraftData = [...processedAircraft, ...processedBirds];
        console.log('Total processed data:', window.aircraftData.length, 'items');
        
        // Atualizar interface
        renderTableSafely(window.aircraftData);
        return window.aircraftData;
    } catch (error) {
        console.error('Detailed error loading data:', error);
        console.error('Stack trace:', error.stack);
        showAlert('Error loading data: ' + error.message, 'danger');
        return [];
    }
}

async function loadParameters() {
    try {
        const response = await fetch(`${API_URL}/parameters`);
        parameters = await response.json();
        populateParameterSelects();
    } catch (error) {
        console.error('Erro ao carregar parâmetros:', error);
    }
}

// Função auxiliar para renderizar a tabela com segurança
function renderTableSafely(data) {
    try {
        const tbody = document.getElementById('aircraft-table-body');
        if (!tbody) {
            console.error('tbody element not found');
            return;
        }

        // Limpar a tabela antes de renderizar
        tbody.innerHTML = '';

        // Verificar se temos dados válidos
        if (!data || !Array.isArray(data) || data.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center">
                        No data available
                    </td>
                </tr>
            `;
            return;
        }

        // Criar todas as linhas de uma vez
        const fragment = document.createDocumentFragment();

        // Processar cada aeronave
        data.forEach(aircraft => {
            if (!aircraft) return;  // Pular entradas nulas

            const row = document.createElement('tr');

            // Adicionar categorias como atributos de dados para filtragem
            if (aircraft.category_type) {
                row.setAttribute('data-category-type', aircraft.category_type);
            }
            if (aircraft.category_era) row.setAttribute('data-category-era', aircraft.category_era);
            if (aircraft.category_engine) row.setAttribute('data-category-engine', aircraft.category_engine);
            if (aircraft.category_size) row.setAttribute('data-category-size', aircraft.category_size);

            // Criar o HTML da célula do nome com tooltip
            const nameCell = `
                <a href="#" 
                   onclick="viewAircraftDetails(${aircraft.id}); return false;" 
                   class="aircraft-name"
                   data-bs-toggle="tooltip" 
                   data-bs-placement="right" 
                   title="${aircraft.name}"
                >
                    ${aircraft.name || 'No name'}
                </a>
            `;

            row.innerHTML = `
                <td>${nameCell}</td>
                <td>${aircraft.manufacturer || '-'}</td>
                <td>${aircraft.model || '-'}</td>
                <td>${aircraft.first_flight_year || '-'}</td>
                <td>${getCategoryName(aircraft.category_type) || '-'}</td>
                <td>${getCategoryEra(aircraft.category_era) || '-'}</td>
                <td>${aircraft.mtow ? aircraft.mtow.toLocaleString() : '-'}</td>
            `;

            fragment.appendChild(row);
        });

        // Adicionar todas as linhas de uma vez
        tbody.appendChild(fragment);

        // Inicializar tooltips do Bootstrap
        if (typeof bootstrap !== 'undefined' && bootstrap.Tooltip) {
            const tooltips = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
            tooltips.map(function (tooltipTriggerEl) {
                return new bootstrap.Tooltip(tooltipTriggerEl);
            });
        }

        // Aplicar filtros se existirem
        if (window.applyFilters && typeof window.applyFilters === 'function') {
            window.applyFilters();
        }
    } catch (error) {
        console.error('Error rendering table:', error);
        showAlert('Error rendering table: ' + error.message, 'danger');
    }
}

function populateParameterSelects() {
    console.log('Populando selects de parâmetros...');
    
    // Parâmetros disponíveis para os gráficos
    const availableParams = [
        { value: 'mtow_N', label: 'MTOW (N)' },
        { value: 'wing_area_m2', label: 'Área da Asa (m²)' },
        { value: 'wingspan_m', label: 'Envergadura (m)' },
        { value: 'cruise_speed_ms', label: 'Velocidade de Cruzeiro (m/s)' },
        { value: 'takeoff_speed_ms', label: 'Velocidade de Decolagem (m/s)' },
        { value: 'landing_speed_ms', label: 'Velocidade de Pouso (m/s)' },
        { value: 'service_ceiling_m', label: 'Teto de Serviço (m)' },
        { value: 'max_thrust', label: 'Empuxo Máximo (kN)' },
        { value: 'engine_count', label: 'Número de Motores' },
        { value: 'first_flight_year', label: 'Ano do Primeiro Voo' },
        { value: 'range_km', label: 'Alcance (km)' },
        { value: 'max_speed_ms', label: 'Velocidade Máxima (m/s)' }
    ];
    
    // Referências aos selects
    const xParamSelect = document.getElementById('x-param');
    const yParamSelect = document.getElementById('y-param');
    const timelineParamSelect = document.getElementById('timeline-param');
    
    // Limpar e preencher os selects
    [xParamSelect, yParamSelect, timelineParamSelect].forEach(select => {
        if (!select) return;
        
        // Limpar opções existentes
        select.innerHTML = '';
        
        // Adicionar novas opções
        availableParams.forEach(param => {
            const option = document.createElement('option');
            option.value = param.value;
            option.textContent = param.label;
            select.appendChild(option);
        });
    });
    
    // Definir valores padrão
    if (xParamSelect) xParamSelect.value = 'mtow_N';
    if (yParamSelect) yParamSelect.value = 'cruise_speed_ms';
    if (timelineParamSelect) timelineParamSelect.value = 'cruise_speed_ms';
    
    console.log('Selects de parâmetros populados com sucesso');
}

// Função auxiliar para obter a URL da API correta
async function getApiUrl(endpoint) {
    const url = `${API_URL}${endpoint}`;
    const devUrl = `${DEV_API_URL}${endpoint}`;
    
    try {
        const response = await fetch(url, { method: 'HEAD' });
        if (response.ok) return url;
    } catch (e) {
        // Falha ao acessar a URL relativa, tentar URL de desenvolvimento
    }
    
    return devUrl;
}

// Function to initialize charts
function initializeCharts() {
    console.log('Initializing charts...');
    
    // Initialize chart controls
    const controls = {
        scatter: {
            xParam: document.getElementById('x-param'),
            yParam: document.getElementById('y-param'),
            xLogScale: document.getElementById('x-log-scale'),
            yLogScale: document.getElementById('y-log-scale')
        },
        timeline: {
            param: document.getElementById('timeline-param'),
            logScale: document.getElementById('timeline-log-scale')
        },
        flightDiagram: {
            xAxisParam: document.getElementById('x-axis-param'),
            showTrendlines: document.getElementById('showTrendlines'),
            xLogScale: document.getElementById('xLogScale'),
            yLogScale: document.getElementById('yLogScale')
        }
    };

    // Set default values for scatter plot
    if (controls.scatter.xParam) controls.scatter.xParam.value = 'mtow_N';
    if (controls.scatter.yParam) controls.scatter.yParam.value = 'cruise_speed_ms';

    // Set default values for timeline
    if (controls.timeline.param) controls.timeline.param.value = 'cruise_speed_ms';

    // Set default values for flight diagram
    if (controls.flightDiagram.xAxisParam) controls.flightDiagram.xAxisParam.value = 'wing_loading_mtow';

    // Add event listeners
    Object.values(controls).forEach(controlGroup => {
        Object.entries(controlGroup).forEach(([key, element]) => {
            if (element) {
                element.addEventListener('change', () => {
                    updateCharts();
                });
            }
        });
    });

    // Initialize Chart.js defaults
    if (typeof Chart !== 'undefined') {
        Chart.defaults.font.family = "'Arial', sans-serif";
        Chart.defaults.font.size = 12;
        Chart.defaults.plugins.tooltip.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        Chart.defaults.plugins.legend.position = 'top';
    }

    console.log('Charts initialized successfully');
}

// Function to initialize timeline
function initializeTimeline() {
    console.log('Initializing timeline...');
    
    // Get timeline controls
    const timelineControls = {
        param: document.getElementById('timeline-param'),
        logScale: document.getElementById('timeline-log-scale')
    };
    
    // Set default values
    if (timelineControls.param) {
        timelineControls.param.value = 'cruise_speed_ms';
    }
    
    // Add event listeners
    Object.entries(timelineControls).forEach(([key, element]) => {
        if (element) {
            element.addEventListener('change', () => {
                updateTimelineChart();
            });
        }
    });
    
    console.log('Timeline initialized successfully');
}

// Function to initialize aircraft modal
function initializeAircraftModal() {
    console.log('Initializing aircraft modal...');
    
    // Initialize Bootstrap modal
    const modalElement = document.getElementById('aircraft-details-modal');
    if (modalElement) {
        aircraftModal = new bootstrap.Modal(modalElement);
    }
    
    console.log('Aircraft modal initialized successfully');
}

// Update the updateScatterChart function to properly process data
function updateScatterChart() {
    console.log('Atualizando gráfico de dispersão...');
    
    // Get selected parameters
    const xParam = document.getElementById('x-param')?.value;
    const yParam = document.getElementById('y-param')?.value;
    
    if (!xParam || !yParam) {
        console.error('Missing parameters for scatter chart');
        return;
    }

    try {
        // Use the loaded data
        if (!window.aircraftData || window.aircraftData.length === 0) {
            console.log('Loading data for scatter chart...');
            loadAircraftData();
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

// Function to render scatter chart
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

    // Group data by category
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

// Função para visualizar detalhes da aeronave
async function viewAircraftDetails(id) {
    console.log(`Visualizando detalhes da aeronave ID: ${id}`);
    
    // Mostrar o modal
    const modal = new bootstrap.Modal(document.getElementById('aircraft-details-modal'));
    modal.show();
    
    try {
        // Tentar encontrar a aeronave nos dados já carregados
        let aircraft = null;
        
        if (window.aircraftData && Array.isArray(window.aircraftData)) {
            aircraft = window.aircraftData.find(a => a.id === id);
            console.log('Aeronave encontrada nos dados carregados:', aircraft ? 'Sim' : 'Não');
        }
        
        // Se não encontrou nos dados carregados, tentar carregar do arquivo JSON
        if (!aircraft) {
            try {
                const response = await fetch('data/aircraft.json');
                if (response.ok) {
                    const jsonData = await response.json();
                    if (jsonData && jsonData.aircraft && Array.isArray(jsonData.aircraft)) {
                        aircraft = jsonData.aircraft.find(a => a.id === id);
                        console.log('Aeronave encontrada no arquivo JSON:', aircraft ? 'Sim' : 'Não');
                    }
                }
            } catch (jsonError) {
                console.warn('Erro ao buscar do arquivo JSON:', jsonError);
            }
        }
        
        // Se ainda não encontrou, mostrar mensagem de erro
        if (!aircraft) {
            console.warn(`Aeronave com ID ${id} não encontrada em nenhuma fonte de dados`);
            document.getElementById('aircraft-details-body').innerHTML = `
                <div class="alert alert-warning">
                    Aircraft not found ID: ${id}
                </div>
            `;
            return;
        }
        
        // Validar URL da imagem
        let imageUrl = aircraft.image_url;
        if (typeof getValidImageUrl === 'function') {
            try {
                imageUrl = await getValidImageUrl(aircraft);
            } catch (error) {
                console.error('Erro ao validar URL da imagem:', error);
            }
        }
        
        // Função auxiliar para formatar números com unidades
        const formatValue = (value, unit, decimals = 2) => {
            if (value === undefined || value === null) return 'N/A';
            return `${Number(value).toLocaleString('pt-BR', { maximumFractionDigits: decimals })} ${unit}`;
        };
        
        // Calcular valores derivados
        const wingLoading = aircraft.mtow_N && aircraft.wing_area_m2 
            ? (aircraft.mtow_N / aircraft.wing_area_m2)
            : null;
            
        const aspectRatio = aircraft.wingspan_m && aircraft.wing_area_m2 
            ? ((aircraft.wingspan_m * aircraft.wingspan_m) / aircraft.wing_area_m2)
            : null;
            
        // Converter velocidades de m/s para km/h
        const msToKmh = (ms) => ms ? (ms * 3.6) : null;
        
        // Preencher o modal com os detalhes da aeronave
        document.getElementById('aircraft-details-title').textContent = aircraft.name;
        
        document.getElementById('aircraft-details-body').innerHTML = `
            <div class="row">
                <div class="col-md-5">
                    <img src="${imageUrl}" alt="${aircraft.name}" class="img-fluid rounded mb-3" 
                         style="max-height: 300px; width: 100%; object-fit: cover;">
                </div>
                <div class="col-md-7">
                    <h4>${aircraft.manufacturer || ''} ${aircraft.model || ''}</h4>
                    <p class="text-muted">
                        ${getCategoryName(aircraft.category_type)} | 
                        ${getCategoryEra(aircraft.category_era)}
                    </p>
                    
                    <div class="row mt-3">
                        <div class="col-md-6">
                            <p><strong>First Flight Year:</strong> ${aircraft.first_flight_year || 'N/A'}</p>
                            <p><strong>MTOW:</strong> ${formatValue(aircraft.mtow_N / 9.81, 'kg')}</p>
                            <p><strong>Wing Area:</strong> ${formatValue(aircraft.wing_area_m2, 'm²')}</p>
                            <p><strong>Wingspan:</strong> ${formatValue(aircraft.wingspan_m, 'm')}</p>
                            <p><strong>Wing Loading:</strong> ${formatValue(wingLoading, 'N/m²')}</p>
                        </div>
                        <div class="col-md-6">
                            <p><strong>Cruise Speed:</strong> ${formatValue(msToKmh(aircraft.cruise_speed_ms), 'km/h')}</p>
                            <p><strong>Takeoff Speed:</strong> ${formatValue(msToKmh(aircraft.takeoff_speed_ms), 'km/h')}</p>
                            <p><strong>Landing Speed:</strong> ${formatValue(msToKmh(aircraft.landing_speed_ms), 'km/h')}</p>
                            <p><strong>Service Ceiling:</strong> ${formatValue(aircraft.service_ceiling_m, 'm')}</p>
                            <p><strong>Cruise Altitude:</strong> ${formatValue(aircraft.cruise_altitude_m, 'm')}</p>
                            <p><strong>Engine Type:</strong> ${aircraft.engine_count || 'N/A'} × ${aircraft.engine_type || 'N/A'}</p>
                            ${aircraft.max_thrust ? `<p><strong>Max Thrust:</strong> ${formatValue(aircraft.max_thrust, 'kN')}</p>` : ''}
                        </div>
                    </div>
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Erro ao visualizar detalhes da aeronave:', error);
        showAlert('Erro ao carregar detalhes da aeronave: ' + error.message, 'danger');
    }
}

// Função para obter o valor da velocidade
function getSpeedValue(aircraft) {
    if (!aircraft || !aircraft.cruise_speed_ms) return 0;
    
    if (showEquivalentSpeed) {
        // Calculate VE based on TAS and altitude
        // VE = TAS * sqrt(density ratio)
        // Density ratio approximated by exp(-altitude/scale height)
        // Scale height = 7400m for standard atmosphere
        if (aircraft.cruise_altitude_m) {
            const rho = Math.exp(-aircraft.cruise_altitude_m / 7400); // Approximate density ratio
            const ve = aircraft.cruise_speed_ms * Math.sqrt(rho);
            console.log(`Aircraft: ${aircraft.name}, TAS: ${aircraft.cruise_speed_ms}, VE: ${ve.toFixed(2)}, Altitude: ${aircraft.cruise_altitude_m}m, Density ratio: ${rho.toFixed(4)}`);
            return ve;
        } else {
            // If no altitude data, assume sea level (no difference)
            console.log(`Aircraft: ${aircraft.name}, No altitude data, using TAS: ${aircraft.cruise_speed_ms}`);
            return aircraft.cruise_speed_ms;
        }
    }
    
    console.log(`TAS for ${aircraft.name}: ${aircraft.cruise_speed_ms}`);
    return aircraft.cruise_speed_ms;
}

// Função para obter o rótulo da velocidade
function getSpeedLabel() {
    return showEquivalentSpeed ? 'Equivalent Speed (VE) [m/s]' : 'True Airspeed (TAS) [m/s]';
}

function createSpeedWeightChart(data) {
    const canvas = document.getElementById('flight-diagram-chart');
    if (!canvas) {
        console.error('Canvas element flight-diagram-chart not found');
        return;
    }

    // Destroy any existing chart on this canvas
    const existingChart = Chart.getChart(canvas);
    if (existingChart) {
        existingChart.destroy();
    }

    const ctx = canvas.getContext('2d');

    // Prepare datasets
    const datasets = [];
    const categories = ['ave', 'comercial', 'militar', 'geral', 'historica', 'executiva'];
    const colors = {
        'ave': 'rgba(255, 99, 132, 0.7)',
        'comercial': 'rgba(54, 162, 235, 0.7)',
        'militar': 'rgba(255, 206, 86, 0.7)',
        'geral': 'rgba(75, 192, 192, 0.7)',
        'historica': 'rgba(153, 102, 255, 0.7)',
        'executiva': 'rgba(255, 159, 64, 0.7)'
    };

    categories.forEach(category => {
        const categoryData = data.filter(a => a.category_type === category);
        datasets.push({
            label: category,
            data: categoryData.map(a => ({
                x: a.mtow,
                y: getSpeedValue(a),
                aircraft: a
            })),
            backgroundColor: colors[category],
            borderColor: colors[category],
            pointRadius: 5,
            pointHoverRadius: 7
        });
    });

    // Create chart
    speedWeightChartInstance = new Chart(ctx, {
        type: 'scatter',
        data: {
            datasets: datasets
        },
        options: {
            scales: {
                x: {
                    type: 'logarithmic',
                    position: 'bottom',
                    title: {
                        display: true,
                        text: 'MTOW [kg]'
                    }
                },
                y: {
                    type: 'logarithmic',
                    title: {
                        display: true,
                        text: getSpeedLabel()
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const aircraft = context.raw.aircraft;
                            const speed = getSpeedValue(aircraft);
                            return `${aircraft.name}: ${speed.toFixed(0)} km/h, ${aircraft.mtow.toFixed(0)} kg`;
                        }
                    }
                }
            }
        }
    });
}

function createSpeedYearChart(data) {
    const canvas = document.getElementById('timeline-chart');
    if (!canvas) {
        console.error('Canvas element timeline-chart not found');
        return;
    }

    // Destroy any existing chart on this canvas
    const existingChart = Chart.getChart(canvas);
    if (existingChart) {
        existingChart.destroy();
    }

    const ctx = canvas.getContext('2d');

    // Prepare datasets
    const datasets = [];
    const categories = ['ave', 'comercial', 'militar', 'geral', 'historica', 'executiva'];
    const colors = {
        'ave': 'rgba(255, 99, 132, 0.7)',
        'comercial': 'rgba(54, 162, 235, 0.7)',
        'militar': 'rgba(255, 206, 86, 0.7)',
        'geral': 'rgba(75, 192, 192, 0.7)',
        'historica': 'rgba(153, 102, 255, 0.7)',
        'executiva': 'rgba(255, 159, 64, 0.7)'
    };

    categories.forEach(category => {
        const categoryData = data.filter(a => a.category_type === category && a.first_flight_year);
        datasets.push({
            label: category,
            data: categoryData.map(a => ({
                x: a.first_flight_year,
                y: getSpeedValue(a),
                aircraft: a
            })),
            backgroundColor: colors[category],
            borderColor: colors[category],
            pointRadius: 5,
            pointHoverRadius: 7
        });
    });

    // Create chart
    speedYearChartInstance = new Chart(ctx, {
        type: 'scatter',
        data: {
            datasets: datasets
        },
        options: {
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
                    type: 'logarithmic',
                    title: {
                        display: true,
                        text: getSpeedLabel()
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const aircraft = context.raw.aircraft;
                            const speed = getSpeedValue(aircraft);
                            return `${aircraft.name} (${aircraft.first_flight_year}): ${speed.toFixed(0)} km/h`;
                        }
                    }
                }
            }
        }
    });
}

// Function to update all charts based on current page
function updateCharts() {
    const activePage = document.querySelector('.page:not(.d-none)');
    if (!activePage) return;
    
    const pageId = activePage.id;
    console.log('Atualizando gráficos para página:', pageId);
    
    try {
        switch (pageId) {
            case 'scatter-plot':
                if (typeof updateScatterChart === 'function') {
                    updateScatterChart();
                }
                break;
            case 'timeline':
                if (typeof updateTimelineChart === 'function') {
                    updateTimelineChart();
                }
                break;
            case 'flight-diagram':
                if (typeof updateFlightDiagram === 'function') {
                    updateFlightDiagram();
                }
                break;
        }
    } catch (error) {
        console.error('Erro ao atualizar gráficos:', error);
        showAlert('Erro ao atualizar gráficos: ' + error.message, 'danger');
    }
}

// Function to update timeline chart
function updateTimelineChart() {
    console.log('Atualizando gráfico de timeline...');
    
    // Get selected parameter and scale
    const param = document.getElementById('timeline-param')?.value;
    const logScale = document.getElementById('timeline-log-scale')?.checked || false;
    
    if (!param) {
        console.error('Missing parameter for timeline chart');
        return;
    }

    try {
        // Use the loaded data
        if (!window.aircraftData || window.aircraftData.length === 0) {
            console.log('Loading data for timeline chart...');
            loadAircraftData();
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

// Function to render timeline chart
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

    // Group data by category
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

// Function to check if an image exists and provide a fallback if it doesn't
function getValidImageUrl(aircraft) {
    return new Promise((resolve) => {
        if (!aircraft || !aircraft.image_url) {
            // If no image URL, use fallback based on category
            const fallbackUrl = aircraft && aircraft.category_type ? 
                FALLBACK_IMAGES[aircraft.category_type] || DEFAULT_FALLBACK_IMAGE : 
                DEFAULT_FALLBACK_IMAGE;
            resolve(fallbackUrl);
            return;
        }

        // If the image URL is already a local path, use it directly
        if (aircraft.image_url.startsWith('/images/')) {
            resolve(aircraft.image_url);
        return;
    }
    
        // Check if the image exists
        const img = new Image();
        let resolved = false;

        // Set a timeout in case the image takes too long to load
        const timeout = setTimeout(() => {
            if (!resolved) {
                resolved = true;
                const fallbackUrl = aircraft.category_type ? 
                    FALLBACK_IMAGES[aircraft.category_type] || DEFAULT_FALLBACK_IMAGE : 
                    DEFAULT_FALLBACK_IMAGE;
                resolve(fallbackUrl);
            }
        }, 3000);

        img.onload = function() {
            if (!resolved) {
                resolved = true;
                clearTimeout(timeout);
                resolve(aircraft.image_url);
            }
        };

        img.onerror = function() {
            if (!resolved) {
                resolved = true;
                clearTimeout(timeout);
                const fallbackUrl = aircraft.category_type ? 
                    FALLBACK_IMAGES[aircraft.category_type] || DEFAULT_FALLBACK_IMAGE : 
                    DEFAULT_FALLBACK_IMAGE;
                resolve(fallbackUrl);
            }
        };

        img.src = aircraft.image_url;
    });
}

// Função para obter nome da categoria
function getCategoryName(categoryType) {
    const categoryMap = {
        'comercial': 'Commercial Aviation',
        'executiva': 'Business Aircraft',
        'carga': 'Cargo Aviation',
        'militar': 'Military Aviation',
        'geral': 'General Aviation',
        'historica': 'Historical Aircraft',
        'experimental': 'Experimental Aircraft',
        'ave': 'Bird'
    };
    return categoryMap[categoryType] || categoryType;
}

// Function to get era category name
function getCategoryEra(era) {
    const eraMap = {
        'pioneiro': 'Pioneer',
        'entreguerras': 'Interwar',
        'ww2': 'World War II',
        'pos-guerra': 'Post-War',
        'jato': 'Jet Age',
        'moderno': 'Modern',
        'contemporaneo': 'Contemporary'
    };
    return eraMap[era] || era;
}

function setupNavigation() {
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Atualizar links ativos
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            
            // Mostrar página correspondente
            const targetPage = link.getAttribute('data-page');
            pages.forEach(page => {
                page.classList.toggle('d-none', page.id !== targetPage);
            });
            
            // Atualizar gráficos da nova página
            updateCharts();
        });
    });
}

function setupEventListeners() {
    // Event listeners para gráficos
    const chartControls = [
        { element: xParamSelect, callback: updateScatterChart },
        { element: yParamSelect, callback: updateScatterChart },
        { element: xLogScale, callback: updateScatterChart },
        { element: yLogScale, callback: updateScatterChart },
        { element: timelineParamSelect, callback: updateTimelineChart },
        { element: timelineLogScale, callback: updateTimelineChart },
        { element: xAxisParamSelect, callback: updateFlightDiagram }
    ];
    
    chartControls.forEach(control => {
        if (control.element) {
            control.element.addEventListener('change', control.callback);
        }
    });
}

function showAlert(message, type = 'info') {
    // Criar elemento de alerta
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
    alertDiv.setAttribute('role', 'alert');
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    // Adicionar ao DOM
    const container = document.querySelector('.container');
    container.insertBefore(alertDiv, container.firstChild);
    
    // Remover após 5 segundos
    setTimeout(() => {
        alertDiv.classList.remove('show');
        setTimeout(() => alertDiv.remove(), 150);
    }, 5000);
}

// Add a global function for tooltips that can be called from HTML
window.setupTooltip = function(element, aircraftId) {
    if (!element || !aircraftId) return;
    
    const id = parseInt(aircraftId);
    const aircraft = window.aircraftData.find(a => a.id === id);
    
    if (!aircraft || !aircraft.image_url) return;
    
    console.log(`Setting up tooltip for ${aircraft.name} with image ${aircraft.image_url}`);
    
    // Create tooltip element
    const tooltip = document.createElement('div');
    tooltip.style.position = 'absolute';
    tooltip.style.zIndex = '9999';
    tooltip.style.display = 'none';
    tooltip.style.backgroundColor = 'white';
    tooltip.style.border = '1px solid #ccc';
    tooltip.style.borderRadius = '4px';
    tooltip.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
    tooltip.style.width = '200px';
    tooltip.style.overflow = 'hidden';
    
    // Add image
    const img = document.createElement('img');
    img.src = aircraft.image_url;
    img.alt = aircraft.name;
    img.style.width = '100%';
    img.style.height = '120px';
    img.style.objectFit = 'cover';
    
    // Add caption
    const caption = document.createElement('div');
    caption.textContent = aircraft.name;
    caption.style.padding = '5px';
    caption.style.backgroundColor = 'rgba(0,0,0,0.7)';
    caption.style.color = 'white';
    caption.style.fontSize = '12px';
    caption.style.textAlign = 'center';
    
    tooltip.appendChild(img);
    tooltip.appendChild(caption);
    document.body.appendChild(tooltip);
    
    // Show tooltip on mouseenter
    element.addEventListener('mouseenter', function() {
        const rect = element.getBoundingClientRect();
        tooltip.style.left = rect.left + 'px';
        tooltip.style.top = (rect.bottom + window.scrollY + 5) + 'px';
        tooltip.style.display = 'block';
    });
    
    // Hide tooltip on mouseleave
    element.addEventListener('mouseleave', function() {
        tooltip.style.display = 'none';
    });
}

// Funções para o Diagrama do Voo
async function updateFlightDiagram() {
    console.log('Atualizando Diagrama do Voo...');
    
    // Obter os parâmetros selecionados
    const chartType = document.getElementById('x-axis-param').value;
    const showTrendlines = document.getElementById('showTrendlines').checked;
    const xLogScale = document.getElementById('xLogScale').checked;
    const yLogScale = document.getElementById('yLogScale').checked;
    
    try {
        // Usar os dados já carregados em vez de fazer outra requisição
        if (!window.aircraftData || window.aircraftData.length === 0) {
            console.log('Carregando dados para o Diagrama do Voo...');
            await loadAircraftData();
        }
        
        // Set showEquivalentSpeed based on chart type
        if (chartType === 'wing_loading_speed_ve' || chartType === 'speed_mtow_ve') {
            showEquivalentSpeed = true;
            console.log('Usando Velocidade Equivalente (VE)');
        } else {
            showEquivalentSpeed = false;
            console.log('Usando Velocidade Real (TAS)');
        }
        
        // Map the chart type to the base type for rendering
        let baseChartType = chartType;
        if (chartType === 'wing_loading_speed_ve') baseChartType = 'wing_loading_speed';
        if (chartType === 'speed_mtow_ve') baseChartType = 'speed_mtow';
        
        renderFlightDiagram(window.aircraftData, baseChartType, showTrendlines, xLogScale, yLogScale);
        
        // Mostrar/ocultar controles de acordo com o tipo de gráfico
        const mtowControls = document.getElementById('wingLoadingMtowControls');
        const speedControls = document.getElementById('wingLoadingSpeedControls');
        
        if (baseChartType === 'wing_loading_mtow') {
            mtowControls.style.display = 'block';
            speedControls.style.display = 'none';
        } else if (baseChartType === 'wing_loading_speed') {
            mtowControls.style.display = 'none';
            speedControls.style.display = 'block';
        } else {
            mtowControls.style.display = 'none';
            speedControls.style.display = 'none';
        }
    } catch (error) {
        console.error('Erro ao carregar dados para o Diagrama do Voo:', error);
        if (typeof showAlert === 'function') {
            showAlert('Erro ao carregar dados para o Diagrama do Voo: ' + error.message, 'danger');
        }
    }
}

function renderFlightDiagram(data, chartType, showTrendlines, xLogScale, yLogScale) {
    // Verificar se temos aves nos dados
    const birds = data.filter(item => item.category_type === 'ave');
    console.log(`Renderizando diagrama do voo com ${data.length} itens, incluindo ${birds.length} aves, tipo: ${chartType}`);
    
    const canvas = document.getElementById('flight-diagram-chart');
    if (!canvas) {
        console.error('Canvas para diagrama do voo não encontrado');
        return;
    }
    
    // Verificar se já existe um gráfico e destruí-lo
    const existingChart = Chart.getChart(canvas);
    if (existingChart) {
        existingChart.destroy();
    }
    
    // Filtrar dados válidos para o diagrama
    let validData = [];
    
    if (chartType === 'wing_loading_mtow') {
        validData = data.filter(aircraft => 
            aircraft.mtow_N && aircraft.wing_area_m2 && 
            aircraft.mtow_N > 0 && aircraft.wing_area_m2 > 0
        ).map(aircraft => ({
            x: aircraft.mtow_N,
            y: (aircraft.mtow_N / aircraft.wing_area_m2),
            id: aircraft.id,
            name: aircraft.name,
            category: aircraft.category_type
        }));
    } else if (chartType === 'speed_mtow') {
        validData = data.filter(aircraft => 
            aircraft.mtow_N && aircraft.cruise_speed_ms && 
            aircraft.mtow_N > 0 && aircraft.cruise_speed_ms > 0
        ).map(aircraft => ({
            x: aircraft.mtow_N,
            y: getSpeedValue(aircraft),  // Usar getSpeedValue aqui
            id: aircraft.id,
            name: aircraft.name,
            category: aircraft.category_type,
            originalSpeed: aircraft.cruise_speed_ms,
            cruiseAltitude: aircraft.cruise_altitude_m
        }));
    } else if (chartType === 'wing_loading_speed') {
        validData = data.filter(aircraft => 
            aircraft.wing_area_m2 && aircraft.mtow_N && aircraft.cruise_speed_ms && 
            aircraft.wing_area_m2 > 0 && aircraft.mtow_N > 0 && aircraft.cruise_speed_ms > 0
        ).map(aircraft => ({
            x: getSpeedValue(aircraft),  // Usar getSpeedValue aqui
            y: (aircraft.mtow_N / aircraft.wing_area_m2),
            id: aircraft.id,
            name: aircraft.name,
            category: aircraft.category_type,
            originalSpeed: aircraft.cruise_speed_ms,
            cruiseAltitude: aircraft.cruise_altitude_m
        }));
    }
    
    // Verificar se temos aves nos dados válidos
    const birdsInValidData = validData.filter(item => item.category === 'ave');
    console.log(`Dados válidos para o diagrama: ${validData.length} itens, incluindo ${birdsInValidData.length} aves`);
    
    // Se não houver dados válidos, mostrar mensagem
    if (validData.length === 0) {
        console.error('Nenhum dado válido para o diagrama do voo');
        return;
    }
    
    // Cores para diferentes categorias
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
    
    // Agrupar dados por categoria
    const datasetsByCategory = {};
    validData.forEach(point => {
        const category = point.category || 'desconhecida';
        if (!datasetsByCategory[category]) {
            datasetsByCategory[category] = [];
        }
        datasetsByCategory[category].push(point);
    });
    
    // Criar datasets para cada categoria
    const datasets = Object.keys(datasetsByCategory).map(category => {
        return {
            label: getCategoryName(category),
            data: datasetsByCategory[category],
            backgroundColor: categoryColors[category] || 'rgba(100, 100, 100, 0.7)',
            borderColor: categoryColors[category] || 'rgba(100, 100, 100, 0.7)',
            pointRadius: 5,
            pointHoverRadius: 8
        };
    });
    
    // Adicionar linhas de tendência se solicitado
    if (showTrendlines && chartType !== 'speed_mtow') {
        console.log("Adicionando linha de tendência ao gráfico");
        const trendlineData = generateTrendlineData(chartType);
        if (trendlineData) {
            console.log(`Linha de tendência gerada com ${trendlineData.length} pontos`);
            // Criar dataset para a linha de tendência
            datasets.push({
                label: 'Linha de Tendência',
                data: trendlineData,
                showLine: true,
                fill: false,
                borderColor: 'rgba(255, 0, 0, 0.7)',
                borderWidth: 2,
                pointRadius: 0,
                borderDash: [5, 5],
                pointHitRadius: 0
            });
        } else {
            console.log("Não foi possível gerar dados para a linha de tendência");
        }
    } else {
        if (chartType === 'speed_mtow') {
            console.log("Linha de tendência desativada para o gráfico speed_mtow");
        } else if (!showTrendlines) {
            console.log("Linhas de tendência desativadas pelo usuário");
        }
    }
    
    // Configurar rótulos dos eixos
    let xAxisLabel = 'MTOW (N)';
    let yAxisLabel = 'Carga Alar (N/m²)';
    
    if (chartType === 'speed_mtow') {
        xAxisLabel = 'MTOW (N)';
        yAxisLabel = showEquivalentSpeed ? 'Equivalent Speed (m/s)' : 'True Airspeed (m/s)';
    } else if (chartType === 'wing_loading_speed') {
        xAxisLabel = showEquivalentSpeed ? 'Equivalent Speed (m/s)' : 'True Airspeed (m/s)';
        yAxisLabel = 'Carga Alar (N/m²)';
    }
    
    // Criar o gráfico
    new Chart(canvas, {
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
                    title: {
                    display: true,
                        text: xAxisLabel
                    }
                },
                y: {
                    type: yLogScale ? 'logarithmic' : 'linear',
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
                            if (point.isTrendline) {
                                return point.name;
                            }
                            
                            // Mostrar valores originais e convertidos
                            if (chartType === 'wing_loading_mtow') {
                                return `${point.name}: MTOW ${point.x.toLocaleString()} N, Carga Alar ${point.y.toLocaleString()} N/m²`;
                            } else if (chartType === 'speed_mtow') {
                                const speedLabel = showEquivalentSpeed ? 'VE' : 'TAS';
                                const altitudeInfo = point.cruiseAltitude ? ` (Alt: ${point.cruiseAltitude.toLocaleString()}m)` : '';
                                return `${point.name}: MTOW ${point.x.toLocaleString()} N, ${speedLabel} ${point.y.toFixed(1)} m/s${altitudeInfo}`;
                            } else if (chartType === 'wing_loading_speed') {
                                const speedLabel = showEquivalentSpeed ? 'VE' : 'TAS';
                                const altitudeInfo = point.cruiseAltitude ? ` (Alt: ${point.cruiseAltitude.toLocaleString()}m)` : '';
                                return `${point.name}: ${speedLabel} ${point.x.toFixed(1)} m/s${altitudeInfo}, Carga Alar ${point.y.toLocaleString()} N/m²`;
                            }
                            
                            return `${point.name}: ${point.x.toLocaleString()}, ${point.y.toLocaleString()}`;
                        }
                    }
                },
                legend: {
                    position: 'top'
                }
            },
            onClick: function(e, elements) {
                if (elements.length > 0) {
                    const index = elements[0].index;
                    const datasetIndex = elements[0].datasetIndex;
                    const point = datasets[datasetIndex].data[index];
                    
                    // Ignorar cliques em pontos de linha de tendência
                    if (point.isTrendline) return;
                    
                    // Mostrar detalhes da aeronave selecionada
                    viewAircraftDetails(point.id);
                }
            }
        }
    });
}

function generateTrendlineData(chartType) {
    console.log(`Gerando dados de linha de tendência para: ${chartType}`);
    
    // Não gerar linha de tendência para o gráfico de velocidade vs. MTOW
    if (chartType === 'speed_mtow') {
        console.log('Linha de tendência desativada para o gráfico de velocidade vs. MTOW');
        return null;
    }
    
    // Gerar pontos para a linha de tendência
    const numPoints = 100;
    const trendlinePoints = [];
    
    if (chartType === 'wing_loading_mtow') {
        // Linha de tendência para W/S = k * W^(1/3)
        const k = parseFloat(document.getElementById('mtow-coefficient').value) || 25;
        console.log(`Usando coeficiente k = ${k} para W/S = k * W^(1/3)`);
        
        // Definir limites de MTOW (em N) - de 10 kg a 1000000 kg convertidos para N
        const xMin = 10 * 9.81;
        const xMax = 1000000 * 9.81;
        const logRange = Math.log10(xMax / xMin);
        const step = logRange / (numPoints - 1);
        
        for (let i = 0; i < numPoints; i++) {
            const x = xMin * Math.pow(10, i * step);
            const y = k * Math.pow(x, 1/3);
            trendlinePoints.push({
                x: x,
                y: y,
                isTrendline: true,
                name: `Tendência: W/S = ${k} * W^(1/3)`
            });
        }
        
        console.log(`Gerados ${trendlinePoints.length} pontos para linha de tendência W/S vs MTOW`);
        return trendlinePoints;
    } else if (chartType === 'wing_loading_speed') {
        // Linha de tendência para W/S = k * V^2
        const k = parseFloat(document.getElementById('speed-coefficient').value) || 0.38;
        console.log(`Usando coeficiente k = ${k} para W/S = k * V^2`);
        
        // Definir limites de velocidade (em m/s) - de 0 a 1000 m/s
        const xMin = 1;  // Velocidade mínima de 1 m/s
        const xMax = 1000;  // Velocidade máxima de 1000 m/s
        const logRange = Math.log10(xMax / xMin);
        const step = logRange / (numPoints - 1);
        
        for (let i = 0; i < numPoints; i++) {
            const x = xMin * Math.pow(10, i * step);
            const y = k * Math.pow(x, 2);
            trendlinePoints.push({
                x: x,
                y: y,
                isTrendline: true,
                name: `Tendência: W/S = ${k} * V^2`
            });
        }
        
        console.log(`Gerados ${trendlinePoints.length} pontos para linha de tendência W/S vs Velocidade`);
        return trendlinePoints;
    }
    
    return null;
}

// Função para configurar eventos específicos da página do Diagrama do Voo
function setupFlightDiagramEvents() {
    // Adicionar event listeners para os botões de aplicar coeficientes
    const applyMtowCoefficientBtn = document.getElementById('apply-mtow-coefficient');
    const applySpeedCoefficientBtn = document.getElementById('apply-speed-coefficient');
    
    if (applyMtowCoefficientBtn) {
        applyMtowCoefficientBtn.addEventListener('click', () => {
            console.log('Aplicando novo coeficiente para MTOW');
            if (xAxisParamSelect.value === 'wing_loading_mtow') {
                updateFlightDiagram();
            }
        });
    }
    
    if (applySpeedCoefficientBtn) {
        applySpeedCoefficientBtn.addEventListener('click', () => {
            console.log('Aplicando novo coeficiente para Velocidade');
            if (xAxisParamSelect.value === 'wing_loading_speed') {
                updateFlightDiagram();
            }
        });
    }
    
    // Também atualizar ao pressionar "Enter" nos inputs
    const mtowCoefficientInput = document.getElementById('mtow-coefficient');
    const speedCoefficientInput = document.getElementById('speed-coefficient');
    
    if (mtowCoefficientInput) {
        mtowCoefficientInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                if (xAxisParamSelect.value === 'wing_loading_mtow') {
                    updateFlightDiagram();
                }
            }
        });
    }
    
    if (speedCoefficientInput) {
        speedCoefficientInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                if (xAxisParamSelect.value === 'speed_mtow') {
                    updateFlightDiagram();
                }
            }
        });
    }
}

// Função para categorizar aeronaves
function categorizeAircraft(aircraft) {
    if (!aircraft) return null;
    
    // Adicionar ID se não existir
    if (!aircraft.id) {
        aircraft.id = Math.random().toString(36).substr(2, 9);
    }
    
    return aircraft;
} 
