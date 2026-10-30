"use strict";

// Available symbols for the game.
const symbols = [
  "🍕",
  "🐶",
  "🚀",
  "💎",
  "⚽",
  "🍔",
  "🎧",
  "⭐",
  "🐱",
  "🌈",
  "🎮",
  "🍎",
  "🌻",
  "🦋",
  "🍉",
  "🐸",
  "🎸",
  "🔥",
  "🌙",
  "🦊",
  "🍓",
  "⚡",
  "🐼",
  "🎯",
  "🍩",
  "🦄",
  "🌵",
  "🏀",
  "🐢",
  "🍒",
  "🎹",
  "🧩",
];

// Each level specifies the number of pairs and board columns.
const levels = {
  easy: {
    pairs: 8,
    columns: 4,
  },
  medium: {
    pairs: 16,
    columns: 6,
  },
  hard: {
    pairs: 32,
    columns: 8,
  },
};

const STORAGE_KEY = "memoryMatchStats";

// HTML elements.
const board = document.getElementById("board");
const gamePlaceholder = document.getElementById("gamePlaceholder");
const difficultySelect = document.getElementById("difficulty");
const newGameButton = document.getElementById("newGame");

const movesElement = document.getElementById("moves");
const timeElement = document.getElementById("time");
const pairsElement = document.getElementById("pairs");
const bestMovesElement = document.getElementById("bestMoves");
const bestTimeElement = document.getElementById("bestTime");
const gamesPlayedElement = document.getElementById("gamesPlayed");
const messageElement = document.getElementById("message");

// Current game state.
let currentDifficulty = "";
let flippedCards = [];
let matchedPairs = 0;
let moves = 0;
let seconds = 0;
let timer = null;
let mismatchTimeout = null;
let gameStarted = false;
let gameFinished = false;
let lockBoard = false;

// Statistics are saved separately for each difficulty.
function createEmptyStats() {
  return {
    easy: {
      bestMoves: null,
      bestTime: null,
      gamesPlayed: 0,
    },
    medium: {
      bestMoves: null,
      bestTime: null,
      gamesPlayed: 0,
    },
    hard: {
      bestMoves: null,
      bestTime: null,
      gamesPlayed: 0,
    },
  };
}

// Load statistics and migrate the old format if necessary.
function loadStats() {
  const stats = createEmptyStats();

  try {
    const savedData = localStorage.getItem(STORAGE_KEY);

    if (!savedData) {
      return stats;
    }

    const savedStats = JSON.parse(savedData);

    if (!savedStats || typeof savedStats !== "object") {
      return stats;
    }

    // Migrate the old format into Easy statistics.
    if (!savedStats.easy && !savedStats.medium && !savedStats.hard) {
      stats.easy.bestMoves = Number.isFinite(savedStats.bestMoves)
        ? savedStats.bestMoves
        : null;

      stats.easy.bestTime = Number.isFinite(savedStats.bestTime)
        ? savedStats.bestTime
        : null;

      stats.easy.gamesPlayed = Number.isFinite(savedStats.gamesPlayed)
        ? savedStats.gamesPlayed
        : 0;

      return stats;
    }

    // Load the statistics for each difficulty.
    Object.keys(levels).forEach((level) => {
      const savedLevel = savedStats[level];

      if (!savedLevel || typeof savedLevel !== "object") {
        return;
      }

      stats[level].bestMoves = Number.isFinite(savedLevel.bestMoves)
        ? savedLevel.bestMoves
        : null;

      stats[level].bestTime = Number.isFinite(savedLevel.bestTime)
        ? savedLevel.bestTime
        : null;

      stats[level].gamesPlayed = Number.isFinite(savedLevel.gamesPlayed)
        ? savedLevel.gamesPlayed
        : 0;
    });

    return stats;
  } catch (error) {
    console.error("Could not load game statistics:", error);
    return stats;
  }
}

let savedStats = loadStats();

// Save statistics to the browser.
function saveStats() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(savedStats));
  } catch (error) {
    console.error("Could not save game statistics:", error);
  }
}

// Shuffle an array using the Fisher-Yates algorithm.
function shuffle(array) {
  const shuffled = [...array];

  for (let i = shuffled.length - 1; i > 0; i--) {
    const randomIndex = Math.floor(Math.random() * (i + 1));

    [shuffled[i], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[i]];
  }

  return shuffled;
}

// Convert seconds into MM:SS.
function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const remainingSeconds = totalSeconds % 60;

  return (
    String(minutes).padStart(2, "0") +
    ":" +
    String(remainingSeconds).padStart(2, "0")
  );
}

// Update the statistics shown on the page.
function updateStats() {
  movesElement.textContent = moves;
  timeElement.textContent = formatTime(seconds);

  const totalPairs = currentDifficulty ? levels[currentDifficulty].pairs : 8;

  pairsElement.textContent = `${matchedPairs} / ${totalPairs}`;

  if (!currentDifficulty) {
    bestMovesElement.textContent = "—";
    bestTimeElement.textContent = "—";
    gamesPlayedElement.textContent = "0";
    return;
  }

  const levelStats = savedStats[currentDifficulty];

  bestMovesElement.textContent =
    levelStats.bestMoves === null ? "—" : levelStats.bestMoves;

  bestTimeElement.textContent =
    levelStats.bestTime === null ? "—" : formatTime(levelStats.bestTime);

  gamesPlayedElement.textContent = levelStats.gamesPlayed;
}

// Start the timer only after the first card is flipped.
function startTimer() {
  if (timer !== null) {
    return;
  }

  timer = setInterval(() => {
    seconds++;
    timeElement.textContent = formatTime(seconds);
  }, 1000);
}

// Stop the timer.
function stopTimer() {
  if (timer !== null) {
    clearInterval(timer);
    timer = null;
  }
}

// Create one memory card.
function createCard(symbol, index) {
  const card = document.createElement("button");

  card.type = "button";
  card.className = "memory-card";
  card.dataset.symbol = symbol;
  card.dataset.index = index;
  card.setAttribute("aria-label", "Hidden memory card");

  const inner = document.createElement("span");
  inner.className = "card-inner";

  const back = document.createElement("span");
  back.className = "card-face card-back";
  back.textContent = "?";
  back.setAttribute("aria-hidden", "true");

  const front = document.createElement("span");
  front.className = "card-face card-front";
  front.textContent = symbol;
  front.setAttribute("aria-hidden", "true");

  inner.appendChild(back);
  inner.appendChild(front);
  card.appendChild(inner);

  card.addEventListener("click", () => flipCard(card));

  return card;
}

// Start or restart a game using the selected difficulty.
function startGame() {
  const selectedDifficulty = difficultySelect.value;

  // Do not show the board until a valid difficulty is selected.
  if (!levels[selectedDifficulty]) {
    return;
  }

  stopTimer();

  if (mismatchTimeout !== null) {
    clearTimeout(mismatchTimeout);
    mismatchTimeout = null;
  }

  currentDifficulty = selectedDifficulty;

  const level = levels[currentDifficulty];
  const activeSymbols = symbols.slice(0, level.pairs);
  const shuffledCards = shuffle([...activeSymbols, ...activeSymbols]);

  flippedCards = [];
  matchedPairs = 0;
  moves = 0;
  seconds = 0;
  gameStarted = false;
  gameFinished = false;
  lockBoard = false;

  // Configure the board for the chosen difficulty.
  board.innerHTML = "";
  board.dataset.difficulty = currentDifficulty;
  board.hidden = false;
  gamePlaceholder.hidden = true;

  // Clear previous messages.
  messageElement.textContent = "";
  messageElement.className = "message";

  // Create all cards.
  shuffledCards.forEach((symbol, index) => {
    board.appendChild(createCard(symbol, index));
  });

  // Count each started game.
  savedStats[currentDifficulty].gamesPlayed++;

  saveStats();
  updateStats();
}

// Flip a card when the player clicks it.
function flipCard(card) {
  if (
    lockBoard ||
    gameFinished ||
    card.classList.contains("flipped") ||
    card.classList.contains("matched")
  ) {
    return;
  }

  // Start the timer on the first move.
  if (!gameStarted) {
    gameStarted = true;
    startTimer();
  }

  card.classList.add("flipped");
  card.setAttribute("aria-label", card.dataset.symbol);

  flippedCards.push(card);

  // Check for a match after two cards have been flipped.
  if (flippedCards.length === 2) {
    moves++;
    updateStats();
    checkMatch();
  }
}

// Check whether the two flipped cards match.
function checkMatch() {
  const [firstCard, secondCard] = flippedCards;

  if (firstCard.dataset.symbol === secondCard.dataset.symbol) {
    firstCard.classList.add("matched");
    secondCard.classList.add("matched");

    firstCard.disabled = true;
    secondCard.disabled = true;

    firstCard.setAttribute("aria-label", `Matched ${firstCard.dataset.symbol}`);

    secondCard.setAttribute(
      "aria-label",
      `Matched ${secondCard.dataset.symbol}`,
    );

    matchedPairs++;
    flippedCards = [];

    updateStats();

    // Check whether the player has won.
    if (matchedPairs === levels[currentDifficulty].pairs) {
      finishGame();
    }

    return;
  }

  // Prevent the player from flipping more cards during the delay.
  lockBoard = true;

  mismatchTimeout = setTimeout(() => {
    firstCard.classList.remove("flipped");
    secondCard.classList.remove("flipped");

    firstCard.setAttribute("aria-label", "Hidden memory card");
    secondCard.setAttribute("aria-label", "Hidden memory card");

    flippedCards = [];
    lockBoard = false;
    mismatchTimeout = null;
  }, 900);
}

// Finish the game and save the best result.
function finishGame() {
  gameFinished = true;
  stopTimer();

  const levelStats = savedStats[currentDifficulty];

  const isNewBestMoves =
    levelStats.bestMoves === null || moves < levelStats.bestMoves;

  const isNewBestTime =
    levelStats.bestTime === null || seconds < levelStats.bestTime;

  if (isNewBestMoves) {
    levelStats.bestMoves = moves;
  }

  if (isNewBestTime) {
    levelStats.bestTime = seconds;
  }

  saveStats();
  updateStats();

  messageElement.className = "message win";

  let resultMessage = `You won! ${moves} moves in ${formatTime(seconds)}.`;

  if (isNewBestMoves || isNewBestTime) {
    resultMessage += " New personal best!";
  }

  messageElement.textContent = resultMessage;
}

// Changing difficulty immediately starts a new game.
difficultySelect.addEventListener("change", startGame);

// The New Game button restarts the currently selected difficulty.
newGameButton.addEventListener("click", startGame);

// Initial page state: no board until a difficulty is selected.
board.hidden = true;
gamePlaceholder.hidden = false;
messageElement.textContent = "Choose a difficulty to begin.";

updateStats();
