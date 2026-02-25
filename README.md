# OpenOctopus
**Forked from HKUDS/nanobot**

- 简化版NanoBot
- 精简内容：去掉商业channel接入、去掉商业模型API接入
- 保留内容：核心agent运作机制、http方式channel接入、openAI兼容性API接入
- 新增内容：
    - bot-ui: web界面(功能：和agent对话/查看技能列表)
    - nodebot: nodejs版nanobot
    - llm-gateway: llm网关（用于内部系统/特殊LLM对话接口封装的http网关,聚合常用&自定义模型API）
    - llm-ui: 机器人对话交互界面（纯html/css/js）

## 1. 安装
```bash
# backend（python）
cd nanobot
pip install -e .

# backend（nodejs）
cd nodebot
npm install

# frontend 安装&运行
cd bot-ui
npm install
npm run dev
```

## 2. 配置
```bash
# Initialize
nanobot onboard  

# Configure `~/.nanobot/config.json`
# 见example.config.json
```

## 3. 使用
```sh
nanobot onboard                    # Initialize config & workspace
nanobot agent                      # Interactive chat mode
nanobot agent -m "Hello"          # Single message chat
nanobot agent --no-markdown       # Plain-text replies
nanobot agent --logs              # Show runtime logs
nanobot gateway                   # Start the gateway
nanobot status                    # Show status

nanobot channels login             # Link WhatsApp (scan QR)
nanobot channels status            # Show channel status

# cron jobs
nanobot cron add --name "daily" --message "Hi" --cron "0 9 * * *"
nanobot cron list
nanobot cron remove <job_id>

# memory
nanobot memory save "key" "value"
nanobot memory get "key"
nanobot memory list
```