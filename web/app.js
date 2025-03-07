// Configuração da API
const API_URL = '/api';
const DEV_API_URL = 'http://localhost:5001/api';

// Make aircraftData globally available
window.aircraftData = [];

// Fallback images by category - these are now local paths
const FALLBACK_IMAGES = {
    'comercial': '/images/fallback/comercial.jpg',
    'executiva': '/images/fallback/executiva.jpg',
    'carga': '/images/fallback/carga.jpg',
    'militar': '/images/fallback/militar.jpg',
    'geral': '/images/fallback/geral.jpg',
    'historica': '/images/fallback/historica.jpg',
    'experimental': '/images/fallback/experimental.jpg',
    'ave': '/images/fallback/ave.jpg'
};

// Default fallback image
const DEFAULT_FALLBACK_IMAGE = '/images/fallback/geral.jpg';

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

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM carregado, inicializando aplicação...');
    
    // Inicializar modais do Bootstrap
    const modalElement = document.getElementById('aircraft-modal');
    const detailsModalElement = document.getElementById('aircraft-details-modal');
    
    if (modalElement) {
        aircraftModal = new bootstrap.Modal(modalElement);
        console.log('Modal de aeronave inicializado');
    } else {
        console.error('Elemento modal de aeronave não encontrado');
    }
    
    if (detailsModalElement) {
        aircraftDetailsModal = new bootstrap.Modal(detailsModalElement);
        console.log('Modal de detalhes inicializado');
    } else {
        console.error('Elemento modal de detalhes não encontrado');
    }
    
    // Configurar switches de velocidade
    const speedToggles = document.querySelectorAll('.speed-type-toggle');
    console.log('Encontrados switches de velocidade:', speedToggles.length);
    
    speedToggles.forEach(toggle => {
        toggle.addEventListener('change', (event) => {
            console.log('Switch de velocidade alterado. Novo estado:', event.target.checked);
            showEquivalentSpeed = event.target.checked;
            
            // Sincronizar todos os switches
            speedToggles.forEach(t => {
                t.checked = showEquivalentSpeed;
            });
            
            // Atualizar gráficos
            console.log('Atualizando gráficos com novo tipo de velocidade:', showEquivalentSpeed ? 'VE' : 'TAS');
            
            // Force chart recreation
            if (aircraftData && aircraftData.length > 0) {
                console.log('Recriando gráficos com dados existentes');
                
                // Destroy existing charts first
                if (speedWeightChartInstance) {
                    speedWeightChartInstance.destroy();
                    speedWeightChartInstance = null;
                }
                
                if (speedYearChartInstance) {
                    speedYearChartInstance.destroy();
                    speedYearChartInstance = null;
                }
                
                if (flightDiagramChartInstance) {
                    flightDiagramChartInstance.destroy();
                    flightDiagramChartInstance = null;
                }
                
                // Recreate charts
                createSpeedWeightChart(aircraftData);
                createSpeedYearChart(aircraftData);
                
                // Update flight diagram if on that page
                const flightDiagramPage = document.getElementById('flight-diagram');
                if (flightDiagramPage && !flightDiagramPage.classList.contains('d-none')) {
                    updateFlightDiagram();
                }
            } else {
                console.log('Buscando novos dados para os gráficos');
                fetch('http://localhost:5001/api/aircraft')
                    .then(response => response.json())
                    .then(data => {
                        aircraftData = data;
                        createSpeedWeightChart(data);
                        createSpeedYearChart(data);
                        updateFlightDiagram();
                    })
                    .catch(error => {
                        console.error('Erro ao atualizar gráficos:', error);
                        showAlert('Erro ao atualizar gráficos: ' + error.message, 'danger');
                    });
            }
        });
    });
    
    // Carregar dados iniciais
    loadAircraftData();
    loadParameters();
    
    // Configurar navegação
    setupNavigation();
    
    // Configurar eventos
    setupEventListeners();
    
    // Configurar eventos específicos para Diagrama do Voo
    if (xAxisParamSelect) {
        xAxisParamSelect.addEventListener('change', () => {
            console.log('Tipo de diagrama alterado para:', xAxisParamSelect.value);
            updateFlightDiagram();
        });
        console.log('Event listener para seleção de parâmetro do Diagrama do Voo configurado');
    }
    
    // Configurar eventos específicos para os controles do Diagrama do Voo
    setupFlightDiagramEvents();
});

// Funções de carregamento de dados
async function loadAircraftData() {
    try {
        console.log('Carregando dados de aeronaves...');
        
        // Tentar primeiro a URL relativa
        let response;
        let responseBody;
        let success = false;
        
        try {
            console.log('Tentando URL principal:', `${API_URL}/aircraft`);
            response = await fetch(`${API_URL}/aircraft`);
            
            if (!response.ok) {
                throw new Error(`Erro na API: ${response.status} ${response.statusText}`);
            }
            
            responseBody = await response.json();
            success = true;
        } catch (err) {
            console.warn('Falha ao usar URL principal:', err.message);
            
            // Se falhar, tentar a URL de desenvolvimento
            try {
                console.log('Tentando URL de desenvolvimento:', `${DEV_API_URL}/aircraft`);
                response = await fetch(`${DEV_API_URL}/aircraft`);
                
                if (!response.ok) {
                    throw new Error(`Erro na API dev: ${response.status} ${response.statusText}`);
                }
                
                responseBody = await response.json();
                success = true;
            } catch (devErr) {
                console.warn('Também falhou com URL de desenvolvimento:', devErr.message);
                
                // Se ambas as APIs falharem, tentar carregar do arquivo JSON local
                try {
                    console.log('Tentando carregar do arquivo JSON local...');
                    response = await fetch('/images/aircraft_images.json');
                    
                    if (!response.ok) {
                        throw new Error(`Erro ao carregar arquivo local: ${response.status}`);
                    }
                    
                    const imageMapping = await response.json();
                    
                    // Converter o mapeamento em um array de aeronaves
                    responseBody = Object.entries(imageMapping).map(([id, info]) => ({
                        id: parseInt(id),
                        name: info.name,
                        image_url: info.image_path,
                        // Outros campos serão preenchidos quando necessário
                    }));
                    
                    console.log(`Carregados ${responseBody.length} registros do arquivo local`);
                    success = true;
                } catch (localErr) {
                    console.error('Falha ao carregar do arquivo local:', localErr.message);
                    throw localErr; // Re-throw para ser capturado pelo catch principal
                }
            }
        }
        
        if (!success) {
            throw new Error('Falha ao carregar dados de todas as fontes');
        }
        
        // Validar os dados recebidos
        if (!responseBody || !Array.isArray(responseBody)) {
            console.error('Dados recebidos não são um array:', responseBody);
            throw new Error('Formato de dados inválido');
        }
        
        console.log(`Dados carregados com sucesso: ${responseBody.length} aeronaves`);
        aircraftData = responseBody;
        window.aircraftData = responseBody; // Make sure it's available globally
        
        // Renderizar a tabela
        renderTableSafely(responseBody);
    } catch (error) {
        console.error('Erro ao carregar dados de aeronaves:', error);
        showAlert('Erro ao carregar dados de aeronaves: ' + error.message, 'danger');
        
        // Exibir mensagem na tabela
        const tbody = document.getElementById('aircraft-table-body');
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center">
                        <div class="alert alert-danger mb-0">
                            Erro ao carregar dados. ${error.message}<br>
                            <button class="btn btn-primary btn-sm mt-2" onclick="loadAircraftData()">
                                <i class="bi bi-arrow-clockwise"></i> Tentar novamente
                            </button>
                            <button class="btn btn-success btn-sm mt-2" id="retry-import">
                                <i class="bi bi-cloud-download"></i> Importar exemplos
                            </button>
                        </div>
                    </td>
                </tr>
            `;
            
            // Adicionar evento ao botão de importação
            const retryImportBtn = document.getElementById('retry-import');
            if (retryImportBtn) {
                retryImportBtn.addEventListener('click', function() {
                    if (window.importSampleData && typeof window.importSampleData === 'function') {
                        window.importSampleData();
                    }
                });
            }
        }
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
        if (window.renderAircraftTable && typeof window.renderAircraftTable === 'function') {
            console.log('Usando função renderAircraftTable global');
            window.renderAircraftTable(data);
        } else {
            console.warn('Função renderAircraftTable não encontrada, usando fallback');
            // Fallback: renderização simples
            const tbody = document.getElementById('aircraft-table-body');
            if (tbody) {
                tbody.innerHTML = '';
                if (!data || data.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="8" class="text-center">Nenhum dado disponível.</td></tr>';
                    return;
                }
                
                data.forEach(aircraft => {
                    if (!aircraft) return;  // Pular entradas nulas
                    
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>
                            <a href="#" onclick="viewAircraftDetails(${aircraft.id || 0}); return false;" data-id="${aircraft.id}" class="aircraft-link">
                                ${aircraft.name || 'Sem nome'}
                            </a>
                        </td>
                        <td>${aircraft.manufacturer || '-'}</td>
                        <td>${aircraft.model || '-'}</td>
                        <td>${aircraft.first_flight_year || '-'}</td>
                        <td>${aircraft.category_type || '-'}</td>
                        <td>${aircraft.category_era || '-'}</td>
                        <td>${aircraft.mtow ? aircraft.mtow.toLocaleString() : '-'}</td>
                        <td>
                            <button class="btn btn-sm btn-primary" onclick="editAircraft(${aircraft.id || 0})">
                                <i class="bi bi-pencil"></i>
                            </button>
                            <button class="btn btn-sm btn-danger" onclick="deleteAircraft(${aircraft.id || 0})">
                                <i class="bi bi-trash"></i>
                            </button>
                        </td>
                    `;
                    tbody.appendChild(row);
                    
                    // Setup tooltip for aircraft image
                    if (aircraft.image_url) {
                        const link = row.querySelector('.aircraft-link');
                        if (link) {
                            setupAircraftTooltip(link);
                        }
                    }
                });
            }
        }
    } catch (renderError) {
        console.error('Erro ao renderizar tabela:', renderError);
        const tbody = document.getElementById('aircraft-table-body');
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center">
                        Erro ao renderizar dados: ${renderError.message}
                    </td>
                </tr>
            `;
        }
    }
}

function populateParameterSelects() {
    // Limpar selects
    xParamSelect.innerHTML = '';
    yParamSelect.innerHTML = '';
    timelineParamSelect.innerHTML = '';
    
    // Preencher selects com parâmetros
    parameters.forEach(param => {
        const option = document.createElement('option');
        option.value = param.id;
        option.textContent = param.name;
        
        xParamSelect.appendChild(option.cloneNode(true));
        yParamSelect.appendChild(option.cloneNode(true));
        timelineParamSelect.appendChild(option.cloneNode(true));
    });
    
    // Valores padrão
    xParamSelect.value = 'mtow';
    yParamSelect.value = 'cruise_speed';
    timelineParamSelect.value = 'mtow';
    
    // Inicializar gráficos
    updateScatterChart();
    updateTimelineChart();
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

// Funções para gráficos
async function updateScatterChart() {
    const xParam = xParamSelect.value;
    const yParam = yParamSelect.value;
    
    try {
        const apiUrl = await getApiUrl(`/stats/scatter?x=${xParam}&y=${yParam}`);
        const response = await fetch(apiUrl);
        const data = await response.json();
        
        renderScatterChart(data, xParam, yParam);
    } catch (error) {
        console.error('Erro ao carregar dados para o gráfico:', error);
    }
}

function renderScatterChart(data, xParam, yParam) {
    // Destruir gráfico existente se houver
    if (scatterChartInstance) {
        scatterChartInstance.destroy();
    }
    
    // Obter rótulos para os eixos
    const xParamLabel = parameters.find(p => p.id === xParam)?.name || xParam;
    const yParamLabel = parameters.find(p => p.id === yParam)?.name || yParam;
    
    // Preparar dados para o gráfico
    const chartData = {
        datasets: [{
            label: 'Aeronaves',
            data: data.map(item => ({
                x: item.x,
                y: item.y,
                id: item.id,
                name: item.name
            })),
            backgroundColor: 'rgba(54, 162, 235, 0.7)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1,
            pointRadius: 6,
            pointHoverRadius: 8
        }]
    };
    
    // Verificar se as escalas logarítmicas estão ativadas
    const useLogScaleX = xLogScale.checked;
    const useLogScaleY = yLogScale.checked;
    
    // Configuração do gráfico
    const config = {
        type: 'scatter',
        data: chartData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const point = context.raw;
                            return `${point.name}: (${point.x}, ${point.y})`;
                        }
                    }
                },
                legend: {
                    display: false
                }
            },
            scales: {
                x: {
                    type: useLogScaleX ? 'logarithmic' : 'linear',
                    title: {
                        display: true,
                        text: xParamLabel + (useLogScaleX ? ' (escala log)' : '')
                    }
                },
                y: {
                    type: useLogScaleY ? 'logarithmic' : 'linear',
                    title: {
                        display: true,
                        text: yParamLabel + (useLogScaleY ? ' (escala log)' : '')
                    }
                }
            },
            onClick: (event, elements) => {
                if (elements.length > 0) {
                    const index = elements[0].index;
                    const aircraftId = chartData.datasets[0].data[index].id;
                    viewAircraftDetails(aircraftId);
                }
            }
        }
    };
    
    // Criar gráfico
    scatterChartInstance = new Chart(scatterChart, config);
}

async function updateTimelineChart() {
    const param = timelineParamSelect.value;
    
    try {
        const apiUrl = await getApiUrl(`/stats/timeline?param=${param}`);
        const response = await fetch(apiUrl);
        const data = await response.json();
        
        renderTimelineChart(data, param);
    } catch (error) {
        console.error('Erro ao carregar dados para o gráfico de timeline:', error);
    }
}

function renderTimelineChart(data, param) {
    // Destruir gráfico existente se houver
    if (timelineChartInstance) {
        timelineChartInstance.destroy();
    }
    
    // Obter rótulo para o eixo Y
    const paramLabel = parameters.find(p => p.id === param)?.name || param;
    
    // Ordenar dados por ano
    data.sort((a, b) => a.year - b.year);
    
    // Verificar se a escala logarítmica está ativada
    const useLogScale = timelineLogScale.checked;
    
    // Preparar dados para o gráfico
    const chartData = {
        labels: data.map(item => item.year),
        datasets: [{
            label: paramLabel,
            data: data.map(item => ({
                x: item.year,
                y: item.value,
                id: item.id,
                name: item.name
            })),
            backgroundColor: 'rgba(75, 192, 192, 0.7)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1,
            pointRadius: 6,
            pointHoverRadius: 8,
            fill: false,
            tension: 0.1
        }]
    };
    
    // Configuração do gráfico
    const config = {
        type: 'line',
        data: chartData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const point = context.raw;
                            return `${point.name}: ${point.y}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Ano do Primeiro Voo'
                    }
                },
                y: {
                    type: useLogScale ? 'logarithmic' : 'linear',
                    title: {
                        display: true,
                        text: paramLabel + (useLogScale ? ' (escala log)' : '')
                    }
                }
            },
            onClick: (event, elements) => {
                if (elements.length > 0) {
                    const index = elements[0].index;
                    const aircraftId = chartData.datasets[0].data[index].id;
                    viewAircraftDetails(aircraftId);
                }
            }
        }
    };
    
    // Criar gráfico
    timelineChartInstance = new Chart(timelineChart, config);
}

// Funções CRUD para aeronaves
async function viewAircraftDetails(id) {
    console.log(`Visualizando detalhes da aeronave ID: ${id}`);
    
    try {
        // First try to find the aircraft in the global aircraftData array
        let aircraft = null;
        
        if (window.aircraftData && Array.isArray(window.aircraftData)) {
            aircraft = window.aircraftData.find(a => a.id === id);
        }
        
        // If not found in memory, try to load from the API
        if (!aircraft) {
            try {
                const apiUrl = await getApiUrl(`/aircraft/${id}`);
                const response = await fetch(apiUrl);
                
                if (!response.ok) {
                    throw new Error(`Erro ao buscar detalhes: ${response.status}`);
                }
                
                aircraft = await response.json();
            } catch (apiError) {
                console.warn(`API request failed: ${apiError.message}. Trying to load from local data...`);
                
                // Try to load from the local JSON file
                try {
                    const response = await fetch(`/images/aircraft/${id}_info.json`);
                    if (response.ok) {
                        const aircraftInfo = await response.json();
                        
                        // Find the aircraft in the global data
                        if (window.aircraftData && Array.isArray(window.aircraftData)) {
                            aircraft = window.aircraftData.find(a => 
                                a.name === aircraftInfo.name && 
                                a.manufacturer === aircraftInfo.manufacturer
                            );
                        }
                        
                        // If still not found, create a basic aircraft object from the info
                        if (!aircraft) {
                            aircraft = {
                                id: aircraftInfo.id,
                                name: aircraftInfo.name,
                                manufacturer: aircraftInfo.manufacturer,
                                model: aircraftInfo.model,
                                category_type: aircraftInfo.category,
                                image_url: aircraftInfo.local_path
                            };
                        }
                    } else {
                        throw new Error(`Não foi possível carregar informações locais: ${response.status}`);
                    }
                } catch (localError) {
                    console.error(`Failed to load local data: ${localError.message}`);
                    throw new Error(`Aeronave não encontrada (ID: ${id})`);
                }
            }
        }
        
        if (!aircraft) {
            throw new Error('Aeronave não encontrada');
        }
        
        // Validate and fix the image URL
        if (aircraft.image_url) {
            // If it's a local path, make sure it exists
            if (aircraft.image_url.startsWith('/images/')) {
                // The path is already local, use it
            } else {
                // Try to find a local image for this aircraft
                try {
                    const response = await fetch(`/images/aircraft/${id}_info.json`);
                    if (response.ok) {
                        const info = await response.json();
                        aircraft.image_url = info.local_path;
                    }
                } catch (e) {
                    console.warn(`Could not find local image info for aircraft ${id}`);
                    // Use the getValidImageUrl function if available
                    if (typeof getValidImageUrl === 'function') {
                        aircraft.image_url = await getValidImageUrl(aircraft);
                    }
                }
            }
        } else {
            // No image URL, use fallback
            aircraft.image_url = `/images/fallback/${aircraft.category_type || 'geral'}.jpg`;
        }
        
        // Mostrar modal com detalhes
        const modalTitle = document.getElementById('aircraft-details-title');
        const modalBody = document.getElementById('aircraft-details-body');
        
        if (!modalTitle || !modalBody) {
            throw new Error('Elementos do modal não encontrados');
        }
        
        modalTitle.textContent = aircraft.name;
        
        // Mapear valores de categoria para texto legível
        const categoryTypeMap = {
            'comercial': 'Aviação Comercial',
            'executiva': 'Aeronaves Executivas',
            'carga': 'Aviação de Carga',
            'militar': 'Aviação Militar',
            'geral': 'Aviação Geral',
            'historica': 'Aeronaves Históricas',
            'experimental': 'Aeronaves Experimentais',
            'ave': 'Ave (Biológico)'
        };
        
        const categoryEraMap = {
            'pioneiros': 'Pioneiros (até 1930)',
            'classica': 'Era Clássica (1930-1950)',
            'jato_inicial': 'Era do Jato (1950-1970)',
            'moderna': 'Era Moderna (1970-2000)',
            'contemporanea': 'Era Contemporânea (2000+)',
            'biologica': 'Biológico (Aves)'
        };
        
        // Criar conteúdo do modal
        let content = `
            <div class="row">
                <div class="col-md-6 mb-3">
                    <table class="table table-sm">
                        <tr>
                            <th>Fabricante:</th>
                            <td>${aircraft.manufacturer || '-'}</td>
                        </tr>
                        <tr>
                            <th>Modelo:</th>
                            <td>${aircraft.model || '-'}</td>
                        </tr>
                        <tr>
                            <th>Primeiro Voo:</th>
                            <td>${aircraft.first_flight_year || '-'}</td>
                        </tr>
                        <tr>
                            <th>Categoria:</th>
                            <td>${categoryTypeMap[aircraft.category_type] || aircraft.category_type || '-'}</td>
                        </tr>
                        <tr>
                            <th>Era:</th>
                            <td>${categoryEraMap[aircraft.category_era] || aircraft.category_era || '-'}</td>
                        </tr>
                        <tr>
                            <th>Tipo de Motor:</th>
                            <td>${aircraft.engine_type || '-'}</td>
                        </tr>
                        <tr>
                            <th>Número de Motores:</th>
                            <td>${aircraft.engine_count || '-'}</td>
                        </tr>
                        <tr>
                            <th>MTOW:</th>
                            <td>${aircraft.mtow ? aircraft.mtow.toLocaleString() + ' kg' : '-'}</td>
                        </tr>
                        <tr>
                            <th>Área da Asa:</th>
                            <td>${aircraft.wing_area ? aircraft.wing_area.toLocaleString() + ' m²' : '-'}</td>
                        </tr>
                    </table>
                </div>
                <div class="col-md-6 mb-3">
                    <table class="table table-sm">
                        <tr>
                            <th>Envergadura:</th>
                            <td>${aircraft.wingspan ? aircraft.wingspan.toLocaleString() + ' m' : '-'}</td>
                        </tr>
                        <tr>
                            <th>Velocidade de Cruzeiro:</th>
                            <td>${aircraft.cruise_speed ? aircraft.cruise_speed.toLocaleString() + ' km/h' : '-'}</td>
                        </tr>
                        <tr>
                            <th>Velocidade de Decolagem:</th>
                            <td>${aircraft.takeoff_speed ? aircraft.takeoff_speed.toLocaleString() + ' km/h' : '-'}</td>
                        </tr>
                        <tr>
                            <th>Velocidade de Pouso:</th>
                            <td>${aircraft.landing_speed ? aircraft.landing_speed.toLocaleString() + ' km/h' : '-'}</td>
                        </tr>
                        <tr>
                            <th>Teto de Serviço:</th>
                            <td>${aircraft.service_ceiling ? aircraft.service_ceiling.toLocaleString() + ' m' : '-'}</td>
                        </tr>
                        <tr>
                            <th>Altitude de Cruzeiro:</th>
                            <td>${aircraft.cruise_altitude ? aircraft.cruise_altitude.toLocaleString() + ' m' : '-'}</td>
                        </tr>
                        <tr>
                            <th>Tração Máxima:</th>
                            <td>${aircraft.max_thrust ? aircraft.max_thrust.toLocaleString() + ' kN' : '-'}</td>
                        </tr>
                    </table>
                </div>
            </div>
        `;
        
        // Adicionar imagem se disponível
        if (aircraft.image_url) {
            content = `
                <div class="text-center mb-4">
                    <img src="${aircraft.image_url}" alt="${aircraft.name}" class="img-fluid" style="max-height: 300px;">
                </div>
            ` + content;
        }
        
        modalBody.innerHTML = content;
        
        // Exibir modal
        const modal = new bootstrap.Modal(document.getElementById('aircraft-details-modal'));
        modal.show();
    } catch (error) {
        console.error('Erro ao carregar detalhes da aeronave:', error);
        if (typeof showAlert === 'function') {
            showAlert('Erro ao carregar detalhes da aeronave: ' + error.message, 'danger');
        }
    }
}

function addAircraft() {
    console.log('Função addAircraft chamada');
    // Limpar formulário
    aircraftForm.reset();
    document.getElementById('aircraft-id').value = '';
    document.getElementById('aircraft-modal-title').textContent = 'Adicionar Aeronave';
    
    // Mostrar modal
    if (aircraftModal) {
        aircraftModal.show();
        console.log('Modal exibido');
    } else {
        console.error('Modal não inicializado');
        // Fallback: tentar inicializar o modal novamente
        const modalElement = document.getElementById('aircraft-modal');
        if (modalElement) {
            aircraftModal = new bootstrap.Modal(modalElement);
            aircraftModal.show();
        }
    }
}

function editAircraft(id) {
    // Buscar dados da aeronave
    const aircraft = aircraftData.find(a => a.id === id);
    if (!aircraft) return;
    
    // Preencher formulário
    document.getElementById('aircraft-id').value = aircraft.id;
    document.getElementById('name').value = aircraft.name || '';
    document.getElementById('manufacturer').value = aircraft.manufacturer || '';
    document.getElementById('model').value = aircraft.model || '';
    document.getElementById('first_flight_year').value = aircraft.first_flight_year || '';
    document.getElementById('mtow').value = aircraft.mtow || '';
    document.getElementById('wing_area').value = aircraft.wing_area || '';
    document.getElementById('wingspan').value = aircraft.wingspan || '';
    document.getElementById('cruise_speed').value = aircraft.cruise_speed || '';
    document.getElementById('takeoff_speed').value = aircraft.takeoff_speed || '';
    document.getElementById('landing_speed').value = aircraft.landing_speed || '';
    document.getElementById('service_ceiling').value = aircraft.service_ceiling || '';
    document.getElementById('cruise_altitude').value = aircraft.cruise_altitude || '';
    document.getElementById('max_thrust').value = aircraft.max_thrust || '';
    document.getElementById('engine_type').value = aircraft.engine_type || '';
    document.getElementById('engine_count').value = aircraft.engine_count || '';
    document.getElementById('image_url').value = aircraft.image_url || '';
    
    // Atualizar título do modal
    document.getElementById('aircraft-modal-title').textContent = 'Editar Aeronave';
    
    // Mostrar modal
    aircraftModal.show();
}

async function saveAircraft() {
    // Obter dados do formulário
    const id = document.getElementById('aircraft-id').value;
    const isEdit = id !== '';
    
    const aircraftData = {
        name: document.getElementById('name').value,
        manufacturer: document.getElementById('manufacturer').value,
        model: document.getElementById('model').value,
        first_flight_year: document.getElementById('first_flight_year').value ? parseInt(document.getElementById('first_flight_year').value) : null,
        mtow: document.getElementById('mtow').value ? parseFloat(document.getElementById('mtow').value) : null,
        wing_area: document.getElementById('wing_area').value ? parseFloat(document.getElementById('wing_area').value) : null,
        wingspan: document.getElementById('wingspan').value ? parseFloat(document.getElementById('wingspan').value) : null,
        cruise_speed: document.getElementById('cruise_speed').value ? parseFloat(document.getElementById('cruise_speed').value) : null,
        takeoff_speed: document.getElementById('takeoff_speed').value ? parseFloat(document.getElementById('takeoff_speed').value) : null,
        landing_speed: document.getElementById('landing_speed').value ? parseFloat(document.getElementById('landing_speed').value) : null,
        service_ceiling: document.getElementById('service_ceiling').value ? parseFloat(document.getElementById('service_ceiling').value) : null,
        cruise_altitude: document.getElementById('cruise_altitude').value ? parseFloat(document.getElementById('cruise_altitude').value) : null,
        max_thrust: document.getElementById('max_thrust').value ? parseFloat(document.getElementById('max_thrust').value) : null,
        engine_type: document.getElementById('engine_type').value,
        engine_count: document.getElementById('engine_count').value ? parseInt(document.getElementById('engine_count').value) : null,
        image_url: document.getElementById('image_url').value,
        category_type: document.getElementById('category_type').value,
        category_era: document.getElementById('category_era').value,
        category_engine: document.getElementById('category_engine').value,
        category_size: document.getElementById('category_size').value
    };
    
    try {
        let response;
        
        if (isEdit) {
            // Atualizar aeronave existente
            const apiUrl = await getApiUrl(`/aircraft/${id}`);
            response = await fetch(apiUrl, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(aircraftData)
            });
        } else {
            // Criar nova aeronave
            const apiUrl = await getApiUrl(`/aircraft`);
            response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(aircraftData)
            });
        }
        
        if (response.ok) {
            // Fechar modal
            aircraftModal.hide();
            
            // Recarregar dados
            loadAircraftData();
            
            // Mostrar mensagem de sucesso
            showAlert(`Aeronave ${isEdit ? 'atualizada' : 'adicionada'} com sucesso!`, 'success');
            
            // Atualizar gráficos
            updateScatterChart();
            updateTimelineChart();
        } else {
            const error = await response.json();
            throw new Error(error.message || 'Erro ao salvar aeronave');
        }
    } catch (error) {
        console.error('Erro ao salvar aeronave:', error);
        showAlert(`Erro ao ${isEdit ? 'atualizar' : 'adicionar'} aeronave: ${error.message}`, 'danger');
    }
}

async function deleteAircraft(id) {
    if (!confirm('Tem certeza que deseja excluir esta aeronave?')) {
        return;
    }
    
    try {
        const apiUrl = await getApiUrl(`/aircraft/${id}`);
        const response = await fetch(apiUrl, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            // Recarregar dados
            loadAircraftData();
            
            // Mostrar mensagem de sucesso
            showAlert('Aeronave excluída com sucesso!', 'success');
            
            // Atualizar gráficos
            updateScatterChart();
            updateTimelineChart();
        } else {
            const error = await response.json();
            throw new Error(error.message || 'Erro ao excluir aeronave');
        }
    } catch (error) {
        console.error('Erro ao excluir aeronave:', error);
        showAlert(`Erro ao excluir aeronave: ${error.message}`, 'danger');
    }
}

async function importSampleData() {
    if (!confirm('Isso irá substituir todos os dados existentes. Deseja continuar?')) {
        return;
    }
    
    try {
        const apiUrl = await getApiUrl(`/import/sample`);
        const response = await fetch(apiUrl, {
            method: 'POST'
        });
        
        if (response.ok) {
            const result = await response.json();
            
            // Recarregar dados
            loadAircraftData();
            
            // Mostrar mensagem de sucesso
            showAlert(`${result.count} aeronaves importadas com sucesso!`, 'success');
            
            // Atualizar gráficos
            updateScatterChart();
            updateTimelineChart();
        } else {
            const error = await response.json();
            throw new Error(error.message || 'Erro ao importar dados de exemplo');
        }
    } catch (error) {
        console.error('Erro ao importar dados de exemplo:', error);
        showAlert(`Erro ao importar dados: ${error.message}`, 'danger');
    }
}

// Funções de utilidade
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
                if (page.id === targetPage) {
                    page.classList.remove('d-none');
                } else {
                    page.classList.add('d-none');
                }
            });
            
            // Atualizar gráficos se necessário
            if (targetPage === 'scatter-plot') {
                updateScatterChart();
            } else if (targetPage === 'timeline') {
                updateTimelineChart();
            } else if (targetPage === 'flight-diagram') {
                updateFlightDiagram();
            }
        });
    });
}

function setupEventListeners() {
    console.log('Configurando event listeners...');
    
    // Busca de aeronaves
    if (aircraftSearch) {
        aircraftSearch.addEventListener('input', () => {
            const searchTerm = aircraftSearch.value.toLowerCase();
            const filteredData = aircraftData.filter(aircraft => 
                aircraft.name.toLowerCase().includes(searchTerm) ||
                aircraft.manufacturer.toLowerCase().includes(searchTerm) ||
                aircraft.model.toLowerCase().includes(searchTerm)
            );
            renderAircraftTable(filteredData);
        });
        console.log('Event listener de busca configurado');
    }
    
    // Botões de ação
    if (btnAddAircraft) {
        btnAddAircraft.addEventListener('click', () => {
            console.log('Botão Adicionar Aeronave clicado');
            addAircraft();
        });
        console.log('Event listener do botão Adicionar Aeronave configurado');
    } else {
        console.error('Botão Adicionar Aeronave não encontrado');
    }
    
    if (btnImportSample) {
        btnImportSample.addEventListener('click', () => {
            console.log('Botão Importar Exemplos clicado');
            importSampleData();
        });
        console.log('Event listener do botão Importar Exemplos configurado');
    } else {
        console.error('Botão Importar Exemplos não encontrado');
    }
    
    if (saveAircraftBtn) {
        saveAircraftBtn.addEventListener('click', () => {
            console.log('Botão Salvar clicado');
            saveAircraft();
        });
        console.log('Event listener do botão Salvar configurado');
    } else {
        console.error('Botão Salvar não encontrado');
    }
    
    // Selects de parâmetros para gráficos
    if (xParamSelect) xParamSelect.addEventListener('change', updateScatterChart);
    if (yParamSelect) yParamSelect.addEventListener('change', updateScatterChart);
    if (timelineParamSelect) timelineParamSelect.addEventListener('change', updateTimelineChart);
    
    // Checkboxes de escala logarítmica
    if (xLogScale) xLogScale.addEventListener('change', updateScatterChart);
    if (yLogScale) yLogScale.addEventListener('change', updateScatterChart);
    if (timelineLogScale) timelineLogScale.addEventListener('change', updateTimelineChart);
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
    const chartType = xAxisParamSelect.value;
    
    try {
        // Usar os dados já carregados em vez de fazer outra requisição
        if (!aircraftData || aircraftData.length === 0) {
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
        
        renderFlightDiagram(aircraftData, baseChartType);
        
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

function renderFlightDiagram(data, chartType) {
    console.log(`Renderizando Diagrama do Voo com tipo: ${chartType}, Velocidade: ${showEquivalentSpeed ? 'VE' : 'TAS'}`);
    
    // Get the canvas element
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

    // Filtrar dados válidos com base no tipo de gráfico
    const validData = data.filter(aircraft => {
        if (!aircraft.mtow) return false;
        
        if (chartType === 'wing_loading_mtow') {
            return Boolean(aircraft.wing_loading);
        } else if (chartType === 'speed_mtow') {
            return Boolean(aircraft.cruise_speed);
        } else if (chartType === 'wing_loading_speed') {
            return Boolean(aircraft.wing_loading) && Boolean(aircraft.cruise_speed);
        }
        
        return false;
    });
    
    if (validData.length === 0) {
        console.error('Não há dados válidos para o Diagrama do Voo');
        if (typeof showAlert === 'function') {
            showAlert('Não há dados suficientes para exibir o Diagrama do Voo', 'warning');
        }
        return;
    }
    
    // Agrupar por categoria
    const categories = {
        'ave': {
            label: 'Aves',
            backgroundColor: 'rgba(255, 99, 132, 0.7)',
            borderColor: 'rgba(255, 99, 132, 1)',
            data: []
        },
        'comercial': {
            label: 'Aviação Comercial',
            backgroundColor: 'rgba(54, 162, 235, 0.7)',
            borderColor: 'rgba(54, 162, 235, 1)',
            data: []
        },
        'militar': {
            label: 'Aviação Militar',
            backgroundColor: 'rgba(255, 206, 86, 0.7)',
            borderColor: 'rgba(255, 206, 86, 1)',
            data: []
        },
        'geral': {
            label: 'Aviação Geral',
            backgroundColor: 'rgba(75, 192, 192, 0.7)',
            borderColor: 'rgba(75, 192, 192, 1)',
            data: []
        },
        'historica': {
            label: 'Aeronaves Históricas',
            backgroundColor: 'rgba(153, 102, 255, 0.7)',
            borderColor: 'rgba(153, 102, 255, 1)',
            data: []
        },
        'executiva': {
            label: 'Aeronaves Executivas',
            backgroundColor: 'rgba(255, 159, 64, 0.7)',
            borderColor: 'rgba(255, 159, 64, 1)',
            data: []
        },
        'carga': {
            label: 'Aviação de Carga',
            backgroundColor: 'rgba(100, 255, 100, 0.7)',
            borderColor: 'rgba(100, 255, 100, 1)',
            data: []
        },
        'experimental': {
            label: 'Aeronaves Experimentais',
            backgroundColor: 'rgba(255, 100, 255, 0.7)',
            borderColor: 'rgba(255, 100, 255, 1)',
            data: []
        }
    };
    
    // Processar dados para o gráfico
    validData.forEach(aircraft => {
        let xValue, yValue;
        
        if (chartType === 'wing_loading_mtow') {
            // X = Carga Alar (N/m²), Y = MTOW (N)
            xValue = aircraft.wing_loading * 9.8; // Converter kg/m² para N/m²
            yValue = aircraft.mtow * 9.8; // Converter kg para N
        } else if (chartType === 'speed_mtow') {
            // X = Velocidade (m/s), Y = MTOW (N)
            const speed = getSpeedValue(aircraft);
            xValue = speed / 3.6; // Converter km/h para m/s
            yValue = aircraft.mtow * 9.8; // Converter kg para N
        } else if (chartType === 'wing_loading_speed') {
            // X = Carga Alar (N/m²), Y = Velocidade (m/s)
            xValue = aircraft.wing_loading * 9.8; // Converter kg/m² para N/m²
            const speed = getSpeedValue(aircraft);
            yValue = speed / 3.6; // Converter km/h para m/s
        }
        
        // Obter categoria ou usar 'outros' como fallback
        const category = aircraft.category_type || 'outros';
        
        // Adicionar aos dados da categoria correspondente
        if (categories[category]) {
            categories[category].data.push({
                x: xValue,
                y: yValue,
                id: aircraft.id,
                name: aircraft.name
            });
        }
    });
    
    // Filtrar apenas categorias com dados
    const datasets = Object.values(categories)
        .filter(category => category.data.length > 0)
        .map(category => ({
            label: category.label,
            data: category.data,
            backgroundColor: category.backgroundColor,
            borderColor: category.borderColor,
            borderWidth: 1,
            pointRadius: 5,
            pointHoverRadius: 7
        }));
    
    // Adicionar linha de tendência para gráficos específicos
    if (chartType === 'wing_loading_mtow' || chartType === 'wing_loading_speed') {
        const trendlineData = generateTrendlineData(chartType);
        datasets.push(trendlineData);
    }
    
    // Configuração do gráfico
    let xAxisTitle, yAxisTitle;
    
    if (chartType === 'wing_loading_mtow') {
        xAxisTitle = 'Carga Alar (N/m²)';
        yAxisTitle = 'MTOW (N)';
    } else if (chartType === 'speed_mtow') {
        xAxisTitle = `${showEquivalentSpeed ? 'Velocidade Equivalente (VE)' : 'Velocidade Real (TAS)'} (m/s)`;
        yAxisTitle = 'MTOW (N)';
    } else if (chartType === 'wing_loading_speed') {
        xAxisTitle = 'Carga Alar (N/m²)';
        yAxisTitle = `${showEquivalentSpeed ? 'Velocidade Equivalente (VE)' : 'Velocidade Real (TAS)'} (m/s)`;
    }
    
    const config = {
        type: 'scatter',
        data: {
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const point = context.raw;
                            if (!point.isTrendline) {
                                return `${point.name}: (${point.x.toFixed(2)}, ${point.y.toFixed(2)})`;
                            } else {
                                return `Tendência: (${point.x.toFixed(2)}, ${point.y.toFixed(2)})`;
                            }
                        }
                    }
                }
            },
            scales: {
                x: {
                    type: 'logarithmic',
                    title: {
                        display: true,
                        text: xAxisTitle
                    }
                },
                y: {
                    type: 'logarithmic',
                    title: {
                        display: true,
                        text: yAxisTitle
                    }
                }
            },
            onClick: (event, elements) => {
                if (elements.length > 0) {
                    const index = elements[0].index;
                    const datasetIndex = elements[0].datasetIndex;
                    // Verificar se o elemento clicado não é da linha de tendência
                    const dataset = datasets[datasetIndex];
                    if (!dataset.data[index].isTrendline) {
                        const aircraftId = dataset.data[index].id;
                        viewAircraftDetails(aircraftId);
                    }
                }
            }
        }
    };
    
    // Criar gráfico
    const ctx = canvas.getContext('2d');
    flightDiagramChartInstance = new Chart(ctx, config);
    
    console.log('Diagrama do Voo renderizado com sucesso');
}

// Função para gerar os dados das linhas de tendência
function generateTrendlineData(chartType) {
    console.log('Gerando dados para linha de tendência...');
    
    let trendlinePoints = [];
    let trendlineLabel = '';
    
    if (chartType === 'wing_loading_mtow') {
        // Obter o coeficiente ajustável para W/S = k * W^(1/3)
        const mtowCoefficient = parseFloat(document.getElementById('mtow-coefficient').value) || 25;
        
        // Tendência para W/S = k * W^(1/3)
        trendlineLabel = `Tendência: W/S = ${mtowCoefficient} * W^(1/3)`;
        
        // Gerar pontos para diferentes valores de MTOW (Peso em Newtons)
        for (let w = 1; w <= 10000000; w *= 10) {
            // Diferentes valores de W dentro de cada ordem de magnitude
            for (let factor = 1; factor <= 9; factor++) {
                const weight = w * factor;
                // Calcular W/S usando a fórmula W/S = k * W^(1/3)
                const wingLoading = mtowCoefficient * Math.pow(weight, 1/3);
                
                trendlinePoints.push({
                    x: wingLoading,
                    y: weight,
                    isTrendline: true
                });
            }
        }
    } else if (chartType === 'wing_loading_speed') {
        // Obter o coeficiente ajustável para W/S = k * V^2
        const speedCoefficient = parseFloat(document.getElementById('speed-coefficient').value) || 0.38;
        
        // Tendência para W/S = k * V^2
        trendlineLabel = `Tendência: W/S = ${speedCoefficient} * V²`;
        
        // Gerar pontos para diferentes valores de velocidade (m/s)
        for (let v = 5; v <= 350; v += 5) {
            // Calcular carga alar usando a fórmula W/S = k * V^2
            const wingLoading = speedCoefficient * Math.pow(v, 2);
            
            trendlinePoints.push({
                x: wingLoading,
                y: v,
                isTrendline: true
            });
        }
    }
    
    return {
        label: trendlineLabel,
        data: trendlinePoints,
        backgroundColor: 'rgba(0, 0, 0, 0)', // Transparente
        borderColor: 'rgba(200, 0, 0, 0.8)', // Vermelho
        borderWidth: 2,
        borderDash: [5, 5], // Linha tracejada
        pointRadius: 0, // Sem pontos
        showLine: true, // Mostrar como linha
        fill: false
    };
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
                if (xAxisParamSelect.value === 'wing_loading_speed') {
                    updateFlightDiagram();
                }
            }
        });
    }
}

// Função para obter o valor da velocidade
function getSpeedValue(aircraft) {
    if (!aircraft || !aircraft.cruise_speed) return 0;
    
    if (showEquivalentSpeed) {
        // Calculate VE based on TAS and altitude
        // VE = TAS * sqrt(density ratio)
        // Density ratio approximated by exp(-altitude/scale height)
        // Scale height = 7400m for standard atmosphere
        if (aircraft.cruise_altitude) {
            const rho = Math.exp(-aircraft.cruise_altitude / 7400); // Approximate density ratio
            const ve = aircraft.cruise_speed * Math.sqrt(rho);
            console.log(`Aircraft: ${aircraft.name}, TAS: ${aircraft.cruise_speed}, VE: ${ve.toFixed(2)}, Altitude: ${aircraft.cruise_altitude}m, Density ratio: ${rho.toFixed(4)}`);
            return ve;
        } else {
            // If no altitude data, assume sea level (no difference)
            console.log(`Aircraft: ${aircraft.name}, No altitude data, using TAS: ${aircraft.cruise_speed}`);
            return aircraft.cruise_speed;
        }
    }
    
    console.log(`TAS for ${aircraft.name}: ${aircraft.cruise_speed}`);
    return aircraft.cruise_speed;
}

// Função para obter o rótulo da velocidade
function getSpeedLabel() {
    return showEquivalentSpeed ? 'Velocidade Equivalente (VE) [km/h]' : 'Velocidade Real (TAS) [km/h]';
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
                        text: 'Ano do Primeiro Voo'
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

function updateCharts() {
    // Atualizar todos os gráficos com a nova configuração de velocidade
    fetch('http://localhost:5001/api/aircraft')
        .then(response => response.json())
        .then(data => {
            createSpeedWeightChart(data);
            createSpeedYearChart(data);
        })
        .catch(error => console.error('Erro ao atualizar gráficos:', error));
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