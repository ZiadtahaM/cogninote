# CogniNote

An AI-powered intelligence engine for organizing, querying, and synthesizing personal notes.

![CogniNote UI](https://via.placeholder.com/1200x600.png?text=CogniNote+Interface)

## Overview
CogniNote provides a semantic search and categorization layer over your notes. By using vector embeddings, it surfaces related concepts and dynamically generates summaries to augment your learning and memory.

## Tech Stack
- **Frontend**: React / JavaScript.
- **Backend**: Node.js / Python (depending on the intelligence pipeline).
- **Database**: Vector storage for semantic querying.

## Architecture
A decoupled frontend-backend architecture. The `frontend/` handles the user interface for note taking and visualization, while the `backend/` orchestrates text chunking, embedding generation via external AI providers, and vector similarity search.

## Local Setup
1. Clone the repository.
2. In the `backend/` directory, install dependencies and start the API server.
3. In the `frontend/` directory, install dependencies and start the development server.
4. Ensure your environment variables are configured for your chosen LLM and vector store.
