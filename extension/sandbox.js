console.log("Sandbox script started.");

let detector;

// This function initializes the hand detection model.
async function initializeDetector() {
    try {
	// Wait for the global 'handPoseDetection' object to be ready.
	await new Promise(resolve => {
	    const interval = setInterval(() => {
		if (window.handPoseDetection) {
		    clearInterval(interval);
		    resolve();
		}
	    }, 100);
	});

	const model = handPoseDetection.SupportedModels.MediaPipeHands;
	const detectorConfig = {
	    runtime: 'tfjs', // Use the TensorFlow.js runtime
	    modelType: 'lite', // 'lite' is faster, 'full' is more accurate
	    maxHands: 1 // We only need to track one hand
	};
	detector = await handPoseDetection.createDetector(model, detectorConfig);
	console.log("Sandbox: Detector initialized successfully.");
	// Signal to the parent (content.js) that the model is loaded and ready.
	window.parent.postMessage({ type: 'SANDBOX_READY' }, '*');
    } catch (error) {
	console.error("Sandbox: Error initializing detector", error);
    }
}

// Listen for messages from the content script
window.addEventListener('message', async (event) => {
    // A safety check to not listen to our own messages
    if (event.source === window) {
	return;
    }

    // Check if we received a frame to process
    if (event.data && event.data.type === 'DETECT_HAND') {
	if (!detector) {
	    console.log("Sandbox: Detector not ready, ignoring message.");
	    return;
	}

	try {
	    // 'estimateHands' is the core function that runs the model
	    const hands = await detector.estimateHands(event.data.imageData, { flipHorizontal: true });
	    if (hands.length > 0) {
		// If a hand is found, send the keypoints back to the content script
		window.parent.postMessage({ type: 'HAND_DETECTED', hands: hands }, '*');
	    }
	} catch (error) {
	    console.error("Sandbox: Error during hand estimation", error);
	}
    }
});

// Start the initialization process as soon as the script loads.
initializeDetector();
