async function getHeroName(id, json_heroes){
    for(const hero of json_heroes){
        if(hero.id == id){
            return hero.localized_name;
        }
    }
}

async function heroList(){
    const url = "https://api.opendota.com/api/heroes";
    try {
        const response = await fetch(url);
        if(!response.ok){
            throw new Error(`Response status: ${response.status}`);
        }
        const jsonHeroes = await response.json();
        return jsonHeroes;

    } catch (error) {
        console.error(error.message);
    }
}

async function getHeroes(jsonMatch, jsonHeroes){
    

    const radiant = [];
    const radiantBan = [];
    const dire = [];
    const direBan = [];

    for(const hero of jsonMatch.picks_bans){
        const heroName = await getHeroName(hero.hero_id, jsonHeroes);
        if(hero.team == 1){
            if(hero.is_pick){
                dire.push(heroName);
            } else {
                direBan.push(heroName);
            }
        } else {
            if(hero.is_pick){
                radiant.push(heroName);
            } else {
                radiantBan.push(heroName);
            }
        }
    }

    return [radiant, radiantBan, dire, direBan];
}

async function getMatch(matchId){
    const url = `https://api.opendota.com/api/matches/${matchId}`;
    try {
        const response = await fetch(url);
        if(!response.ok){
            throw new Error(`Response status: ${response.status}`);
        }
        const json = await response.json();
        return json;

    } catch (error) {
        console.error(error.message);
    }
}

function getLobbyType(typeId) {
    console.log(`=> ${typeId} <=`);
    const lobbyTypes = [
        "Normal",
        "Practice",
        "Tournament",
        "Tutorial",
        "Co-op with Bots",
        "Team Match",
        "Solo Queue",
        "Ranked",
        "1v1 Mid",
        "Battle Cup"
    ];
    return lobbyTypes[typeId] || 'Unknown';
}

async function getMatchesList(playerId, limit = 8){
    const url = `https://api.opendota.com/api/players/${playerId}/matches?limit=${limit}`
    const allHeroList = await heroList();

    try {
        const response = await fetch(url);
        if(!response.ok){
            throw new Error(`Response status: ${response.status}`);
        }
        const json = await response.json();
        console.log("\n-----------------------------------------");
        console.log('HISTORY:');
        console.log("-----------------------------------------");
        for(const match of json){
            const myDate = new Date(match.start_time * 1000); 

            const isRadiant = match.player_slot < 128;  // Слоты игроков 0-127 — Radiant, 128-255 — Dire
            const didWin = (isRadiant && match.radiant_win) || (!isRadiant && !match.radiant_win);
            const result = didWin ? "WIN" : "LOSE";

            console.log(`\n> ${myDate.toDateString()}:${getLobbyType(match.lobby_type)} --- ${result} ${match.match_id}`);

            const myChar = await getHeroName(match.hero_id, allHeroList);
            console.log(`Hero: ${myChar}`)
            console.log(`Kills: ${match.kills}| Deaths: ${match.deaths}| Assists: ${match.assists}|`);

            const heroes = await getHeroes(await getMatch(match.match_id), allHeroList);

            console.log('\nRadiant:');
            console.log(`Pick: ${heroes[0].join(", ")}`);
            if(!heroes[1].length){
                console.log("Ban: \-");
            } else {
                console.log(`Ban: ${heroes[1].join(", ")}`);
            }
            
            console.log('\nDire:');
            console.log(`Pick: ${heroes[2].join(", ")}`);
            if(!heroes[3].length){
                console.log("Ban: \-");
            } else {
                console.log(`Ban: ${heroes[3].join(", ")}`);
            }
        }

    } catch (error) {
        console.error(error.message);
    }
}

async function getProfile(accountId){
    const url = `https://api.opendota.com/api/players/${accountId}`
    const urlwl = `https://api.opendota.com/api/players/${accountId}/wl`
    try {
        const response = await fetch(url);
        const responsewl = await fetch(urlwl);
        if(!response.ok || !responsewl.ok){
            throw new Error(`Response status: ${response.status}`);
        }

        const json = await response.json();
        const jsonwl = await responsewl.json();

        console.log("\n-----------------------------------------");
        console.log('PROFILE:');
        console.log("-----------------------------------------");
        console.log(json.profile.personaname);

        let fullRank = '-';
        if(json.rank_tier){
            const ranks = {
                1: "Herald",
                2: "Guardian",
                3: "Crusader",
                4: "Archon",
                5: "Legend",
                6: "Ancient",
                7: "Divine",
                8: "Immortal"
            }
            const rank = Math.floor(json.rank_tier / 10);
            const subrank = json.rank_tier % 10;
            fullRank = `${ranks[rank]}(${subrank})`;
        }
        console.log(`Rank: ${fullRank}`);

        let winrate = ((jsonwl.win / (jsonwl.win+jsonwl.lose))*100).toFixed(2);
        if (!jsonwl.win || !jsonwl.lose){
            winrate = 0;
        }

        console.log(`Win: ${jsonwl.win} | Lose: ${jsonwl.lose} => ${winrate}%`);

    } catch(error) {
        console.error(error.message);
    }
}

const id = 180758633;

async function main() {
    const readline = require('readline');
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    function askQuestion(query) {
        return new Promise(resolve => rl.question(query, resolve));
    }
    const id  = await askQuestion("Enter your dota ID: ");
    await getProfile(id);
    await getMatchesList(id);

    rl.close();
}
main();



