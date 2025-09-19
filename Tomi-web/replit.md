# Overview

This is a Node.js web application that serves as an AI-powered chat platform called "Bella AI Chat" with additional tools and services. The application provides a conversational AI interface with image processing capabilities, file upload support, and a plugin system for extensibility. It includes multiple web interfaces including a main chat application, service panels, and specialized tools like a trading journal and romantic content generators.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Backend Architecture
- **Framework**: Express.js server running on Node.js
- **Port Configuration**: Configurable via environment variables (SERVER_PORT or PORT), defaults to 5000
- **Plugin System**: AI-readable modular architecture with BotCore managing plugins and adapters
  - PluginManager with recursive scanning for nested plugin folders
  - BotCore abstraction for cross-platform message routing and command processing
  - WebAdapter integration layer with WhatsApp-ready architecture
  - Plugin schema validation using AJV for manifest.json files
  - Support for commands, tools, and event-driven plugins
  - REST API endpoints for AI plugin discovery and management
  - Tools integration with Bella AI chat for enhanced capabilities

## Data Storage
- **Database**: LowDB (JSON file-based database) stored in db.json
- **Data Structure**: 
  - User sessions with chat history
  - Trading journal data
  - Image metadata and conversation tracking
- **File Storage**: Local file system for uploaded images in /uploads directory

## Frontend Architecture
- **Multi-page Application**: Static HTML files served from /public directory
- **Styling**: Tailwind CSS and custom CSS for responsive design
- **JavaScript**: Vanilla JavaScript with external libraries (Puter.js for AI, Chart.js for analytics)
- **Chat Interface**: Real-time chat with session management and image upload support

## AI Integration
- **Google Gemini AI**: Primary AI service via @google/genai package
- **Image Processing**: Tesseract.js for OCR (Optical Character Recognition)
- **Context Management**: Session-based conversation history with image support
- **Tool System**: AI can access registered plugin tools for extended functionality

## File Upload System
- **Middleware**: express-fileupload for handling multipart uploads
- **Image Support**: JPEG, PNG with automatic OCR processing
- **Storage**: Files saved with user session identifiers

## Security & Configuration
- **CORS**: Enabled for cross-origin requests
- **File Validation**: Basic file type checking for uploads
- **Plugin Security**: Permission system and capability-based access control

## API Structure
- RESTful endpoints for chat interactions
- Session management endpoints
- File upload handling
- Plugin management endpoints

# External Dependencies

## Core Dependencies
- **@google/genai**: Google's Generative AI SDK for ChatGPT-like functionality
- **express**: Web application framework
- **lowdb**: Lightweight JSON database
- **express-fileupload**: File upload middleware
- **cors**: Cross-Origin Resource Sharing middleware

## AI & Processing
- **tesseract.js**: OCR library for image text extraction
- **node-fetch**: HTTP client for external API calls

## Frontend Libraries
- **Tailwind CSS**: Utility-first CSS framework (via CDN)
- **Font Awesome**: Icon library (via CDN)
- **Chart.js**: Data visualization library (via CDN)
- **Puter.js**: External AI service integration (via CDN)
- **Google Fonts**: Typography (Poppins font family)

## Development Tools
- **ajv**: JSON Schema validator for plugin manifests

## File System Dependencies
- Native Node.js modules: fs, path for file operations
- JSON-based configuration and data storage