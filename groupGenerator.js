    document.addEventListener("DOMContentLoaded", function() {
    // Define variables for animation, data storage, and DOM elements
    let animationInterval;
    let confettiTimeouts = [];
    let lastAction = null;
    let storedNames = JSON.parse(localStorage.getItem('names')) || [];
    let checkboxStates = JSON.parse(localStorage.getItem('checkboxStates')) || {};
    const membersContainer = document.getElementById("members-container");
    const groupsContainer = document.getElementById("groups-container");
    const addMemberInput = document.getElementById("add-member-input");
    const selectAllButton = document.getElementById("select-all-button");
    const settingsButton = document.getElementById("parameters-group-button");
    const settingsContainer = document.getElementById("group-settings-container");
    const slider = document.getElementById('group-size-slider');
    const sliderValueDisplay = document.getElementById('slider-value');
    const checkboxes = document.querySelectorAll(".name-checkbox");
    const deleteSvgIcon = `
        <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>`;
        const defaultConfettiOptions = { zIndex: 9998 };

    storedNames = [...new Set(storedNames)].sort();

    // Toggle settings container display
    settingsButton.addEventListener('click', toggleSettingsDisplay);
    slider.addEventListener('input', updateSliderValue);
    document.getElementById("add-member-button").addEventListener('click', addNewMember);
    membersContainer.addEventListener('click', handleMemberContainerClick);
    document.getElementById("generate-button").addEventListener("click", generateGroupsButtonClicked);
    document.getElementById("select-random-button").addEventListener('click', selectRandomMemberClicked);
    document.getElementById("shuffle-names-button").addEventListener('click', shuffleNames);
    membersContainer.addEventListener('change', handleCheckboxChange);
    document.getElementById("groups-container").addEventListener('click', relaunchLastAction);

    // Initialize slider value from local storage
    if (localStorage.getItem('groupSize')) {
        slider.value = localStorage.getItem('groupSize');
        sliderValueDisplay.textContent = slider.value;
    }

    function toggleSettingsDisplay() {
    if (settingsContainer.style.display === "block") {
        settingsContainer.style.display = "none";
        settingsButton.classList.remove("active");
    } else {
        settingsContainer.style.display = "block";
        settingsButton.classList.add("active");
    }
}

function updateSliderValue() {
        sliderValueDisplay.textContent = this.value;
        localStorage.setItem('groupSize', this.value);
    }

    document.getElementById("add-member-input").addEventListener("keyup", function(event) {
    if (event.key === "Enter") {
        addNewMember(); // Call the existing function when Enter is pressed
        event.preventDefault(); // Prevent default form submission behavior
    }
});

function addNewMember() {
    const name = addMemberInput.value.trim();
    if (!name) {
        displayMessage("Please enter a name.", true);
        return;
    }

    if (storedNames.includes(name)) {
        displayMessage("Name already exists.", true);
        return;
    }

    // Add the new member as the name is valid
    storedNames.push(name);
    storedNames.sort(); // Sort the names alphabetically
    renderMembersList(); // Re-render the members list to include the new name
    addMemberInput.value = ''; // Clear the input field
    localStorage.setItem('names', JSON.stringify(storedNames)); // Update local storage
    updateSelectAllButtonText(); // Update the select all button text
}

function handleMemberContainerClick(event) {
        if (event.target.closest('.delete-button')) {
            const memberLabel = event.target.closest('.member-label');
            const checkbox = memberLabel.querySelector('.name-checkbox');
            removeMember(checkbox.value);
            updateSelectAllButtonText(); // Update button text here
        }
    }

    function removeMember(name) {
        const index = storedNames.indexOf(name);
        if (index > -1) {
            storedNames.splice(index, 1);
            renderMembersList();
            localStorage.setItem('names', JSON.stringify(storedNames));
        }
    }
    function generateGroupsButtonClicked() {
    resetAnimationAndClearResults();
    if (!checkSelectedNames()) return;
    const selectedNames = getSelectedNames();
    const groups = generateGroups(selectedNames);
    displayGroups(groups);
    applyGroupColors();
    triggerConfetti();
}

// clean effects before to run new results
function resetAnimationAndClearResults() {
    clearInterval(animationInterval);
    removeHighlights();
    clearConfetti();
    groupsContainer.innerHTML = '';
}

// Select a random Member
function selectRandomMemberClicked() {
    resetAnimationAndClearResults();
    if (checkSelectedNames()) {
        startRandomSelection();
        lastAction = 'random';  // Update this line to set the last action as 'random'
    }
}


function shuffleNames() {
    // 1. Preserve Checkbox States
    const checkboxStatesBeforeShuffle = {};
    document.querySelectorAll(".name-checkbox").forEach(checkbox => {
        checkboxStatesBeforeShuffle[checkbox.value] = checkbox.checked;
    });

    // 2. Shuffle Names
    storedNames = shuffleArray(storedNames);

    // 3. Re-render Member List
    renderMembersList();

    // 4. Restore Checkbox States
    document.querySelectorAll(".name-checkbox").forEach(checkbox => {
        checkbox.checked = checkboxStatesBeforeShuffle[checkbox.value] || false;
    });

    // 5. Update Event Handlers (if necessary)
    // This is typically handled in renderMembersList if it re-attaches event listeners

    // 6. Save the updated list to local storage
    localStorage.setItem('names', JSON.stringify(storedNames));
}

    function handleCheckboxChange(event) {
    if (event.target.classList.contains('name-checkbox')) {
        const checkbox = event.target;
        updateCheckboxState(checkbox.value, checkbox.checked);
        updateSelectAllButtonText(); // Update button text here
    }
}

function relaunchLastAction() {
    if (lastAction === 'random') {
        selectRandomMemberClicked();
    } else if (lastAction === 'group') {
        generateGroupsButtonClicked();
    }
}

    // Render members list
    function renderMembersList() {
    membersContainer.innerHTML = '';
    storedNames.forEach(name => {
        const isChecked = checkboxStates[name] !== false;
        renderMember(name, isChecked);
    });
    updateSelectAllButtonText();
}

function updateSelectAllButtonText() {
    const checkboxes = document.querySelectorAll(".name-checkbox");
    const allChecked = Array.from(checkboxes).every(checkbox => checkbox.checked);
    selectAllButton.textContent = allChecked ? "Deselect All" : "Select All";
}

// Render a single member
function renderMember(name, isChecked) {
    const memberDiv = document.createElement('div');
    memberDiv.className = 'member-label';
    memberDiv.innerHTML = `
        <div class="checkbox-wrapper-42">
            <input id="cbx-${name}" type="checkbox" class="name-checkbox" value="${name}" ${isChecked ? 'checked' : ''} />
            <label class="cbx" for="cbx-${name}"></label>
            <label class="lbl" for="cbx-${name}">${name}</label>
        </div>
        <button class="delete-button">${deleteSvgIcon}</button>
    `;
    membersContainer.appendChild(memberDiv);
    const checkbox = memberDiv.querySelector('.name-checkbox');
    checkbox.addEventListener('change', handleCheckboxChange);
}

function handleCheckboxChange(event) {
    if (event.target.classList.contains('name-checkbox')) {
        const checkbox = event.target;
        updateCheckboxState(checkbox.value, checkbox.checked);
        updateSelectAllButtonText();
    }
}

// Start random selection process
function startRandomSelection() {
    if (!checkSelectedNames()) return;

    const checkedMemberLabels = Array.from(document.querySelectorAll(".member-label"))
                                     .filter(label => label.querySelector(".name-checkbox").checked);
    let currentHighlightIndex = -1;
    let intervalTime = getRandomInterval(20, 50);
    const maxIntervalTime = 300;

    function highlightRandomMember() {
        if (currentHighlightIndex !== -1) {
            checkedMemberLabels[currentHighlightIndex].classList.remove("member-label-highlighted");
        }

        let nextIndex;
        do {
            nextIndex = Math.floor(Math.random() * checkedMemberLabels.length);
        } while (nextIndex === currentHighlightIndex);

        currentHighlightIndex = nextIndex;
        checkedMemberLabels[currentHighlightIndex].classList.add("member-label-highlighted");

        // Update the groupsContainer with the current selection
        let currentMemberName = checkedMemberLabels[currentHighlightIndex].querySelector('.lbl').textContent;
    groupsContainer.innerHTML = `<div class='group' style='text-align:center;background-color: #c8bdfa'><strong style='font-size: 25px'>${currentMemberName}</strong></div>`;

        if (intervalTime < maxIntervalTime) {
            intervalTime += Math.floor(Math.random() * 20); // Random increase between 0 and 20
            clearInterval(animationInterval);
            animationInterval = setInterval(highlightRandomMember, intervalTime);
        } else {
            clearInterval(animationInterval);
            displaySelectedMember(checkedMemberLabels[currentHighlightIndex].querySelector('.name-checkbox').value);
        }
    }

    animationInterval = setInterval(highlightRandomMember, intervalTime);
}


// Generate groups
function generateGroups(selectedNames) {
    const shuffledNames = shuffleArray(selectedNames);
    const preferredMaxGroupSize = parseInt(slider.value, 10);
    const numberOfGroups = Math.ceil(shuffledNames.length / preferredMaxGroupSize);
    const groups = [];

    for (let i = 0; i < numberOfGroups; i++) {
        groups.push([]);
    }

    shuffledNames.forEach((name, i) => {
        groups[i % numberOfGroups].push(name);
    });

    return groups;
}

// Display generated groups
function displayGroups(groups) {
    groupsContainer.innerHTML = '';
    groups.forEach((group, index) => {
        const groupElement = document.createElement("div");
        groupElement.className = "group";
        groupElement.innerHTML = `<strong>Group ${index + 1}:</strong> ${group.join(", ")}`;
        groupsContainer.appendChild(groupElement);
    });
    lastAction = 'group';
    addRelaunchOption();
}


// Update checkbox state
function updateCheckboxState(name, isChecked) {
    checkboxStates[name] = isChecked;
    localStorage.setItem('checkboxStates', JSON.stringify(checkboxStates));
}

// Random interval generator
function getRandomInterval(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Create relaunch text element
function createRelaunchOption() {
    const relaunchDiv = document.createElement('div');
    relaunchDiv.className = 'relaunch-option';
    relaunchDiv.textContent = 'Tap to relaunch';
    relaunchDiv.style.cursor = 'pointer';
    relaunchDiv.style.color = 'white';
    relaunchDiv.style.marginTop = '10px';
    relaunchDiv.addEventListener('click', () => {
        if (lastAction === 'random') {
            selectRandomMemberClicked();  // Relaunch random member selection
        } else if (lastAction === 'group') {
            generateGroupsButtonClicked();  // Relaunch group generation
        }
    });

    return relaunchDiv;
}

// Select/Deselect All
selectAllButton.addEventListener("click", function() {
    const checkboxes = document.querySelectorAll(".name-checkbox");
    const allChecked = Array.from(checkboxes).every(checkbox => checkbox.checked);
    
    checkboxes.forEach(checkbox => {
        checkbox.checked = !allChecked;
        updateCheckboxState(checkbox.value, checkbox.checked);
    });

    updateSelectAllButtonText();
});

// Slider event listener for dynamic group size selection
slider.addEventListener('input', function() {
    sliderValueDisplay.textContent = this.value;
    localStorage.setItem('groupSize', this.value);
});

// Store checkbox states in local storage
function updateCheckboxState(name, isChecked) {
    checkboxStates[name] = isChecked;
    localStorage.setItem('checkboxStates', JSON.stringify(checkboxStates));
}

// Display a message in the groups container
function displayMessage(message) {
    // Both regular and error messages use the same styling
    groupsContainer.innerHTML = `<div class='group' style='background-color: #ffe8e6; color: #ed705a; font-weight: 600; text-align:center;'>${message}</div>`;
}

// Utility function to remove all highlights
function removeHighlights() {
    document.querySelectorAll('.member-label-highlighted')
             .forEach(label => label.classList.remove('member-label-highlighted'));
}

// Utility function to get selected names
function getSelectedNames() {
    return Array.from(document.querySelectorAll(".name-checkbox:checked")).map(checkbox => checkbox.value);
}

// Utility function to apply colors to groups
function applyGroupColors() {
    const colors = ['#f0d192', '#bce0ca', '#f5bf9e', '#c8bdfa', '#bce4f9'];
    document.querySelectorAll('.group').forEach((group, index) => {
        group.style.backgroundColor = colors[index % colors.length];
        group.style.color = '#000000';
    });
}

// Utility function to shuffle an array
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Display the selected member
function displaySelectedMember(name) {
    groupsContainer.innerHTML = `<div class='group' style='text-align:center;background-color: #c8bdfa'>
        Winner<br><strong style='font-size: 25px'>${name}</strong>
    </div>`;

    // Create and append the button for deselecting the winner
    const deselectButton = createDeselectButton();
    deselectButton.classList.add('fade-in');
    groupsContainer.appendChild(deselectButton);

    const relaunchText = createRelaunchOption();
    relaunchText.classList.add('fade-in');
    groupsContainer.appendChild(relaunchText);

    // Add visible class after a delay
    setTimeout(function() {
        deselectButton.classList.add('visible');
        relaunchText.classList.add('visible');
    }, 1000); // Delay of 1 second
    triggerConfetti();
}

// Trigger confetti animation
function triggerConfetti() {
    function confettiBurst(options) {
    // Merge the options with default confetti settings, including zIndex
    const defaultOptions = {
        zIndex: 9998, // Ensure it's below the groups container
    };
    const finalOptions = Object.assign({}, defaultOptions, options);

    confetti(finalOptions);
}

    // Array of confetti styles
    const confettiStyles = [
        { spread: 60, startVelocity: 55 },
        { spread: 80 },
        { spread: 100, decay: 0.91, scalar: 0.8 },
        { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 },
        { spread: 180, startVelocity: 45, decay: 0.95, scalar: 1.5 }
    ];

    // Generate multiple bursts with different styles
    for (let i = 0; i < 8; i++) {
        let origin = {
            x: 0.5 + Math.random() * 0.1 - 0.06,
            y: Math.random() * 0.4 + 0.3
        };

        let options = Object.assign({}, {
            particleCount: 100 + Math.random() * 100,
            angle: Math.random() * 140,
            origin: origin
        }, confettiStyles[i % confettiStyles.length]);

        // Randomly intersperse big bursts
        if (Math.random() < 0.3) {
            options = Object.assign(options, {
                particleCount: 150,
                spread: 120,
                startVelocity: 55,
                gravity: 1.2,
                scalar: 1.5
            });
        }

        setTimeout(() => {
            confettiBurst(options);
        }, i * 300);
    }

    // Grand finale: 5 big bursts in different locations
    const finaleBursts = [
        { x: 0.2, y: 1 },
        { x: 0.4, y: 1 },
        { x: 0.6, y: 1 },
        { x: 0.8, y: 1 },
        { x: 0.5, y: 1 }
    ];

    finaleBursts.forEach((origin, index) => {
        const timeoutId = setTimeout(() => {
            confettiBurst({
                particleCount: 150,
                angle: 90,
                spread: 120,
                origin: origin,
                startVelocity: 55,
                gravity: 1.2,
                scalar: 1.5
            });
        }, 3000 + index * 300);
        confettiTimeouts.push(timeoutId); // Store the timeout ID
    });
}


// Function to check if selected names are enough
function checkSelectedNames() {
    const selectedNames = getSelectedNames();
    if (selectedNames.length < 2) {
        displayMessage("Please select at least 2 names.");
        return false;
    }
    return true;
}

// Function to get selected names
function getSelectedNames() {
    return Array.from(document.querySelectorAll(".name-checkbox:checked")).map(checkbox => checkbox.value);
}


// Add relaunch option to the groups container
function addRelaunchOption() {
    const relaunchText = createRelaunchOption();
    groupsContainer.appendChild(relaunchText);
}

// Deselect and Redraw for Random Selection
function createDeselectButton() {
    const deselectButton = document.createElement('button');
    deselectButton.textContent = 'Deselect & Redraw';
    deselectButton.classList.add('deselect-button');
    deselectButton.addEventListener('click', () => {
        // Find the highlighted member
        const highlightedMemberLabel = document.querySelector('.member-label-highlighted');
        if (highlightedMemberLabel) {
            const checkbox = highlightedMemberLabel.querySelector('.name-checkbox');
            if (checkbox) {
                checkbox.checked = false; // Deselect only the highlighted member
                updateCheckboxState(checkbox.value, false); // Update the state in localStorage
            }
            removeHighlights(); // Remove highlight from all labels
            clearConfetti(); // Clear confetti
        }
        // Optionally, you can trigger a new random selection here
        // startRandomSelection();
    });
    return deselectButton;
}

// Update checkbox state
function updateCheckboxState(name, isChecked) {
    checkboxStates[name] = isChecked;
    localStorage.setItem('checkboxStates', JSON.stringify(checkboxStates));
}

function clearConfetti() {
    // Stop any scheduled confetti bursts
    confettiTimeouts.forEach(timeoutId => clearTimeout(timeoutId));
    confettiTimeouts = []; // Reset the timeouts array

    // Fire an empty confetti burst to stop ongoing animations
    confetti({
        particleCount: 0,
        startVelocity: 0
    });
}

// Initialize the application
renderMembersList();
updateSelectAllButtonText();

});
