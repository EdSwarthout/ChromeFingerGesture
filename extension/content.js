// This script is injected into every webpage.

console.log("Gesture Scroller: Content script loaded.");

let isEnabled = false;

// Function to start or stop the gesture detection logic
function handleGestureControl(enabled) {
    if (enabled) {
        console.log("Gesture control ACTIVATED. (Logic to come in next step)");
        // TODO: Add webcam and TensorFlow.js initialization here
    } else {
        console.log("Gesture control DEACTIVATED.");
        // TODO: Add cleanup logic here (e.g., turn off webcam)
    }
}

// Listen for changes in the storage.
// This allows the content script to react when the user toggles the switch in the popup.
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
