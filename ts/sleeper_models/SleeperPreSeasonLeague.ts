class SleeperPreSeasonLeague extends League {
    public id: string;
    public leagueName: string;
    public weeks: Week[];
    public season: number;
    public members: SleeperMember[];
    public trades: SleeperTrade[] = [];
    public settings: SleeperSettings;
    public seasonPortion: SEASON_PORTION;
    public weeklyPowerRanks: Map<number, WeeklyPowerRanks>;
    public leaguePlatform: PLATFORM;

    constructor(weeks: Week[], members: Member[], settings: SleeperSettings) {
        super(weeks, members, settings, PLATFORM.SLEEPER);
    }

    public setPage() {
        console.log(this);
        document.getElementById("league_name_header").innerHTML = this.leagueName;
        enableButtons();
        createTeamMenu(this);
        enablePlugins();
        enableTradePage();
        //enableYearSelector(this);
        createLeagueTradeDiagram(this);
        constructTrades(this);
        generateTradeBlock(this);
        transitionToLeaguePage();
        // createPositionalCheckboxes(this);
    }
}
