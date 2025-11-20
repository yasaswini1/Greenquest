# Ollama Setup Instructions

This project uses Ollama for AI-powered image verification. Follow these steps to set it up:

## 1. Install Ollama

Download and install Ollama from: https://ollama.ai

### macOS:
```bash
# Download from https://ollama.ai or use Homebrew
brew install ollama
```

### Linux:
```bash
curl -fsSL https://ollama.ai/install.sh | sh
```

### Windows:
Download the installer from https://ollama.ai

## 2. Start Ollama

After installation, Ollama should start automatically. If not, start it manually:

```bash
ollama serve
```

Ollama runs on `http://localhost:11434` by default.

## 3. Pull the LLaVA Model

LLaVA (Large Language and Vision Assistant) is a vision model that can analyze images:

```bash
ollama pull llava
```

**Important Notes:**
- The model is approximately 4-5 GB
- LLaVA models can be unstable and may crash with certain image formats (especially WebP)
- **Recommended**: Use JPEG or PNG images instead of WebP
- If you experience crashes, try the smaller 7B variant: `ollama pull llava:7b`
- The model requires ~8GB RAM to run smoothly

**Known Issues:**
- WebP images may cause model crashes ("model runner has unexpectedly stopped")
- Large images (>10MB) may cause memory issues
- Solution: Convert images to JPEG/PNG before uploading

## 4. Verify Installation

Test that Ollama is working:

```bash
# Test that Ollama is running
curl http://localhost:11434/api/tags

# Test the LLaVA model (optional)
ollama run llava
```

## 5. Configure the Project (Optional)

The project uses these default settings:
- **Ollama API URL**: `http://localhost:11434`
- **Model**: `llava:latest`

You can override these with environment variables in a `.env` file:

```env
OLLAMA_API_URL=http://localhost:11434
OLLAMA_MODEL=llava:latest
```

## 6. Start the Server

Once Ollama is running, start the project server:

```bash
npm run server
```

The server will automatically use Ollama for image verification when users upload activity images.

## Troubleshooting

### Ollama not connecting
- Make sure Ollama is running: `ollama serve`
- Check the API URL in `.env` matches your Ollama installation
- Verify the port (default: 11434)

### Model not found
- Make sure you've pulled the model: `ollama pull llava`
- Check available models: `ollama list`

### Slow performance
- First run may be slow as the model loads
- Consider using a smaller model variant if available
- Ensure you have enough RAM (LLaVA requires ~4-8GB)

## How It Works

1. User uploads an image for activity verification
2. Server converts image to base64
3. Server sends image + prompt to Ollama LLaVA model
4. LLaVA analyzes the image and describes what it sees
5. Server matches the description against category keywords
6. Points are assigned based on AI confidence and category match

## Alternative Models

You can use other vision models if preferred:
- `llava:7b` - Smaller, faster version
- `llava:13b` - Larger, more accurate version
- `bakllava` - Alternative vision model

Change the model in `.env`:
```env
OLLAMA_MODEL=llava:7b
```

