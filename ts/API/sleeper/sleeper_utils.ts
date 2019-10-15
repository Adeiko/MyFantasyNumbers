function convertSleeperRoster(rosterPositions: string[], numIR: number, numTaxi: number): [number[], number[]]{
    var activeCount = new Map();
    var benchCount = new Map();
    var activeLineupSlots = [];
    var benchSlots = [];
    var active = rosterPositions.filter(it => {
        return it != "BN";
    }).map(slot => positionToInt.get(slot));
    active.forEach(slot => {
        if (activeCount.has(slot)) {
            let newCount = activeCount.get(slot) + 1;
            activeCount.set(slot, newCount);
        } else {
            activeCount.set(slot, 1);
        }
    });

    var bench = rosterPositions.filter((it) => {
        return it == "BN";
    }).map(slot => positionToInt.get(slot));
    for(var i = 0; i < numIR; i++) {
        bench.push(positionToInt.get("IR"));
    }
    for(var i = 0; i < numTaxi; i++) {
        bench.push(positionToInt.get("TAXI"));
    }
    bench.forEach(slot => {
        if (benchCount.has(slot)) {
            let newCount = benchCount.get(slot) + 1;
            benchCount.set(slot, newCount);
        } else {
            benchCount.set(slot, 1);
        }
    });

    activeCount.forEach((value: number, key: number) => {
        activeLineupSlots.push([key, value]);
    });
    benchCount.forEach((value: number, key: number) => {
        benchSlots.push([key, value]);
    });
    
    return [activeLineupSlots, benchSlots];
}

function makeSleeperPlayers(players: string[]): Sleeper_Player[] {
    var sleeperPlayers = [];
    players.forEach(player => {
        sleeperPlayers.push(player);
    });
    return sleeperPlayers;
}

function getSleeperWeekStats(numWeeks: number): Promise<any> {
    var statPromises = [];
    for (var i = 1; i <= numWeeks; i++) {
        statPromises.push(makeRequest('https://api.sleeper.app/v1/stats/nfl/regular/2019/' + i));
    }

    var projectionPromises = [];
    for (var i = 1; i <= numWeeks; i++) {
        projectionPromises.push(makeRequest('https://api.sleeper.app/v1/projections/nfl/regular/2019/' + i));
    }
    var allPromises = statPromises.concat(projectionPromises)
    return Promise.all(allPromises).then(result => {
        var sleeperStats = [];
        var stats = result.slice(0, statPromises.length).map(obj => {
            return obj.response;
        });
        var projections = result.slice(statPromises.length, allPromises.length).map(obj => {
            return obj.response;
        });

        for (var i = 0; i < stats.length; i++) {
            sleeperStats.push(new Sleeper_Week_Stats(projections[i], stats[i], i + 1));
        }

        return sleeperStats;
    });
}

function makeRequest(url: string): Promise<XMLHttpRequest> {
	// Create the XHR request
    var request = new XMLHttpRequest();
    request.responseType = "json";

	// Return it as a Promise
	return new Promise(function (resolve, reject) {

		// Setup our listener to process compeleted requests
		request.onreadystatechange = function () {

			// Only run if the request is complete
			if (request.readyState !== 4) return;

			// Process the response
			if (request.status >= 200 && request.status < 300) {
				// If successful
				resolve(request);
			} else {
				// If failed
				reject({
					status: request.status,
					statusText: request.statusText
				});
			}

		};

		// Setup our HTTP request
		request.open('GET', url, true);

		// Send the request
		request.send();

	});
}

function assignAllPlayerAttributes(weeks: Week[], activeLineupSlots, settings: Settings, leagueID, seasonID, members, leagueName) {
    makeRequest("js/typescript/player_library.json").then(result => {
        const lib = (result.response as Sleeper_Player_Library_Entry[]);
        weeks.forEach(week => {
            week.matchups.forEach(matchup => {
                matchup.home.lineup.forEach(player => {
                    assignSleeperPlayerAttributes(player as Sleeper_Player, lib[player.playerID]);
                });
                matchup.home.bench.forEach(player => {
                    assignSleeperPlayerAttributes(player as Sleeper_Player, lib[player.playerID]);
                });
                matchup.home.IR.forEach(player => {
                    assignSleeperPlayerAttributes(player as Sleeper_Player, lib[player.playerID]);
                });
                (matchup.home as Sleeper_Team).setTeamMetrics(activeLineupSlots);
                if (!matchup.byeWeek) {
                    matchup.away.lineup.forEach(player => {
                        assignSleeperPlayerAttributes(player, lib[player.playerID]);
                    });
                    matchup.away.bench.forEach(player => {
                        assignSleeperPlayerAttributes(player, lib[player.playerID]);
                    });
                    matchup.away.IR.forEach(player => {
                        assignSleeperPlayerAttributes(player, lib[player.playerID]);
                    });
                    (matchup.away as Sleeper_Team).setTeamMetrics(activeLineupSlots);
                    matchup.projectedMOV = (Math.abs(matchup.home.projectedScore - matchup.away.projectedScore));
                    matchup.setPoorLineupDecisions();
                }
            });
        }); 


        var league = new League(leagueID, seasonID, weeks, members, settings, leagueName, PLATFORM.SLEEPER);
        league.setMemberStats(league.getSeasonPortionWeeks());
        console.log(league);
        setPage(league);

    }); 
}

function assignSleeperPlayerAttributes(player: Sleeper_Player, player_attributes: Sleeper_Player_Library_Entry) {
    player.firstName = player_attributes.first_name;
    player.lastName = player_attributes.last_name;
    player.position =  player_attributes.position;
    player.playerID = player.playerID;
    player.eligibleSlots = eligibleSlotMap.get(positionToInt.get(player_attributes.position));
    player.realTeamID = player_attributes.team;
    player.espnID = player_attributes.espn_id;
}

const eligibleSlotMap = new Map([
    [0, [0, 1, 7, 20, 21]],
    [1, [1, 7, 20, 21]],
    [2, [2, 3, 7, 20, 21, 23]],
    [4, [4, 3, 5, 7, 20, 21, 23]],
    [6, [6, 5, 7, 20, 21, 23]],
    [8, [8, 15, 20, 21]],
    [9, [9, 15, 20, 21]],
    [10, [10, 15, 20, 21]],
    [11, [11, 15, 20, 21]],
    [12, [12, 15, 20, 21]],
    [13, [13, 15, 20, 21]],
    [14, [14, 15, 20, 21]],
    [16, [16, 20]],
    [17, [17, 20, 21]],
    [18, [18, 20, 21]],
    [19, [19, 20]]
]);

const intToPosition = new Map([
    [0, "QB"],
    [1, "TQB"],
    [2, "RB"],
    [3, "RB/WR"],
    [4, "WR"],
    [5, "WR/TE"],
    [6, "TE"],
    [7, "OP"],
    [8, "DT"],
    [9, "DE"],
    [10, "LB"],
    [11, "DL"],
    [12, "CB"],
    [13, "S"],
    [14, "DB"],
    [15, "DP"],
    [16, "DEF"],
    [17, "K"],
    [18, "P"],
    [19, "HC"],
    [20, "BN"],
    [21, "IR"],
    [23, "FLEX"],
    [88, "TAXI"]
]);

const positionToInt = new Map([
    ["QB", 0],
    ["TQB", 1],
    ["RB", 2],
    ["RB/WR", 3],
    ["WR", 4],
    ["WR/TE", 5],
    ["TE", 6],
    ["SUPER_FLEX", 7],
    ["OP", 7],
    ["DT", 8],
    ["DE", 9],
    ["LB", 10],
    ["DL", 11],
    ["CB", 12],
    ["S", 13],
    ["DB", 14],
    ["DP", 15],
    ["DEF", 16],
    ["K", 17],
    ["P", 18],
    ["HC", 19],
    ["BN", 20],
    ["IR", 21],
    ["FLEX", 23],
    ["TAXI", 88]
]);
