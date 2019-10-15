class SleeperTeam implements Team {
    public lineup: SleeperPlayer[];
    public bench: SleeperPlayer[];
    public IR: SleeperPlayer[];
    public matchupID: number;
    public teamID: number;
    public score: number;
    public potentialPoints: number;
    public projectedScore: number;
    public opponentID: number;
    public gutDifference: number;
    public gutPlayers: number;
    constructor(lineup: string[], totalRoster: string[], score: number, matchupID: number, rosterID: number, opponentID: number, weekNumber, activeLineupSlots, lineupOrder: string[]) {
        this.lineup = lineup.map((playerID, index) => {
            return new SleeperPlayer(playerID, weekNumber, positionToInt.get(lineupOrder[index]));
        });
        this.bench = totalRoster.filter((element) => {
            return !lineup.includes(element);
        }).map((playerID) => {
            return new SleeperPlayer(playerID, weekNumber, positionToInt.get("BN"));
        });
        this.IR = [];
        this.opponentID = opponentID;
        this.teamID = rosterID;
        this.score = score;
        this.matchupID = matchupID;
    }

    public getOptimalLineup(activeLineupSlots: number[]): SleeperPlayer[] {
        const rosterSlots = [];
        // tslint:disable-next-line: forin
        for (const i in activeLineupSlots) {
            for (let w = 0; w < activeLineupSlots[i][1]; w++) {
                rosterSlots.push(activeLineupSlots[i][0]);
            }
        }
        const optimalLineup = new Array<SleeperPlayer>();
        // tslint:disable-next-line: forin
        for (const x in rosterSlots) {
            let highScore = 0;
            let bestPlayer = null;
            const eligibleWeekPlayers = [];
            const players = this.lineup.concat(this.bench, this.IR);
            for (const y in players) {
                if (!includesPlayer(players[y], optimalLineup)) {
                    if (players[y].isEligible(rosterSlots[x])) {
                        eligibleWeekPlayers.push(players[y]);
                    }
                }
            }
            for (const z in eligibleWeekPlayers) {
                if (eligibleWeekPlayers[z].score > highScore) {
                    highScore = eligibleWeekPlayers[z].score;
                    bestPlayer = eligibleWeekPlayers[z];
                }
            }

            if (bestPlayer != null) {
                optimalLineup.push(bestPlayer);
                highScore = 0;
            }
        }
        return optimalLineup;
    }

    public getTeamScore(players: SleeperPlayer[]): number {
        let score = 0;
        for (const i in players) {
            if (players[i].score != null && players[i].score !== "undefined") {
                score += players[i].score;
            }
        }
        return score;
    }

    public getProjectedScore(players: SleeperPlayer[]): number {
        let projectedScore = 0;
        for (const i in players) {
            if (players[i].projectedScore != null && players[i].projectedScore !== "undefined") {
                projectedScore += players[i].projectedScore;
            }
        }
        return projectedScore;
    }

    public getMVP(): SleeperPlayer {
        let mvp = this.lineup[0];
        let mvpScore = 0;
        this.lineup.forEach((player) => {
            if (player.score > mvpScore) {
                mvpScore = player.score;
                mvp = player;
            }
        });
        return mvp;
    }

    public getLVP(): SleeperPlayer {
        let lvp = this.lineup[0];
        let lvpScore = this.lineup[0].score;
        this.lineup.forEach((player) => {
            if (player.score > lvpScore) {
                lvpScore = player.score;
                lvp = player;
            }
        });
        return lvp;
    }

    public getPositionalPlayers(position: string): SleeperPlayer[] {
        const players = this.lineup;
        const positionPlayers = [];
        players.forEach((player) => {
            if (player.position === position) {
                positionPlayers.push(player);
            }
        });
        return positionPlayers;
    }

    public getEligibleSlotPlayers(slot: number): SleeperPlayer[] {
        const players = this.lineup.concat(this.bench, this.IR);
        const eligiblePlayers = players.filter((it) => {
            return it.isEligible(slot) === true;
        });

        return eligiblePlayers;
    }

    public getEligibleSlotBenchPlayers(slot: number): SleeperPlayer[] {
        const players = this.bench.concat(this.IR);
        const eligiblePlayers = players.filter((it) => {
            return it.isEligible(slot) === true;
        });

        return eligiblePlayers;
    }

    public getProjectedOptimalLineup(activeLineupSlots: number[]): SleeperPlayer[] {
        const rosterSlots = [];
        // tslint:disable-next-line: forin
        for (const i in activeLineupSlots) {
            for (let w = 0; w < activeLineupSlots[i][1]; w++) {
                rosterSlots.push(activeLineupSlots[i][0]);
            }
        }
        const optimalLineup = new Array<SleeperPlayer>();
        // tslint:disable-next-line: forin
        for (const x in rosterSlots) {
            let highScore = 0;
            let bestPlayer = null;
            const eligibleWeekPlayers = [];
            const players = this.lineup.concat(this.bench, this.IR);
            for (const y in players) {
                if (!includesPlayer(players[y], optimalLineup)) {
                    if (players[y].isEligible(rosterSlots[x])) {
                        eligibleWeekPlayers.push(players[y]);
                    }
                }
            }
            for (const z in eligibleWeekPlayers) {
                if (eligibleWeekPlayers[z].projectedScore > highScore) {
                    highScore = eligibleWeekPlayers[z].projectedScore;
                    bestPlayer = eligibleWeekPlayers[z];
                }
            }

            if (bestPlayer != null) {
                optimalLineup.push(bestPlayer);
                highScore = 0;
            }
        }
        return optimalLineup;
    }

    public getGutPoints(activeLineupSlots: number[]): [number, number] {
        const players = this.getProjectedLinupPlayerDifference(activeLineupSlots);
        const gutPlayers = players[0];
        const satPlayers = players[1];

        const diff = this.getTeamScore(gutPlayers) - this.getTeamScore(satPlayers);
        const playerNum = gutPlayers.length;
        return [diff, playerNum];
    }

    public getProjectedLinupPlayerDifference(activeLineupSlots: number[]): [SleeperPlayer[], SleeperPlayer[]] {
        const gutPlayers = [];
        const satPlayers = [];
        const projectedLineup = this.getProjectedOptimalLineup(activeLineupSlots);
        this.lineup.forEach((player) => {
            if (!includesPlayer(player, projectedLineup)) {
                gutPlayers.push(player);
            }
        });
        projectedLineup.forEach((player) => {
            if (!includesPlayer(player, this.lineup)) {
                satPlayers.push(player);
            }
        });

        return [gutPlayers, satPlayers];
    }

    public setTeamMetrics(activeLineupSlots): void {
        this.potentialPoints = this.getTeamScore(this.getOptimalLineup(activeLineupSlots));
        this.projectedScore = this.getProjectedScore(this.lineup);
        const gutArray = this.getGutPoints(activeLineupSlots);
        this.gutDifference = gutArray[0];
        this.gutPlayers = gutArray[1];
    }
}
