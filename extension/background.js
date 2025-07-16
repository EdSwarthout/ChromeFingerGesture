// This script runs in the background of the extension.

// Set the initial state of the 'enabled' flag to false when the extension is installed.
chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.sync.set({ enabled: false });
    console.log('Gesture Scroller: Extension installed. Feature is disabled by default.');
});
