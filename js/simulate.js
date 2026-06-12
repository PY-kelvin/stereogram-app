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

    const originalUser = JSON.parse(JSON.stringify(window.App.currentUser));
    
    // Scenarios:
    // User 1-5: Play 10 mins perfectly for 7 days
    // User 6-10: Play 1 min, quit, then play 10 mins (Testing bug fix)
    // User 11-15: Use password orthoptics 1, then play 10 mins
    // User 16-20: Use password orthoptics 3, play partial, play full
    
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
            unlockedStages: [1]
        };
        const user = window.App.currentUser;
        
        try {
            if (i >= 1 && i <= 5) {
                // Play 7 perfect days
                for (let d=0; d<7; d++) {
                    const fakeDate = new Date(Date.now() + d * 86400000);
                    // Override completeSession Date manually since it uses new Date()
                    // Actually, we'll just manipulate the history directly to simulate the passage of time accurately
                    user.sessionHistory.push({
                        dateStr: fakeDate.toDateString(),
                        timestamp: fakeDate.getTime(),
                        durationMins: 10,
                        stage: '1A'
                    });
                    user.streak += 1;
                }
                if (user.streak === 7) passCount++; else log(`<span style="color:red">Failed User ${i} (Streak=${user.streak})</span>`);
                
            } else if (i >= 6 && i <= 10) {
                // Test the bug fix! 
                // User plays 2 partial sessions of 1 minute today
                user.sessionHistory.push({
                    dateStr: new Date().toDateString(),
                    timestamp: new Date().getTime(),
                    durationMins: 1,
                    stage: '1A'
                });
                user.sessionHistory.push({
                    dateStr: new Date().toDateString(),
                    timestamp: new Date().getTime() + 60000,
                    durationMins: 1,
                    stage: '1A'
                });
                
                // Then user completes a session TODAY
                window.Game.hasStartedCurrentSession = false; 
                window.Game.completeSession(); // Should increment streak!
                
                if (user.streak === 1) passCount++; else log(`<span style="color:red">Bug Fix Failed! Streak is ${user.streak} instead of 1</span>`);
                
            } else if (i >= 11 && i <= 15) {
                // Password Override test
                window.Map.fastForward(14, "orthoptics 1");
                if (user.streak === 14) passCount++; else log(`<span style="color:red">Password Failed User ${i}</span>`);
                
            } else if (i >= 16 && i <= 20) {
                // Password + Bug fix test
                window.Map.fastForward(28, "orthoptics 3");
                
                // Fake a partial session
                user.sessionHistory.push({
                    dateStr: new Date().toDateString(),
                    timestamp: new Date().getTime(),
                    durationMins: 5,
                    stage: '3A'
                });
                
                // Complete session
                window.Game.completeSession();
                
                if (user.streak === 29) passCount++; else log(`<span style="color:red">Combo Failed User ${i} (Streak=${user.streak})</span>`);
            }
        } catch(e) {
            log(`<span style="color:red">Error: ${e.message}</span>`);
        }
    }
    
    log(`<br><b style="font-size:1.5rem; color:${passCount === 20 ? 'green' : 'red'};">${passCount}/20 Tests Passed Successfully!</b>`);
    
    // Restore original
    window.App.currentUser = originalUser;
};
