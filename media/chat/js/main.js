const messageInput = document.getElementById("messageInput");
const sendButton = document.getElementById("sendButton");
const messagesContainer = document.getElementById("messagesContainer");
const agentSelect = document.getElementById("agentSelect");
const attachButton = document.getElementById("attachButton");

// Auto-resize textarea
messageInput.addEventListener("input", function () {
  this.style.height = "auto";
  this.style.height = Math.min(this.scrollHeight, 120) + "px";

  // Enable/disable send button
  sendButton.disabled = !this.value.trim();
});

// Send message on Ctrl+Enter
messageInput.addEventListener("keydown", function (e) {
  if (e.ctrlKey && e.key === "Enter") {
    sendMessage();
  }
});

// Focus on Ctrl+I
document.addEventListener("keydown", function (e) {
  if (e.ctrlKey && e.key === "i") {
    e.preventDefault();
    messageInput.focus();
  }
});

// Send button click
sendButton.addEventListener("click", sendMessage);

// Attach button click
attachButton.addEventListener("click", function () {
  // Implement file attachment logic here
  console.log("Attach file clicked");
});

function sendMessage() {
  const message = messageInput.value.trim();
  if (!message) return;

  // Add user message
  addMessage(message, "user");

  // Clear input
  messageInput.value = "";
  messageInput.style.height = "auto";
  sendButton.disabled = true;

  // Simulate AI response
  setTimeout(() => {
    addMessage("I understand. Let me help you with that...", "assistant");
  }, 1000);
}

function addMessage(content, sender) {
  const messageDiv = document.createElement("div");
  messageDiv.className = "message";

  const now = new Date();
  const timeString = "now";

  messageDiv.innerHTML = `
        <div class="message-header">
            <div class="message-avatar ${sender}-avatar">
                ${sender === "user" ? "U" : "AI"}
            </div>
            <div class="message-time">${timeString}</div>
        </div>
        <div class="message-content">
            ${content}
        </div>
    `;

  messagesContainer.appendChild(messageDiv);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Initialize
sendButton.disabled = true;
