class League {
    public id: number;
    public leagueName: string;
    public weeks: Week[];
    public season: number;
    public members: Member[];
    public settings: Settings;
    public seasonPortion: SEASON_PORTION;
    constructor(id, season, weeks, members, settings, leagueName) {
        this.id = id;
        this.weeks = weeks;
        this.season = season;
        this.members = members;
        this.settings = settings; 
        this.seasonPortion = SEASON_PORTION.REGULAR;
        this.leagueName = leagueName;
    }

    public setMemberStats(weeks): void {
        weeks.forEach( (week) => {
            const weekMatches = [];
            week.matchups.forEach((matchup) => {
                if (matchup.byeWeek !== true) {
                    if (matchup.isTie !== true) {
                        this.getMember(matchup.winner).stats.wins += 1;
                        this.getMember(matchup.getOpponent(matchup.winner).teamID).stats.losses += 1;
                    } else {
                        this.getMember(matchup.home.teamID).stats.ties += 1;
                        this.getMember(matchup.away.teamID).stats.ties += 1;
                    }
                    this.getMember(matchup.home.teamID).stats.pa += matchup.away.score;
                    this.getMember(matchup.away.teamID).stats.pa += matchup.home.score;
                    weekMatches.push(matchup.home);
                    weekMatches.push(matchup.away);
                } else {
                    weekMatches.push(matchup.home);
                }
            });
            weekMatches.sort((x: Team, y: Team) => {
                if (x.score < y.score) {
                  return -1;
                }
                if (x.score > y.score) {
                  return 1;
                }
                return 0;
              });

            for (let i = 0; i < weekMatches.length; i++) {
                const curMember: Member = this.getMember(weekMatches[i].teamID);
                const curMemberTeam: Team = weekMatches[i];
                curMember.stats.pf += curMemberTeam.score;
                curMember.stats.pp += curMemberTeam.potentialPoints;
                curMember.stats.powerWins += i;
                curMember.stats.powerLosses += (weekMatches.length - 1 - i);
            }
       });
        this.members.forEach((member) => {
           member.setAdvancedStats(weeks);
       });
    }

    public resetStats(): void {
        this.members.forEach((member) => {
            member.stats = new Stats(member.stats.finalStanding);
        });
    }

    public getSeasonPortionWeeks(): Week[] {
        let weekPortion = this.weeks;
        if (this.seasonPortion === SEASON_PORTION.REGULAR) {
            weekPortion = this.weeks.filter((it) => {
                return it.isPlayoffs === false;
            });
        } else if (this.seasonPortion === SEASON_PORTION.POST) {
            weekPortion = this.weeks.filter((it) => {
                return it.isPlayoffs === true;
            });
        }
        return weekPortion;
    }

    public getMember(teamID: number): Member {
        let found;
        this.members.forEach((member) => {
            if (teamID == member.teamID) {
                found = member;
            }
        });
        return found;
    }

    public getMemberBestWeek(teamID): Team {
        let highScore = 0;
        let highTeam;
        this.weeks.forEach((week) => {
            if (week.getTeam(teamID).score > highScore) {
                highScore = week.getTeam(teamID).score;
                highTeam = week.getTeam(teamID);
            }
        });
        return highTeam;
    }

    public getPointsAgainstFinish(teamID: number): number {
        let finish = 1;
        const pa = this.getMember(teamID).stats.pa;
        this.members.forEach((member) => {
            if (pa > member.stats.pa && member.teamID !== teamID) {
                finish += 1;
            }
        });

        return finish;
    }

    public getPointsScoredFinish(teamID: number): number {
        let finish = 1;
        const pf = this.getMember(teamID).stats.pf;
        this.members.forEach((member) => {
            if (pf < member.stats.pf && member.teamID !== teamID) {
                finish += 1;
            }
        });

        return finish;
    }

    public getPotentialPointsFinish(teamID: number): number {
        let finish = 1;
        const pp = this.getMember(teamID).stats.pp;
        this.members.forEach((member) => {
            if (pp < member.stats.pp && member.teamID !== teamID) {
                finish += 1;
            }
        });

        return finish;
    }

    public getBestWeek(teamID: number): Matchup {
        let bestWeekMatchup = this.weeks[0].getTeamMatchup(teamID);
        let highestScore = this.weeks[0].getTeam(teamID).score;
        this.weeks.forEach((week) => {
            if (week.getTeam(teamID).score > highestScore) {
                highestScore = week.getTeam(teamID).score;
                bestWeekMatchup = week.getTeamMatchup(teamID);
            }
        });

        return bestWeekMatchup;
    }

    public getLargestMarginOfVictory(): Matchup {
        let highestMOV = 0;
        let highestMOVMatchup;
        this.weeks.forEach((week) => {
            week.matchups.forEach((matchup) => {
                if (matchup.marginOfVictory > highestMOV && !matchup.byeWeek) {
                    highestMOV = matchup.marginOfVictory;
                    highestMOVMatchup = matchup;
                }
            });

        });
        return highestMOVMatchup;
    }

    public getSmallestMarginOfVictory(): Matchup {
        let smallestMOV = this.weeks[0].matchups[0].marginOfVictory;
        let smallestMOVMatchup;
        this.weeks.forEach((week) => {
            week.matchups.forEach((matchup) => {
                if (matchup.marginOfVictory < smallestMOV && !matchup.byeWeek) {
                    smallestMOV = matchup.marginOfVictory;
                    smallestMOVMatchup = matchup;
                }
            });

        });
        return smallestMOVMatchup;
    }

    public getLeagueWeeklyAverage(): number {
        var scores = [];
        this.getSeasonPortionWeeks().forEach((week) => {
            week.matchups.forEach((matchup) => {
                scores.push(matchup.home.score);
                if (!matchup.byeWeek) {
                    scores.push(matchup.away.score);
                }
            });
        });

        return getMean(scores);
    }

    public getLeagueStandardDeviation(): number {
        var scores = [];
        this.getSeasonPortionWeeks().forEach((week) => {
            week.matchups.forEach((matchup) => {
                scores.push(matchup.home.score);
                if (!matchup.byeWeek) {
                    scores.push(matchup.away.score);
                }
            });
        });

        return calcStandardDeviation(scores);
    }

    public getOverallBestWeek(): Matchup {
        var bestWeekMatchup;
        var highestScore = 0;
        this.weeks.forEach((week) => {
            week.matchups.forEach(matchup => {
                if (matchup.home.score > highestScore) {
                     bestWeekMatchup = matchup;
                     highestScore = matchup.home.score;
                } else if (!matchup.byeWeek){
                    if (matchup.away.score > highestScore) {
                        bestWeekMatchup = matchup;
                        highestScore = matchup.away.score;
                   }
                }
            });
        });

        return bestWeekMatchup;
    }

    static convertFromJson(object: any) : League {
        var members = [];
        var weeks = [];
        var jsonSettings = object.settings;
        var settings = new Settings(jsonSettings.activeLineupSlots,
             jsonSettings.lineupSlots,
              jsonSettings.regularSeasonLength,
               jsonSettings.playoffLength,
                jsonSettings.draftType);
        object.weeks.forEach(week => {
            var matchups = [];
            week.matchups.forEach(matchup => {
                var homeRoster = [];
                matchup.home.IR.concat(matchup.home.bench, matchup.home.lineup).forEach(player => {
                    homeRoster.push(new Player(player.firstName, player.lastName, 
                        player.score, player.projectedScore, player.position, player.realTeamID, player.playerID, 
                        player.lineupSlotID, player.eligibleSlots, player.weekNumber));
                });
                var away;
                if (!matchup.byeWeek) {
                    var awayRoster = [];
                    matchup.away.IR.concat(matchup.away.bench, matchup.away.lineup).forEach(player => {
                    awayRoster.push(new Player(player.firstName, player.lastName, 
                        player.score, player.projectedScore, player.position, player.realTeamID, player.playerID, 
                        player.lineupSlotID, player.eligibleSlots, player.weekNumber));
                });
                    away = new Team(matchup.away.teamID,
                        awayRoster,
                        object.settings.activeLineupSlots,
                        matchup.away.teamID);
                } else {
                    var awayTeamId = -1;
                }
                var home = new Team(
                    matchup.home.teamID,
                    homeRoster,
                    object.settings.activeLineupSlots,
                    awayTeamId);
                
                matchups.push(new Matchup(home, away, week.weekNumber, week.isPlayoffs));
            });
            weeks.push(new Week(week.weekNumber, week.isPlayoffs, matchups))
        });
        object.members.forEach(member => {
            members.push(new Member(
                member.ID,
                member.firstName,
                member.lastName,
                member.teamLocation,
                member.teamNickname,
                member.teamAbbrev,
                member.division,
                member.teamID,
                member.logoURL,
                member.transactions,
                new Stats(member.stats.finalStanding)
            ));
        });
        var league = new League(object.id, object.season, weeks, members, settings, object.leagueName);
        league.setMemberStats(league.getSeasonPortionWeeks());
        return league;
    }
}
