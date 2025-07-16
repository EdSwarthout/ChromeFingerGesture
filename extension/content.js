// This script is injected into every webpage.
console.log("Gesture Scroller: Content script loaded.");

let isEnabled = false;
let videoElement = null;
let mediaStream = null;

// Function to start the webcam feed
async function startWebcam() {
    if (mediaStream) {
	console.log("Webcam is already running.");
	return;
    }
    console.log("Starting webcam...");
    try {
	// Request access to the webcam
	mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });

	// Create a video element to play the stream
	videoElement = document.createElement('video');
	videoElement.srcObject = mediaStream;
	videoElement.style.display = 'none'; // Hide the video element
	document.body.appendChild(videoElement);

	// The 'play()' call is important for the video stream to be active.
	videoElement.play().catch(e => console.error("Video play failed:", e));

	console.log("Webcam started successfully.");
	// TODO: Add TensorFlow.js initialization here

    } catch (error) {
	console.error("Error accessing webcam:", error);
	// If permission is denied, we should probably turn the feature off.
	chrome.storage.sync.set({ enabled: false });
    }
}

// Function to stop the webcam feed
function stopWebcam() {
    console.log("Stopping webcam...");
    if (mediaStream) {
	// Stop all tracks in the stream
	mediaStream.getTracks().forEach(track => track.stop());
	mediaStream = null;
    }
    if (videoElement) {
	// Remove the video element from the DOM
	videoElement.remove();
	videoElement = null;
    }
    // TODO: Add TensorFlow.js cleanup here
    console.log("Webcam stopped.");
}


// Function to start or stop the gesture detection logic
function handleGestureControl(enabled) {
    if (enabled) {
	console.log("Gesture control ACTIVATED.");
	startWebcam();
    } else {
	console.log("Gesture control DEACTIVATED.");
	stopWebcam();
    }
}

// Listen for changes in the storage.
chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'sync' && changes.enabled) {
	isEnabled = !!changes.enabled.newValue;
	handleGestureControl(isEnabled);
    }
});

// Check the initial state when the content script is first injected into a page.
chrome.storage.sync.get(['enabled'], (result) => {
    isEnabled = !!result.enabled;
    handleGestureControl(isEnabled);
});
