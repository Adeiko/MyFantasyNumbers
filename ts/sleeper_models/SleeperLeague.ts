class SleeperLeague extends League {
    public id: string;
    public leagueName: string;
    public weeks: Week[];
    public season: number;
    public members: SleeperMember[];
    public trades: SleeperTrade[] = [];
    public settings: Settings;
    public seasonPortion: SEASON_PORTION;
    public weeklyPowerRanks: Map<number, WeeklyPowerRanks>;
    public leaguePlatform: PLATFORM;

    constructor(id: string, season: number, weeks: Week[], members: Member[], settings: Settings, leagueName: string, leaguePlatform: PLATFORM) {
        super(id, season, weeks, members, settings, leagueName, leaguePlatform);
    }

    public setPage() {
        console.log(this);
        super.setPage();
        enableSeasonPortionSelector(this, this.settings.currentMatchupPeriod >= this.settings.regularSeasonLength);
        enableTradePage();
        createLeagueTradeDiagram(this);
        constructTrades(this);
        generateTradeBlock(this);
        transitionToLeaguePage();
    }
}
