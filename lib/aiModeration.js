// AI Moderation System
// Analyzes user content (avatars, signatures, bios, etc.) for policy violations
// Returns SAFE | UNCERTAIN | UNSAFE with confidence scores
// Designed to support human review, not replace it

const CONFIDENCE_THRESHOLD = 0.7; // 70% confidence

const UNSAFE_KEYWORDS = [
  // Hate speech
  'slur1', 'slur2', // Replace with actual patterns
  // Gore/violence indicators
  'graphic', 'gore', 'violence',
  // NSFW
  'explicit', 'porn',
];

const UNCERTAIN_KEYWORDS = [
  'dark', 'death', 'blood', 'weapon',
];

/**
 * Analyze image for policy violations
 * Uses basic heuristics; in production, would use vision AI API
 * @param {Buffer} imageBuffer - Image file buffer
 * @param {Object} metadata - { width, height, mimeType }
 * @returns {Promise<Object>} AI moderation result
 */
async function analyzeImage(imageBuffer, metadata = {}) {
  try {
    // Basic validation
    if (!imageBuffer || imageBuffer.length === 0) {
      return {
        decision: 'UNSAFE',
        confidence: 0.99,
        reasons: ['Empty or invalid image file'],
        flaggedKeywords: [],
      };
    }

    // Check file size (limit 2MB)
    if (imageBuffer.length > 2 * 1024 * 1024) {
      return {
        decision: 'UNSAFE',
        confidence: 0.95,
        reasons: ['File size exceeds limit (2MB max)'],
        flaggedKeywords: [],
      };
    }

    // Check MIME type
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (metadata.mimeType && !allowedMimes.includes(metadata.mimeType)) {
      return {
        decision: 'UNSAFE',
        confidence: 0.99,
        reasons: ['File type not allowed'],
        flaggedKeywords: [],
      };
    }

    // Check dimensions
    if (metadata.width && metadata.height) {
      if (metadata.width > 2000 || metadata.height > 2000) {
        return {
          decision: 'UNSAFE',
          confidence: 0.85,
          reasons: ['Image dimensions too large'],
          flaggedKeywords: [],
        };
      }
    }

    // In production, call actual vision AI API (OpenAI, Google Vision, etc.)
    // For now, return SAFE with note that this is placeholder
    return {
      decision: 'SAFE',
      confidence: 0.6,
      reasons: [],
      flaggedKeywords: [],
      note: 'Placeholder AI analysis - use production vision API',
    };
  } catch (error) {
    console.error('Error analyzing image:', error);
    return {
      decision: 'UNCERTAIN',
      confidence: 0.5,
      reasons: ['Analysis error - requires manual review'],
      flaggedKeywords: [],
    };
  }
}

/**
 * Analyze text for policy violations
 * @param {String} text - Text content to analyze
 * @param {String} type - 'signature' | 'bio' | 'displayName'
 * @returns {Promise<Object>} AI moderation result
 */
async function analyzeText(text, type = 'text') {
  if (!text || text.trim().length === 0) {
    return {
      decision: 'SAFE',
      confidence: 0.99,
      reasons: [],
      flaggedKeywords: [],
    };
  }

  const lowerText = text.toLowerCase();
  const flaggedUnsafe = [];
  const flaggedUncertain = [];

  // Check for unsafe keywords
  UNSAFE_KEYWORDS.forEach((keyword) => {
    if (lowerText.includes(keyword)) {
      flaggedUnsafe.push(keyword);
    }
  });

  // Check for uncertain keywords
  UNCERTAIN_KEYWORDS.forEach((keyword) => {
    if (lowerText.includes(keyword)) {
      flaggedUncertain.push(keyword);
    }
  });

  // Check length limits
  const maxLengths = {
    signature: 200,
    bio: 500,
    displayName: 30,
  };

  if (maxLengths[type] && text.length > maxLengths[type]) {
    return {
      decision: 'UNSAFE',
      confidence: 0.9,
      reasons: [`Text exceeds maximum length for ${type}`],
      flaggedKeywords: [],
    };
  }

  // Determine decision
  if (flaggedUnsafe.length > 0) {
    return {
      decision: 'UNSAFE',
      confidence: Math.min(0.99, 0.7 + flaggedUnsafe.length * 0.1),
      reasons: [`Potentially harmful content detected`],
      flaggedKeywords: flaggedUnsafe,
    };
  }

  if (flaggedUncertain.length > 0) {
    return {
      decision: 'UNCERTAIN',
      confidence: 0.5 + flaggedUncertain.length * 0.05,
      reasons: [`Content requires review`],
      flaggedKeywords: flaggedUncertain,
    };
  }

  return {
    decision: 'SAFE',
    confidence: 0.95,
    reasons: [],
    flaggedKeywords: [],
  };
}

/**
 * Determine if content should be auto-approved, sent to human review, or auto-rejected
 * @param {Object} aiResult - Result from analyze* functions
 * @returns {String} Action: 'AUTO_APPROVE' | 'AUTO_REJECT' | 'HUMAN_REVIEW'
 */
function determineAction(aiResult) {
  const { decision, confidence } = aiResult;

  if (decision === 'SAFE' && confidence >= 0.8) {
    return 'AUTO_APPROVE';
  }

  if (decision === 'UNSAFE' && confidence >= 0.9) {
    return 'AUTO_REJECT';
  }

  // Everything else goes to human review
  return 'HUMAN_REVIEW';
}

/**
 * Full content moderation pipeline
 * @param {Object} content - { type, data, metadata }
 * @param {String} userId - User ID for logging
 * @returns {Promise<Object>} { action, aiResult, needsReview }
 */
async function moderateContent(content, userId) {
  const { type, data, metadata } = content;

  let aiResult;

  if (type === 'avatar') {
    aiResult = await analyzeImage(data, metadata);
  } else if (type === 'signature' || type === 'bio' || type === 'displayName') {
    aiResult = await analyzeText(data, type);
  } else if (type === 'gif') {
    // GIFs come from approved library, minimal check
    aiResult = { decision: 'SAFE', confidence: 0.99, reasons: [], flaggedKeywords: [] };
  } else {
    aiResult = {
      decision: 'UNCERTAIN',
      confidence: 0.5,
      reasons: ['Unknown content type'],
      flaggedKeywords: [],
    };
  }

  const action = determineAction(aiResult);
  const needsReview = action === 'HUMAN_REVIEW';

  return {
    action,
    aiResult,
    needsReview,
    userId,
    timestamp: new Date(),
  };
}

module.exports = {
  analyzeImage,
  analyzeText,
  determineAction,
  moderateContent,
};
