// Função para criar gráfico de dispersão
function createScatterPlot(data, xParam, yParam, xLogScale, yLogScale) {
    const ctx = document.getElementById('scatter-chart').getContext('2d');
    
    // Preparar dados
    const datasets = data.map(item => ({
        x: item[xParam],
        y: item[yParam],
        label: item.name
    })).filter(item => item.x != null && item.y != null);
    
    // Configurar escalas
    const scales = {
        x: {
            type: xLogScale ? 'logarithmic' : 'linear',
            position: 'bottom',
            title: {
                display: true,
                text: xParam
            }
        },
        y: {
            type: yLogScale ? 'logarithmic' : 'linear',
            title: {
                display: true,
                text: yParam
            }
        }
    };
    
    // Criar gráfico
    return new Chart(ctx, {
        type: 'scatter',
        data: {
            datasets: [{
                data: datasets,
                backgroundColor: 'rgba(54, 162, 235, 0.5)',
                borderColor: 'rgba(54, 162, 235, 1)',
                pointRadius: 5,
                pointHoverRadius: 7
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.raw.label;
                        }
                    }
                }
            },
            scales: scales
        }
    });
}
