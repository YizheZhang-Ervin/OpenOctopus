# OpenOctopus
**Forked from HKUDS/nanobot**

- 简化版NanoBot
- 精简内容：去掉商业channel接入、去掉商业模型API接入
- 保留内容：核心agent运作机制、http方式channel接入、openAI兼容性API接入
- 新增内容：web界面UI(功能：和agent对话/查看技能列表)

## 1. 安装
```bash
# backend
cd nanobot
pip install -e .

# frontend 安装&运行
cd frontend
npm install
npm run dev
```

## 2. 配置
```bash
# Initialize
nanobot onboard  

# Configure `~/.nanobot/config.json`
# 见config.example.json
```

## 3-A. 使用
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


## 3-B. 使用：docker
```bash
# Build the image
docker build -t nanobot .

# Initialize config (first time only)
docker run -v ~/.nanobot:/root/.nanobot --rm nanobot onboard

# Edit config on host to add API keys
vim ~/.nanobot/config.json

# Run gateway (connects to enabled channels, e.g. Telegram/Discord/Mochat)
docker run -v ~/.nanobot:/root/.nanobot -p 18790:18790 nanobot gateway

# Or run a single command
docker run -v ~/.nanobot:/root/.nanobot --rm nanobot agent -m "Hello!"
docker run -v ~/.nanobot:/root/.nanobot --rm nanobot status
```

## 3-C. 使用：docker compose
```sh
docker compose run --rm nanobot-cli onboard   # first-time setup
vim ~/.nanobot/config.json                     # add API keys
docker compose up -d nanobot-gateway           # start gateway

docker compose run --rm nanobot-cli agent -m "Hello!"   # run CLI
docker compose logs -f nanobot-gateway                   # view logs
docker compose down                                      # stop
```

## 4. 其他
```
channel相关：docs/channel_http_api.md
安全相关：docs/SECURITY.md
技能相关：docs/skills.md
```
