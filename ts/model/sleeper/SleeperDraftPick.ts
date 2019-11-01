class SleeperDraftPick {
    public season: number;
    public round: number;
    public currentOwnerId: number;
    public sellingOwnerId: number;
    public associatedRosterId: number;

    constructor(season: number, round: number, currentOwnerId: number, sellingOwnerId: number, associatedRosterId: number) {
        this.season = season;
        this.round = round;
        this.currentOwnerId = currentOwnerId;
        this.sellingOwnerId = sellingOwnerId;
        this.associatedRosterId = associatedRosterId;
    }
}
