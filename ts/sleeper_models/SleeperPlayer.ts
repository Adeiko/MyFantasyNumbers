class SleeperPlayer implements Player {
    public firstName: string;
    public lastName: string;
    public eligibleSlots: number[];
    public score: number;
    public projectedScore: number;
    public position: string;
    public realTeamID: string;
    public playerID: string;
    public weekNumber: number;
    public lineupSlotID: number;
    public espnID: string;
    public positions: string[];

    constructor(playerID: string, weekNumber: number, lineupSlotID: number) {
        this.playerID = playerID;
        if (playerID === "OAK") {
            this.playerID = "LV";
        }
        this.score = 0;
        this.projectedScore = 0;
        this.weekNumber = weekNumber;
        if (undefined !== lineupSlotID) {
            this.lineupSlotID = lineupSlotID;
        }
    }

    public isEligible(slot: number): boolean {
        let isEligible = false;
        this.eligibleSlots.forEach((eligibleSlot) => {
            if (eligibleSlot === slot) {
                isEligible = true;
            }
        });
        return isEligible;
    }
}


