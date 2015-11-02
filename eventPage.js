var chrome = chrome;
var TIMER;


// preventing data loss:
// https://developer.chrome.com/apps/app_lifecycle
chrome.storage.local.get('timer', function(items){
	var loadTimer;

	// Setup default timer if it doesn't exist
	if (typeof(items.timer) === "undefined") {
		TIMER = new Timer(false, null, null);
	}
	else {
		TIMER = new Timer(items.timer.on, new Date(Date.parse(items.timer.start)), null);
	}
	
	chrome.browserAction.onClicked.addListener(function(tab) {
		toggleTimer(tab, TIMER);
	});

	chrome.runtime.onSuspend.addListener(function(){
		saveTimer();
	});

});

// admittedly it's weird that this is using the global timer and all my other functions pass in a timer
// just trying to get this working now
function saveTimer() {
	var timer = {};

	timer.on = TIMER.on;
	timer.start = TIMER.start.toISOString();

	chrome.storage.local.set({'timer':timer});
}


function Timer(on, start, stop) {
    this.on = on;
    this.start = start;
    this.stop = stop;
}

var stopTimer = function stopTimer (tabId, tabTimer) {
    tabTimer.on = false;
    tabTimer.stop = new Date();
	saveTimer();
    console.log("Stopped global timer on tab " + tabId + " at " + tabTimer.stop.toTimeString());
};

var startTimer = function startTimer (tabId, tabTimer) {
    tabTimer.on = true;
    tabTimer.start = new Date();
	saveTimer();
    console.log("Started global timer on tab " + tabId + " at " + tabTimer.start.toTimeString());
};

var findMinutes = function findMinutes (timer) {
    var milliseconds = timer.stop.getTime() - timer.start.getTime();
    var minutes = milliseconds/1000/60;
    return Math.ceil(minutes);
};


var toggleTimer = function toggleTimer (tab, taskTimer) {
    var waitedForWorkLog = 0;

    var logWork = function logWork (taskTimer) {
        chrome.browserAction.setIcon({path: "off-19.png"});
        stopTimer (tab.id, taskTimer);
        var minutes = findMinutes(taskTimer);
        var minString = minutes + "m";
        var d = taskTimer.start;
        var startString = d.getDate() + "/" +
                d.toLocaleString("en-US", {month: "short"}) + "/" +
                d.toLocaleString("en-US", {year: "numeric"}) + " " +
                d.toLocaleString("en-US", {hour: "numeric", minute: "numeric", hour12: true});

        var minStringCode = 'document.getElementById("log-work-time-logged").value = "' + minString + '"';
        var startStringCode = 'document.getElementById("log-work-date-logged-date-picker").value = "' + startString + '"';
        chrome.tabs.executeScript(tab.id, {code: minStringCode });
        chrome.tabs.executeScript(tab.id, {code: startStringCode });

    };

    var waitForWorkLog = function waitForWorkLog (taskTimer) {
            chrome.tabs.executeScript(tab.id, {code: 'document.getElementById("log-work-time-logged")'}, function(results){
                if (results[0] !== null) {
                    logWork(taskTimer);
                }
                else {
                    waitedForWorkLog += 100; /* match the setTimeout interval which is 100 milliseconds */
                    if (waitedForWorkLog >= 3000) { /* 3 seconds, 3000 milliseconds */
                        chrome.tabs.executeScript(tab.id, {code: 'alert("Waited too long for Work Log.");'});
                    }
                    else {
                        window.setTimeout(waitForWorkLog, 100, taskTimer);
                    }
                }
            });
    };

    var updateWorklogValues = function updateWorklogValues (taskTimer) {
        chrome.tabs.executeScript(tab.id, {code: 'document.getElementById("log-work").click();'}, function() {
                window.setTimeout(waitForWorkLog, 100, taskTimer);
            });

    };

    var stopIfJiraPage = function stopIfJiraPage (taskTimer) {
        chrome.tabs.executeScript(tab.id, {code: 'document.getElementById("log-work");'}, function(results) {
                if (results[0] !== null) {
                    updateWorklogValues(taskTimer);
                }
                else {
                    alert("Couldn't find the log work button! Letting the timer keep running.");
                }
            });

    };


	// If it's on, stop it. If It's off, start it.
    if (taskTimer.on === true) {
        stopIfJiraPage(taskTimer);
    } else {
        chrome.browserAction.setIcon({path: "on-19.png"});
        startTimer (tab.id, taskTimer);
    }

};

