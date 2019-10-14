class SeasonPlayer {
    public firstName: string;
    public lastName: string;
    public eligibleSlots: any;
    public seasonScore: number;
    public projectedSeasonScore: number;
    public position: any;
    public realTeamID: number;
    public playerID: number;
    public weeksPlayed: number;
    public averageScore: number;
    public scores: [[number, number]];
    public pictureURL: string;
    public pictureID: number;
    constructor(player: Player, platform: PLATFORM) {
        this.firstName = player.firstName;
        this.lastName = player.lastName;
        this.eligibleSlots = player.eligibleSlots;
        this.seasonScore = player.score;
        this.projectedSeasonScore = player.projectedScore;
        this.position = player.position;
        this.realTeamID = player.realTeamID;
        this.playerID = player.playerID;
        this.weeksPlayed = 1;
        this.averageScore = player.score;
        this.scores = [[player.score, player.weekNumber]];
        if (platform == PLATFORM.SLEEPER) {
            this.pictureID = (player as Sleeper_Player).espnID;
        } else {
            this.pictureID = player.playerID;
        }
        this.setPictureURL();
    }

    public addPerformance(player: Player) {
        this.weeksPlayed += 1;
        this.seasonScore += player.score;
        this.projectedSeasonScore += player.projectedScore;
        this.averageScore = roundToHundred(this.seasonScore / this.weeksPlayed);
        this.scores.push([player.score, player.weekNumber]);
    }

    public getScores(): number[] {
        var points = [];
        this.scores.forEach(tup => {
            points.push(tup[0]);
        });

        return points;
    }


    public isEligible(slot: number): boolean {
        var isEligible = false;
        this.eligibleSlots.forEach((eligibleSlot) => {
            if (eligibleSlot == slot) {
                isEligible = true;
            }
        });
        return isEligible;
    }

    public setPictureURL(): void {
        if (this.position == "D/ST" || this.position == "DEF") {
            this.pictureURL = "http://a.espncdn.com/combiner/i?img=/i/teamlogos/NFL/500/" + getRealTeamInitials(this.realTeamID) + ".png&h=150&w=150";
        } else {
            this.pictureURL = "http://a.espncdn.com/i/headshots/nfl/players/full/" + this.pictureID + ".png";
        }
    }
}
