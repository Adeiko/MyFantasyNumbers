class EmptySlot {
    public firstName: string;
    public lastName: string;
    public actualScore: number;
    public projectedScore: number;
    public position: string;
    public realTeamID: number;
    public jerseyNumber: number;
    public playerID: number;
    constructor() {
        this.firstName = "Empty";
        this.lastName = "Slot";
        this.actualScore = 0;
        this.projectedScore = 0;
        this.position = "EMPTY";
        this.realTeamID = -1;
        this.jerseyNumber = -1;
        this.playerID = -1;
    }
}
