class Sleeper_Player implements Player {
    firstName: string;
    lastName: string;
    eligibleSlots: any;
    score: any;
    projectedScore: any;
    position: any;
    realTeamID: any;
    playerID: any;
    weekNumber: any;
    lineupSlotID: any;

    constructor(playerID: string, weekNumber: number) {
        this.playerID = playerID;
        this.score = 0;
        this.projectedScore = 0;
        this.weekNumber = weekNumber;
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
}