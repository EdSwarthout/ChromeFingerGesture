// This script is injected into every webpage.
console.log("Gesture Scroller: Content script loaded.");

let isEnabled = false;
let videoElement = null;
let mediaStream = null;
let detectionInterval = null;
let sandboxIframe = null;
let canvasElement = null;
let canvasContext = null;
let isSandboxReady = false;

// Function to initialize and add the sandbox iframe to the page
function initSandbox() {
    if (sandboxIframe) return;

    console.log("Initializing sandbox iframe...");
    sandboxIframe = document.createElement('iframe');
    sandboxIframe.src = chrome.runtime.getURL('sandbox.html');
    sandboxIframe.style.display = 'none';
    document.body.appendChild(sandboxIframe);

    // Listen for messages from the sandbox
    window.addEventListener('message', (event) => {
	// Basic validation: ensure the message is from our sandbox
	if (event.source !== sandboxIframe.contentWindow) return;

	if (event.data.type === 'SANDBOX_READY') {
	    console.log("Content script received SANDBOX_READY message.");
	    isSandboxReady = true;
	} else if (event.data.type === 'HAND_DETECTED') {
	    // We have a hand!
	    console.log("Hand detected:", event.data.hands[0].keypoints);
	    // TODO: Translate gesture to scroll
	}
    });
}

// Function to start detecting hands by sending frames to the sandbox
function startDetection() {
    if (!videoElement) {
	console.log("Video not ready for detection.");
	return;
    }

    // Setup a canvas to grab frames from the video
    canvasElement = document.createElement('canvas');
    canvasElement.style.display = 'none';
    document.body.appendChild(canvasElement);
    // 'willReadFrequently' is an optimization hint for the browser
    canvasContext = canvasElement.getContext('2d', { willReadFrequently: true });

    detectionInterval = setInterval(() => {
	// Only send frames if the sandbox is ready and the video has data
	if (!isSandboxReady || !videoElement || videoElement.readyState < 2) {
	    return;
	}

	// Match canvas size to video size
	if (canvasElement.width !== videoElement.videoWidth) {
	    canvasElement.width = videoElement.videoWidth;
	    canvasElement.height = videoElement.videoHeight;
	}

	// Draw the current video frame to the canvas
	canvasContext.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);
	// Get the image data from the canvas
	const imageData = canvasContext.getImageData(0, 0, canvasElement.width, canvasElement.height);

	// Send the image data to the sandbox for processing
	sandboxIframe.contentWindow.postMessage({ type: 'DETECT_HAND', imageData: imageData }, '*');

    }, 100); // Adjust interval as needed
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
	videoElement.setAttribute('playsinline', ''); // Required for autoplay on some platforms
	document.body.appendChild(videoElement);

	await new Promise((resolve) => {
	    videoElement.onloadedmetadata = () => {
		videoElement.play().catch(e => console.error("Video play failed:", e));
		resolve();
	    };
	});

	console.log("Webcam started successfully.");

	// Initialize the sandbox and start the detection loop
	initSandbox();
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
    if (canvasElement) {
	canvasElement.remove();
	canvasElement = null;
    }
    if (sandboxIframe) {
	sandboxIframe.remove();
	sandboxIframe = null;
    }
    isSandboxReady = false;
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

// Listen for changes in storage
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
