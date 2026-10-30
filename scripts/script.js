"use strict";

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
];

const board = document.getElementById("board");
const movesElement = document.getElementById("moves");
const timeElement = document.getElementById("time");
const pairsElement = document.getElementById("pairs");
const bestMovesElement = document.getElementById("bestMoves");
const bestTimeElement = document.getElementById("bestTime");
const gamesPlayedElement = document.getElementById("gamesPlayed");
const messageElement = document.getElementById("message");
const newGameButton = document.getElementById("newGame");

let flippedCards = [];
let matchedPairs = 0;
let moves = 0;
let seconds = 0;
let timer = null;
let gameStarted = false;
let lockBoard = false;

// Load saved statistics.
let savedStats;

try {
  savedStats = JSON.parse(localStorage.getItem("memoryMatchStats"));
} catch {
  savedStats = null;
}

if (
  !savedStats ||
  typeof savedStats !== "object" ||
  Array.isArray(savedStats)
) {
  savedStats = {
    bestMoves: null,
    bestTime: null,
    gamesPlayed: 0,
  };
}

// Add Best Time for players with previously saved statistics.
if (savedStats.bestTime === undefined) {
  savedStats.bestTime = null;
}

if (savedStats.bestMoves === undefined) {
  savedStats.bestMoves = null;
}

if (typeof savedStats.gamesPlayed !== "number") {
  savedStats.gamesPlayed = 0;
}

// Shuffle the cards.
function shuffle(array) {
  const shuffled = [...array];

  for (let i = shuffled.length - 1; i > 0; i--) {
    const randomIndex = Math.floor(Math.random() * (i + 1));

    [shuffled[i], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[i]];
  }

  return shuffled;
}

// Start a new game.
function startGame() {
  clearInterval(timer);

  flippedCards = [];
  matchedPairs = 0;
  moves = 0;
  seconds = 0;
  gameStarted = false;
  lockBoard = false;

  board.innerHTML = "";
  messageElement.textContent = "";
  messageElement.className = "message";

  const shuffledCards = shuffle([...symbols, ...symbols]);

  shuffledCards.forEach((symbol) => {
    const card = document.createElement("button");

    card.type = "button";
    card.className = "memory-card";
    card.dataset.symbol = symbol;
    card.setAttribute("aria-label", "Hidden memory card");

    const inner = document.createElement("span");
    inner.className = "card-inner";

    const back = document.createElement("span");
    back.className = "card-face card-back";
    back.textContent = "?";

    const front = document.createElement("span");
    front.className = "card-face card-front";
    front.textContent = symbol;

    inner.appendChild(back);
    inner.appendChild(front);
    card.appendChild(inner);

    card.addEventListener("click", () => flipCard(card));

    board.appendChild(card);
  });

  updateStats();
}

// Start the timer when the first card is flipped.
function startTimer() {
  timer = setInterval(() => {
    seconds++;
    updateStats();
  }, 1000);
}

// Flip a card.
function flipCard(card) {
  if (
    lockBoard ||
    card.classList.contains("flipped") ||
    card.classList.contains("matched")
  ) {
    return;
  }

  if (!gameStarted) {
    gameStarted = true;
    startTimer();
  }

  card.classList.add("flipped");
  card.setAttribute("aria-label", card.dataset.symbol);

  flippedCards.push(card);

  if (flippedCards.length === 2) {
    moves++;
    updateStats();
    checkMatch();
  }
}

// Check whether the two cards match.
function checkMatch() {
  const [firstCard, secondCard] = flippedCards;

  if (firstCard.dataset.symbol === secondCard.dataset.symbol) {
    firstCard.classList.add("matched");
    secondCard.classList.add("matched");

    firstCard.disabled = true;
    secondCard.disabled = true;

    matchedPairs++;
    flippedCards = [];

    updateStats();

    if (matchedPairs === symbols.length) {
      finishGame();
    }
  } else {
    lockBoard = true;

    setTimeout(() => {
      firstCard.classList.remove("flipped");
      secondCard.classList.remove("flipped");

      firstCard.setAttribute("aria-label", "Hidden memory card");
      secondCard.setAttribute("aria-label", "Hidden memory card");

      flippedCards = [];
      lockBoard = false;
    }, 800);
  }
}

// Finish the game and save the best results.
function finishGame() {
  clearInterval(timer);

  savedStats.gamesPlayed++;

  // Save the fewest moves.
  if (savedStats.bestMoves === null || moves < savedStats.bestMoves) {
    savedStats.bestMoves = moves;
  }

  // Save the fastest completion time.
  if (savedStats.bestTime === null || seconds < savedStats.bestTime) {
    savedStats.bestTime = seconds;
  }

  // Save all statistics in localStorage.
  localStorage.setItem("memoryMatchStats", JSON.stringify(savedStats));

  updateStats();

  messageElement.textContent = `🎉 You won in ${moves} moves and ${formatTime(seconds)}!`;

  messageElement.className = "message win";
}

// Update the statistics displayed on the page.
function updateStats() {
  movesElement.textContent = moves;
  timeElement.textContent = formatTime(seconds);
  pairsElement.textContent = `${matchedPairs} / ${symbols.length}`;

  bestMovesElement.textContent =
    savedStats.bestMoves === null ? "—" : savedStats.bestMoves;

  bestTimeElement.textContent =
    savedStats.bestTime === null ? "—" : formatTime(savedStats.bestTime);

  gamesPlayedElement.textContent = savedStats.gamesPlayed;
}

// Format seconds as MM:SS.
function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const remainingSeconds = totalSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(
    remainingSeconds,
  ).padStart(2, "0")}`;
}

// Start a new game when the button is clicked.
newGameButton.addEventListener("click", startGame);

// Initialize the game.
updateStats();
startGame();
