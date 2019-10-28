function getOptimalLineup(activeLineupSlots: number[], players: Player[]): Player[] {
    let optimalLineup = [];
    activeLineupSlots.forEach((slot) => {
        optimalLineup = optimalLineup.concat(getHighestPlayersForSlot(slot[0], slot[1], players, optimalLineup));
    });
    return optimalLineup;
}

function getHighestPlayersForSlot(slotID: number, numPlayers: number, players: Player[], takenPlayers: Player[]): Player[] {
    // Filter players who have already been included or who are not eligible for the slot or who have scored less than 0 since an empty slot would be a better play
    const eligibleSortedPlayers = players.filter((player) => {
        return (player.eligibleSlots.includes(slotID) && !takenPlayers.includes(player));
    }).sort((a, b) => {
        return b.score - a.score;
    });
    if (eligibleSortedPlayers.length >= numPlayers) {
        return eligibleSortedPlayers.slice(0, numPlayers);
    } else {
        while (eligibleSortedPlayers.length <= numPlayers) {
            eligibleSortedPlayers.push(new EmptySlot(slotID));
        }
        return eligibleSortedPlayers.slice(0, numPlayers);
    }
}

function getOptimalProjectedLineup(activeLineupSlots: number[], players: Player[]): Player[] {
    let optimalLineup = [];
    activeLineupSlots.forEach((slot) => {
        optimalLineup = optimalLineup.concat(getHighestProjectedPlayersForSlot(slot[0], slot[1], players, optimalLineup));
    });
    return optimalLineup;
}

function getHighestProjectedPlayersForSlot(slotID: number, numPlayers: number, players: Player[], takenPlayers: Player[]): Player[] {
    // Filter players who have already been included or who are not eligible for the slot or who have scored less than 0 since an empty slot would be a better play
    const eligibleSortedPlayers = players.filter((player) => {
        return (player.eligibleSlots.includes(slotID) && !takenPlayers.includes(player));
    }).sort((a, b) => {
        return b.projectedScore - a.projectedScore;
    });
    if (eligibleSortedPlayers.length >= numPlayers) {
        return eligibleSortedPlayers.slice(0, numPlayers);
    } else {
        while (eligibleSortedPlayers.length <= numPlayers) {
            eligibleSortedPlayers.push(new EmptySlot(slotID));
        }
        return eligibleSortedPlayers.slice(0, numPlayers);
    }
}
