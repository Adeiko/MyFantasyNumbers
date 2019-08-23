enum SEASON_PORTION {
    REGULAR = "Regular Season",
    POST = "Post-Season",
    ALL = "Complete Season",
}

enum DRAFT_TYPE {
    AUCTION,
    SNAKE,
    LINEAR,
}

enum LEAGUE_TYPE {
    DYNASTY,
    REDRAFT,
}

enum SCORING_TYPE {
    STANDARD,
    HALF_PPR,
    FULL_PPR,
}

enum POSITION {
    QB = "QB",
    RB = "RB",
    WR = "WR",
    TE = "TE",
    K = "K",
    D_ST = "D/ST",
    DL = "DL",
    LB = "LB",
    DB = "DB",
}

function getPosition(eligibleSlots: number[]): POSITION {
    if (eligibleSlots[0] === 0) {
        return POSITION.QB;
    } else if (eligibleSlots[0] === 2) {
        return POSITION.RB;
    } else if (eligibleSlots[0] === 3) {
        return POSITION.WR;
    } else if (eligibleSlots[0] === 16) {
        return POSITION.D_ST;
    } else if (eligibleSlots[0] === 17) {
        return POSITION.K;
    } else if (eligibleSlots[0] === 5) {
        return POSITION.TE;
    }
}

function getLineupSlot(lineupSlotID: number): string {
    if (lineupSlotID === 0) {
        return "QB";
    } else if (lineupSlotID == 2) {
        return "RB";
    } else if (lineupSlotID == 23) {
        return "FLEX";
    } else if (lineupSlotID == 20) {
        return "BENCH";
    } else if (lineupSlotID == 21) {
        return "IR";
    } else if (lineupSlotID == 4) {
        return "WR";
    } else if (lineupSlotID == 16) {
        return "D/ST";
    } else if (lineupSlotID == 17) {
        return "K";
    } else if (lineupSlotID == 6) {
        return "TE";
    }
}

function includesPlayer(player: Player, lineup: Player[]): boolean {
    var includes = false;
    lineup.forEach((element) => {
        if (player.playerID == element.playerID) {
            includes = true;
        }
    });
    return includes;
}

function calcStandardDeviation (scores: number[]): number {
    var modified = [];
    var mean = getMean(scores);
    scores.forEach((score) =>{
        modified.push(Math.pow(score - mean, 2));
    });

    return roundToHundred(Math.sqrt(getMean(modified)));
}

function getMean(numbers: number[]): number {
    var sum = 0;
    numbers.forEach(num => {
        sum += num;
    });

    return roundToHundred(sum/numbers.length);
}

function getBestLeastConsistent(league: League, teamID: number): SeasonPlayer[] {
    var players = getSeasonPlayers(league, teamID);
    var mvp = players[0];
    var lvp = players[0];
    var mostConsistent = players[0];
    players.forEach((seasonPlayer) => {
        if (seasonPlayer.seasonScore > mvp.seasonScore) {
            mvp = seasonPlayer;
        }

        if (seasonPlayer.seasonScore < lvp.seasonScore) {
            lvp = seasonPlayer;
        }

        if (calcStandardDeviation(seasonPlayer.getScores()) < calcStandardDeviation(mostConsistent.getScores()) &&
        seasonPlayer.weeksPlayed > 5 && seasonPlayer.seasonScore != 0) {
            mostConsistent = seasonPlayer;
        }
    });

    return [mvp, lvp, mostConsistent];
}

function getMVP(league: League, teamID: number): SeasonPlayer {
    var players = getSeasonPlayers(league, teamID);
    var mvp = players[0];
    players.forEach((seasonPlayer) => {
        if (seasonPlayer.seasonScore > mvp.seasonScore) {
            mvp = seasonPlayer;
        }
    });

    return mvp;
}

function getLVP(league: League, teamID: number): SeasonPlayer {
    var players = getSeasonPlayers(league, teamID);
    var lvp = players[0];
    players.forEach((seasonPlayer) => {
        if (seasonPlayer.seasonScore < lvp.seasonScore) {
            lvp = seasonPlayer;
        }
    });

    return lvp;
}

function getSeasonPlayers(league: League, teamID: number): SeasonPlayer[] {
    var players = [];
    league.getSeasonPortionWeeks().forEach((week) => {
        week.getTeam(teamID).lineup.forEach((player) => {
            var index = players.findIndex((existingPlayer) => 
                existingPlayer.playerID == player.playerID
            );
            if (index > -1) {
                players[index].addPerformance(player);
                } else {
                    players.push(new SeasonPlayer(player));
            }
        });
    });

    return players;
}

//Params: Int, team ID
//Returns: String, Team Abbreviation
function getRealTeamInitials(realteamID) {
    var team;
    //console.log(realteamID);
    switch (realteamID) {
        case 1:
            team = "Atl";
            break;
        case 2:
            team = "Buf";
            break;
        case 3:
            team = "Chi";
            break;
        case 4:
            team = "Cin";
            break;
        case 5:
            team = "Cle";
            break;
        case 6:
            team = "Dal";
            break;
        case 7:
            team = "Den";
            break;
        case 8:
            team = "Det";
            break;
        case 9:
            team = "GB";
            break;
        case 10:
            team = "Ten";
            break;
        case 11:
            team = "Ind";
            break;
        case 12:
            team = "KC";
            break;
        case 13:
            team = "Oak";
            break;
        case 14:
            team = "Lar";
            break;
        case 15:
            team = "Mia";
            break;
        case 16:
            team = "Min";
            break;
        case 17:
            team = "NE";
            break;
        case 18:
            team = "NO";
            break;
        case 19:
            team = "NYG";
            break;
        case 20:
            team = "NYJ";
            break;
        case 21:
            team = "Phi";
            break;
        case 22:
            team = "Ari";
            break;
        case 23:
            team = "Pit";
            break;
        case 24:
            team = "LAC";
            break;
        case 25:
            team = "SF";
            break;
        case 26:
            team = "Sea";
            break;
        case 27:
            team = "TB";
            break;
        case 28:
            team = "Wsh";
            break;
        case 29:
            team = "Car";
            break;
        case 30:
            team = "Jax";
            break;
        case 33:
            team = "Bal";
            break;
        case 34:
            team = "Hou";
            break;
    }
    return team;
}