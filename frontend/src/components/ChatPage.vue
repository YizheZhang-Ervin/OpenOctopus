<template>
  <div class="chat-page">
    <header class="header">
      <h1>纳米机器人聊天界面</h1>
      <nav class="navigation">
        <router-link to="/chat" class="nav-link" active-class="active">聊天</router-link>
        <router-link to="/skills" class="nav-link" active-class="active">技能列表</router-link>
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
              <strong>{{ message.sender === 'user' ? '您:' : '纳米机器人:' }}</strong>
              <div class="message-text" v-html="formatMessage(message.text)"></div>
            </div>
          </div>
        </div>
        
        <div class="input-area">
          <textarea
            v-model="inputMessage"
            @keyup.enter.exact="sendMessage"
            @keyup.shift.enter.exact="insertNewline"
            placeholder="在此输入您的消息... (回车发送, Shift+回车换行)"
            rows="3"
          ></textarea>
          <div class="input-controls">
            <button @click="sendMessage" :disabled="sending" class="send-button">
              {{ sending ? '发送中...' : '发送' }}
            </button>
            <button @click="clearChat" class="clear-button">清空</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  name: 'ChatPage',
  data() {
    return {
      inputMessage: '',
      messages: [],
      sending: false,
      sessionId: null
    }
  },
  mounted() {
    // 添加欢迎消息
    this.messages.push({
      sender: 'bot',
      text: '您好！我是纳米机器人。今天我能为您做些什么？您可以询问可用的技能或使用它们执行各种任务。'
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
        sender: 'user',
        text: userMessage
      });

      this.inputMessage = '';
      this.sending = true;

      try {
        // 调用纳米机器人HTTP API
        const response = await axios.post('http://localhost:8000/api/chat', {
          message: userMessage,
          session_id: this.sessionId,
          timeout: 30
        }, {
          headers: {
            'Content-Type': 'application/json'
          }
        });

        // 更新会话ID（如果返回了新的ID）
        if (response.data.session_id && !this.sessionId) {
          this.sessionId = response.data.session_id;
        }

        if (response.data.success) {
          this.messages.push({
            sender: 'bot',
            text: response.data.response || '未收到回复'
          });
        } else {
          this.messages.push({
            sender: 'bot',
            text: `错误: ${response.data.error || '发生未知错误'}`
          });
        }
      } catch (error) {
        console.error('发送消息时出错:', error);
        let errorMessage = '无法从纳米机器人获得回复。';
        
        if (error.response) {
          // 服务器响应了错误状态
          errorMessage += `服务器错误: ${error.response.status} - ${error.response.statusText}`;
        } else if (error.request) {
          // 请求已发出但未收到响应
          errorMessage += '网络错误: 无法连接到纳米机器人服务器。服务器是否正在运行？';
        } else {
          // 发生其他错误
          errorMessage += error.message;
        }
        
        this.messages.push({
          sender: 'bot',
          text: `错误: ${errorMessage}`
        });
      } finally {
        this.sending = false;
      }
    },
    
    insertNewline(event) {
      // 按Shift+Enter时插入换行符
      event.preventDefault();
      this.inputMessage += '\n';
    },
    
    scrollToBottom() {
      const container = this.$refs.messagesContainer;
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    },
    
    formatMessage(text) {
      // 链接和代码块的基本格式化
      if (!text) return '';
      
      // 将URL转换为链接
      let formattedText = text.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>');
      
      // 格式化代码块（简单方法）
      formattedText = formattedText.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
      
      // 格式化行内代码
      formattedText = formattedText.replace(/`([^`]+)`/g, '<code>$1</code>');
      
      // 格式化粗体和斜体文本
      formattedText = formattedText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      formattedText = formattedText.replace(/\*(.*?)\*/g, '<em>$1</em>');
      
      // 将换行符转换为换行标签
      formattedText = formattedText.replace(/\n/g, '<br>');
      
      return formattedText;
    },
    
    clearChat() {
      // 清空聊天记录（保留欢迎消息）
      const welcomeMessage = this.messages.find(msg => 
        msg.sender === 'bot' && 
        msg.text.includes('您好！我是纳米机器人')
      );
      
      this.messages = welcomeMessage ? [welcomeMessage] : [];
      this.sessionId = null;
    }
  }
}
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
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
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
  height: calc(100% - 60px); /* 减去头部高度 */
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
    height: calc(100% - 100px); /* 调整为移动端头部高度 */
  }
  
  .input-controls {
    flex-direction: column;
  }
  
  .send-button, .clear-button {
    width: 100%;
  }
}
</style>
