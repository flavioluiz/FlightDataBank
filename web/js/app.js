function generateScatterPlot(data, xKey, yKey, xLabel, yLabel, containerId) {
    const margin = {top: 20, right: 20, bottom: 50, left: 60};
    const width = 800 - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;

    // Limpar o container antes de criar novo gráfico
    d3.select(containerId).html("");

    const svg = d3.select(containerId)
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Criar escalas
    const xScale = d3.scaleLog()
        .domain([d3.min(data, d => d[xKey]) * 0.8, d3.max(data, d => d[xKey]) * 1.2])
        .range([0, width]);

    const yScale = d3.scaleLog()
        .domain([d3.min(data, d => d[yKey]) * 0.8, d3.max(data, d => d[yKey]) * 1.2])
        .range([height, 0]);

    // Adicionar pontos
    svg.selectAll("circle")
        .data(data)
        .enter()
        .append("circle")
        .attr("cx", d => xScale(d[xKey]))
        .attr("cy", d => yScale(d[yKey]))
        .attr("r", 5)
        .style("fill", d => getCategoryColor(d.category_type));

    // Adicionar linha de tendência apenas se não for velocidade x MTOW
    if (!(xKey === 'mtow_N' && yKey === 'cruise_speed_ms')) {
        // Calcular regressão
        const regression = calculateRegression(data, xKey, yKey);
        
        // Usar os valores mínimo e máximo reais dos dados para a linha de tendência
        const xMin = d3.min(data, d => d[xKey]);
        const xMax = d3.max(data, d => d[xKey]);
        
        // Gerar pontos para a linha de tendência
        const trendlineData = [
            {x: xMin, y: regression.predict(xMin)},
            {x: xMax, y: regression.predict(xMax)}
        ];

        // Adicionar linha de tendência
        svg.append("path")
            .datum(trendlineData)
            .attr("class", "trendline")
            .attr("d", d3.line()
                .x(d => xScale(d.x))
                .y(d => yScale(d.y)))
            .style("stroke", "red")
            .style("stroke-width", 2)
            .style("stroke-dasharray", "3,3");
    }

    // Adicionar eixos
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(xScale).ticks(5, ".0f"));

    svg.append("g")
        .call(d3.axisLeft(yScale).ticks(5, ".0f"));

    // Adicionar rótulos dos eixos
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", height + 40)
        .style("text-anchor", "middle")
        .text(xLabel);

    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -40)
        .style("text-anchor", "middle")
        .text(yLabel);
}

// Função para atualizar os gráficos
function updateCharts(data) {
    // Garantir que temos dados válidos
    if (!data || data.length === 0) {
        console.error('Dados inválidos para atualização dos gráficos');
        return;
    }

    // Atualizar cada gráfico com os dados combinados
    generateScatterPlot(data, 'mtow_N', 'cruise_speed_ms', 'MTOW (N)', 'Velocidade (m/s)', '#mtow-speed-chart');
    generateScatterPlot(data, 'wing_loading_N_m2', 'cruise_speed_ms', 'Carga Alar (N/m²)', 'Velocidade (m/s)', '#wing-loading-speed-chart');
    generateScatterPlot(data, 'wing_area_m2', 'mtow_N', 'Área da Asa (m²)', 'MTOW (N)', '#wing-area-mtow-chart');
}

// Função para carregar dados
async function loadData() {
    try {
        console.log('Iniciando carregamento de dados...');
        
        // Carregar dados de aeronaves
        console.log('Carregando aircraft.json...');
        const aircraftResponse = await fetch('data/aircraft.json');
        const aircraftData = await aircraftResponse.json();
        const aircraft = aircraftData.aircraft || [];
        console.log('Aeronaves carregadas:', aircraft.length);

        // Carregar dados de aves
        console.log('Carregando birds.json...');
        const birdsResponse = await fetch('data/birds.json');
        const birdsData = await birdsResponse.json();
        const birds = birdsData.birds || [];
        console.log('Aves carregadas:', birds.length);

        // Combinar os dados e garantir que é uma variável global
        window.allData = [...aircraft, ...birds];
        console.log('Dados combinados:', window.allData.length, 'itens');
        
        // Log detalhado dos tipos
        const tipos = new Set(window.allData.map(item => item.category_type));
        console.log('Tipos encontrados:', Array.from(tipos));

        // Atualizar a tabela principal
        if (typeof renderAircraftTable === 'function') {
            console.log('Atualizando tabela principal...');
            renderAircraftTable(window.allData);
        }

        // Atualizar os gráficos
        console.log('Atualizando gráficos...');
        updateCharts(window.allData);

        // Atualizar filtros se existirem
        if (typeof updateFilterOptions === 'function') {
            console.log('Atualizando opções de filtro...');
            updateFilterOptions(window.allData);
        }

        // Atualizar a lista se existir
        const listContainer = document.getElementById('aircraft-list');
        if (listContainer) {
            console.log('Atualizando lista de itens...');
            listContainer.innerHTML = '';
            window.allData.forEach(item => {
                const listItem = document.createElement('div');
                listItem.className = 'list-item';
                listItem.innerHTML = `
                    <h3>${item.name}</h3>
                    <p>Categoria: ${item.category_type}</p>
                    <p>Velocidade de Cruzeiro: ${item.cruise_speed_ms} m/s</p>
                    <p>MTOW: ${item.mtow_N} N</p>
                `;
                listContainer.appendChild(listItem);
            });
        }

        // Disparar evento de dados carregados
        const event = new CustomEvent('dataLoaded', { detail: window.allData });
        window.dispatchEvent(event);
        
        console.log('Carregamento de dados concluído com sucesso');

    } catch (error) {
        console.error('Erro ao carregar dados:', error);
        console.error('Stack trace:', error.stack);
    }
}

// Adicionar listener para recarregar dados quando necessário
window.addEventListener('reloadData', () => {
    console.log('Solicitação de recarga de dados recebida');
    loadData();
});

// ... existing code ... 