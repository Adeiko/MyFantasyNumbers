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
    window.myBarChart = new Chart(ctx, {
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
    window.myBarChart.render();
}
// function createLeagueStackedGraph(league: League): void {
//     var ctx = document.getElementById("league_stacked_graph_container");
//     //window.myChart.destroy();
//     window.myChart = new Chart(ctx, {
//         type: 'bar',
//         data: {
//             labels: makeMemberLabels(league),
//             datasets: createStackedDatasets(league),
//         },
//         legend: {
//             display: true,
//             position: "bottom",
//             labels: {
//                 fontColor: "#333",
//                 fontSize: 16
//             }
//         },
//         options: {
//             responsive: true,
//             title: {
//                 display: true,
//                 position: "top",
//                 text: "Total Points Scored",
//                 fontSize: 36,
//                 fontColor: "#111",
//             },
//             tooltips: {
//                 mode: 'index',
//                 intersect: false
//             },
//             scales: {
//                 xAxes: [{
//                     stacked: true
//                 }],
//                 yAxes: [{
//                     stacked: true,
//                     beginAtZero: true,
//                 }],
//             },
//             legend: {
//                 display: true,
//                 position: "bottom",
//                 labels: {
//                     fontColor: "#333",
//                     fontSize: 16
//                 }
//             }
//         },
//     });
//     myChart.render();
// }
// function createStackedPFDatasets(league: League) {
//     var memberData = [];
//     var datasets = [];
//     var backgroundColors = ["#24115c", "#700566", "#ae0560", "#de364d", "#f96c32", "#ffa600"];
//     var positions = league.settings.positions;
//     for (i in myYear.members) {
//         memberData.push(getStackedData(myYear.members[i]));
//     }
//     for (x = 0; x < positions.length; x++) {
//         let set = {
//             type: 'bar',
//             label: positions[x],
//             backgroundColor: backgroundColors[x],
//             data: extractMemberData(memberData, x),
//         };
//         datasets.push(set);
//     }
//     return datasets;
// }
// function makeMemberLabels(league: League): string[] {
//     var labels = [];
//     league.members.forEach(member => {
//         labels.push(member.nameToString());
//     });
//     return labels;
// }
// function extractMemberData(memberData, pos) {
//     var data = [];
//     for (i = 0; i < memberData.length; i++) {
//         data.push(memberData[i][pos]);
//     }
//     return data;
// }
function getMemberStackedPfData() {
}
//# sourceMappingURL=Bar_Charts.js.map