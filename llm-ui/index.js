window.onload = () => {
    let { canvas, videoEl } = initRobot()
    initChatRoom(canvas, videoEl)
};

// Robot status switching
let switchRobotStatus = (videoEl, status) => {
    let duration = 2000
    if (status == "hello") {
        videoEl.src = "video/hello.mp4";
        videoEl.play();
    } else if (status == "talk") {
        videoEl.src = "video/talk.mp4";
        videoEl.play();
        duration = 5000
    }
    // Return to original state
    setTimeout(() => {
        videoEl.src = "video/walk.mp4";
        videoEl.play();
    }, duration);
}

// Robot canvas initialization
let initRobot = () => {
    // Create canvas
    const canvas = document.getElementById("canvas");
    const ctx = canvas.getContext("2d");
    if (window.innerHeight > 720) {
        canvas.height = 720
    } else {
        canvas.height = window.innerHeight
        canvas.width = window.innerHeight
    }
    // Also update canvas size when window size changes
    window.onresize = function () {
        if (window.innerHeight > 720) {
            canvas.height = 720
        } else {
            canvas.height = window.innerHeight
            canvas.width = window.innerHeight
        }
    };

    // Create a virtual video element
    const videoEl = document.createElement("video");
    videoEl.src = "video/hello1.mp4";

    // Important: Due to browser autoplay restrictions, use muted autoplay to achieve auto-play
    videoEl.muted = "muted";
    videoEl.autoplay = "autoplay";
    videoEl.loop = "loop";
    videoEl.play();

    const cvsWidth = canvas.width;
    const cvsHeight = canvas.height;
    // Use requestAnimationFrame timer to draw each frame of video on canvas
    const videoRender = () => {
        window.requestAnimationFrame(videoRender);
        ctx.clearRect(0, 0, cvsWidth, cvsHeight);
        ctx.drawImage(videoEl, 0, 0, cvsWidth, cvsHeight);
    };
    videoRender();
    // After greeting, switch to walking state
    switchRobotStatus(videoEl, "walk")

    return { canvas, videoEl }
}

// Chat room initialization
let initChatRoom = (canvas, videoEl) => {
    // Right chat box width setting
    let rightPart = document.getElementById("right")
    rightPart.style.maxWidth = (window.innerWidth - canvas.width) + "px"

    // Get DOM elements
    const chatMessages = document.getElementById('chatMessages');
    const messageInput = document.getElementById('messageInput');
    const sendBtn = document.getElementById('sendBtn');

    // Simulate robot responses (cyberpunk style)
    const botReplies = [
        "Data link established 📶",
        "Warning: System detected abnormal data flow ⚠️",
        "Neon code parsing... 🔍",
        "Cyberspace laws are defined by code 💻",
        "Neural interface connected successfully ✅",
        "Fault protocol initiated, repairing... 🛠️",
        "Your message has been encrypted and transmitted 🤐",
        "The neon lights of Night City never fade 🌃"
    ];

    // Send message function
    function sendMessage() {
        // Get input content and remove leading/trailing spaces
        const messageText = messageInput.value.trim();

        // Don't send empty messages
        if (!messageText) return;

        // Create user message element
        const userMessage = document.createElement('div');
        userMessage.className = 'message user';
        userMessage.innerHTML = `<p class="sentence-box">${messageText}</p>`;
        chatMessages.appendChild(userMessage);

        // Clear input box
        messageInput.value = "";

        // Auto scroll to bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;

        // Simulate robot delayed response

        const randomReply = botReplies[Math.floor(Math.random() * botReplies.length)];
        textToSpeech(randomReply)
        const botMessage = document.createElement('div');
        botMessage.className = 'message bot';
        botMessage.innerHTML = `<p>${randomReply}</p>`;
        chatMessages.appendChild(botMessage);

        // Scroll to bottom again
        chatMessages.scrollTop = chatMessages.scrollHeight;
        // Play talking animation when speaking
        switchRobotStatus(videoEl, "talk")
    }

    // Button click to send
    sendBtn.addEventListener('click', sendMessage);

    // Press Enter to send message
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
}

// Text to speech core function
let textToSpeech = (text, options = {}) => {
    // Check if browser supports
    if (!('speechSynthesis' in window)) {
        alert('Your browser does not support text-to-speech functionality, please use a modern browser!');
        return;
    }

    // Stop playing voice (to avoid overlapping)
    window.speechSynthesis.cancel();

    // Create speech instance
    const utterance = new SpeechSynthesisUtterance(text);

    // Set optional parameters (default values can be adjusted as needed)
    utterance.lang = options.lang || 'en-US'; // Language: zh-CN (Chinese), en-US (English), etc.
    utterance.volume = options.volume || 1; // Volume 0-1
    utterance.rate = options.rate || 1; // Speech rate 0.1-10
    utterance.pitch = options.pitch || 1; // Pitch 0-2

    // Playback completion callback
    utterance.onend = () => {
        console.log('Speech playback completed');
    };

    // Play speech
    window.speechSynthesis.speak(utterance);

    // Return instance for subsequent control (pause, stop, etc.)
    return utterance;
}

// Basic English speech
// textToSpeech('Hello, this is a native Web Speech API text-to-speech test');
// utterance.pause(); // Pause
// utterance.resume(); // Resume
// window.speechSynthesis.cancel(); // Stop all playback