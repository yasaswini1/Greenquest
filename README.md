
  # Gamified Sustainability Tracker


  ## Features

  - **AI-Powered Image Verification**: Uses OpenCLIP LAION2B VIT-B/32 for semantic image-text matching
  - **Activity Tracking**: Log eco-friendly activities with photo evidence
  - **Point System**: Earn points based on AI verification confidence and geolocation
  - **Forest Visualization**: Visual representation of your environmental impact
  - **Leaderboard**: Compete with other users
  - **Feed**: Share your activities publicly or keep them private
  - **Streak Tracking**: Daily login streaks with notifications

  ## Running the code

1. Run `npm i` to install dependencies (installs both frontend and backend packages).
   - This will install `@xenova/transformers` for CLIP model support
2. **Install Python dependencies for CodeCarbon** (optional but recommended):
   ```bash
   pip3 install -r requirements.txt
   ```
   Note: CodeCarbon is used to track CO2 emissions from AI processing. If not installed, the system will use fallback estimations.
3. Start the API server (stores data in `server/localdb.sqlite`):
   ```bash
   npm run server
   ```
   The API listens on `http://localhost:4000` by default and seeds two demo users plus sample activities.
4. In a separate terminal, start the Vite dev server:
   ```bash
   npm run dev
   ```
5. The frontend expects `VITE_API_URL` to point at the API base (defaults to `http://localhost:4000` when the env var is missing).

  ## AI Integration

  This project uses OpenCLIP LAION2B VIT-B/32 for semantic image-text matching:

  - **Server-side**: Uses OpenCLIP for zero-shot image classification
  - **How it works**: 
    - Text embeddings are created for category-specific prompts (e.g., "electricity bill", "energy conservation" for Energy category)
    - Image embeddings are extracted from uploaded images
    - Cosine similarity is calculated between image and text embeddings
    - Scores are assigned based on semantic similarity
  - **Point Calculation**: Points are adjusted based on AI confidence scores and category matching
  - **Verification Status**: Activities are marked as "verified", "pending", or "flagged" based on AI scores
  - **Model Loading**: The CLIP model loads automatically on first request (takes 30-60 seconds)
  - **CO2 Tracking**: CodeCarbon integration tracks emissions from AI processing
    - Measures energy consumption (CPU, GPU, RAM) during CLIP inference
    - Calculates CO2 emissions based on carbon intensity of your local grid
    - Falls back to world average (0.475 kg CO2/kWh) if CodeCarbon is not available
    - Emissions data is stored with each activity submission

  No external services required - everything runs locally using @xenova/transformers.
  
  See [CodeCarbon documentation](https://mlco2.github.io/codecarbon/methodology.html) for details on emission calculations.
  