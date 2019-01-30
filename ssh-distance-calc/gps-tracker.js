const minDistance = 0.1;
let recordedCoords;
let isTracking;
let trackLocation;


const initializeState = () => {
	recordedCoords = [];
	isTracking = false;
};


initializeState();


const startTimer = () => {
	// usees phone's internal clock to track time

	let padWithZeroes = (val) => {
		return val > 9 ? val : "0" + val;
	};

	let firstTime = new Date();

	let getAndShowTime = () => {
		let currTime = new Date();
		let ms = currTime - firstTime;

		let hrs = Math.floor((ms / 1000 / 3600));
		let min = Math.floor((ms / 1000 / 60) % 60);
		let sec = Math.floor((ms / 1000) % 60);
		document.getElementById("time-results").innerHTML = padWithZeroes(hrs) + ":" + padWithZeroes(min) + ":" + padWithZeroes(sec);
	}

	countTime = setInterval(getAndShowTime, 1000);
	countTime;
};


const stopTimer = () => {
	clearInterval(countTime);
};


const calculateDistance = (lat1, lon1, lat2, lon2) => {
	// Returns distance in KMs between two pairs of coordinates.
	const p = 0.017453292519943295;    	// Math.PI / 180
	const c = Math.cos;
	const a = 0.5 - c((lat2 - lat1) * p) / 2 + c(lat1 * p) * c(lat2 * p) * (1 - c((lon2 - lon1) * p)) / 2;
	return 12742 * Math.asin(Math.sqrt(a)); 	// 2 * R; R = 6371 km
};


const processAndShowDistance = () => {
	// Takes an array of recorded coordinates, counts distance between them, converts it to miles and shows it in the DOM.
	let distancesArray = recordedCoords.map((currElement, index) => {
		if (recordedCoords[index + 1]) {
			return (calculateDistance(currElement.latitude, currElement.longitude, recordedCoords[index + 1].latitude, recordedCoords[index + 1].longitude));
		} else {
			return 0;
		}
	});

	let summedDistance = distancesArray.reduce((a, b) => { return a + b; });
	let distanceMiles = parseFloat(summedDistance * 0.621371).toFixed(2);
	document.getElementById("distance-results").innerHTML = `${distanceMiles} miles`;
};


const writeCoords = (position) => {
	// Records geolocation coordinates without checking for movement. Used only for first and last coordinates.
	recordedCoords.push({
		latitude: position.coords.latitude,
		longitude: position.coords.longitude
	});
	console.log("Ping! New location recorded.");
};


const writeCoordsIfMoved = (position) => {
	// Takes geolocation coordinates and records them if they are sufficiently far away from last location.
	// Required distance is set in the minDistance variable.
	const lastLocation = recordedCoords[recordedCoords.length - 1];
	const distanceToCheck = calculateDistance(lastLocation.latitude, lastLocation.longitude, position.coords.latitude, position.coords.longitude);
	if (distanceToCheck > minDistance) {
		writeCoords(position);
	} else {
		console.log("Ping! No movement detected.");
	}
};


const onGeoFailure = () => {
	// Error callback for geolocation function; shows error message while geolocation is failing.
	document.getElementById("status").innerHTML = "Error, please check permissions and connection";
};


const onGeoSuccess = (position) => {
	// Handler for data from succesful geolocation.
	if (isTracking) {
		document.getElementById("status").innerHTML = "Tracking...";
		if (recordedCoords[0]) {
			writeCoordsIfMoved(position);
		} else {
			writeCoords(position);
		}
	}
	processAndShowDistance();
};


const getLocation = () => {
	return new Promise((resolve, reject) => {
		navigator.geolocation.getCurrentPosition(resolve, reject, {
			enableHighAccuracy: true,
			timeout: 30000 	// Error triggered after 30 seconds - large timeout to accomodate slow GPS lock on some devices.
		});
	});
};


const startTracking = () => {
	isTracking = true;
	startTimer();
	const handleLocation = () => getLocation().then(onGeoSuccess).catch(onGeoFailure);
	handleLocation();
	trackLocation = window.setInterval(() => handleLocation(), 10000);

	document.getElementById("start-stop-button").innerHTML = " Stop ";
	document.getElementById("distance-results").innerHTML = " - ";
	document.getElementById("time-results").innerHTML = "00:00:00";
	document.getElementById("status").innerHTML = "Tracking...";
};


const stopTrackingAndReset = () => {
	getLocation().then((position) => {
		writeCoords(position);
		processAndShowDistance();

		stopTimer();
		clearInterval(trackLocation);
		initializeState();

		document.getElementById("start-stop-button").innerHTML = "Start";
		document.getElementById("status").innerHTML = "Ride completed. New start will reset values.";
	})
	.catch(onGeoFailure);
};


const startOrStopTracking = () => {
// the main script is activated by the START/STOP button.
	if (isTracking !== true) {
		startTracking();
	} else {
		stopTrackingAndReset();
	}
};
