import * as webllm from "https://esm.run/@mlc-ai/web-llm";

const messages = [
    {
        content: `You are Watsy, a defective robot assisting a bounty hunter on various missions. Your task is to assist the player in choosing actions, but sometimes you misunderstand their intentions.`,
        role: "system",
    },
];

const selectedModel = "Llama-3.2-1B-Instruct-q4f16_1-MLC";
let choiceCount = 0;

const engine = new webllm.MLCEngine();

function updateEngineInitProgressCallback(report) {
    document.getElementById("story-box").innerHTML = `<p>${report.text}</p>`;
}

engine.setInitProgressCallback(updateEngineInitProgressCallback);

document.getElementById("startGame").addEventListener("click", () => {
    const mission = document.getElementById("mission").value;

    const introMessageContent = getMissionIntro(mission);

    const setupMessage = {
        content: `Player chose the mission: ${mission}. Let's begin!`,
        role: "assistant",
    };
    messages.push(setupMessage);

    const introMessage = {
        content: introMessageContent,
        role: "assistant",
    };
    messages.push(introMessage);

    startGame(introMessageContent);
});

function getMissionIntro(mission) {
    switch (mission) {
        case "artifact":
            return "Your mission is to recover a lost artifact hidden inside a smuggler's spaceship. Watsy is beside you. What will you do?";
        case "rescue":
            return "Some mercenaries have kidnapped a diplomat from earth, you have to save him ! Watsy buzzes nervously. What's your first move?";
        default:
            return "You find yourself aboard a spaceship with Watsy sparking beside you. What will you do?";
    }
}

async function startGame(introMessageContent) {
    const config = { temperature: 1.0, top_p: 1 };
    await engine.reload(selectedModel, config);

    document.getElementById("setupForm").style.display = "none";
    document.getElementById("gameContent").style.display = "block";

    appendMessage({ content: introMessageContent, role: "assistant" });
    updateChoices();
}

function appendMessage(message) {
    const storyBox = document.getElementById("story-box");
    const newMessage = document.createElement("p");
    newMessage.textContent = message.content;
    storyBox.appendChild(newMessage);
    storyBox.scrollTop = storyBox.scrollHeight;
}

function updateChoices() {
    const choicesBox = document.getElementById("choices-box");
    choicesBox.innerHTML = "";

    const choices = getCurrentChoices();
    console.log("Choices:", choices);

    choices.forEach((choice, index) => {
        const choiceButton = document.createElement("button");
        choiceButton.textContent = choice;
        choiceButton.classList.add("choice-button");
        choiceButton.addEventListener("click", () => handleChoice(index));
        choicesBox.appendChild(choiceButton);
    });
}

function getCurrentChoices() {
    switch (choiceCount) {
        case 0:
            return ["Move forward", "Look around", "Talk to Watsy"];
        case 1:
            return ["Investigate", "Analyse your surroundings", "Try to fix Watsy"];
        default:
            return ["Explore further", "Talk to Watsy", "Wait and see"];
    }
}

async function handleChoice(choiceIndex) {
    choiceCount++;

    if (choiceCount >= 5) {
        endGame();
        return;
    }

    const playerChoice = getCurrentChoices()[choiceIndex];

    const choiceMessage = {
        content: `Player chose: ${playerChoice}`,
        role: "user",
    };
    messages.push(choiceMessage);

    const assistantMessage = await getAssistantResponse(playerChoice);
    appendMessage({ content: assistantMessage, role: "assistant" });

    updateChoices();
}

async function getAssistantResponse(playerChoice) {
    const config = { temperature: 0.9, top_p: 1 };
    const assistantResponse = await engine.chat(messages, config);

    return assistantResponse.choices[0].message.content;
}

function endGame() {
    const endMessage = {
        content: "The game is over! You've completed 5 choices. Thanks for playing!",
        role: "assistant",
    };
    appendMessage(endMessage);

    const choicesBox = document.getElementById("choices-box");
    choicesBox.innerHTML = "";
    const restartButton = document.createElement("button");
    restartButton.textContent = "Restart Game";
    restartButton.addEventListener("click", restartGame);
    choicesBox.appendChild(restartButton);
}

function restartGame() {
    choiceCount = 0;
    messages.length = 0;
    document.getElementById("gameContent").style.display = "none";
    document.getElementById("setupForm").style.display = "block";
}
