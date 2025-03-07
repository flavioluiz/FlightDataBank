// Configuração da API
const BASE_URL = window.location.hostname === 'flavioluiz.github.io' ? '/FlightDataBank' : '';
const API_URL = BASE_URL + '/api';
const DEV_API_URL = 'http://localhost:5001/api';
const JSON_DATA_PATH = BASE_URL + '/data/aircraft.json';

// Configurações globais
const FALLBACK_IMAGES = {
    'comercial': BASE_URL + '/images/fallback/comercial.jpg',
    'executiva': BASE_URL + '/images/fallback/executiva.jpg',
    'carga': BASE_URL + '/images/fallback/carga.jpg',
    'militar': BASE_URL + '/images/fallback/militar.jpg',
    'geral': BASE_URL + '/images/fallback/geral.jpg',
    'historica': BASE_URL + '/images/fallback/historica.jpg',
    'experimental': BASE_URL + '/images/fallback/experimental.jpg',
    'ave': BASE_URL + '/images/fallback/ave.jpg'
};

const DEFAULT_FALLBACK_IMAGE = BASE_URL + '/images/fallback/geral.jpg';

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
document.addEventListener('DOMContentLoaded', async function() {
    console.log('DOM carregado, inicializando aplicação...');
    
    // Inicializar modal de detalhes
    const detailsModalElement = document.getElementById('aircraft-details-modal');
    if (detailsModalElement) {
        aircraftDetailsModal = new bootstrap.Modal(detailsModalElement);
    }
    
    // Configurar switches de velocidade
    const speedToggles = document.querySelectorAll('.speed-type-toggle');
    speedToggles.forEach(toggle => {
        toggle.addEventListener('change', (event) => {
            showEquivalentSpeed = event.target.checked;
            
            // Sincronizar todos os switches
            speedToggles.forEach(t => t.checked = showEquivalentSpeed);
            
            // Atualizar gráficos
            updateCharts();
        });
    });
    
    // Configurar navegação e event listeners
    setupNavigation();
    setupEventListeners();
    
    try {
        // Carregar dados e inicializar interface
        await loadAircraftData();
        populateParameterSelects();
        updateCharts();
        
        console.log('Aplicação inicializada com sucesso');
    } catch (error) {
        console.error('Erro ao inicializar aplicação:', error);
        showAlert('Erro ao inicializar aplicação: ' + error.message, 'danger');
    }
});

// Função para carregar dados de aeronaves
async function loadAircraftData() {
    console.log('Carregando dados de aeronaves e aves...');
    
    try {
        // Carregar aeronaves e aves
        const [aircraftResponse, birdsResponse] = await Promise.all([
            fetch(BASE_URL + '/data/aircraft.json'),
            fetch(BASE_URL + '/data/birds.json')
        ]);

        if (!aircraftResponse.ok) throw new Error(`Falha ao carregar dados de aeronaves: ${aircraftResponse.status}`);
        const aircraftData = await aircraftResponse.json();

        let birds = [];
        if (birdsResponse.ok) {
            const birdsData = await birdsResponse.json();
            birds = birdsData.birds || [];
        }

        // Processar e combinar dados
        const processedAircraft = aircraftData.aircraft.map(categorizeAircraft);
        const processedBirds = birds.map(bird => categorizeAircraft({...bird, category_type: 'ave'}));
        
        // Combinar e armazenar dados
        window.aircraftData = [...processedAircraft, ...processedBirds];
        
        // Atualizar interface
        renderTableSafely(window.aircraftData);
        return window.aircraftData;
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
        showAlert('Erro ao carregar dados: ' + error.message, 'danger');
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
            console.error('Elemento tbody não encontrado');
            return;
        }

        // Limpar a tabela antes de renderizar
        tbody.innerHTML = '';

        // Verificar se temos dados válidos
        if (!data || !Array.isArray(data) || data.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center">
                        ${getTranslation('table.no_data')}
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
                    ${aircraft.name || getTranslation('table.no_name')}
                </a>
            `;

            row.innerHTML = `
                <td>${nameCell}</td>
                <td>${aircraft.manufacturer || '-'}</td>
                <td>${aircraft.model || '-'}</td>
                <td>${aircraft.first_flight_year || '-'}</td>
                <td>${getTranslation(`aircraft.categories.type.${aircraft.category_type}`) || '-'}</td>
                <td>${getTranslation(`aircraft.categories.era.${aircraft.category_era}`) || '-'}</td>
                <td>${aircraft.mtow_N ? (aircraft.mtow_N / 9.81).toLocaleString() : '-'}</td>
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
        console.error('Erro ao renderizar tabela:', error);
        showAlert(getTranslation('table.error_rendering'), 'danger');
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

// Funções para gráficos
async function updateScatterChart() {
    console.log('Atualizando gráfico de dispersão...');
    
    // Obter os parâmetros selecionados
    const xParam = document.getElementById('x-param').value;
    const yParam = document.getElementById('y-param').value;
    const xLogScale = document.getElementById('x-log-scale').checked;
    const yLogScale = document.getElementById('y-log-scale').checked;
    
    try {
        // Usar os dados já carregados em vez de fazer requisição à API
        if (!window.aircraftData || window.aircraftData.length === 0) {
            console.log('Carregando dados para o gráfico de dispersão...');
            await loadAircraftData();
        }
        
        // Verificar se temos aves nos dados
        const birds = window.aircraftData.filter(item => item.category_type === 'ave');
        console.log(`Dados disponíveis para gráfico: ${window.aircraftData.length} itens, incluindo ${birds.length} aves`);
        
        // Processar os dados localmente
        const data = window.aircraftData
            .filter(aircraft => {
                // Verificar se os parâmetros existem no objeto
                const hasXParam = aircraft[xParam] !== undefined && aircraft[xParam] !== null;
                const hasYParam = aircraft[yParam] !== undefined && aircraft[yParam] !== null;
                
                if (!hasXParam || !hasYParam) {
                    // Log para debug
                    if (aircraft.category_type === 'ave') {
                        console.log(`Ave ${aircraft.name} não tem parâmetros completos: ${xParam}=${aircraft[xParam]}, ${yParam}=${aircraft[yParam]}`);
                    }
                }
                
                return hasXParam && hasYParam;
            })
            .map(aircraft => ({
                x: aircraft[xParam],
                y: aircraft[yParam],
                id: aircraft.id,
                name: aircraft.name,
                category: aircraft.category_type
            }));
        
        console.log(`Dados processados para o gráfico de dispersão: ${data.length} pontos`);
        
        // Log de debug para ver quais aves estão incluídas
        const birdsInData = data.filter(item => item.category === 'ave');
        console.log(`Aves incluídas no gráfico: ${birdsInData.length}`);
        
        renderScatterChart(data, xParam, yParam, xLogScale, yLogScale);
    } catch (error) {
        console.error('Erro ao processar dados para o gráfico:', error);
        showAlert('Erro ao processar dados para o gráfico: ' + error.message, 'danger');
    }
}

function renderScatterChart(data, xParam, yParam, xLogScale, yLogScale) {
    console.log(`Renderizando gráfico de dispersão com ${data.length} itens, X: ${xParam}, Y: ${yParam}`);
    
    const canvas = document.getElementById('scatter-chart');
    if (!canvas) {
        console.error('Canvas para gráfico de dispersão não encontrado');
        return;
    }
    
    // Verificar se já existe um gráfico e destruí-lo
    const existingChart = Chart.getChart(canvas);
    if (existingChart) {
        existingChart.destroy();
    }
    
    // Se não houver dados válidos, mostrar mensagem
    if (!data || data.length === 0) {
        console.error('Nenhum dado válido para o gráfico de dispersão');
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
    data.forEach(point => {
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
    
    // Mapear parâmetros para rótulos legíveis
    const paramLabels = {
        'mtow_N': 'MTOW (N)',
        'wing_area_m2': 'Área da Asa (m²)',
        'wingspan_m': 'Envergadura (m)',
        'cruise_speed_ms': 'Velocidade de Cruzeiro (m/s)',
        'takeoff_speed_ms': 'Velocidade de Decolagem (m/s)',
        'landing_speed_ms': 'Velocidade de Pouso (m/s)',
        'service_ceiling_m': 'Teto de Serviço (m)',
        'max_thrust': 'Empuxo Máximo (kN)',
        'engine_count': 'Número de Motores',
        'first_flight_year': 'Ano do Primeiro Voo',
        'range_km': 'Alcance (km)',
        'max_speed_ms': 'Velocidade Máxima (m/s)'
    };
    
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
                },
                legend: {
                    position: 'top'
                }
            },
            onClick: function(e, elements) {
                if (elements.length > 0) {
                    const index = elements[0].index;
                    const datasetIndex = elements[0].datasetIndex;
                    const point = this.data.datasets[datasetIndex].data[index];
                    
                    // Mostrar detalhes da aeronave selecionada
                    viewAircraftDetails(point.id);
                }
            }
        }
    });
}

async function updateTimelineChart() {
    console.log('Atualizando gráfico de timeline...');
    
    // Obter os parâmetros selecionados
    const param = document.getElementById('timeline-param').value;
    const logScale = document.getElementById('timeline-log-scale').checked;
    
    try {
        // Usar os dados já carregados em vez de fazer requisição à API
        if (!window.aircraftData || window.aircraftData.length === 0) {
            console.log('Carregando dados para o gráfico de timeline...');
            await loadAircraftData();
        }
        
        // Verificar se temos aves nos dados
        const birds = window.aircraftData.filter(item => item.category_type === 'ave');
        console.log(`Dados disponíveis para timeline: ${window.aircraftData.length} itens, incluindo ${birds.length} aves`);
        
        // Processar os dados localmente
        const data = window.aircraftData
            .filter(aircraft => {
                // Verificar se os parâmetros necessários existem
                const hasParam = aircraft[param] !== undefined && aircraft[param] !== null && !isNaN(aircraft[param]);
                const hasYear = aircraft.first_flight_year !== undefined && aircraft.first_flight_year !== null && !isNaN(aircraft.first_flight_year);
                
                // Log para ajudar a depurar aves
                if (aircraft.category_type === 'ave' && (!hasParam || !hasYear)) {
                    console.log(`Ave ${aircraft.name} não tem dados completos para timeline: ${param}=${aircraft[param]}, ano=${aircraft.first_flight_year}`);
                }
                
                return hasParam && hasYear;
            })
            .map(aircraft => {
                // Processar o valor dependendo do parâmetro
                let value = aircraft[param];
                
                // Garantir que o valor é numérico
                value = parseFloat(value);
                
                return {
                    year: parseInt(aircraft.first_flight_year),
                    value: value,
                    id: aircraft.id,
                    name: aircraft.name,
                    category: aircraft.category_type
                };
            })
            .filter(item => !isNaN(item.year) && !isNaN(item.value)); // Filtro final para garantir dados válidos
        
        console.log(`Dados processados para o gráfico de timeline: ${data.length} pontos`);
        
        // Log de debug para ver quais aves estão incluídas
        const birdsInData = data.filter(item => item.category === 'ave');
        console.log(`Aves incluídas na timeline: ${birdsInData.length}`);
        
        if (data.length === 0) {
            console.warn('Nenhum dado válido para o gráfico de timeline');
            return;
        }
        
        // Verificar os valores mínimos e máximos para debug
        const years = data.map(d => d.year);
        const values = data.map(d => d.value);
        console.log(`Anos: min=${Math.min(...years)}, max=${Math.max(...years)}`);
        console.log(`Valores: min=${Math.min(...values)}, max=${Math.max(...values)}`);
        
        renderTimelineChart(data, param, logScale);
    } catch (error) {
        console.error('Erro ao processar dados para o gráfico de timeline:', error);
        showAlert('Erro ao processar dados para o gráfico de timeline: ' + error.message, 'danger');
    }
}

function renderTimelineChart(data, param, logScale) {
    console.log(`Renderizando gráfico de linha do tempo com ${data.length} itens, parâmetro: ${param}`);
    
    const canvas = document.getElementById('timeline-chart');
    if (!canvas) {
        console.error('Canvas para gráfico de linha do tempo não encontrado');
        return;
    }
    
    // Verificar se já existe um gráfico e destruí-lo
    const existingChart = Chart.getChart(canvas);
    if (existingChart) {
        existingChart.destroy();
    }
    
    // Se não houver dados válidos, mostrar mensagem
    if (!data || data.length === 0) {
        console.error('Nenhum dado válido para o gráfico de linha do tempo');
        return;
    }
    
    // Ordenar dados por ano
    data.sort((a, b) => a.year - b.year);
    
    // Cores para diferentes categorias
    const categoryColors = {
        'ave': 'rgba(255, 99, 132, 0.7)',
        'comercial': 'rgba(54, 162, 235, 0.7)',
        'militar': 'rgba(255, 206, 86, 0.7)',
        'geral': 'rgba(75, 192, 192, 0.7)',
        'historica': 'rgba(153, 102, 255, 0.7)',
        'executiva': 'rgba(255, 159, 64, 0.7)',
        'carga': 'rgba(201, 203, 207, 0.7)',
        'experimental': 'rgba(153, 153, 0, 0.7)',
        'desconhecida': 'rgba(128, 128, 128, 0.7)'
    };
    
    // Agrupar dados por categoria
    const datasetsByCategory = {};
    data.forEach(point => {
        const category = point.category || 'desconhecida';
        if (!datasetsByCategory[category]) {
            datasetsByCategory[category] = [];
        }
        datasetsByCategory[category].push({
            x: point.year,
            y: point.value,
            id: point.id,
            name: point.name,
            category: point.category,
            originalValue: point.value
        });
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
    
    // Mapear parâmetros para rótulos legíveis
    const paramLabels = {
        'mtow_N': 'MTOW (N)',
        'wing_area_m2': 'Área da Asa (m²)',
        'wingspan_m': 'Envergadura (m)',
        'cruise_speed_ms': 'Velocidade de Cruzeiro (m/s)',
        'takeoff_speed_ms': 'Velocidade de Decolagem (m/s)',
        'landing_speed_ms': 'Velocidade de Pouso (m/s)',
        'service_ceiling_m': 'Teto de Serviço (m)',
        'max_thrust': 'Empuxo Máximo (kN)',
        'engine_count': 'Número de Motores',
        'first_flight_year': 'Ano do Primeiro Voo',
        'range_km': 'Alcance (km)',
        'max_speed_ms': 'Velocidade Máxima (m/s)'
    };

    // Encontrar os limites dos anos
    const years = data.map(point => point.year);
    const minYear = Math.min(...years);
    const maxYear = Math.max(...years);
    const yearPadding = Math.round((maxYear - minYear) * 0.05); // 5% de padding

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
                    type: 'linear',
                    position: 'bottom',
                    title: {
                        display: true,
                        text: 'Ano do Primeiro Voo'
                    },
                    min: minYear - yearPadding,
                    max: maxYear + yearPadding,
                    ticks: {
                        stepSize: 10
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
                            let label = `${point.name} (${point.x})`;
                            
                            // Adicionar valor com unidade apropriada
                            if (param.includes('speed')) {
                                label += `: ${(point.y * 3.6).toFixed(1)} km/h`; // Converter m/s para km/h
                            } else if (param === 'mtow_N') {
                                label += `: ${(point.y / 9.81).toFixed(1)} kg`; // Converter N para kg
                            } else {
                                label += `: ${point.y.toLocaleString()}`;
                            }
                            
                            return label;
                        }
                    }
                },
                legend: {
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        pointStyle: 'circle'
                    }
                }
            },
            onClick: function(e, elements) {
                if (elements.length > 0) {
                    const index = elements[0].index;
                    const datasetIndex = elements[0].datasetIndex;
                    const point = this.data.datasets[datasetIndex].data[index];
                    
                    // Mostrar detalhes da aeronave selecionada
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
                const response = await fetch(BASE_URL + '/data/aircraft.json');
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
                    ${getTranslation('aircraft.details.not_found')} ID: ${id}
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
                        ${getTranslation(`aircraft.categories.type.${aircraft.category_type}`)} | 
                        ${getTranslation(`aircraft.categories.era.${aircraft.category_era}`)}
                    </p>
                    
                    <div class="row mt-3">
                        <div class="col-md-6">
                            <p><strong>${getTranslation('aircraft.details.general.first_flight_year')}:</strong> ${aircraft.first_flight_year || 'N/A'}</p>
                            <p><strong>${getTranslation('aircraft.details.physical.mtow')}:</strong> ${formatValue(aircraft.mtow_N / 9.81, 'kg')}</p>
                            <p><strong>${getTranslation('aircraft.details.physical.wing_area')}:</strong> ${formatValue(aircraft.wing_area_m2, 'm²')}</p>
                            <p><strong>${getTranslation('aircraft.details.physical.wingspan')}:</strong> ${formatValue(aircraft.wingspan_m, 'm')}</p>
                            <p><strong>${getTranslation('aircraft.details.physical.wing_loading')}:</strong> ${formatValue(wingLoading, 'N/m²')}</p>
                        </div>
                        <div class="col-md-6">
                            <p><strong>${getTranslation('aircraft.details.speeds.cruise')}:</strong> ${formatValue(msToKmh(aircraft.cruise_speed_ms), 'km/h')}</p>
                            <p><strong>${getTranslation('aircraft.details.speeds.takeoff')}:</strong> ${formatValue(msToKmh(aircraft.takeoff_speed_ms), 'km/h')}</p>
                            <p><strong>${getTranslation('aircraft.details.speeds.landing')}:</strong> ${formatValue(msToKmh(aircraft.landing_speed_ms), 'km/h')}</p>
                            <p><strong>${getTranslation('aircraft.details.performance.service_ceiling')}:</strong> ${formatValue(aircraft.service_ceiling_m, 'm')}</p>
                            <p><strong>${getTranslation('aircraft.details.performance.cruise_altitude')}:</strong> ${formatValue(aircraft.cruise_altitude_m, 'm')}</p>
                            <p><strong>${getTranslation('aircraft.details.general.engine_type')}:</strong> ${aircraft.engine_count || 'N/A'} × ${aircraft.engine_type || 'N/A'}</p>
                            ${aircraft.max_thrust ? `<p><strong>${getTranslation('aircraft.details.performance.max_thrust')}:</strong> ${formatValue(aircraft.max_thrust, 'kN')}</p>` : ''}
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
    return showEquivalentSpeed ? 'Velocidade Equivalente (VE) [m/s]' : 'Velocidade Real (TAS) [m/s]';
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

// Função para atualizar todos os gráficos
function updateCharts() {
    const activePage = document.querySelector('.page:not(.d-none)');
    if (!activePage) return;
    
    const pageId = activePage.id;
    console.log('Atualizando gráficos para página:', pageId);
    
    try {
        switch (pageId) {
            case 'scatter-plot':
                updateScatterChart();
                break;
            case 'timeline':
                updateTimelineChart();
                break;
            case 'flight-diagram':
                updateFlightDiagram();
                break;
        }
    } catch (error) {
        console.error('Erro ao atualizar gráficos:', error);
        showAlert('Erro ao atualizar gráficos: ' + error.message, 'danger');
    }
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
    const categories = {
        'comercial': 'Aviação Comercial',
        'militar': 'Aviação Militar',
        'geral': 'Aviação Geral',
        'executiva': 'Aviação Executiva',
        'carga': 'Aviação de Carga',
        'historica': 'Aeronave Histórica',
        'experimental': 'Aeronave Experimental',
        'ave': 'Ave (Comparação)',
        'desconhecida': 'Desconhecida'
    };
    
    return categories[categoryType] || categoryType;
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
        yAxisLabel = showEquivalentSpeed ? 'Velocidade Equivalente (m/s)' : 'Velocidade Real (m/s)';
    } else if (chartType === 'wing_loading_speed') {
        xAxisLabel = showEquivalentSpeed ? 'Velocidade Equivalente (m/s)' : 'Velocidade Real (m/s)';
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
                    const point = this.data.datasets[datasetIndex].data[index];
                    
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
    const result = { ...aircraft };
    
    // Se for uma ave, aplicar categorias padrão
    if (result.category_type === 'ave') {
        return {
            ...result,
            category_era: 'biologica',
            category_engine: 'muscular',
            category_size: 'muito_leve'
        };
    }
    
    // Categorização por tamanho (MTOW)
    const mtowRanges = [
        { max: 5700, size: 'muito_leve' },
        { max: 50000, size: 'regional' },
        { max: 150000, size: 'medio' },
        { max: 300000, size: 'grande' },
        { max: Infinity, size: 'muito_grande' }
    ];
    
    if (!result.category_size && result.mtow) {
        result.category_size = mtowRanges.find(range => result.mtow <= range.max)?.size || 'desconhecido';
    }
    
    // Categorização por era
    const eraRanges = [
        { max: 1930, era: 'pioneiros' },
        { max: 1950, era: 'classica' },
        { max: 1970, era: 'jato_inicial' },
        { max: 2000, era: 'moderna' },
        { max: Infinity, era: 'contemporanea' }
    ];
    
    if (!result.category_era && result.first_flight_year) {
        result.category_era = eraRanges.find(range => result.first_flight_year <= range.max)?.era || 'desconhecido';
    }
    
    // Categorização por tipo de motor
    if (!result.category_engine && result.engine_type) {
        const engineType = result.engine_type.toLowerCase();
        const engineMap = {
            'pist': 'pistao',
            'turbo': 'turboelice',
            'turbojato': 'turbojato',
            'turbofan': 'turbofan',
            'especial': 'especial'
        };
        
        result.category_engine = Object.entries(engineMap)
            .find(([key]) => engineType.includes(key))?.[1] || 'desconhecido';
    }
    
    return result;
} 
