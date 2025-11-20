const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// CLIP model configuration
// Using OpenAI's CLIP model (converted by Xenova) - this is definitely available
const MODEL_NAME = 'Xenova/clip-vit-base-patch32';
let clipClassifier = null;

// Category text prompts for embedding - these are the "candidate labels" for zero-shot classification
const categoryPrompts = {
  transport: [
    'a bicycle',
    'a bike',
    'a bus',
    'a train',
    'public transportation',
    'cycling',
    'walking',
    'sustainable transport',
    'electric vehicle',
    'public transit',
    'metro',
    'subway',
    'commuting by bike',
    'pedestrian',
  ],
  plastic: [
    'a reusable bag',
    'a paper bag',
    'a cloth bag',
    'a tote bag',
    'a shopping bag',
    'a reusable bottle',
    'a water bottle',
    'plastic avoidance',
    'eco-friendly packaging',
    'reusable container',
    'canvas bag',
    'grocery bag',
    'recyclable bag',
  ],
  energy: [
    'an electricity bill',
    'an energy bill',
    'a utility bill',
    'reduced electricity usage',
    'energy conservation',
    'lower energy consumption',
    'energy savings',
    'electricity statement',
    'power bill',
    'energy reduction',
    'solar panels',
    'renewable energy',
  ],
  water: [
    'water conservation',
    'reduced water usage',
    'a water bill',
    'water savings',
    'low water consumption',
    'water efficiency',
    'water reduction',
    'conserving water',
  ],
  tree: [
    'planting a tree',
    'a tree sapling',
    'tree planting',
    'a young tree',
    'planting trees',
    'tree growth',
    'forest restoration',
    'reforestation',
  ],
  event: [
    'an eco event',
    'a sustainability workshop',
    'a clean-up drive',
    'environmental event',
    'eco-friendly gathering',
    'green event',
    'community cleanup',
    'environmental awareness',
  ],
};

// Negative prompts - things that should NOT match
const negativePrompts = {
  transport: [
    'a laptop',
    'a computer',
    'a phone',
    'a bill',
    'a document',
    'an invoice',
    'a receipt',
  ],
  plastic: [
    'a laptop',
    'a computer',
    'a phone',
    'a bill',
    'a document',
    'an invoice',
  ],
  energy: [
    'a bicycle',
    'a bike',
    'a bag',
    'a bottle',
    'a tree',
    'transportation',
  ],
  water: [
    'a laptop',
    'a computer',
    'a bike',
    'a bill',
    'transportation',
  ],
  tree: [
    'a laptop',
    'a computer',
    'a bill',
    'a document',
    'a bag',
  ],
  event: [
    'a laptop',
    'a computer',
    'a bill',
    'a document',
  ],
};

/**
 * Initialize CLIP model (lazy loading)
 */
async function initializeCLIP() {
  if (clipClassifier) {
    return clipClassifier;
  }

  try {
    console.log('[CLIP] Loading CLIP model (this may take 30-60 seconds on first load)...');
    console.log('[CLIP] Model will be downloaded from HuggingFace if not cached locally');
    const { pipeline } = await import('@xenova/transformers');
    
    // Use zero-shot image classification pipeline
    // The model will auto-download from HuggingFace on first use
    clipClassifier = await pipeline('zero-shot-image-classification', MODEL_NAME);
    console.log('[CLIP] Model loaded successfully');
    return clipClassifier;
  } catch (error) {
    console.error('[CLIP] Error loading model:', error);
    console.error('[CLIP] Full error:', error.message);
    
    // Provide helpful error message
    if (error.message.includes('Unauthorized') || error.message.includes('401')) {
      throw new Error(`CLIP model download failed: Authentication issue with HuggingFace. This may be a temporary network issue. Please try again in a few moments.`);
    } else if (error.message.includes('404') || error.message.includes('not found')) {
      throw new Error(`CLIP model not found. Please check your internet connection and try again.`);
    } else {
      throw new Error(`Failed to load CLIP model: ${error.message}. Please ensure @xenova/transformers is installed: npm install @xenova/transformers`);
    }
  }
}

/**
 * Track CO2 emissions using CodeCarbon
 * @param {number} durationSeconds - Duration of processing in seconds
 */
async function trackEmissions(durationSeconds) {
  return new Promise((resolve) => {
    const scriptPath = path.join(__dirname, 'codecarbon_tracker.py');
    const pythonProcess = spawn('python3', [scriptPath], {
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    const input = JSON.stringify({ duration_seconds: durationSeconds });
    pythonProcess.stdin.write(input);
    pythonProcess.stdin.end();

    let stdout = '';
    let stderr = '';

    pythonProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    pythonProcess.on('close', (code) => {
      if (code === 0) {
        try {
          const result = JSON.parse(stdout);
          resolve(result);
        } catch (error) {
          console.warn('[CodeCarbon] Failed to parse result, using fallback:', error.message);
          // Fallback estimation
          const estimatedEnergyKwh = (durationSeconds / 3600) * 0.05;
          const carbonIntensity = 0.475;
          resolve({ 
            emissions_kg: estimatedEnergyKwh * carbonIntensity,
            energy_consumed_kwh: estimatedEnergyKwh,
            duration_seconds: durationSeconds,
          });
        }
      } else {
        console.warn('[CodeCarbon] Tracking failed, using fallback');
        // Fallback estimation
        const estimatedEnergyKwh = (durationSeconds / 3600) * 0.05;
        const carbonIntensity = 0.475;
        resolve({ 
          emissions_kg: estimatedEnergyKwh * carbonIntensity,
          energy_consumed_kwh: estimatedEnergyKwh,
          duration_seconds: durationSeconds,
        });
      }
    });

    pythonProcess.on('error', (error) => {
      console.warn('[CodeCarbon] Could not start tracker:', error.message);
      // Fallback estimation
      const estimatedEnergyKwh = (durationSeconds / 3600) * 0.05;
      const carbonIntensity = 0.475;
      resolve({ 
        emissions_kg: estimatedEnergyKwh * carbonIntensity,
        energy_consumed_kwh: estimatedEnergyKwh,
        duration_seconds: durationSeconds,
      });
    });
  });
}

/**
 * Analyze image using OpenCLIP zero-shot classification
 */
async function analyzeImageServer(imagePath, category) {
  let emissionsData = { emissions_kg: 0, energy_consumed_kwh: 0 };
  const startTime = Date.now();
  
  try {
    if (!fs.existsSync(imagePath)) {
      throw new Error('Image file not found');
    }

    console.log(`[CLIP] Starting image analysis for category: ${category}`);
    console.log(`[CLIP] Image path: ${imagePath}`);
    
    // Start CodeCarbon tracking (non-blocking)
    // Note: We'll track emissions during the actual processing
    const trackingStartTime = Date.now();

    // Initialize model
    const classifier = await initializeCLIP();

    // Get category prompts
    const positivePrompts = categoryPrompts[category.toLowerCase()] || [];
    const negativePromptsList = negativePrompts[category.toLowerCase()] || [];

    if (positivePrompts.length === 0) {
      throw new Error(`No prompts defined for category: ${category}`);
    }

    console.log(`[CLIP] Using ${positivePrompts.length} positive prompts and ${negativePromptsList.length} negative prompts`);

    // Combine all candidate labels
    const allLabels = [...positivePrompts, ...negativePromptsList];
    
    // Read image - zero-shot classification expects image path or URL
    // @xenova/transformers can handle file paths directly
    console.log(`[CLIP] Running zero-shot classification...`);
    const results = await classifier(imagePath, allLabels);
    
    // Process results - results is an array of { label, score }
    const resultsMap = {};
    results.forEach(result => {
      resultsMap[result.label] = result.score;
    });

    // Calculate positive and negative scores
    const positiveScores = positivePrompts.map(prompt => resultsMap[prompt] || 0);
    const negativeScores = negativePromptsList.map(prompt => resultsMap[prompt] || 0);

    const maxPositiveScore = Math.max(...positiveScores);
    const avgPositiveScore = positiveScores.reduce((a, b) => a + b, 0) / positiveScores.length;
    const maxNegativeScore = negativeScores.length > 0 ? Math.max(...negativeScores) : 0;
    
    console.log(`[CLIP] Max positive score: ${maxPositiveScore.toFixed(4)}`);
    console.log(`[CLIP] Average positive score: ${avgPositiveScore.toFixed(4)}`);
    console.log(`[CLIP] Max negative score: ${maxNegativeScore.toFixed(4)}`);

    // Determine if it matches
    // Use a combination of max and average score
    const combinedScore = (maxPositiveScore * 0.7) + (avgPositiveScore * 0.3);
    
    // Penalize if negative score is high
    const adjustedScore = maxNegativeScore > 0.3 
      ? combinedScore * (1 - maxNegativeScore * 0.6)
      : combinedScore;
    
    // Threshold for matching (CLIP scores are typically 0.1-0.5 for good matches)
    // We use a lower threshold since CLIP scores can vary
    const matches = adjustedScore > 0.15 && maxNegativeScore < 0.4;
    
    // Convert score to confidence (0-1) and then to AI score (0-100)
    // CLIP scores range roughly 0.05-0.5 for relevant matches
    const normalizedConfidence = Math.max(0, Math.min(1, (adjustedScore - 0.05) / 0.45));
    const confidence = matches ? normalizedConfidence : normalizedConfidence * 0.4;
    
    // Calculate AI score (0-100)
    const aiScore = matches 
      ? Math.round(Math.max(50, confidence * 100)) // Minimum 50 for matches
      : Math.round(confidence * 40); // Lower score for non-matches (max 40)

    // Get the best matching prompt
    const bestMatchIdx = positiveScores.indexOf(maxPositiveScore);
    const label = positivePrompts[bestMatchIdx] || category;

    console.log(`[CLIP] ========== Analysis Complete ==========`);
    console.log(`[CLIP] Category: ${category}`);
    console.log(`[CLIP] Combined score: ${combinedScore.toFixed(4)}`);
    console.log(`[CLIP] Adjusted score: ${adjustedScore.toFixed(4)}`);
    console.log(`[CLIP] Final match decision: ${matches ? '✅ MATCH' : '❌ NO MATCH'}`);
    console.log(`[CLIP] Confidence: ${(confidence * 100).toFixed(1)}%`);
    console.log(`[CLIP] AI Score: ${aiScore}/100`);
    console.log(`[CLIP] Label: ${label}`);
    console.log(`[CLIP] =======================================`);

    // Ensure emissions data is always present with valid values
    const finalEmissions = {
      co2_kg: emissionsData?.emissions_kg || 0,
      energy_kwh: emissionsData?.energy_consumed_kwh || 0,
      duration_seconds: emissionsData?.duration_seconds || ((Date.now() - startTime) / 1000),
    };
    
    console.log(`[CLIP] Final emissions data:`, finalEmissions);
    
    return {
      confidence,
      label,
      matches,
      predictions: positivePrompts.map((prompt, idx) => ({
        label: prompt,
        score: positiveScores[idx],
      })),
      aiScore,
      description: `CLIP similarity: ${adjustedScore.toFixed(4)}`,
      emissions: finalEmissions,
    };
  } catch (error) {
    console.error('[CLIP] Error analyzing image:', error.message);
    console.error('[CLIP] Error stack:', error.stack?.substring(0, 500));
    
    throw error;
  }
}

/**
 * Calculate points based on AI verification
 */
function calculatePointsFromAI(basePoints, aiConfidence, matches, geoBonus = 0) {
  if (!matches) {
    // If AI doesn't match category, heavily penalize - give only 5-20% of base points
    const penaltyMultiplier = Math.max(0.05, aiConfidence * 0.2); // 5-20% based on confidence
    return Math.floor(basePoints * penaltyMultiplier);
  }

  // Scale points based on confidence for valid matches
  let confidenceMultiplier = 1.0;
  if (aiConfidence >= 0.8) {
    confidenceMultiplier = 1.0 + (aiConfidence - 0.8) * 1.0; // 1.0 to 1.2
  } else if (aiConfidence >= 0.5) {
    confidenceMultiplier = 0.8 + (aiConfidence - 0.5) * 0.67; // 0.8 to 1.0
  } else {
    confidenceMultiplier = 0.5 + (aiConfidence / 0.5) * 0.3; // 0.5 to 0.8
  }

  const aiAdjustedPoints = Math.floor(basePoints * confidenceMultiplier);
  return aiAdjustedPoints + geoBonus;
}

module.exports = {
  analyzeImageServer,
  calculatePointsFromAI,
};
