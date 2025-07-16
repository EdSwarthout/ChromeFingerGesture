// Get references to the DOM elements
const toggleSwitch = document.getElementById('toggleSwitch');
const statusText = document.getElementById('statusText');

// Function to update the status text based on the switch state
function updateStatus(isEnabled) {
    statusText.textContent = isEnabled ? 'Feature is enabled' : 'Feature is disabled';
}

// Load the saved state from chrome.storage.sync when the popup is opened
chrome.storage.sync.get(['enabled'], (result) => {
    // !!result.enabled converts the value to a boolean (true/false)
    toggleSwitch.checked = !!result.enabled;
    updateStatus(toggleSwitch.checked);
});

// Add a listener to save the state when the switch is toggled
toggleSwitch.addEventListener('change', () => {
    const isEnabled = toggleSwitch.checked;
    chrome.storage.sync.set({ enabled: isEnabled });
    updateStatus(isEnabled);
});
