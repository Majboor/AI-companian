import { marked } from "https://cdn.jsdelivr.net/npm/marked/lib/marked.esm.js";
import { GoogleGenerativeAI } from "https://esm.run/@google/generative-ai";
import { HarmBlockThreshold, HarmCategory } from "https://esm.run/@google/generative-ai";

const version = "0.1";

//inputs
const ApiKeyInput = document.querySelector("#apiKeyInput");
const maxTokensInput = document.querySelector("#maxTokens");
const messageInput = document.querySelector("#messageInput");

//forms
const addPersonalityForm = document.querySelector("#form-add-personality");
const editPersonalityForm = document.querySelector("#form-edit-personality");

//buttons
const sendMessageButton = document.querySelector("#btn-send");
const clearAllButton = document.querySelector("#btn-clearall-personality");
const whatsNewButton = document.querySelector("#btn-whatsnew");
const submitNewPersonalityButton = document.querySelector("#btn-submit-personality");
const importPersonalityButton = document.querySelector("#btn-import-personality");
const addPersonalityButton = document.querySelector("#btn-add-personality");
const hideOverlayButton = document.querySelector("#btn-hide-overlay");
const submitPersonalityEditButton = document.querySelector("#btn-submit-personality-edit");
const hideSidebarButton = document.querySelector("#btn-hide-sidebar");
const showSidebarButton = document.querySelector("#btn-show-sidebar");

//containers
const sidebar = document.querySelector(".sidebar");
const messageContainer = document.querySelector(".message-container");
const personalityCards = document.getElementsByClassName("card-personality");
const formsOverlay = document.querySelector(".overlay");
const sidebarViews = document.getElementsByClassName("sidebar-section");
const defaultPersonalityCard = document.querySelector("#card-personality-default");

//nav elements
const tabs = [...document.getElementsByClassName("navbar-tab")];
const tabHighlight = document.querySelector(".navbar-tab-highlight");

//misc
const badge = document.querySelector("#btn-whatsnew");

//-------------------------------

//load api key from local storage into input field
ApiKeyInput.value = localStorage.getItem("API_KEY");
maxTokensInput.value = localStorage.getItem("maxTokens");
if (maxTokensInput.value == "") maxTokensInput.value = 1000;

//define AI settings
const safetySettings = [

    {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
    }
];
const systemPrompt = "If needed, format your answer using markdown." +
    "Today's date is" + new Date().toDateString() + "." +
    "End of system prompt.";

//setup tabs
let currentTab = undefined;
tabHighlight.style.width = `calc(100% / ${tabs.length})`;
tabs.forEach(tab => {
    tab.addEventListener("click", () => {
        navigateTo(tab);
    })
});

[...sidebarViews].forEach(view => {
    hideElement(view);
});

navigateTo(tabs[0]);

//load personalities on launch
const personalitiesArray = JSON.parse(getLocalPersonalities());
if (personalitiesArray) {
    for (let personality of personalitiesArray) {
        insertPersonality(personality);
    }
}
let personalityToEditIndex = 0;

//add default personality card event listeners and initial state
const shareButton = defaultPersonalityCard.querySelector(".btn-share-card");
const editButton = defaultPersonalityCard.querySelector(".btn-edit-card");
const input = defaultPersonalityCard.querySelector("input");

shareButton.addEventListener("click", () => {
    sharePersonality(defaultPersonalityCard);
}
);

editButton.addEventListener("click", () => {
    alert("triggered stuff");
    return;
});

input.addEventListener("change", () => {
    // Darken all cards
    [...personalityCards].forEach(card => {
        card.style.outline = "0px solid rgb(150 203 236)";
        darkenBg(card);
    })
    // Lighten selected card
    input.parentElement.style.outline = "3px solid rgb(150 203 236)";
    lightenBg(input.parentElement);
});

if (input.checked) {
    lightenBg(input.parentElement);
    input.parentElement.style.outline = "3px solid rgb(150 203 236)";
}

//setup version number on badge and header
badge.querySelector("#badge-version").textContent = `v${version}`;
document.getElementById('header-version').textContent += ` v${version}`;

//show whats new on launch if new version
const prevVersion = localStorage.getItem("version");
if (prevVersion != version) {
    localStorage.setItem("version", version);
    badge.classList.add("badge-highlight");
    setTimeout(() => {
        badge.classList.remove("badge-highlight");
    }, 7000);
}

//event listeners
hideOverlayButton.addEventListener("click", closeOverlay);

addPersonalityButton.addEventListener("click", showAddPersonalityForm);

submitNewPersonalityButton.addEventListener("click", submitNewPersonality);

submitPersonalityEditButton.addEventListener("click", () => {submitPersonalityEdit(personalityToEditIndex)});

sendMessageButton.addEventListener("click", run);

//enter key to send message but support shift+enter for new line
messageInput.addEventListener("keydown", (e) => {
    if (e.key == "Enter" && !e.shiftKey) {
        e.preventDefault();
        run();
    }
});

whatsNewButton.addEventListener("click", showWhatsNew);

hideSidebarButton.addEventListener("click", () => {
    hideElement(sidebar);
});

showSidebarButton.addEventListener("click", () => {
    showElement(sidebar);
});

clearAllButton.addEventListener("click", () => {
    localStorage.removeItem("personalities");
    [...personalityCards].forEach(card => {
        if (card != defaultPersonalityCard) {
            card.remove();
        }
    });
});

importPersonalityButton.addEventListener("click", () => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.addEventListener('change', () => {
        const file = fileInput.files[0];
        const reader = new FileReader();
        reader.onload = function (e) {
            const personalityJSON = JSON.parse(e.target.result);
            insertPersonality(personalityJSON);
            setLocalPersonality(personalityJSON);
        };
        reader.readAsText(file);
    });
    fileInput.click();
    fileInput.remove();
});

window.addEventListener("resize", () => {
    //show sidebar if window is resized to desktop size
    if (window.innerWidth > 768) {
        showElement(document.querySelector(".sidebar"));
    }
});

messageInput.addEventListener("input", () => {
    //auto resize message input
    if (messageInput.value.split("\n").length == 1) {
        messageInput.style.height = "2.5rem";
    }
    else {
        messageInput.style.height = "";
        messageInput.style.height = messageInput.scrollHeight + "px";
    }
});

//-------------------------------

//functions
function hideElement(element) {
    element.style.transition = 'opacity 0.2s';
    element.style.opacity = '0';
    setTimeout(function () {
        element.style.display = 'none';
    }, 200);
}

function showElement(element) {
    // Wait for other transitions to complete (0.2s delay)
    setTimeout(function () {
        // Change display property
        element.style.display = 'flex';
        // Wait for next frame for display change to take effect
        requestAnimationFrame(function () {
            // Start opacity transition
            element.style.transition = 'opacity 0.2s';
            element.style.opacity = '1';
        });
    }, 200);
}

function darkenBg(element) {
    let elementBackgroundImageURL = element.style.backgroundImage.match(/url\((.*?)\)/)[1].replace(/('|")/g, '');
    element.style.backgroundImage = `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url('${elementBackgroundImageURL}')`;
}


function lightenBg(element) {

    let elementBackgroundImageURL = element.style.backgroundImage.match(/url\((.*?)\)/)[1].replace(/('|")/g, '');
    element.style.backgroundImage = `url('${elementBackgroundImageURL}')`;
}

function showStylizedPopup() {
    // Create popupContainer dynamically
    const popupContainer = document.createElement('div');
    popupContainer.id = 'popupContainer';
    popupContainer.className = 'popup-container';
    
    // Create popupContent dynamically
    const popupContent = document.createElement('div');
    popupContent.id = 'popupContent';
    popupContent.className = 'popup-content';

    // Add popupContent to popupContainer
    popupContainer.appendChild(popupContent);

    // Show the popup
    popupContainer.style.display = 'flex';

    // Add popupContainer to the body
    document.body.appendChild(popupContainer);

    // Function to close popup
    function closePopup() {
        popupContainer.style.display = 'none';
    }

    // Initially show Step 1 content
    showStep1();

    // Function to show Step 1 content
    function showStep1() {
        popupContent.innerHTML = `
            <h2>How Do I Help?</h2>
            <p>Welcome to the Creative Writing Companian!</p>
            <p>I am not the normal GPT</p>
            <button id="btnNext" class="btn-next">Next</button>
            <button id="btnClose" class="btn-close">Close</button>
        `;
        document.getElementById('btnNext').addEventListener('click', showStep2);
        document.getElementById('btnClose').addEventListener('click', closePopup);
    }

    // Function to show Step 2 content
    function showStep2() {
        popupContent.innerHTML = `
            <h2>Sorry I Cant Write For You.</h2>
            <p>We Write, Grow and Learn Together</p>
            <button id="btnNext" class="btn-next">Next</button>
            <button id="btnClose" class="btn-close">Close</button>
        `;
        document.getElementById('btnNext').addEventListener('click', showStep3);
        document.getElementById('btnClose').addEventListener('click', closePopup);
    }

    function showStep3() {
        popupContent.innerHTML = `
            <h2>How we really write</h2>
            <p>I can do</p>
            <button id="btnClose" class="btn-close">Close</button>
        `;
        document.getElementById('btnClose').addEventListener('click', closePopup);
    }
}

function navigateTo(tab) {
    if (tab == tabs[currentTab]) {
        return;
    }
    // set the highlight to match the size of the tab element


    let tabIndex = [...tabs].indexOf(tab);
    if (tabIndex < 0 || tabIndex >= sidebarViews.length) {
        console.error("Invalid tab index: " + tabIndex);
        return;
    }

    if (currentTab != undefined) {
        hideElement(sidebarViews[currentTab]);
    }
    showElement(sidebarViews[tabIndex]);
    currentTab = tabIndex;

    tabHighlight.style.left = `calc(100% / ${tabs.length} * ${tabIndex})`;

}

function sharePersonality(personality) {
    //export personality to json
    const personalityJSON = {
        name: personality.querySelector(".personality-title").innerText,
        description: personality.querySelector(".personality-description").innerText,
        prompt: personality.querySelector(".personality-prompt").innerText,
        //base64 encode image
        image: personality.style.backgroundImage.match(/url\((.*?)\)/)[1].replace(/('|")/g, '')
    }
    const personalityJSONString = JSON.stringify(personalityJSON);
    //download
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(personalityJSONString));
    element.setAttribute('download', `${personalityJSON.name}.json`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
}


function showAddPersonalityForm() {
    showElement(formsOverlay);
    showElement(addPersonalityForm);
}

function showEditPersonalityForm() {
    showElement(formsOverlay);
    showElement(editPersonalityForm);
}

function closeOverlay() {
    hideElement(formsOverlay);
    hideElement(addPersonalityForm);
    hideElement(editPersonalityForm);
    hideElement(document.querySelector("#whats-new"));
}

function showDeploymentStatus(message) {
    const alertContainer = document.createElement('div');
    alertContainer.textContent = message;
    alertContainer.style.position = 'fixed';
    alertContainer.style.bottom = '10px';
    alertContainer.style.left = '10px'; // Positioned on the left
    alertContainer.style.backgroundColor = '#111'; // Grey background
    alertContainer.style.color = '#fff'; // White font color
    alertContainer.style.padding = '5px 10px';
    alertContainer.style.borderRadius = '5px';
    alertContainer.style.boxShadow = '0px 2px 5px rgba(0, 0, 0, 0.3)';
    alertContainer.style.zIndex = '9999';

    // Create a cross button
    const closeButton = document.createElement('button');
    closeButton.textContent = '✖';
    closeButton.style.backgroundColor = 'transparent';
    closeButton.style.color = '#fff';
    closeButton.style.border = 'none';
    closeButton.style.cursor = 'pointer';
    closeButton.style.float = 'right';
    closeButton.style.fontSize = '20px';
    closeButton.style.marginLeft = '5px';
    closeButton.onclick = function(event) {
        event.stopPropagation(); // Prevents the click event from reaching the alert container
        alertContainer.remove();
    };

    // Append the close button to the alert container
    alertContainer.appendChild(closeButton);

    // Add click event listener to the alert container to close it
    alertContainer.onclick = function() {
        alertContainer.remove();
    };

    document.body.appendChild(alertContainer);

    // Remove the alert after 3 seconds
    setTimeout(function() {
        alertContainer.remove();
    }, 3000);
}

// Example usage:
// showDeploymentStatus('Deployment in progress...');


// Example usage:
// showDeploymentStatus('Deployment in progress...');





function insertPersonality(personalityJSON) {
    const personalitiesDiv = document.querySelector("#personalitiesDiv");
    const personalityCard = document.createElement("label");

    personalityCard.classList.add("card-personality");
    personalityCard.style.backgroundImage = `url('${personalityJSON.image}')`;
    personalityCard.innerHTML = `
            <input type="radio" name="personality" value="${personalityJSON.name}">
            <div>
                <h3 class="personality-title">${personalityJSON.name}</h3>
                <p class="personality-description">${personalityJSON.description}</p>
                <p class="personality-prompt">${personalityJSON.prompt}</p>
            </div>
            <button class="btn-textual btn-edit-card material-symbols-outlined" 
                id="btn-edit-personality-${personalityJSON.name}">edit</button>
            <button class="btn-textual btn-share-card material-symbols-outlined" 
                id="btn-share-personality-${personalityJSON.name}">share</button>
            <button class="btn-textual btn-delete-card material-symbols-outlined"
                id="btn-delete-personality-${personalityJSON.name}">delete</button>
            `;

       // Add click event listener to the personality card
    personalityCard.addEventListener("click", () => {        
        console.log(personalityJSON.name)     
        // Example usage:
        showDeploymentStatus(`You Are in ${personalityJSON.name} Mode`);   
    });
            
    //insert personality card before the button array
    personalitiesDiv.append(personalityCard);
    darkenBg(personalityCard);

    const shareButton = personalityCard.querySelector(".btn-share-card");
    const deleteButton = personalityCard.querySelector(".btn-delete-card");
    const editButton = personalityCard.querySelector(".btn-edit-card");
    const input = personalityCard.querySelector("input");

    shareButton.addEventListener("click", () => {
        sharePersonality(personalityCard);
    });

    //conditional because the default personality card doesn't have a delete button
    if(deleteButton){
        deleteButton.addEventListener("click", () => {
            deleteLocalPersonality(Array.prototype.indexOf.call(personalityCard.parentNode.children, personalityCard));
            personalityCard.remove();
        });
    }

    editButton.addEventListener("click", () => {
        personalityToEditIndex = Array.prototype.indexOf.call(personalityCard.parentNode.children, personalityCard);
        showEditPersonalityForm();
        const personalityName = personalityCard.querySelector(".personality-title").innerText;
        const personalityDescription = personalityCard.querySelector(".personality-description").innerText;
        const personalityPrompt = personalityCard.querySelector(".personality-prompt").innerText;
        const personalityImageURL = personalityCard.style.backgroundImage.match(/url\((.*?)\)/)[1].replace(/('|")/g, '');
        document.querySelector("#form-edit-personality #personalityNameInput").value = personalityName;
        document.querySelector("#form-edit-personality #personalityDescriptionInput").value = personalityDescription;
        document.querySelector("#form-edit-personality #personalityPromptInput").value = personalityPrompt;
        document.querySelector("#form-edit-personality #personalityImageURLInput").value = personalityImageURL;
    });

    input.addEventListener("change", () => {
        // Darken all cards
        [...personalityCards].forEach(card => {
            card.style.outline = "0px solid rgb(150 203 236)";
            darkenBg(card);
        })
        // Lighten selected card
        input.parentElement.style.outline = "3px solid rgb(150 203 236)";
        lightenBg(input.parentElement);
    });

    // Set initial outline
    if (input.checked) {
        lightenBg(input.parentElement);
        input.parentElement.style.outline = "3px solid rgb(150 203 236)";
    }

    // Check if hash is #writing and personality name is "Creative Writing"
// Check for #writing hash in the URL and the personality name
// Check for #writing hash in the URL and the personality name
// Check for #writing hash in the URL and the personality name
if (window.location.hash === '#writing' && personalityJSON.name === 'Creative Writing') {
    // Call custom popup function
    personalityCard.click();
    showStylizedPopup();
}




}
  
    
    




function setLocalPersonality(personalityJSON) {
    const savedPersonalities = JSON.parse(localStorage.getItem("personalities"));
    let newSavedPersonalities = [];
    if (savedPersonalities) {
        newSavedPersonalities = [...savedPersonalities, personalityJSON];
    }
    else {
        newSavedPersonalities = [personalityJSON];
    }
    localStorage.setItem("personalities", JSON.stringify(newSavedPersonalities));
}

function submitNewPersonality() {
    const personalityName = document.querySelector("#form-add-personality #personalityNameInput");
    const personalityDescription = document.querySelector("#form-add-personality #personalityDescriptionInput");
    const personalityImageURL = document.querySelector("#form-add-personality #personalityImageURLInput");
    const personalityPrompt = document.querySelector("#form-add-personality #personalityPromptInput");

    if (personalityName.value == "") {
        alert("Please enter a personality name");
        return;
    }
    if (personalityPrompt.value == "") {
        alert("Please enter a personality prompt");
        return;
    }

    //to json
    const personalityJSON = {
        name: personalityName.value,
        description: personalityDescription.value,
        prompt: personalityPrompt.value,
        image: personalityImageURL.value
    }
    insertPersonality(personalityJSON);
    setLocalPersonality(personalityJSON);
    closeOverlay();
}

function submitPersonalityEdit(personalityIndex) {
    const newName = editPersonalityForm.querySelector("#personalityNameInput").value;
    const newDescription = editPersonalityForm.querySelector("#personalityDescriptionInput").value;
    const newPrompt = editPersonalityForm.querySelector("#personalityPromptInput").value;
    const newImageURL = editPersonalityForm.querySelector("#personalityImageURLInput").value;

    if (newName.value == "") {
        alert("Please enter a personality name");
        return;
    }
    if (newPrompt.value == "") {
        alert("Please enter a personality prompt");
        return;
    }

    const personalityCard = [...personalityCards][personalityIndex+1]; //+1 because the default personality card is not in the array
    personalityCard.querySelector(".personality-title").innerText = newName;
    personalityCard.querySelector(".personality-description").innerText = newDescription;
    personalityCard.querySelector(".personality-prompt").innerText = newPrompt;
    personalityCard.style.backgroundImage = `url('${newImageURL}')`;
    darkenBg(personalityCard);

    const personalitiesJSON = JSON.parse(getLocalPersonalities());
    personalitiesJSON[personalityIndex] = {
        name: newName,
        description: newDescription,
        prompt: newPrompt,
        image: newImageURL
    };
    localStorage.setItem("personalities", JSON.stringify(personalitiesJSON));
    closeOverlay();
}




function getLocalPersonalities() {
    const personalitiesJSON = localStorage.getItem("personalities");
    return personalitiesJSON;
}

function deleteLocalPersonality(index) {
    let localPers = JSON.parse(getLocalPersonalities());
    localPers.splice(index, 1);
    localStorage.setItem("personalities", JSON.stringify(localPers));
}

function getSanitized(string) {
    return DOMPurify.sanitize(string.replace(/</g, "&lt;").replace(/>/g, "&gt;").trim());
}

function showWhatsNew() {
    const whatsNewDiv = document.querySelector("#whats-new");
    showElement(formsOverlay);
    showElement(whatsNewDiv);
}

async function run() {
    const msg = document.querySelector("#messageInput");
    let msgText = getSanitized(msg.value);
    console.log(msgText)
    msg.value = "";
    document.getElementById('messageInput').style.height = "2.5rem"; //This will reset messageInput box to its normal size.
    if (msgText == "") {
        return;
    }
    const maxTokens = document.querySelector("#maxTokens");
    const API_KEY = document.querySelector("#apiKeyInput");
    const selectedPersonalityTitle = document.querySelector("input[name='personality']:checked + div .personality-title").innerText;
    console.log(selectedPersonalityTitle)


    const { steps, teach } = getPersonalityDetails(selectedPersonalityTitle);
    console.log(`STEPS`,steps);
    console.log(`teach`,teach);

    const selectedPersonalityToneExamples = [];
    //chat history
    let chatHistory = [];
    //get chat history from message container
    const messageElements = messageContainer.querySelectorAll(".message");
    messageElements.forEach(element => {
        const messageroleapi = element.querySelector(".message-role-api").innerText;
        const messagetext = element.querySelector(".message-text").innerText;
        chatHistory.push({
            role: messageroleapi,
            parts: [{ text: messagetext }]
        })
    })
    //reverse order of chat history
    chatHistory.reverse();



    const generationConfig = {
        maxOutputTokens: maxTokens.value,
        temperature: 0.9
    };
    const genAI = new GoogleGenerativeAI('AIzaSyBKQQq8CLYwz_1Hogh-cGvy5gqk8l5uU8k');
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const chat = model.startChat({
        generationConfig, safetySettings,
        history: [
            {
                role: "user",
              parts: [{ text: `you are a writing bot,your inputs and outputs are limited to questions IN ANY CASE DO NOT WRITE THE COMPLETE ESSAY Only chose one from the following [Explanation, Assessment of users Writing Level,Feedback on Your Writing,Guidance on Improvement recommended vocabulary specific words to be used literary devices and more,Rewriting users writing for Improvement,Collaborative Writing Exercise.] Any collaborative writing excercise should be with you not with any other human you should engage the user in a game. YOu are required to use the following writing style: ${selectedPersonalityTitle}, you can only do the following actions: ${steps}. In case of anything that is not related to the ${selectedPersonalityTitle} then prompt the user to please follow the steps. Avoid any inappropriate or non writing related questions you are a bot made to help write. If you are not aware of the topic then ask about the topic.you are to make the user learn about: ${teach}  the end of the message I should engage the user with the next step. ${systemPrompt}` }]
            },
            {
                role: "model",
                parts: [{ text: `Okay. From now on, I understand that I need to put each step in one message and at the end of the message I should engage the user with the next step I am not allowed to create steps on my own but I need to chose from the given list.I can not give all messages in one. I need to analyse the previous message and then suggest a response the current message being ${msgText} I shall help the user write a ${selectedPersonalityTitle}. 
                Your described steps to be taught will be used for the rest of the conversation. actions can only be chose from [Explanation, Assessment of users Writing Level,Feedback on Your Writing,Guidance on Improvement,Rewriting for Improvement,Collaborative Writing Exercise.]
                message1 I will start by asking the user about his topic
                message2 after inquring about the topic, I will want to ask the user about his piece of writing in order to examine how the user writes.
                message3 I will provide Feedback on users Writing which will be a detailed examine of the users writing style after the examination I would do 
                message3 if the user wants further Guidance on Improvement,if the user still fails to understand then Rewriting for Improvement would be ideal,
                in the last message I would encourage Collaborative Writing Exercise after it
                based on the conversation I will check which step and message has not been delievered and try to deliever them if so that none are missed most important being asking the user about topic and asking for a paragraph of his writing to analyse it. I understand that I need to put each step in each message and will start by asking the topic.` }]
            },
            ...selectedPersonalityToneExamples,
            ...chatHistory
        ]
    })

    //create new message div for the user's message then append to message container's top
    const newMessage = document.createElement("div");
    console.log(`you are a writing bot made to write in the writing style: ${selectedPersonalityTitle}, you can only do the following actions: ${steps} you are to make the user learn about: ${teach}. ${systemPrompt}`);
    newMessage.classList.add("message");
    newMessage.innerHTML = `
            <h3 class="message-role">You:</h3>
            <div class="message-role-api" style="display: none;">user</div>
            <p class="message-text">${msgText}</p>
            `;
    messageContainer.insertBefore(newMessage, messageContainer.firstChild);

    const result = await chat.sendMessageStream(msgText);

    //create new message div for the model's reply then append to message container's top
    const newReply = document.createElement("div");
    newReply.classList.add("message");
    newReply.classList.add("message-model");
    newReply.innerHTML = `
            <h3 class="message-role">${selectedPersonalityTitle}:</h3>
            <div class="message-role-api" style="display: none;">model</div>
            <p class="message-text">`;

    //get the p element inside the message div
    const replyText = newReply.querySelector(".message-text");


    messageContainer.insertBefore(newReply, messageContainer.firstChild);

    let rawText = "";
    for await (const chunk of result.stream) {
        rawText += chunk.text();

        replyText.innerHTML = DOMPurify.sanitize(marked.parse(rawText));
        void replyText.offsetHeight; // Force reflow
        hljs.highlightAll();
    }

    //save api key to local storage
    localStorage.setItem("API_KEY", API_KEY.value);
    localStorage.setItem("maxTokens", maxTokens.value);

}

//-------------------------------

// Get the personality HTML element
const myPersonalityElement = document.getElementById("myPersonality");

// Extract the necessary information
const personalityName = myPersonalityElement.querySelector(".personality-title").innerText;
const personalityDescription = myPersonalityElement.querySelector(".personality-description").innerText;
const personalityPrompt = myPersonalityElement.querySelector(".personality-prompt").innerText;
const personalityImageURL = "https://www.seekpng.com/png/full/84-843473_creative-writing-clipart-creative-writing-creativity-creative-writing.png"; // Extract image URL if it's set in the HTML

// Create a JavaScript object representing the personality
const myPersonality = {
    name: personalityName,
    description: personalityDescription,
    prompt: personalityPrompt,
    image: personalityImageURL // Set this to the actual image URL if it's available in the HTML
};


// Call the insertPersonality function with your personality object
insertPersonality(myPersonality);

// main.js



