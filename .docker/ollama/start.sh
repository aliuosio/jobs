#!/bin/sh
set -e

# Start Ollama server in background
ollama serve &
SERVER_PID=$!

# Wait for server to be ready
sleep 5

# Pull qwen2.5 model if not present
if ! ollama list | grep -q "qwen2.5:3b"; then
  echo "Pulling Qwen 2.5:3B model..."
  ollama pull qwen2.5:3b 
fi

# Keep container running
wait $SERVER_PID