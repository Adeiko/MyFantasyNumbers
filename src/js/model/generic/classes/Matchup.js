var Matchup = (function () {
    function Matchup(home, away, weekNumber, isPlayoff) {
        this.home = home;
        this.weekNumber = weekNumber;
        this.isPlayoffs = isPlayoff;
        if (away === undefined || away === null) {
            this.byeWeek = true;
            this.isUpset = false;
            this.isTie = false;
        }
        else {
            this.away = away;
            if (home.projectedScore > away.projectedScore) {
                this.projectedWinner = home.teamID;
            }
            else {
                this.projectedWinner = away.teamID;
            }
            this.projectedMOV = (Math.abs(home.projectedScore - away.projectedScore));
            if (home.score > away.score) {
                this.winner = home.teamID;
            }
            else if (home.score < away.score) {
                this.winner = away.teamID;
            }
            else {
                this.isTie = true;
                this.isUpset = false;
            }
            this.marginOfVictory = (Math.abs(home.score - away.score));
            this.byeWeek = false;
            if (this.projectedWinner !== this.winner) {
                this.isUpset = true;
            }
            else {
                this.isUpset = false;
            }
        }
    }
    Matchup.prototype.getWinningTeam = function () {
        if (this.byeWeek) {
            return null;
        }
        else if (this.home.score > this.away.score) {
            return this.home;
        }
        else {
            return this.away;
        }
    };
    Matchup.prototype.hasTeam = function (teamID) {
        if (this.byeWeek !== true) {
            if (this.home.teamID === teamID || this.away.teamID === teamID) {
                return true;
            }
        }
        else {
            if (this.home.teamID === teamID) {
                return true;
            }
        }
    };
    Matchup.prototype.getTeam = function (teamID) {
        if (this.home.teamID === teamID) {
            return this.home;
        }
        else if (this.away.teamID === teamID) {
            return this.away;
        }
    };
    Matchup.prototype.getOpponent = function (teamID) {
        if (this.home.teamID === teamID && this.byeWeek === false) {
            return this.away;
        }
        else if (this.away.teamID === teamID) {
            return this.home;
        }
        else {
            return null;
        }
    };
    Matchup.prototype.gutHadImpact = function (teamID) {
        var team = this.getTeam(teamID);
        if (this.marginOfVictory > Math.abs(team.gutDifference)) {
            return false;
        }
        else {
            return true;
        }
    };
    Matchup.prototype.setPoorLineupDecisions = function () {
        var _this = this;
        var whiffedChoices = 0;
        var team = this.home;
        if (this.home.score > this.away.score) {
            team = this.away;
        }
        team.lineup.forEach(function (startingPlayer) {
            team.getEligibleSlotBenchPlayers(startingPlayer.lineupSlotID).forEach(function (benchedPlayer) {
                var diff = benchedPlayer.score - startingPlayer.score;
                if (diff > _this.marginOfVictory) {
                    whiffedChoices += 1;
                }
            });
        });
        this.loserPotentialWinningSingleMoves = whiffedChoices;
        if (this.loserPotentialWinningSingleMoves > 0) {
            this.withinSingleMoveOfWinning = true;
        }
        else {
            this.withinSingleMoveOfWinning = false;
        }
    };
    return Matchup;
}());
//# sourceMappingURL=Matchup.js.map