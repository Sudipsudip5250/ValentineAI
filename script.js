document.addEventListener("DOMContentLoaded", function () {
    const userInput = document.getElementById("user-input");
    const sendButton = document.getElementById("send-button");
    const chatArea = document.getElementById("chat-area");
  
    let botData = [];
  
    // Load the bot "brain" from the JSON file
    fetch("bot_brain.json")
      .then((response) => response.json())
      .then((data) => {
        botData = data;
      })
      .catch((error) => console.error("Error loading bot_brain.json:", error));
  
    // Display a message in the chat area
    function displayMessage(message, sender) {
      const messageDiv = document.createElement("div");
      messageDiv.classList.add(sender + "-message");
      messageDiv.textContent = message;
      chatArea.appendChild(messageDiv);
      chatArea.scrollTop = chatArea.scrollHeight;
    }
  
    function damerauLevenshtein(a, b) {
      const matrix = [];
      const aLen = a.length;
      const bLen = b.length;
  
      if (aLen === 0) return bLen;
      if (bLen === 0) return aLen;
  
      for (let i = 0; i <= aLen; i++) {
        matrix[i] = [i];
      }
      for (let j = 0; j <= bLen; j++) {
        matrix[0][j] = j;
      }
  
      for (let i = 1; i <= aLen; i++) {
        for (let j = 1; j <= bLen; j++) {
          const cost = a[i - 1] === b[j - 1] ? 0 : 1;
          matrix[i][j] = Math.min(
            matrix[i - 1][j] + 1, // deletion
            matrix[i][j - 1] + 1, // insertion
            matrix[i - 1][j - 1] + cost // substitution
          );
  
          if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
            matrix[i][j] = Math.min(matrix[i][j], matrix[i - 2][j - 2] + 1);
          }
        }
      }
  
      return matrix[aLen][bLen];
    }
  
    // Compute similarity as a ratio (1 means identical, 0 means completely different)
    function similarity(a, b) {
      const distance = damerauLevenshtein(a, b);
      return 1 - distance / Math.max(a.length, b.length);
    }
  
    // Get a bot response based on fuzzy matching of user input to each pattern
    function getBotResponse(userMessage) {
      userMessage = userMessage.toLowerCase().trim();
      let bestMatch = null;
      let highestScore = 0;
      const threshold = 0.65; // Adjust the threshold as needed
  
      // Add this in getBotResponse before the main loop
      const userWords = userMessage.split(" ");
  
      // Loop through each bot brain entry
      botData.forEach((entry) => {
        entry.patterns.forEach((pattern) => {
          const cleanPattern = pattern.toLowerCase().replace(/[^a-z0-9 ]/g, "");
  
          // Check full phrase match
          const phraseScore = similarity(userMessage, cleanPattern);
  
          // Check individual word matches
          const wordScores = userWords.map((word) =>
            Math.max(
              ...cleanPattern.split(" ").map((pWord) => similarity(word, pWord))
            )
          );
          const avgWordScore =
            wordScores.reduce((a, b) => a + b, 0) / wordScores.length;
  
          const totalScore = Math.max(phraseScore, avgWordScore);
  
          if (totalScore > highestScore) {
            highestScore = totalScore;
            bestMatch = entry;
          }
        });
      });
  
      if (bestMatch && highestScore >= threshold) {
        // Pick a random response from the matched entry
        const responses = bestMatch.responses;
        const randomIndex = Math.floor(Math.random() * responses.length);
        return responses[randomIndex];
      } else {
        return "I'm not sure I understand. Can you rephrase?";
      }
    }
  
    // New helper function
    function calculateKeywordOverlap(message, pattern) {
      const messageWords = new Set(message.split(" "));
      const patternWords = new Set(pattern.split(" "));
      let matches = 0;
  
      messageWords.forEach((word) => {
        if (patternWords.has(word)) matches++;
      });
  
      return matches / Math.max(messageWords.size, patternWords.size);
    }
  
    // Event listener for send button
    sendButton.addEventListener("click", function () {
      const message = userInput.value;
      if (message.trim() !== "") {
        displayMessage(message, "user");
        userInput.value = "";
  
        // Simulate a small delay to mimic "thinking"
        setTimeout(() => {
          const botResponse = getBotResponse(message);
          displayMessage(botResponse, "bot");
        }, 500);
      }
    });
  
    // Allow sending messages by pressing Enter
    userInput.addEventListener("keypress", function (event) {
      if (event.key === "Enter" && !event.shiftKey) {
        sendButton.click();
        event.preventDefault();
      }
    });
  });
  