// function fillData(data, interval) {
//     let labels = intervalLabels[interval]
//     for(let i = data.length)
// }
$(function () {
    var activeChart = $('.interval.active')
    const ctx = $('#views');
    var chart

    const intervalItems = $('.interval')
    const intervalsLabels = {
        "day": ['00', '01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23'],
        "week": ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'],
        "month": ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23', '24', '25', '26', '27', '28', '29', '30', '31']
    }
    // funcao preencher dados e atualizar grafico
    $.getJSON(activeChart.attr('href'), function (result) {
        chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: intervalsLabels[activeChart.data('interval')],
                datasets: [{
                    data: result,
                    lineTension: 0,
                    backgroundColor: 'transparent',
                    borderColor: '#007bff',
                    borderWidth: 4,
                    pointRadius: 5,
                    pointHoverRadius: 5,
                    pointBackgroundColor: '#007bff'
                }]
            },
            options: {
                scales: {
                    yAxes: [{
                        ticks: {
                            beginAtZero: false
                        }
                    }]
                },
                legend: {
                    display: false
                }
            }
        })
    })
    intervalItems.click(function (e) {
        e.preventDefault()
        activeChart.removeClass('active')
        activeChart = $(this)
        activeChart.addClass('active')
        $.getJSON(activeChart.attr('href'), function (views) {
            chart.data.datasets[0].data = views
            chart.data.labels = intervalsLabels[activeChart.data('interval')]
            chart.update()
        })
    })
})