function createTeamBarChart(league, member) {
    $('#member_bar_chart_canvas').remove();
    $('#member_bar_chart_container').append('<canvas id="member_bar_chart_canvas"><canvas>');
    var ctx = document.getElementById("member_bar_chart_canvas");
    ctx.classList.toggle('team_weekly_line_chart', true);
    var chartData = {
        labels: league.settings.getPositions(),
        datasets: [{
                label: member.nameToString(),
                backgroundColor: "blue",
                data: league.getMemberTotalPointsPerPosition(member.teamID)
            }, {
                label: "All Opponents",
                backgroundColor: "orange",
                data: league.getLeaguePointsPerPosition()
            }, {
                label: "League Average",
                backgroundColor: "black",
                data: league.getMemberOpponentTotalPointsPerPosition(member.teamID)
            }]
    };
    var memberBarChart = new Chart(ctx, {
        type: 'bar',
        data: chartData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            title: {
                display: true,
                position: "top",
                text: "Total points by position",
                fontSize: 20,
                fontColor: "#111",
            },
            scales: {
                yAxes: [{
                        ticks: {
                            beginAtZero: true,
                        }
                    }]
            },
            plugins: {
                deferred: {
                    xOffset: 150,
                    yOffset: '50%',
                    delay: 500 // delay of 500 ms after the canvas is considered inside the viewport
                }
            },
            legend: {
                display: true,
                position: "bottom",
                labels: {
                    fontColor: "#333",
                    fontSize: 12
                },
            }
        }
    });
    memberBarChart.render();
}
//# sourceMappingURL=Bar_Charts.js.map