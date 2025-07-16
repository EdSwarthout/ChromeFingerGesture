// This script is injected into every webpage.
console.log("Gesture Scroller: Content script loaded.");

let isEnabled = false;
let videoElement = null;
let mediaStream = null;
let detector = null;
let detectionInterval = null;

// Function to dynamically load a script
function loadScript(url) {
    return new Promise((resolve, reject) => {
	const script = document.createElement('script');
	script.src = url;
	script.onload = resolve;
	script.onerror = reject;
	document.head.appendChild(script);
    });
}

// Function to load TF.js and the hand-pose-detection model
async function loadModel() {
    console.log("Loading TensorFlow.js and MediaPipe Hand-Pose-Detection model...");
    try {
	// Load the required scripts in sequence
	await loadScript('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-core');
	await loadScript('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-backend-webgl');
	await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/hands');
	await loadScript('https://cdn.jsdelivr.net/npm/@tensorflow-models/hand-pose-detection');

	console.log("Scripts loaded successfully.");

	// Create the detector
	const model = handPoseDetection.SupportedModels.MediaPipeHands;
	const detectorConfig = {
	    runtime: 'tfjs', // or 'mediapipe'
	    modelType: 'lite', // or 'full'
	    maxHands: 1
	};
	detector = await handPoseDetection.createDetector(model, detectorConfig);
	console.log("Hand detector created successfully.");

    } catch (error) {
	console.error("Error loading model or scripts:", error);
    }
}

// Function to start detecting hands
function startDetection() {
    if (!detector || !videoElement) {
	console.log("Detector or video not ready.");
	return;
    }

    // Run detection every 100ms
    detectionInterval = setInterval(async () => {
	try {
	    const hands = await detector.estimateHands(videoElement, { flipHorizontal: true });
	    if (hands.length > 0) {
		// We have a hand!
		console.log("Hand detected:", hands[0].keypoints);
		// TODO: Translate gesture to scroll
	    }
	} catch (error) {
	    console.error("Error during hand detection:", error);
	}
    }, 100); // Adjust interval as needed for performance
}


// Function to start the webcam feed
async function startWebcam() {
    if (mediaStream) {
	console.log("Webcam is already running.");
	return;
    }
    console.log("Starting webcam...");
    try {
	mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
	videoElement = document.createElement('video');
	videoElement.srcObject = mediaStream;
	videoElement.style.display = 'none';
	document.body.appendChild(videoElement);

	await new Promise((resolve) => {
	    videoElement.onloadedmetadata = () => {
		videoElement.play().catch(e => console.error("Video play failed:", e));
		resolve();
	    };
	});

	console.log("Webcam started successfully.");

	// Load the model and then start detection
	if (!detector) {
	    await loadModel();
	}
	startDetection();

    } catch (error) {
	console.error("Error accessing webcam:", error);
	chrome.storage.sync.set({ enabled: false });
    }
}

// Function to stop the webcam feed and detection
function stopWebcam() {
    console.log("Stopping webcam and detection...");
    if (detectionInterval) {
	clearInterval(detectionInterval);
	detectionInterval = null;
    }
    if (mediaStream) {
	mediaStream.getTracks().forEach(track => track.stop());
	mediaStream = null;
    }
    if (videoElement) {
	videoElement.remove();
	videoElement = null;
    }
    // We don't dispose of the detector, so it's ready if the user toggles back on.
    // This saves loading time. It can be disposed of if memory becomes a concern.
    console.log("Webcam and detection stopped.");
}


// Main control function
function handleGestureControl(enabled) {
    if (enabled) {
	console.log("Gesture control ACTIVATED.");
	startWebcam();
    } else {
	console.log("Gesture control DEACTIVATED.");
	stopWebcam();
    }
}

// Listen for changes in the storage
chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'sync' && changes.enabled) {
	isEnabled = !!changes.enabled.newValue;
	handleGestureControl(isEnabled);
    }
});

// Check the initial state
chrome.storage.sync.get(['enabled'], (result) => {
    isEnabled = !!result.enabled;
    handleGestureControl(isEnabled);
});
