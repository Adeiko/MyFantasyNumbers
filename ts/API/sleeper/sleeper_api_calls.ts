function getSleeperLeagueSettings(leagueID: string, seasonID: number) {
    sleeper_request("get", {
        path: "league/" + leagueID.toString()
    }).done((json) => {
        json = json as SleeperLeagueResponse;
        if (json == null) {
            alert("Something went wrong, make sure the leagueID was input correctly and the season you are looking up exists");
            location.reload();
            return;
        }
        const rosters = convertSleeperRoster(json.roster_positions, json.settings.reserve_slots, json.settings.taxi_slots);
        const lineupOrder = json.roster_positions.filter((it) => it !== "BN");
        const leagueName = json.name;
        const leagueAvatar = json.avatar;
        const draftId = json.draft_id;
        const playoffStartWeek = json.settings.playoff_week_start;
        const currentMatchupPeriod = json.settings.leg;
        const previousLeagueId = json.previous_league_id;
        const numDivisions = json.settings.divisions;
        const isActive = (json.status === "in_season");
        const scoringSettings = json.scoring_settings;
        const divisions = [];
        for (let i = 0; i < numDivisions; i++) {
            divisions.push((json.metadata["division_" + (i + 1)], json.metadata["division_" + (i + 1) + "_avatar"]));
        }
        const settings = new Settings(rosters[0], rosters[0].concat(rosters[1]), 16, 16 - playoffStartWeek, "", currentMatchupPeriod, isActive, [seasonID]);
        updateLoadingText("Getting Members");
        getSleeperMembers(leagueID, seasonID, settings, scoringSettings, lineupOrder, leagueName);
    });
}

function getSleeperMembers(leagueID: string, seasonID: number, settings: Settings, scoringSettings: object, lineupOrder: string[], leagueName: string) {
    sleeper_request("get", {
        path: "league/" + leagueID.toString() + "/users"
    }).done((json) => {
        json = json as SleeperUserResponse;
        const members = [];
        json.forEach((member) => {
            const memberName = member.display_name;
            const memberID = member.user_id;
            const teamName = member.metadata.team_name;
            const teamAvatar = member.avatar;
            members.push(new SleeperMember(memberID, memberName, teamName, teamAvatar));
        });
        updateLoadingText("Getting Rosters");
        getSleeperRosters(leagueID, seasonID, members, settings, scoringSettings, lineupOrder, leagueName);
    });
}

function getSleeperRosters(leagueID: string, seasonID: number, members: SleeperMember[], settings: Settings, scoringSettings: object, lineupOrder: string[], leagueName: string) {
    sleeper_request("get", {
        path: "league/" + leagueID.toString() + "/rosters/"
    }).done((json) => {
        json = json as SleeperRosterResponse;
        json.forEach((roster) => {
            const teamID = parseInt(roster.roster_id, 10);
            const wins = roster.settings.wins;
            const totalMoves = roster.settings.totalMoves;
            const rosterOwnerID = roster.owner_id.toString();
            const coOwners = roster.co_owners;
            members.forEach((member) => {
                if (member.memberID === rosterOwnerID) {
                    member.teamID = teamID;
                    member.stats = new Stats(0);
                }
            });
        });
        updateLoadingText("Getting Matchups");
        getSleeperMatchups(leagueID, seasonID, members.filter((member) => member.teamID !== undefined), settings, scoringSettings, lineupOrder, leagueName);
    });
}

function getSleeperMatchups(leagueID: string, seasonID: number, members: SleeperMember[], settings: Settings, scoringSettings: object, lineupOrder: string[], leagueName: string) {
    let weeksToGet;
    if (settings.currentMatchupPeriod < settings.regularSeasonLength + settings.playoffLength) {
        weeksToGet = settings.currentMatchupPeriod - 1;
    } else {
        weeksToGet = settings.regularSeasonLength + settings.playoffLength;
    }
    const promises = [];
    for (let i = 1; i <= weeksToGet; i++) {
        promises.push(makeRequest("https://api.sleeper.app/v1/league/" + leagueID + "/matchups/" + i));
    }
    updateLoadingText("Getting weekly stats");
    let weekCounter = 1;
    const Weeks = [];
    Promise.all(promises).then((weeks) => {
        weeks.forEach((week) => {
            const isPlayoffs = (weekCounter > settings.regularSeasonLength);
            const weekMatches = getSleeperWeekMatchups(week.response, settings.activeLineupSlots, weekCounter, isPlayoffs, lineupOrder);
            Weeks.push(new Week(weekCounter, isPlayoffs, weekMatches));
            weekCounter += 1;
        });

        getSleeperWeekStats(weeksToGet).then((result) => {
            for (let y = 0; y < result.length; y++) {
                (Weeks as Week[])[y].matchups.forEach((matchup) => {
                    matchup.home.lineup.forEach((player) => {
                        (result[y] as SleeperWeekStats).calculatePlayerScore(scoringSettings, player);
                        (result[y] as SleeperWeekStats).calculateProjectedPlayerScore(scoringSettings, player);
                    });
                    matchup.home.bench.forEach((player) => {
                        (result[y] as SleeperWeekStats).calculatePlayerScore(scoringSettings, player);
                        (result[y] as SleeperWeekStats).calculateProjectedPlayerScore(scoringSettings, player);
                    });

                    if (!matchup.byeWeek) {
                        matchup.away.lineup.forEach((player) => {
                            (result[y] as SleeperWeekStats).calculatePlayerScore(scoringSettings, player);
                            (result[y] as SleeperWeekStats).calculateProjectedPlayerScore(scoringSettings, player);
                        });
                        matchup.away.bench.forEach((player) => {
                            (result[y] as SleeperWeekStats).calculatePlayerScore(scoringSettings, player);
                            (result[y] as SleeperWeekStats).calculateProjectedPlayerScore(scoringSettings, player);
                        });
                    }
                });
            }
            assignAllPlayerAttributes(Weeks, settings.activeLineupSlots, settings, leagueID, seasonID, members, leagueName);
        });
    });
}

function getSleeperWeekMatchups(teams: SleeperTeamResponse[], activeLineupSlots, weekNumber: number, isPlayoff: boolean, lineupOrder: string[]): Matchup[] {
    const allTeams = (teams as any).map((team) => {
        return new SleeperTeam(team.starters, team.players, team.points, team.matchup_id, team.roster_id, findOpponent(teams, team.roster_id, team.matchup_id), weekNumber, activeLineupSlots, lineupOrder);
    });
    const matchups = [];
    for (let i = 0; i <= (teams.length / 2); i++) {
        const curTeams = allTeams.filter((team) => {
            return team.matchupID === i;
        });
        if (curTeams.length === 1) {
            matchups.push(new Matchup(curTeams[0], null, weekNumber, isPlayoff));
        }
        if (curTeams.length === 2) {
            matchups.push(new Matchup(curTeams[0], curTeams[1], weekNumber, isPlayoff));
        }
    }
    return matchups;
}

function assignAllPlayerAttributes(weeks: Week[], activeLineupSlots, settings: Settings, leagueID, seasonID, members, leagueName) {
    updateLoadingText("Getting Player Stats");
    makeRequest("js/typescript/player_library.json").then((result) => {
        const lib = (result.response as SleeperPlayerLibraryEntry[]);
        weeks.forEach((week) => {
            week.matchups.forEach((matchup) => {
                matchup.home.lineup.forEach((player) => {
                    assignSleeperPlayerAttributes(player as SleeperPlayer, lib[player.playerID]);
                });
                matchup.home.bench.forEach((player) => {
                    assignSleeperPlayerAttributes(player as SleeperPlayer, lib[player.playerID]);
                });
                matchup.home.IR.forEach((player) => {
                    assignSleeperPlayerAttributes(player as SleeperPlayer, lib[player.playerID]);
                });
                (matchup.home as SleeperTeam).setTeamMetrics(activeLineupSlots);
                if (!matchup.byeWeek) {
                    matchup.away.lineup.forEach((player) => {
                        assignSleeperPlayerAttributes(player, lib[player.playerID]);
                    });
                    matchup.away.bench.forEach((player) => {
                        assignSleeperPlayerAttributes(player, lib[player.playerID]);
                    });
                    matchup.away.IR.forEach((player) => {
                        assignSleeperPlayerAttributes(player, lib[player.playerID]);
                    });
                    (matchup.away as SleeperTeam).setTeamMetrics(activeLineupSlots);
                    matchup.projectedMOV = (Math.abs(matchup.home.projectedScore - matchup.away.projectedScore));
                    matchup.setPoorLineupDecisions();
                }
            });
        });

        const league = new League(leagueID, seasonID, weeks, members, settings, leagueName, PLATFORM.SLEEPER);
        updateLoadingText("Setting Page");
        league.setMemberStats(league.getSeasonPortionWeeks());
        setPage(league);
    });
}
