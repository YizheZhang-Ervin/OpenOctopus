<template>
  <div class="chat-page">
    <header class="header">
      <h1>Nanobot Chat Interface</h1>
      <nav class="navigation">
        <router-link to="/chat" class="nav-link" active-class="active"
          >Chat</router-link
        >
        <router-link to="/skills" class="nav-link" active-class="active"
          >Skills List</router-link
        >
      </nav>
    </header>

    <div class="full-page-container">
      <div class="chat-container">
        <div class="messages" ref="messagesContainer">
          <div
            v-for="(message, index) in messages"
            :key="index"
            :class="['message', message.sender]"
          >
            <div class="message-content">
              <strong>{{
                message.sender === "user" ? "You:" : "Nanobot:"
              }}</strong>
              <div
                class="message-text"
                v-html="formatMessage(message.text)"
              ></div>
            </div>
          </div>
        </div>

        <div class="input-area">
          <textarea
            v-model="inputMessage"
            @keyup.enter.exact="sendMessage"
            @keyup.shift.enter.exact="insertNewline"
            placeholder="Enter your message here... (Enter to send, Shift+Enter for new line)"
            rows="3"
          ></textarea>
          <div class="input-controls">
            <button
              @click="sendMessage"
              :disabled="sending"
              class="send-button"
            >
              {{ sending ? "Sending..." : "Send" }}
            </button>
            <button @click="clearChat" class="clear-button">Clear</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from "axios";

export default {
  name: "ChatPage",
  data() {
    return {
      inputMessage: "",
      messages: [],
      sending: false,
      sessionId: null,
    };
  },
  mounted() {
    // Add welcome message
    this.messages.push({
      sender: "bot",
      text: "Hello! I am Nanobot. What can I do for you today? You can ask about available skills or use them to perform various tasks.",
    });
  },
  updated() {
    this.scrollToBottom();
  },
  methods: {
    async sendMessage() {
      if (!this.inputMessage.trim() || this.sending) {
        return;
      }

      const userMessage = this.inputMessage.trim();
      this.messages.push({
        sender: "user",
        text: userMessage,
      });

      this.inputMessage = "";
      this.sending = true;

      try {
        // Call Nanobot HTTP API
        const response = await axios.post(
          "http://localhost:8000/api/chat",
          {
            message: userMessage,
            session_id: this.sessionId,
            timeout: 30,
          },
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        // Update session ID (if a new one was returned)
        if (response.data.session_id && !this.sessionId) {
          this.sessionId = response.data.session_id;
        }

        if (response.data.success) {
          this.messages.push({
            sender: "bot",
            text: response.data.response || "No response received",
          });
        } else {
          this.messages.push({
            sender: "bot",
            text: `Error: ${
              response.data.error || "An unknown error occurred"
            }`,
          });
        }
      } catch (error) {
        console.error("Error sending message:", error);
        let errorMessage = "Unable to get a response from Nanobot.";

        if (error.response) {
          // Server responded with an error status
          errorMessage += `Server error: ${error.response.status} - ${error.response.statusText}`;
        } else if (error.request) {
          // Request was made but no response was received
          errorMessage +=
            "Network error: Cannot connect to the Nanobot server. Is the server running?";
        } else {
          // Some other error occurred
          errorMessage += "An unknown error occurred";
        }

        this.messages.push({
          sender: "bot",
          text: `Error: ${errorMessage}`,
        });
      } finally {
        this.sending = false;
      }
    },

    insertNewline(event) {
      // Insert a newline when pressing Shift+Enter
      event.preventDefault();
      this.inputMessage += "\n";
    },

    scrollToBottom() {
      const container = this.$refs.messagesContainer;
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    },

    formatMessage(text) {
      // Basic formatting for links and code blocks
      if (!text) return "";

      // Basic formatting for links and code blocks
      let formattedText = text.replace(
        /(https?:\/\/[^\s]+)/g,
        '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'
      );

      // Format code blocks (simple approach)
      formattedText = formattedText.replace(
        /```([\s\S]*?)```/g,
        "<pre><code>$1</code></pre>"
      );

      // Format inline code
      formattedText = formattedText.replace(/`([^`]+)`/g, "<code>$1</code>");

      // Format bold and italic text
      formattedText = formattedText.replace(
        /\*\*(.*?)\*\*/g,
        "<strong>$1</strong>"
      );
      formattedText = formattedText.replace(/\*(.*?)\*/g, "<em>$1</em>");

      // Convert newlines to br tags
      formattedText = formattedText.replace(/\n/g, "<br>");

      return formattedText;
    },

    clearChat() {
      // Clear chat history (keep welcome message)
      const welcomeMessage = this.messages.find(
        (msg) =>
          msg.sender === "bot" && msg.text.includes("Hello! I am Nanobot")
      );

      this.messages = welcomeMessage ? [welcomeMessage] : [];
      this.sessionId = null;
    },
  },
};
</script>

<style scoped>
.chat-page {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.header {
  background-color: #2c3e50;
  color: white;
  padding: 1rem;
  text-align: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
  z-index: 10;
}

.navigation {
  display: flex;
  gap: 1rem;
}

.nav-link {
  color: #bdc3c7;
  text-decoration: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  transition: all 0.2s;
}

.nav-link.router-link-active,
.nav-link.active {
  background-color: #3498db;
  color: white;
}

.nav-link:hover {
  background-color: #3d566e;
  color: white;
}

.full-page-container {
  flex: 1;
  display: flex;
  padding: 0;
  margin: 0;
  overflow: hidden;
  width: 100%;
  height: calc(100% - 60px); /* Subtract header height */
}

.chat-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  background: white;
  overflow: hidden;
  flex: 1;
}

.messages {
  flex: 1;
  padding: 1rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  background-color: #f9f9f9;
  width: 100%;
}

.message {
  max-width: 80%;
}

.message.user {
  align-self: flex-end;
}

.message.bot {
  align-self: flex-start;
}

.message-content {
  padding: 0.75rem;
  border-radius: 8px;
  word-wrap: break-word;
}

.message.user .message-content {
  background-color: #3498db;
  color: white;
}

.message.bot .message-content {
  background-color: #ecf0f1;
  color: #2c3e50;
}

.message-text {
  margin-top: 0.5rem;
}

.message-text pre {
  background: #2c3e50;
  color: #ecf0f1;
  padding: 0.75rem;
  border-radius: 4px;
  overflow-x: auto;
  margin: 0.5rem 0;
  font-size: 0.9rem;
  line-height: 1.4;
}

.message-text code {
  background: #f1f2f6;
  padding: 0.2rem 0.4rem;
  border-radius: 3px;
  font-family: monospace;
  font-size: 0.9em;
}

.message-text a {
  color: #3498db;
  text-decoration: none;
}

.message-text a:hover {
  text-decoration: underline;
}

.input-area {
  padding: 1rem;
  border-top: 1px solid #eee;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  background-color: white;
  flex-shrink: 0;
  width: 100%;
}

.input-area textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  resize: vertical;
  font-family: inherit;
  font-size: 1rem;
  margin-bottom: 0.5rem;
}

.input-area textarea:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
}

.input-controls {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
}

.send-button {
  padding: 0.5rem 1rem;
  background-color: #3498db;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  transition: background-color 0.2s;
}

.send-button:hover:not(:disabled) {
  background-color: #2980b9;
}

.send-button:disabled {
  background-color: #bdc3c7;
  cursor: not-allowed;
}

.clear-button {
  padding: 0.5rem 1rem;
  background-color: #e74c3c;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  transition: background-color 0.2s;
}

.clear-button:hover {
  background-color: #c0392b;
}

@media (max-width: 768px) {
  .header {
    flex-direction: column;
    gap: 1rem;
  }

  .full-page-container {
    height: calc(100% - 100px); /* Adjust for mobile header height */
  }

  .input-controls {
    flex-direction: column;
  }

  .send-button,
  .clear-button {
    width: 100%;
  }
}
</style>