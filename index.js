let timestamps = [];
let recordedCoords = [];
let isTracking = false;
let minDistance = 0.000000000001;
let secondsCounted = 0;
let startDynamicTimer;
let updateDynamicTimer;
let incrementDynamicTime;

const resetVariables = () => {
	timestamps = [];
	recordedCoords = [];
	isTracking = false;
	dynamicTimer();
	document.getElementById("start-stop-button").innerHTML = "Start";
}

/* const trackLocation = () => {
 //   if (isTracking != true) {
		// Fetch new GPS info every 10000 milliseconds
	    getLocation();
	    window.setInterval(() => getLocation(), 10000);
//    } 
     else {
 		showResults();
    } 
} */

const showDistance = () => {
	// Takes an array of recorded coordinates, counts distance between them, converts it to miles and shows it in the DOM.
	let distancesArray = recordedCoords.map((currElement, index) => {
		if (recordedCoords[index + 1]) {
			return(calculateDistance(currElement.latitude, currElement.longitude, recordedCoords[index + 1].latitude, recordedCoords[index + 1].longitude));
		} else {
			return 0
		}
	});

	let summedDistance = distancesArray.reduce((a, b) => {return a + b;});
	let distanceMiles = parseFloat(summedDistance * 0.621371).toFixed(2);
	document.getElementById("distance-results").innerHTML = `${distanceMiles} miles`;
}

const calculateDistance = (lat1, lon1, lat2, lon2) => {
	// Returns distance in KMs between two pairs of coordinates.
	let p = 0.017453292519943295;    	// Math.PI / 180
	let c = Math.cos;
	let a = 0.5 - c((lat2 - lat1) * p)/2 + c(lat1 * p) * c(lat2 * p) * (1 - c((lon2 - lon1) * p))/2;
	return 12742 * Math.asin(Math.sqrt(a)); 	// 2 * R; R = 6371 km
} 

const recordCoords = (position) => {
	// Records geolocation coordinates without checking for movement. Used only for first and last coordinates.
	timestamps.push(position.timestamp);
	recordedCoords.push({
		latitude: position.coords.latitude,
		longitude: position.coords.longitude
	});
	console.log("ping!"); 
}

const recordCoordsIfMoved = (position, arr = recordedCoords, distanceFilter = minDistance) => {
	// Takes geolocation coordinates and records them if they are sufficiently far away from last location.
	// Required distance is set in the minDistance variable.
	timestamps.push(position.timestamp);
	let lastLocation = arr[arr.length - 1];
	let distanceToCheck = calculateDistance(lastLocation.latitude, lastLocation.longitude, position.coords.latitude, position.coords.longitude);
	if (distanceToCheck > minDistance) { 
		recordedCoords.push({
			latitude: position.coords.latitude,
			longitude: position.coords.longitude
		});
	console.log("ping! you moved!");
	} else {
	console.log("ping! no movement detected.")
	}
}

const onGeoFailure = () => {
	// Error callback for geolocation function; shows error message while geolocation is failing.
	if (isTracking) {
		document.getElementById("status").innerHTML = "Error, please check permissions and connection";
	}
}

const onGeoSuccess = (position, arr = recordedCoords) => {
	// Handler for data from succesful geolocation.
	if (isTracking) {
		document.getElementById("status").innerHTML = "Tracking...";
		if (arr[0]) {
			recordCoordsIfMoved(position);
		} else {
			recordCoords(position);
		}
	showDistance();
	}	
}

const calculateAndShowTime = (timeArr) => {
	// Returns final trip time from first and last geolocation timestamp
	let tripTime = timeArr[timeArr.length -1] - timeArr[0];
	let	parsedTime = msToTime(tripTime);
	document.getElementById("time-results").innerHTML = `${parsedTime}`;
} 

const msToTime = (duration) => {
	let  seconds = parseInt((duration / 1000) % 60),
	minutes = parseInt((duration / (1000 * 60)) % 60),
	hours = parseInt((duration / (1000 * 60 * 60)) % 24);

	hours = (hours < 10) ? "0" + hours : hours;
	minutes = (minutes < 10) ? "0" + minutes : minutes;
	seconds = (seconds < 10) ? "0" + seconds : seconds;

	return hours + ":" + minutes + ":" + seconds; 
}

const dynamicTimer = () => {
	// This timer is only shown while ride is in progress. The calculateAndShowTime() function is used for calculating final time value.
	if (secondsCounted === 0 && isTracking) {
		incrementDynamicTime = (val) => {
			return val > 9 ? val : "0" + val; 
		}
		updateDynamicTimer = (callback = incrementDynamicTime) => {
			document.getElementById("time-results").innerHTML = callback(parseInt(secondsCounted/3600,10)) + ":" + callback(parseInt(secondsCounted/60,10)) + ":" + callback(++secondsCounted%60);
		}

		startDynamicTimer = setInterval(updateDynamicTimer, 1000);
		startDynamicTimer;
	} 
	else {
		secondsCounted = 0;
		clearInterval(startDynamicTimer);
	}
}

const getLocation = () => {
	navigator.geolocation.getCurrentPosition(onGeoSuccess, onGeoFailure, {
        enableHighAccuracy: true,
        timeout: 50000 	// Large timeout to accomodate slow GPS lock on some devices
	});	
}

const getLocationWithPromise = () => {
	return new Promise((resolve, reject) => {
		navigator.geolocation.getCurrentPosition(resolve, reject, {
	        enableHighAccuracy: true,
	        timeout: 30000 	// Error triggered after 30 seconds - large timeout to accomodate slow GPS lock on some devices. 
		});	
	});
}

const getResults = () => {
	calculateAndShowTime(timestamps);
	showDistance();
	document.getElementById("status").innerHTML = "Ride completed. New start will reset values.";
}


const showResults = () => {
	getLocationWithPromise().then(recordCoords).then(getResults).then(resetVariables).catch(onGeoFailure);
}

const triggerCalculator = () => {
// the main script is activated by the START/STOP button.
	getLocation();
//	trackLocation();
	if (isTracking != true) { 		
		isTracking = true;
		dynamicTimer();
		window.setInterval(() => getLocation(), 10000);

		document.getElementById("start-stop-button").innerHTML = " Stop ";
		document.getElementById("distance-results").innerHTML = " - ";
		document.getElementById("time-results").innerHTML = " - ";
		document.getElementById("status").innerHTML = "Tracking...";
	} else {
		showResults();
	}
}