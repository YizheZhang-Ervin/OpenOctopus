# Nanobot Frontend

A Vue 3 frontend for interacting with the Nanobot HTTP API. This interface provides a chat interface to communicate with the Nanobot and displays available skills.

## Features

- Real-time chat interface with Nanobot
- Display of available skills with status indicators
- Session management
- Message formatting (links, code blocks, etc.)
- Responsive design for different screen sizes

## Prerequisites

Before running the frontend, ensure you have:

- Node.js (version 18 or higher)
- The Nanobot HTTP API server running on `http://localhost:8000`

## Installation

1. Navigate to the frontend directory:
```bash
cd octopus-ui
```

2. Install dependencies:
```bash
npm install
```

## Running the Development Server

To start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:5173`.

## Building for Production

To build the application for production:

```bash
npm run build
```

The built files will be placed in the `dist` directory.

## Configuration

The frontend communicates with the Nanobot HTTP API at `http://localhost:8000` by default. If your Nanobot server is running on a different address, you'll need to update the API endpoints in `src/App.vue`.

## Project Structure

- `src/App.vue` - Main application component with chat interface and skills display
- `src/main.js` - Entry point for the Vue application
- `src/style.css` - Global styles (though most styles are scoped in components)

## API Endpoints Used

- `POST /api/chat` - Send messages to Nanobot and receive responses
- The application simulates a skills endpoint since one isn't directly available

## Troubleshooting

- Ensure the Nanobot HTTP API server is running before using the chat features
- Check browser console for any JavaScript errors
- Network errors typically indicate the backend server is not accessible