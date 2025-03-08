// Função para criar gráfico de linha do tempo
function createTimelineChart(data, param, logScale) {
    const ctx = document.getElementById('timeline-chart').getContext('2d');
    
    // Preparar dados
    const sortedData = data
        .filter(item => item.first_flight_year && item[param])
        .sort((a, b) => a.first_flight_year - b.first_flight_year);
    
    const chartData = {
        labels: sortedData.map(item => item.first_flight_year),
        datasets: [{
            label: param,
            data: sortedData.map(item => item[param]),
            borderColor: 'rgb(75, 192, 192)',
            tension: 0.1
        }]
    };
    
    // Criar gráfico
    return new Chart(ctx, {
        type: 'line',
        data: chartData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    type: logScale ? 'logarithmic' : 'linear',
                    title: {
                        display: true,
                        text: param
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Year'
                    }
                }
            }
        }
    });
}
