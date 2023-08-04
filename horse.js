let horses = {}; // {horseName: {race: raceNumber, points: pointNumber}}
let races = {}; // {raceNumber: [horses]}
let rawData = []; // store the entire CSV for displaying raw text in the table


function processData() {
    let file = document.getElementById('csvFile').files[0];

    Papa.parse(file, {
        header: true,
        dynamicTyping: true,
        complete: function(results) {
            results.data.forEach(row => {
                rawData = results.data; // store the raw data
                if (!row["RACE"] || !row["HORSE_NAME"]) {
                    return;  // skip this horse if either "RACE" or "HORSE_NAME" is not defined
                }

                let raceNumber = row["RACE"];
                let angles = typeof row["Angles"] === 'string' ? row["Angles"] : null;
                let horseNumber = row["PROGRAM"];
                let pP = !isNaN(row["PP"]) ? parseFloat(row["PP"]) : null;
                let solleyFour = row["Solley4"];
                let top2 = row["Top2"];
                let horseName = row["HORSE_NAME"];
                let mLO = row["AXCIS_ODDS"];
                let power = row["POWER"];
                let hiSpeed = row["HI_SPD_SD"];
                let avgSpeed = row["Avg Sd"];
                let speedL3 = row["SPEED_L3"];
                let pace = row["PACER"];
                let paceAll = row["PACER_ALL"];
                let days = row["DAYS"];

                // Convert "AXCIS_ODDS" from a fraction to a floating point number.
                let mloValue = null;
                if (mLO) {
                    let fraction = mLO.match(/(\d+)\/(\d+)/);
                    if (fraction) {
                        mloValue = parseFloat(fraction[1]) / parseFloat(fraction[2]);
                    }
                }

                let horse = {
                    name: horseName,
                    race: raceNumber, 
                    angles: angles,
                    horseNumber: horseNumber,
                    pP: pP,
                    solleyFour: solleyFour,
                    top2: top2,
                    mLO: mloValue,
                    power: power,
                    hiSpeed: hiSpeed,
                    avgSpeed: avgSpeed,
                    speedL3: speedL3,
                    pace: pace,
                    paceAll: paceAll,
                    days: days,
                    points: 0,
                    mloCheck: 'No' // Initialize mloCheck attribute to 'No'.
                };

                if (!horses[horseName]) {
                    horses[horseName] = horse;
                }

                if (!races[raceNumber]) {
                    races[raceNumber] = [];
                }
                races[raceNumber].push(horse);
            });

            // call the function to check angles per race
            checkAngles();

            // call the function to check top PP
            checkTopPP();

            // Call the function to check top Solley4
            checkTopSolleyFour();

            // Call the function to check top two in Top2
            checkTopTwo();

            // Call the function to check top Power
            checkTopPower();

            // Call the function to check top HiSpeed
            checkTopHiSpeed();

            // Call the function to check top Avg Speed
            checkTopAvgSpeed();

            // Call the function to check top Speed L3
            checkTopSpeedL3();

            // Call the function to check top Early Pace
            checkEarlyPace();

            // Call the function to check top Third Pace
            checkPaceFinal();

            // Call the function to check top Pace All First
            checkPaceAllFirst();

            // Call the function to check top Pace All Second
            checkPaceAllSecond();

            // Call the function to check Days
            checkDays();

            // Call the function to check Last 3 Up
            checkLast3Up();

            // Call the function to check Last 3 Down
            checkLast3Down();

            
            // Call the function to check Speed L3 Delta
            checkSpeedL3Delta();

            // call the function for MLO check
            mloCheck();

            // call the final function
            calculatePoints();
        }
    });
}

function checkAngles() {
    let combinations = ['2r', 'Jt', 'Xm', 'M2', 'O1', 'C4'];
    
    for (let raceNumber in races) {
        let race = races[raceNumber];
        race.forEach(horse => {
            if (horse.angles && typeof horse.angles === 'string') {
                for (let i = 0; i < combinations.length; i++) {
                    if (horse.angles.includes(combinations[i])) {
                        horse.points += 1;
                        console.log(`Horse: ${horse.name}, Race: ${horse.race}, checkAngles(): +1 point`);
                        break; // exit the loop as soon as one match is found
                    }
                }
            }
        });
    }
}


function checkTopPP() {
    for (let raceNumber in races) {
        let race = races[raceNumber].filter(horse => typeof horse.pP === 'number');
        race.sort((a, b) => b.pP - a.pP); // sort horses by descending PP
        for (let i = 0; i < Math.min(4, race.length); i++) {
            let horse = race[i]; // This makes it clear we're dealing with a horse
            horse.points += 1; // add 1 point to the top 4 horses
            console.log(`Horse: ${horse.name}, Race: ${horse.race}, checkTopPP(): +1 point`);
        }
    }
}

function calculatePoints() {
    let resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = ''; // clear previous results

    for (let raceNumber in races) {
        let race = races[raceNumber];
        let raceResults = race.filter(horse => horse.points >= 1);

        if (raceResults.length > 0) {
            // Sort the horses by points in descending order
            raceResults.sort((a, b) => b.points - a.points);
            // Get the first horse in the race to access the common race properties
            let firstHorse = raceResults[0];
            let matchingRow = rawData.find(row => row["PROGRAM"] === Number(firstHorse.horseNumber) && row["RACE"] === Number(raceNumber));
            let surface = matchingRow ? String(matchingRow["SURFACE"]) : "Unknown surface";
            let distance = matchingRow ? String(matchingRow["DISTANCE"]) : "Unknown distance";

            let tableHTML = `<h2>Race: ${raceNumber} (${surface}, ${distance} furlongs)</h2>`;
            tableHTML += '<table><thead><tr><th>Horse#</th><th>Horse</th><th>Points</th><th>MLO Check</th><th>MLO</th></tr></thead><tbody>';

            raceResults.forEach(horse => {
                let mloCheckClass = horse.mloCheck === 'Yes' ? 'mlo-yes' : 'mlo-no';
                let matchingRow = rawData.find(row => row["PROGRAM"] === Number(horse.horseNumber) && row["RACE"] === Number(raceNumber));
                if (!matchingRow) {
                    console.log(`No matching row found for horse number ${horse.horseNumber} in race number ${raceNumber}`);
                } else {
                    let mloRaw = matchingRow["AXCIS_ODDS"];
                    tableHTML += `<tr><td>${horse.horseNumber}</td><td>${horse.name}</td><td>${horse.points}</td><td class="${mloCheckClass}">${horse.mloCheck}</td><td>${String(mloRaw)}</td></tr>`;
                }
            });

            tableHTML += '</tbody></table><br>'; // end of table and add a blank line between races
            resultsDiv.innerHTML += tableHTML;
        }
    }
}


    // Log total points for each horse
    for (let raceNumber in races) {
        let race = races[raceNumber];
        race.forEach(horse => {
            console.log(`Horse: ${horse.name}, Race: ${horse.race}, Total Points: ${horse.points}`);
        });
    }


function updateUploadStatus() {
    let fileStatus = document.getElementById('file-upload-status');
    if (document.getElementById('csvFile').files.length > 0) {
        fileStatus.innerHTML = 'File Uploaded!';
    } else {
        fileStatus.innerHTML = '';
    }
}

function mloCheck() {
    for (let raceNumber in races) {
        let race = races[raceNumber];
        race.forEach(horse => {
            // Check if the horse's points and MLO value meet any of the thresholds.
            if ((horse.points >= 10 && horse.mLO >= 4.5) || 
                (horse.points >= 6 && horse.mLO >= 8)) {
                // If a threshold is met, set the mloCheck attribute to 'Yes'.
                horse.mloCheck = 'Yes';
            }
        });
    }
}

function checkTopSolleyFour() {
    for (let raceNumber in races) {
        let race = races[raceNumber].filter(horse => !isNaN(Number(horse.solleyFour)) && Number(horse.solleyFour) > 0);
        race.sort((a, b) => Number(b.solleyFour) - Number(a.solleyFour)); // Sort descending by Solley4
        for (let i = 0; i < Math.min(4, race.length); i++) {
            let horse = race[i];
            horse.points += 1;
            console.log(`Horse: ${horse.name}, Race: ${horse.race}, checkTopSolleyFour(): +1 point, Total Points: ${horse.points}`);
        }
    }
}


function checkTopTwo() {
    console.log('checkTopTwo() function called');
    for (let raceNumber in races) {
        let race = races[raceNumber].filter(horse => !isNaN(Number(horse.top2)) && Number(horse.top2) > 0);
        race.sort((a, b) => b.top2 - a.top2); // Sort descending by Top2

        if (race.length >= 2) {
            let highest_value = race[0].top2;
            let second_highest_value = race[1].top2;

            console.log(`Race: ${raceNumber}, Highest value: ${highest_value}, Second highest value: ${second_highest_value}`);

            for (let horse of race) {
                console.log(`Horse: ${horse.name}, Top2 value: ${horse.top2}`);
                if (Number(horse.top2) >= second_highest_value) {
                    horse.points += 1;
                    console.log(`Horse: ${horse.name}, Race: ${horse.race}, checkTopTwo(): +1 point, Total Points: ${horse.points}`);
                }
            }
        }
    }
}



function checkTopPower() {
    for (let raceNumber in races) {
        let race = races[raceNumber].filter(horse => !isNaN(Number(horse.power)) && Number(horse.power) > 0);
        race.sort((a, b) => Number(b.power) - Number(a.power)); // Sort descending by Power
        for (let i = 0; i < Math.min(4, race.length); i++) {
            let horse = race[i];
            horse.points += 1;
            console.log(`Horse: ${horse.name}, Race: ${horse.race}, checkTopPower(): +1 point, Total Points: ${horse.points}`);
        }
    }
}



function checkTopHiSpeed() {
    for (let raceNumber in races) {
        let race = races[raceNumber].filter(horse => !isNaN(Number(horse.hiSpeed)) && Number(horse.hiSpeed) > 0);
        race.sort((a, b) => Number(b.hiSpeed) - Number(a.hiSpeed)); // Sort descending by hiSpeed
        for (let i = 0; i < Math.min(4, race.length); i++) {
            let horse = race[i];
            horse.points += 2;  // award 2 points
            console.log(`Horse: ${horse.name}, Race: ${horse.race}, checkTopHiSpeed(): +2 points, Total Points: ${horse.points}`);
        }
    }
}



function checkTopAvgSpeed() {
    for (let raceNumber in races) {
        let race = races[raceNumber].filter(horse => !isNaN(Number(horse.avgSpeed)) && Number(horse.avgSpeed) > 0);
        race.sort((a, b) => Number(b.avgSpeed) - Number(a.avgSpeed)); // Sort descending by Avg Speed
        for (let i = 0; i < Math.min(4, race.length); i++) {
            let horse = race[i];
            horse.points += 1;  // award 1 point
            console.log(`Horse: ${horse.name}, Race: ${horse.race}, checkTopAvgSpeed(): +1 point, Total Points: ${horse.points}`);
        }
    }
}



function checkTopSpeedL3() {
    for (let raceNumber in races) {
        let race = races[raceNumber].filter(horse => {
            if (typeof horse.speedL3 === 'string') {
                let numbers = horse.speedL3.split(/[\s-]+/).filter(n => !isNaN(n) && n.trim() !== '');
                return numbers.length > 0;
            }
            return false;
        });

        // Add a new property 'maxSpeedL3Number' to use for sorting
        race.forEach(horse => {
            let numbers = horse.speedL3.split(/[\s-]+/).filter(n => !isNaN(n) && n.trim() !== '');
            horse.maxSpeedL3Number = Math.max.apply(null, numbers.map(Number));
        });

        race.sort((a, b) => b.maxSpeedL3Number - a.maxSpeedL3Number); // Sort descending by max Speed L3 number

        for (let i = 0; i < Math.min(4, race.length); i++) {
            let horse = race[i];
            horse.points += 1;  // award 1 point
            console.log(`Horse: ${horse.name}, Race: ${horse.race}, checkTopSpeedL3(): +1 point`);
        }
    }
}


function checkEarlyPace() {
    for (let raceNumber in races) {
        let race = races[raceNumber];

        race.forEach(horse => {
            if (typeof horse.pacer === 'string') {
                let numbers = horse.pacer.split(" ").filter(item => !isNaN(parseFloat(item)));
                if (numbers.length === 4) {
                    horse.firstPacerNumber = parseFloat(numbers[0]);
                    console.log(`Horse: ${horse.name}, Race: ${raceNumber}, First number in pacer: ${horse.firstPacerNumber}`);
                }
            }
        });

        race.sort((a, b) => a.firstPacerNumber - b.firstPacerNumber); // Sort ascending by first Pacer number

        let awardPointsCount = 0;
        let lastAwardedFirstPacerNumber = null;
        for (let horse of race) {
            if (awardPointsCount < 4 || horse.firstPacerNumber === lastAwardedFirstPacerNumber) {
                horse.points += 1;  // award 1 point
                console.log(`Horse: ${horse.name}, Race: ${raceNumber}, checkEarlyPace(): +1 point, Total Points: ${horse.points}`);
                awardPointsCount++;
                lastAwardedFirstPacerNumber = horse.firstPacerNumber;
            } else {
                break;
            }
        }

        if (awardPointsCount === 0) {
            console.log(`Race: ${raceNumber}, checkEarlyPace(): no horses meet the criteria`);
        }
    }
}

function checkPaceFinal() {
    for (let raceNumber in races) {
        let race = races[raceNumber];

        race.forEach(horse => {
            if (typeof horse.pacer === 'string') {
                let numbers = horse.pacer.split(" ").filter(item => !isNaN(parseFloat(item)));
                if (numbers.length === 4) {
                    horse.thirdPacerNumber = parseFloat(numbers[2]);  // Use the third number
                    console.log(`Horse: ${horse.name}, Race: ${raceNumber}, Third number in pacer: ${horse.thirdPacerNumber}`);
                }
            }
        });

        race.sort((a, b) => a.thirdPacerNumber - b.thirdPacerNumber); // Sort ascending by third Pacer number

        let awardPointsCount = 0;
        let lastAwardedThirdPacerNumber = null;
        for (let horse of race) {
            if (awardPointsCount < 4 || horse.thirdPacerNumber === lastAwardedThirdPacerNumber) {
                horse.points += 1;  // award 1 point
                console.log(`Horse: ${horse.name}, Race: ${raceNumber}, checkPaceFinal(): +1 point, Total Points: ${horse.points}`);
                awardPointsCount++;
                lastAwardedThirdPacerNumber = horse.thirdPacerNumber;
            } else {
                break;
            }
        }

        if (awardPointsCount === 0) {
            console.log(`Race: ${raceNumber}, checkPaceFinal(): no horses meet the criteria`);
        }
    }
}


function checkPaceAllFirst() {
    for (let raceNumber in races) {
        let race = races[raceNumber];

        race.forEach(horse => {
            if (typeof horse.pacerAll === 'string') {
                let numbers = horse.pacerAll.split(" ").filter(item => !isNaN(parseFloat(item)));
                if (numbers.length === 4) {
                    horse.firstPacerAllNumber = parseFloat(numbers[0]);  // Use the first number
                    console.log(`Horse: ${horse.name}, Race: ${raceNumber}, First number in pacerAll: ${horse.firstPacerAllNumber}`);
                }
            }
        });

        race.sort((a, b) => a.firstPacerAllNumber - b.firstPacerAllNumber); // Sort ascending by first Pacer All number

        let awardPointsCount = 0;
        let lastAwardedFirstPacerAllNumber = null;
        for (let horse of race) {
            if (awardPointsCount < 4 || horse.firstPacerAllNumber === lastAwardedFirstPacerAllNumber) {
                horse.points += 1;  // award 1 point
                console.log(`Horse: ${horse.name}, Race: ${raceNumber}, checkPaceAllFirst(): +1 point, Total Points: ${horse.points}`);
                awardPointsCount++;
                lastAwardedFirstPacerAllNumber = horse.firstPacerAllNumber;
            } else {
                break;
            }
        }

        if (awardPointsCount === 0) {
            console.log(`Race: ${raceNumber}, checkPaceAllFirst(): no horses meet the criteria`);
        }
    }
}

function checkPaceAllSecond() {
    for (let raceNumber in races) {
        let race = races[raceNumber];

        race.forEach(horse => {
            if (typeof horse.pacerAll === 'string') {
                let numbers = horse.pacerAll.split(" ").filter(item => !isNaN(parseFloat(item)));
                if (numbers.length === 4) {
                    horse.secondPacerAllNumber = parseFloat(numbers[2]);  // Use the third number
                    console.log(`Horse: ${horse.name}, Race: ${raceNumber}, Third number in pacerAll: ${horse.secondPacerAllNumber}`);
                }
            }
        });

        race.sort((a, b) => a.secondPacerAllNumber - b.secondPacerAllNumber); // Sort ascending by third Pacer All number

        let awardPointsCount = 0;
        let lastAwardedSecondPacerAllNumber = null;
        for (let horse of race) {
            if (awardPointsCount < 4 || horse.secondPacerAllNumber === lastAwardedSecondPacerAllNumber) {
                horse.points += 1;  // award 1 point
                console.log(`Horse: ${horse.name}, Race: ${raceNumber}, checkPaceAllSecond(): +1 point, Total Points: ${horse.points}`);
                awardPointsCount++;
                lastAwardedSecondPacerAllNumber = horse.secondPacerAllNumber;
            } else {
                break;
            }
        }

        if (awardPointsCount === 0) {
            console.log(`Race: ${raceNumber}, checkPaceAllSecond(): no horses meet the criteria`);
        }
    }
}



function checkDays() {
    for (let raceNumber in races) {
        let race = races[raceNumber];
        for (let horse of race) {
            if (!isNaN(Number(horse.days)) && Number(horse.days) <= 36) {
                horse.points += 1;  // award 1 point
                console.log(`Horse: ${horse.name}, Race: ${horse.race}, checkDays(): +1 point, Total Points: ${horse.points}`);
            }
        }
    }
}



function checkLast3Up() {
    for (let raceNumber in races) {
        let race = races[raceNumber].filter(horse => {
            if (typeof horse.speedL3 === 'string') {
                let numbers = horse.speedL3.split(/[\s-]+/).filter(n => !isNaN(n) && n.trim() !== '');
                return numbers.length === 3;
            }
            return false;
        });

        for (let horse of race) {
            let numbers = horse.speedL3.split(/[\s-]+/).map(Number);
            if (numbers[0] < numbers[1] && numbers[1] < numbers[2]) {
                horse.points += 2;  // award 2 points
                console.log(`Horse: ${horse.name}, Race: ${horse.race}, checkLast3Up(): +2 points`);
            }
        }
    }
}


function checkLast3Down() {
    for (let raceNumber in races) {
        let race = races[raceNumber].filter(horse => {
            if (typeof horse.speedL3 === 'string') {
                let numbers = horse.speedL3.trim().split(/[\s-]+/).filter(n => !isNaN(n) && n.trim() !== '');
                return numbers.length === 3;
            }
            return false;
        });

        for (let horse of race) {
            let numbers = horse.speedL3.trim().split(/[\s-]+/).map(Number);
            if (numbers[0] > numbers[1] && numbers[1] > numbers[2]) {
                horse.points += 1;  // award 1 point
                console.log(`Horse: ${horse.name}, Race: ${horse.race}, checkLast3Down(): +1 point`);
            }
        }
    }
}

function checkSpeedL3Delta() {
    for (let raceNumber in races) {
        let race = races[raceNumber];

        race.forEach(horse => {
            if (typeof horse.speedL3 === 'string') {
                let numbers = horse.speedL3.trim().split(/[\s-]+/).filter(n => !isNaN(n) && n.trim() !== '');
                if (numbers.length === 3) {
                    let minNumber = Math.min(...numbers.map(Number));
                    let maxNumber = Math.max(...numbers.map(Number));
                    if (maxNumber - minNumber <= 8) {
                        horse.points += 2;  // award 2 points
                        console.log(`Horse: ${horse.name}, Race: ${raceNumber}, checkSpeedL3Delta(): +2 points`);
                    }
                }
            }
        });
    }
}
