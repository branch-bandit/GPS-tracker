const minDistance = 0.000000000001;
let recordedCoords;
let isTracking;
let secondsCounted;	
let trackLocation;
let incrementTimer;


const initializeState = () => {
	recordedCoords = [];
	isTracking = false;
	secondsCounted = 0;	
}


initializeState();


const startTimer = () => {
	// Timer works with no GPS or network, so tracking witout a connection will only track the time.
	let incrementTimer = (val) => {
		return val > 9 ? val : "0" + val; 
	}
	let updateTimer = () => {
	    document.getElementById("time-results").innerHTML = incrementTimer(parseInt(secondsCounted/3600,10)) + ":" + incrementTimer(parseInt(secondsCounted/60,10)) + ":" + incrementTimer(++secondsCounted%60);
  	}
	countTime = setInterval(updateTimer, 1000);
}


const stopTimer = () => {
	clearInterval(countTime);
}


const calculateDistance = (lat1, lon1, lat2, lon2) => {
	// Returns distance in KMs between two pairs of coordinates.
	let p = 0.017453292519943295;    	// Math.PI / 180
	let c = Math.cos;
	let a = 0.5 - c((lat2 - lat1) * p)/2 + c(lat1 * p) * c(lat2 * p) * (1 - c((lon2 - lon1) * p))/2;
	return 12742 * Math.asin(Math.sqrt(a)); 	// 2 * R; R = 6371 km
} 


const processAndShowDistance = () => {
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


const writeCoords = (position) => {
	// Records geolocation coordinates without checking for movement. Used only for first and last coordinates.
	recordedCoords.push({
		latitude: position.coords.latitude,
		longitude: position.coords.longitude
	});
	console.log("Ping! New location recorded."); 
}


const writeCoordsIfMoved = (position) => {
	// Takes geolocation coordinates and records them if they are sufficiently far away from last location.
	// Required distance is set in the minDistance variable.
	const lastLocation = recordedCoords[recordedCoords.length - 1];
	const distanceToCheck = calculateDistance(lastLocation.latitude, lastLocation.longitude, position.coords.latitude, position.coords.longitude);
	if (distanceToCheck > minDistance) { 
		writeCoords(position);
	} else {
	console.log("Ping! No movement detected.")
	}
}


const onGeoFailure = () => {
	// Error callback for geolocation function; shows error message while geolocation is failing.
	document.getElementById("status").innerHTML = "Error, please check permissions and connection";
}


const onGeoSuccess = (position) => {
	// Handler for data from succesful geolocation.
	if (isTracking) {
		document.getElementById("status").innerHTML = "Tracking...";
		if (recordedCoords[0]) {
			writeCoordsIfMoved(position);
		} else {
			writeCoords(position);
		}
	processAndShowDistance();
	}	
}


const getLocationWithPromise = () => {
	return new Promise((resolve, reject) => {
		navigator.geolocation.getCurrentPosition(resolve, reject, {
	        enableHighAccuracy: true,
	        timeout: 30000 	// Error triggered after 30 seconds - large timeout to accomodate slow GPS lock on some devices. 
		});	
	});
}


const getLocation = () => {
	console.log('geo req');
	navigator.geolocation.getCurrentPosition(onGeoSuccess, onGeoFailure, {
        enableHighAccuracy: true,
        timeout: 50000 	// Large timeout to accomodate slow GPS lock on some devices
	});	
}


const startTracking = () => {
	isTracking = true;
	startTimer();
	getLocation();
	trackLocation = window.setInterval(() => getLocation(), 10000);

	document.getElementById("start-stop-button").innerHTML = " Stop ";
	document.getElementById("distance-results").innerHTML = " - ";
	document.getElementById("time-results").innerHTML = " - ";
	document.getElementById("status").innerHTML = "Tracking...";
}


const stopTrackingAndReset = () => {
	getLocationWithPromise().then((position) => {
		writeCoords(position);
		processAndShowDistance();

		stopTimer();
		clearInterval(trackLocation);
		initializeState();

		document.getElementById("start-stop-button").innerHTML = "Start";
		document.getElementById("status").innerHTML = "Ride completed. New start will reset values.";
	})
	.catch(onGeoFailure);
}


const startOrStopTracking = () => {
// the main script is activated by the START/STOP button.
	if (isTracking != true) { 	
		startTracking();
	} else {
		stopTrackingAndReset();
	}
}