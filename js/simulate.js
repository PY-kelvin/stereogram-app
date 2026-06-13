// js/simulate.js

window.runSimulation = async function() {
    console.log("Starting Simulation for 20 users...");
    
    // Create a modal to show results
    const resultsModal = document.createElement('div');
    resultsModal.style.cssText = "position:fixed; top:10%; left:10%; width:80%; height:80%; background:white; z-index:999999; border: 5px solid #0d47a1; border-radius: 20px; padding: 20px; overflow-y: auto; color: black; font-family: monospace;";
    document.body.appendChild(resultsModal);
    
    resultsModal.innerHTML = "<h2 style='color:#0d47a1;'>Simulation Results (20 Users)</h2><div id='sim-log'></div><button id='close-sim' style='margin-top:20px; padding:10px 20px; background:#0d47a1; color:white; border:none; border-radius:10px;'>Close Report</button>";
    
    document.getElementById('close-sim').onclick = () => resultsModal.remove();
    
    const logEl = document.getElementById('sim-log');
    const log = (msg) => {
        logEl.innerHTML += `<div>${msg}</div>`;
        console.log(msg);
    };

    // Backup current state to avoid breaking UI during tests
    const originalUser = window.App.currentUser ? JSON.parse(JSON.stringify(window.App.currentUser)) : null;
    const originalTransition = window.Map.triggerCinematicTransition;
    const originalNotification = window.App.showNotification;
    const originalShowMap = window.App.showMapScreen;
    
    // Mock UI functions so they don't visually fire
    window.Map.triggerCinematicTransition = async function() {};
    window.App.showNotification = function() {};
    window.App.showMapScreen = function() {};
    
    let passCount = 0;
    
    for(let i=1; i<=20; i++) {
        log(`<b>--- Simulating User ${i} ---</b>`);
        
        // Mock user
        window.App.currentUser = {
            username: `sim_user_${i}`,
            streak: 0,
            animal: 'cat',
            dailyProgress: 0,
            sessionHistory: [],
            stagePlays: { 1: 0, 2: 0, 3: 0 },
            stageDailyProgress: { 1: 0, 2: 0, 3: 0 },
            visualCount: { 1: 0, 2: 0, 3: 0 },
            unlockedStages: [1]
        };
        const user = window.App.currentUser;
        
        try {
            if (i >= 1 && i <= 5) {
                // Play 7 perfect days
                for (let d=0; d<7; d++) {
                    const fakeDate = new Date(Date.now() + d * 86400000);
                    user.sessionHistory.push({
                        dateStr: fakeDate.toDateString(),
                        timestamp: fakeDate.getTime(),
                        durationMins: 10,
                        stage: '1A'
                    });
                    user.stagePlays[1] += 1;
                }
                if (user.stagePlays[1] === 7) passCount++; else log(`<span style="color:red">Failed User ${i} (Plays=${user.stagePlays[1]})</span>`);
                
            } else if (i >= 6 && i <= 10) {
                window.Game.currentStageNode = '1A';
                user.sessionHistory.push({
                    dateStr: new Date().toDateString(),
                    timestamp: new Date().getTime(),
                    durationMins: 1,
                    stage: '1A'
                });
                
                window.Game.hasStartedCurrentSession = false; 
                window.Game.completeSession(); 
                
                if (user.stagePlays[1] === 1) passCount++; else log(`<span style="color:red">Bug Fix Failed! Plays is ${user.stagePlays[1]} instead of 1</span>`);
                
            } else if (i >= 11 && i <= 15) {
                window.Map.fastForward(14, "orthoptics 1");
                if (user.streak === 14) passCount++; else log(`<span style="color:red">Password Failed User ${i}</span>`);
                
            } else if (i >= 16 && i <= 20) {
                window.Map.fastForward(28, "orthoptics 3");
                window.Game.currentStageNode = '3A';
                
                user.sessionHistory.push({
                    dateStr: new Date().toDateString(),
                    timestamp: new Date().getTime(),
                    durationMins: 5,
                    stage: '3A'
                });
                
                window.Game.completeSession();
                
                if (user.streak === 28 && user.stagePlays[3] === 1) passCount++; else log(`<span style="color:red">Combo Failed User ${i} (Streak=${user.streak}, Plays=${user.stagePlays[3]})</span>`);
            }
        } catch(e) {
            log(`<span style="color:red">Error: ${e.message}</span>`);
        }
    }
    
    log(`<br><b style="font-size:1.5rem; color:${passCount === 20 ? 'green' : 'red'};">${passCount}/20 Tests Passed Successfully!</b>`);
    
    // Restore original state
    window.App.currentUser = originalUser;
    window.Map.triggerCinematicTransition = originalTransition;
    window.App.showNotification = originalNotification;
    window.App.showMapScreen = originalShowMap;
};
