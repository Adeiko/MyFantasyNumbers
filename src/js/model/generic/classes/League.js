var League = (function () {
    function League(id, season, weeks, members, settings, leagueName, leaguePlatform) {
        this.id = id;
        this.weeks = weeks;
        this.season = season;
        this.members = members;
        this.settings = settings;
        this.seasonPortion = SEASON_PORTION.REGULAR;
        this.leagueName = leagueName;
        this.leaguePlatform = leaguePlatform;
    }
    League.convertESPNFromJson = function (object) {
        var members = [];
        var weeks = [];
        var jsonSettings = object.settings;
        var settings = new Settings(jsonSettings.activeLineupSlots, jsonSettings.lineupSlots, jsonSettings.regularSeasonLength, jsonSettings.playoffLength, jsonSettings.draftType, jsonSettings.currentMatchupPeriod, jsonSettings.isActive, jsonSettings.yearsActive);
        object.weeks.forEach(function (week) {
            var matchups = [];
            week.matchups.forEach(function (matchup) {
                var homeRoster = [];
                matchup.home.IR.concat(matchup.home.bench, matchup.home.lineup).forEach(function (player) {
                    homeRoster.push(new ESPNPlayer(player.firstName, player.lastName, player.score, player.projectedScore, player.position, player.realTeamID, player.playerID, player.lineupSlotID, player.eligibleSlots, player.weekNumber));
                });
                var awayTeamId = -1;
                var away;
                if (!matchup.byeWeek) {
                    var awayRoster_1 = [];
                    awayTeamId = matchup.away.teamID;
                    matchup.away.IR.concat(matchup.away.bench, matchup.away.lineup).forEach(function (player) {
                        awayRoster_1.push(new ESPNPlayer(player.firstName, player.lastName, player.score, player.projectedScore, player.position, player.realTeamID, player.playerID, player.lineupSlotID, player.eligibleSlots, player.weekNumber));
                    });
                    away = new ESPNTeam(matchup.away.teamID, awayRoster_1, object.settings.activeLineupSlots, matchup.home.teamID);
                }
                var home = new ESPNTeam(matchup.home.teamID, homeRoster, object.settings.activeLineupSlots, awayTeamId);
                var recreatedMatchup = new Matchup(home, away, week.weekNumber, week.isPlayoffs);
                recreatedMatchup.setPoorLineupDecisions();
                matchups.push(recreatedMatchup);
            });
            weeks.push(new Week(week.weekNumber, week.isPlayoffs, matchups));
        });
        object.members.forEach(function (member) {
            members.push(new ESPNMember(member.memberID, member.firstName, member.lastName, member.teamLocation, member.teamNickname, member.teamAbbrev, member.division, member.teamID, member.logoURL, member.transactions, new Stats(member.stats.finalStanding)));
        });
        var league = new League(object.id, object.season, weeks, members, settings, object.leagueName, object.leaguePlatform);
        league.setMemberStats(league.getSeasonPortionWeeks());
        league.setPowerRanks();
        return league;
    };
    League.prototype.setPowerRanks = function () {
        var _this = this;
        this.weeklyPowerRanks = new Map();
        this.getSeasonPortionWeeks().forEach(function (week) {
            _this.addPowerWeek(week);
        });
    };
    League.prototype.addPowerWeek = function (week) {
        var weeklyPowerRanks = new WeeklyPowerRanks(week.weekNumber, week.isPlayoffs);
        week.matchups.forEach(function (matchup) {
            weeklyPowerRanks.addMatchup(matchup);
        });
        weeklyPowerRanks.setRanks();
        this.weeklyPowerRanks.set(week.weekNumber, weeklyPowerRanks);
    };
    League.prototype.setMemberStats = function (weeks) {
        var _this = this;
        weeks.forEach(function (week) {
            var weekMatches = [];
            week.matchups.forEach(function (matchup) {
                if (matchup.byeWeek !== true) {
                    if (matchup.isTie !== true) {
                        _this.getMember(matchup.winner).stats.wins += 1;
                        _this.getMember(matchup.getOpponent(matchup.winner).teamID).stats.losses += 1;
                    }
                    else {
                        _this.getMember(matchup.home.teamID).stats.ties += 1;
                        _this.getMember(matchup.away.teamID).stats.ties += 1;
                    }
                    _this.getMember(matchup.home.teamID).stats.pa += matchup.away.score;
                    _this.getMember(matchup.away.teamID).stats.pa += matchup.home.score;
                    weekMatches.push(matchup.home);
                    weekMatches.push(matchup.away);
                }
                else {
                    weekMatches.push(matchup.home);
                }
            });
            weekMatches.sort(function (x, y) {
                if (x.score < y.score) {
                    return -1;
                }
                if (x.score > y.score) {
                    return 1;
                }
                return 0;
            });
            for (var i = 0; i < weekMatches.length; i++) {
                var curMember = _this.getMember(weekMatches[i].teamID);
                var curMemberTeam = weekMatches[i];
                curMember.stats.gutPlayersPlayed += curMemberTeam.gutPlayers;
                curMember.stats.gutPoints += curMemberTeam.gutDifference;
                curMember.stats.pf += curMemberTeam.score;
                curMember.stats.pp += curMemberTeam.potentialPoints;
                curMember.stats.powerWins += i;
                curMember.stats.powerLosses += (weekMatches.length - 1 - i);
            }
            weekMatches.sort(function (x, y) {
                if (x.potentialPoints < y.potentialPoints) {
                    return -1;
                }
                if (x.potentialPoints > y.potentialPoints) {
                    return 1;
                }
                return 0;
            });
            for (var i = 0; i < weekMatches.length; i++) {
                var curMember = _this.getMember(weekMatches[i].teamID);
                curMember.stats.potentialPowerWins += i;
                curMember.stats.potentialPowerLosses += (weekMatches.length - 1 - i);
            }
        });
        this.members.forEach(function (member) {
            member.setAdvancedStats(weeks);
            member.stats.rank = _this.getRank(member.teamID);
            member.stats.roundStats();
            member.stats.choicesThatCouldHaveWonMatchup = _this.getLosingDecisionAmount(member.teamID);
            member.stats.gameLostDueToSingleChoice = _this.getGamesLostDueToSingleChoice(member.teamID);
            member.stats.powerRank = _this.getPowerRankFinish(member.teamID);
            _this.setAverageMargins(member.teamID);
        });
    };
    League.prototype.resetStats = function () {
        this.members.forEach(function (member) {
            member.stats = new Stats(member.stats.finalStanding);
        });
    };
    League.prototype.getLeaguePF = function () {
        var pf = 0;
        this.members.forEach(function (member) {
            pf += member.stats.pf;
        });
        return roundToHundred(pf / this.members.length);
    };
    League.prototype.getLeaguePA = function () {
        var pa = 0;
        this.members.forEach(function (member) {
            pa += member.stats.pa;
        });
        return roundToHundred(pa / this.members.length);
    };
    League.prototype.getLeaguePP = function () {
        var pp = 0;
        this.members.forEach(function (member) {
            pp += member.stats.pp;
        });
        return roundToHundred(pp / this.members.length);
    };
    League.prototype.getSeasonPortionWeeks = function () {
        var _this = this;
        var weekPortion = this.weeks;
        if (this.seasonPortion === SEASON_PORTION.REGULAR) {
            weekPortion = this.weeks.filter(function (it) {
                return it.isPlayoffs === false && it.weekNumber <= _this.settings.currentMatchupPeriod;
            });
        }
        else if (this.seasonPortion === SEASON_PORTION.POST) {
            weekPortion = this.weeks.filter(function (it) {
                return it.isPlayoffs === true && it.weekNumber <= _this.settings.currentMatchupPeriod;
            });
        }
        return weekPortion;
    };
    League.prototype.getMember = function (teamID) {
        var found;
        this.members.forEach(function (member) {
            if (teamID === member.teamID) {
                found = member;
            }
        });
        return found;
    };
    League.prototype.getMemberWorstTeam = function (teamID) {
        var lowestScore = this.getSeasonPortionWeeks()[0].getTeam(teamID).score;
        var worstTeam = this.getSeasonPortionWeeks()[0].getTeam(teamID);
        this.getSeasonPortionWeeks().forEach(function (week) {
            if (week.getTeam(teamID).score < lowestScore) {
                lowestScore = week.getTeam(teamID).score;
                worstTeam = week.getTeam(teamID);
            }
        });
        return worstTeam;
    };
    League.prototype.getBiggestBoom = function (teamID) {
        var boomPlayer = this.getSeasonPortionWeeks()[0].getTeam(teamID).lineup[0];
        this.getSeasonPortionWeeks().forEach(function (week) {
            week.getTeam(teamID).lineup.forEach(function (player) {
                if (player.score > boomPlayer.score) {
                    boomPlayer = player;
                }
            });
        });
        return boomPlayer;
    };
    League.prototype.getMemberBestTeam = function (teamID) {
        var highestScore = this.getSeasonPortionWeeks()[0].getTeam(teamID).score;
        var bestTeam = this.getSeasonPortionWeeks()[0].getTeam(teamID);
        this.getSeasonPortionWeeks().forEach(function (week) {
            if (week.getTeam(teamID).score > highestScore) {
                highestScore = week.getTeam(teamID).score;
                bestTeam = week.getTeam(teamID);
            }
        });
        return bestTeam;
    };
    League.prototype.getBestWeekFinish = function (teamID) {
        var _this = this;
        var finish = 1;
        var bestWeekScore = this.getMemberBestTeam(teamID).score;
        this.members.forEach(function (member) {
            if (bestWeekScore < _this.getMemberBestTeam(member.teamID).score && member.teamID !== teamID) {
                finish += 1;
            }
        });
        return finish;
    };
    League.prototype.getWorstWeekFinish = function (teamID) {
        var _this = this;
        var finish = 1;
        var worstWeekScore = this.getMemberWorstTeam(teamID).score;
        this.members.forEach(function (member) {
            if (worstWeekScore > _this.getMemberWorstTeam(member.teamID).score && member.teamID !== teamID) {
                finish += 1;
            }
        });
        return finish;
    };
    League.prototype.getPointsAgainstFinish = function (teamID) {
        var finish = 1;
        var pa = this.getMember(teamID).stats.pa;
        this.members.forEach(function (member) {
            if (pa > member.stats.pa && member.teamID !== teamID) {
                finish += 1;
            }
        });
        return finish;
    };
    League.prototype.getPointsScoredFinish = function (teamID) {
        var finish = 1;
        var pf = this.getMember(teamID).stats.pf;
        this.members.forEach(function (member) {
            if (pf < member.stats.pf && member.teamID !== teamID) {
                finish += 1;
            }
        });
        return finish;
    };
    League.prototype.getPotentialPointsFinish = function (teamID) {
        var finish = 1;
        var pp = this.getMember(teamID).stats.pp;
        this.members.forEach(function (member) {
            if (pp < member.stats.pp && member.teamID !== teamID) {
                finish += 1;
            }
        });
        return finish;
    };
    League.prototype.getBestWeek = function (teamID) {
        var bestWeekMatchup = this.getSeasonPortionWeeks()[0].getTeamMatchup(teamID);
        var highestScore = this.getSeasonPortionWeeks()[0].getTeam(teamID).score;
        this.getSeasonPortionWeeks().forEach(function (week) {
            if (week.getTeam(teamID).score > highestScore) {
                highestScore = week.getTeam(teamID).score;
                bestWeekMatchup = week.getTeamMatchup(teamID);
            }
        });
        return bestWeekMatchup;
    };
    League.prototype.getWorstWeek = function (teamID) {
        var worstWeekMatchup = this.getSeasonPortionWeeks()[0].getTeamMatchup(teamID);
        var lowestScore = this.getSeasonPortionWeeks()[0].getTeam(teamID).score;
        this.getSeasonPortionWeeks().forEach(function (week) {
            if (week.getTeam(teamID).score < lowestScore) {
                lowestScore = week.getTeam(teamID).score;
                worstWeekMatchup = week.getTeamMatchup(teamID);
            }
        });
        return worstWeekMatchup;
    };
    League.prototype.getLargestMarginOfVictory = function () {
        var highestMOV = 0;
        var highestMOVMatchup;
        this.getSeasonPortionWeeks().forEach(function (week) {
            week.matchups.forEach(function (matchup) {
                if (matchup.marginOfVictory > highestMOV && !matchup.byeWeek) {
                    highestMOV = matchup.marginOfVictory;
                    highestMOVMatchup = matchup;
                }
            });
        });
        return highestMOVMatchup;
    };
    League.prototype.getSmallestMarginOfVictory = function () {
        var smallestMOV = this.getSeasonPortionWeeks()[0].matchups[0].marginOfVictory;
        var smallestMOVMatchup;
        this.getSeasonPortionWeeks().forEach(function (week) {
            week.matchups.forEach(function (matchup) {
                if (matchup.marginOfVictory < smallestMOV && !matchup.byeWeek) {
                    smallestMOV = matchup.marginOfVictory;
                    smallestMOVMatchup = matchup;
                }
            });
        });
        return smallestMOVMatchup;
    };
    League.prototype.getLeagueWeeklyAverage = function () {
        var scores = [];
        this.getSeasonPortionWeeks().forEach(function (week) {
            week.matchups.forEach(function (matchup) {
                scores.push(matchup.home.score);
                if (!matchup.byeWeek) {
                    scores.push(matchup.away.score);
                }
            });
        });
        return getMean(scores);
    };
    League.prototype.getLeagueStandardDeviation = function () {
        var scores = [];
        this.getSeasonPortionWeeks().forEach(function (week) {
            week.matchups.forEach(function (matchup) {
                scores.push(matchup.home.score);
                if (!matchup.byeWeek) {
                    scores.push(matchup.away.score);
                }
            });
        });
        return calcStandardDeviation(scores);
    };
    League.prototype.getStandardDeviationFinish = function (teamID) {
        var finish = 1;
        var std = this.getMember(teamID).stats.standardDeviation;
        this.members.forEach(function (member) {
            if (std > member.stats.standardDeviation && member.teamID !== teamID) {
                finish += 1;
            }
        });
        return finish;
    };
    League.prototype.getOverallBestWeek = function () {
        var bestWeekMatchup;
        var highestScore = 0;
        this.getSeasonPortionWeeks().forEach(function (week) {
            week.matchups.forEach(function (matchup) {
                if (matchup.home.score > highestScore) {
                    bestWeekMatchup = matchup;
                    highestScore = matchup.home.score;
                }
                else if (!matchup.byeWeek) {
                    if (matchup.away.score > highestScore) {
                        bestWeekMatchup = matchup;
                        highestScore = matchup.away.score;
                    }
                }
            });
        });
        return bestWeekMatchup;
    };
    League.prototype.getTeamAveragePointsPerPosition = function (teamID) {
        var _this = this;
        var allPlayers = getSeasonPlayers(this, teamID);
        var positions = this.settings.getPositions();
        var scoreDict = new Map();
        var timesPlayedDict = new Map();
        var scores = [];
        positions.forEach(function (position) {
            scoreDict.set(position, 0);
            timesPlayedDict.set(position, 0);
        });
        allPlayers.forEach(function (player) {
            scoreDict.set(player.position, player.seasonScore + scoreDict.get(player.position));
            timesPlayedDict.set(player.position, player.weeksPlayed + timesPlayedDict.get(player.position));
        });
        positions.forEach(function (position) {
            scores.push(roundToHundred(scoreDict.get(position) / timesPlayedDict.get(position) / getBestPositionPlayerAverageScore(_this, position)));
        });
        return scores;
    };
    League.prototype.getLeaguePointsPerPosition = function () {
        var _this = this;
        var allPlayers = getAllSeasonPlayers(this);
        var positions = this.settings.getPositions();
        var scoreDict = new Map();
        var scores = [];
        positions.forEach(function (position) {
            scoreDict.set(position, 0);
        });
        allPlayers.forEach(function (player) {
            scoreDict.set(player.position, player.seasonScore + scoreDict.get(player.position));
        });
        positions.forEach(function (position) {
            scores.push(roundToHundred(scoreDict.get(position) / _this.members.length));
        });
        return scores;
    };
    League.prototype.getMemberTotalPointsPerPosition = function (teamID) {
        var allPlayers = getSeasonPlayers(this, teamID);
        var positions = this.settings.getPositions();
        var scoreDict = new Map();
        var scores = [];
        positions.forEach(function (position) {
            scoreDict.set(position, 0);
        });
        allPlayers.forEach(function (player) {
            scoreDict.set(player.position, player.seasonScore + scoreDict.get(player.position));
        });
        positions.forEach(function (position) {
            scores.push(roundToHundred(scoreDict.get(position)));
        });
        return scores;
    };
    League.prototype.getAverageEfficiency = function () {
        var totalEfficiency = 0.00;
        this.members.forEach(function (member) {
            totalEfficiency += member.stats.getEfficiency();
        });
        return totalEfficiency / this.members.length;
    };
    League.prototype.getEfficiencyFinish = function (teamID) {
        var finish = 1;
        var efficiency = this.getMember(teamID).stats.getEfficiency();
        this.members.forEach(function (member) {
            if (efficiency < member.stats.getEfficiency() && member.teamID !== teamID) {
                finish += 1;
            }
        });
        return finish;
    };
    League.prototype.getMemberOpponentTotalPointsPerPosition = function (teamID) {
        var allPlayers = getSeasonOpponentPlayers(this, teamID);
        var positions = this.settings.getPositions();
        var scoreDict = new Map();
        var scores = [];
        positions.forEach(function (position) {
            scoreDict.set(position, 0);
        });
        allPlayers.forEach(function (player) {
            scoreDict.set(player.position, player.seasonScore + scoreDict.get(player.position));
        });
        positions.forEach(function (position) {
            scores.push(roundToHundred(scoreDict.get(position)));
        });
        return scores;
    };
    League.prototype.getLeagueAveragePointsPerPosition = function () {
        var _this = this;
        var allPlayers = getAllSeasonPlayers(this);
        var positions = this.settings.getPositions();
        var scoreDict = new Map();
        var timesPlayedDict = new Map();
        var scores = [];
        positions.forEach(function (position) {
            scoreDict.set(position, 0);
            timesPlayedDict.set(position, 0);
        });
        allPlayers.forEach(function (player) {
            scoreDict.set(player.position, player.seasonScore + scoreDict.get(player.position));
            timesPlayedDict.set(player.position, player.weeksPlayed + timesPlayedDict.get(player.position));
        });
        positions.forEach(function (position) {
            scores.push(roundToHundred(scoreDict.get(position) / timesPlayedDict.get(position) / getBestPositionPlayerAverageScore(_this, position)));
        });
        return scores;
    };
    League.prototype.getLosingDecisionAmount = function (teamID) {
        var totalLosingDecisions = 0;
        this.getSeasonPortionWeeks().forEach(function (week) {
            var matchup = week.getTeamMatchup(teamID);
            if (matchup.winner !== teamID && !matchup.byeWeek) {
                totalLosingDecisions += matchup.loserPotentialWinningSingleMoves;
            }
        });
        return totalLosingDecisions;
    };
    League.prototype.getGamesLostDueToSingleChoice = function (teamID) {
        var winnableLosses = 0;
        this.getSeasonPortionWeeks().forEach(function (week) {
            var matchup = week.getTeamMatchup(teamID);
            if (matchup.winner !== teamID && !matchup.byeWeek && matchup.withinSingleMoveOfWinning) {
                winnableLosses += 1;
            }
        });
        return winnableLosses;
    };
    League.prototype.getPowerRankFinish = function (teamID) {
        var finish = 1;
        var wins = this.getMember(teamID).stats.powerWins;
        this.members.forEach(function (member) {
            if (wins < member.stats.powerWins && member.teamID !== teamID) {
                finish += 1;
            }
        });
        return finish;
    };
    League.prototype.getRank = function (teamID) {
        var finish = 1;
        var winPct = this.getMember(teamID).stats.getWinPct();
        var pf = this.getMember(teamID).stats.pf;
        this.members.forEach(function (member) {
            if (winPct === member.stats.getWinPct() && member.teamID !== teamID) {
                if (pf < member.stats.pf) {
                    finish += 1;
                }
            }
            else if (winPct < member.stats.getWinPct() && member.teamID !== teamID) {
                finish += 1;
            }
        });
        return finish;
    };
    League.prototype.getGutAverageFinish = function (teamID) {
        var _this = this;
        var finish = 1;
        var gutAvg = this.getMember(teamID).stats.gutPoints / this.getMember(teamID).stats.gutPlayersPlayed;
        this.members.forEach(function (member) {
            if (gutAvg < (member.stats.gutPoints / _this.getMember(teamID).stats.gutPlayersPlayed) && member.teamID !== teamID) {
                finish += 1;
            }
        });
        return finish;
    };
    League.prototype.getPowerRankDiffFinish = function (teamID) {
        var finish = 1;
        var pwrRankDiff = this.getMember(teamID).stats.rank - this.getMember(teamID).stats.powerRank;
        this.members.forEach(function (member) {
            if (pwrRankDiff < (member.stats.rank - member.stats.powerRank) && member.teamID !== teamID) {
                finish += 1;
            }
        });
        return finish;
    };
    League.prototype.setAverageMargins = function (teamID) {
        var member = this.getMember(teamID);
        this.getSeasonPortionWeeks().forEach(function (week) {
            var matchup = week.getTeamMatchup(teamID);
            if (!matchup.byeWeek) {
                if (matchup.getWinningTeam().teamID === teamID) {
                    member.stats.averageMOV += matchup.marginOfVictory;
                }
                else if (matchup.getWinningTeam().teamID !== teamID) {
                    member.stats.averageMOD += matchup.marginOfVictory;
                }
            }
        });
        if (member.stats.wins !== 0) {
            member.stats.averageMOV = roundToHundred(member.stats.averageMOV / member.stats.wins);
        }
        if (member.stats.losses !== 0) {
            member.stats.averageMOD = roundToHundred(member.stats.averageMOD / member.stats.losses);
        }
    };
    League.prototype.getMarginFinish = function (teamID, weekNumber) {
        var finish = 1;
        var week = this.weeks[weekNumber - 1];
        var teamMatchup = week.getTeamMatchup(teamID);
        var margin = teamMatchup.getTeam(teamID).score - teamMatchup.getOpponent(teamID).score;
        if (margin < 0) {
            finish += 1;
        }
        week.matchups.filter(function (it) { return !it.byeWeek; }).forEach(function (matchup) {
            if (matchup.home.teamID !== teamID && matchup.away.teamID !== teamID) {
                var homeMargin = matchup.home.score - matchup.away.score;
                var awayMargin = matchup.away.score - matchup.home.score;
                if (awayMargin > margin && homeMargin > margin) {
                    finish += 2;
                }
                else if (awayMargin > margin || homeMargin > margin) {
                    finish += 1;
                }
            }
        });
        return finish;
    };
    League.prototype.getUpsets = function (teamID) {
        var upsetCount = 0;
        var underdogCount = 0;
        this.getSeasonPortionWeeks().forEach(function (week) {
            var match = week.getTeamMatchup(teamID);
            if (!match.byeWeek) {
                if (match.getWinningTeam().teamID === teamID && match.isUpset) {
                    upsetCount += 1;
                    underdogCount += 1;
                }
                else if (match.getWinningTeam().teamID !== teamID && !match.isUpset) {
                    underdogCount += 1;
                }
            }
        });
        return [underdogCount, upsetCount];
    };
    return League;
}());
//# sourceMappingURL=League.js.map