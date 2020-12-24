function main() {
    localStorage.clear();
    const sleeperButton = document.getElementById("platform_input_0") as any;
    const espnButton = document.getElementById("platform_input_1") as any;
    const leagueIDInput = document.getElementById("league_id_input") as HTMLInputElement;
    const seasonIDSelector = document.getElementById("select_year_input") as HTMLSelectElement;

    const leagueID = leagueIDInput.value.replace(/\D/g, "");
    const seasonID = parseInt(seasonIDSelector.value.replace(/\D/g, ""), 10);
    if (leagueID !== undefined && seasonID !== undefined) {
        initCube();
        if (sleeperButton.checked) {
            console.log(seasonID);
            getSleeperLeagueSettings(leagueID, seasonID);
        } else if (espnButton.checked) {
            // if (localStorage.getItem(leagueID + seasonID)) {
            //     const jsonLeague = JSON.parse(localStorage.getItem(leagueID + seasonID));
            //     const restoredLeague = ESPNLeague.convertESPNFromJson(jsonLeague);
            //     restoredLeague.setPage();
            // } else {
                localStorage.clear();
                getESPNSettings(leagueID, seasonID);
            // }
        }
    }
}

function selectedPlatform(button: HTMLButtonElement): void {
    const seasonIDSelector = document.getElementById("select_year_input") as HTMLSelectElement;
    const children = seasonIDSelector.childNodes;
    if (button.value === "espn") {
        children.forEach((option) => {
                (option as HTMLSelectElement).disabled = false;
        });
    } else {
        children.forEach((option) => {
            (option as HTMLSelectElement).disabled = false;
        });
    }
}
