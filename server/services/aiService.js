/**
 * CivicFix — AI Intelligence Service (Phase 5)
 *
 * Rule-based NLP engine for:
 *  - Keyword extraction & auto-tagging
 *  - Priority & severity scoring
 *  - Smart department routing (override category if text says otherwise)
 *  - Duplicate detection (Jaccard similarity on recent reports)
 *  - Spam / low-quality filtering
 *  - Estimated resolution time
 */

import Report from '../models/Report.js';

// ─── Keyword dictionaries ────────────────────────────────────
const URGENCY_KEYWORDS = {
  critical: ['collapse', 'collapsed', 'flood', 'flooding', 'fire', 'electrocution', 'danger', 'dangerous',
    'emergency', 'life-threatening', 'sinkhole', 'accident', 'injury', 'injured', 'death', 'serious',
    'major', 'severe', 'burst', 'explosion', 'toxic', 'contaminated', 'sewage overflow'],
  high: ['broken', 'overflowing', 'blocked', 'leaking', 'water logging', 'no water', 'no electricity',
    'power outage', 'blackout', 'open manhole', 'exposed wire', 'fallen tree', 'clogged', 'stagnant',
    'unsafe', 'hazard', 'hazardous', 'crack', 'cracked', 'deep pothole', 'large pothole', 'urgent'],
  medium: ['pothole', 'garbage', 'trash', 'dirty', 'damaged', 'faulty', 'flickering', 'dim',
    'smell', 'odor', 'noise', 'slow', 'congestion', 'parking', 'graffiti', 'vandalism',
    'overgrown', 'neglected', 'rusted', 'worn'],
  low: ['paint', 'repaint', 'cosmetic', 'suggestion', 'request', 'improvement', 'upgrade',
    'beautification', 'minor', 'small', 'slightly', 'could be better'],
};

const DEPARTMENT_KEYWORDS = {
  roads: ['pothole', 'road', 'street', 'pavement', 'sidewalk', 'footpath', 'highway', 'bridge',
    'divider', 'median', 'speed bump', 'asphalt', 'tar', 'resurfacing', 'paving'],
  sanitation: ['garbage', 'trash', 'rubbish', 'waste', 'dustbin', 'bin', 'dumpster', 'litter',
    'cleanliness', 'sweeping', 'dump', 'smell', 'odor', 'sanitation', 'cleaning', 'drain', 'gutter',
    'sewer', 'sewage', 'manhole', 'stagnant water'],
  water: ['water', 'pipe', 'pipeline', 'tap', 'supply', 'tanker', 'leak', 'leakage', 'burst pipe',
    'water pressure', 'contaminated water', 'dirty water', 'no water', 'water outage', 'borewell',
    'well', 'water tank', 'purification'],
  electricity: ['electricity', 'light', 'streetlight', 'lamp', 'power', 'transformer', 'wire',
    'cable', 'electric', 'outage', 'blackout', 'voltage', 'short circuit', 'pole', 'meter',
    'flickering', 'current', 'fuse', 'generator'],
  parks: ['park', 'garden', 'playground', 'bench', 'tree', 'grass', 'lawn', 'fountain', 'hedge',
    'flower', 'green space', 'jogging track', 'play area', 'swing', 'slide'],
  traffic: ['traffic', 'signal', 'sign', 'zebra crossing', 'pedestrian', 'speed', 'congestion',
    'parking', 'no parking', 'stop sign', 'red light', 'intersection', 'roundabout', 'lane',
    'road marking', 'divider'],
};

const SPAM_INDICATORS = ['test', 'testing', 'asdf', 'qwerty', 'lorem ipsum',
  'aaa', 'bbb', 'xxx', 'hello world', 'sample', '123456', 'abcdef'];

// ─── Utility functions ───────────────────────────────────────

/**
 * Tokenize text into lowercase words, remove punctuation
 */
function tokenize(text) {
  return (text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 1);
}

/**
 * Generate n-grams (1-gram and 2-gram)
 */
function getNgrams(tokens) {
  const unigrams = [...tokens];
  const bigrams = [];
  for (let i = 0; i < tokens.length - 1; i++) {
    bigrams.push(`${tokens[i]} ${tokens[i + 1]}`);
  }
  return [...unigrams, ...bigrams];
}

/**
 * Jaccard similarity between two sets of tokens
 */
function jaccardSimilarity(setA, setB) {
  const a = new Set(setA);
  const b = new Set(setB);
  const intersection = new Set([...a].filter((x) => b.has(x)));
  const union = new Set([...a, ...b]);
  return union.size === 0 ? 0 : intersection.size / union.size;
}

// ─── Core analysis functions ─────────────────────────────────

/**
 * Extract relevant tags from title + description
 */
export function extractTags(title, description, category) {
  const text = `${title} ${description}`.toLowerCase();
  const tokens = tokenize(text);
  const ngrams = getNgrams(tokens);
  const tags = new Set();

  // Add category as a tag
  if (category) tags.add(category);

  // Match against all department keyword lists
  for (const [dept, keywords] of Object.entries(DEPARTMENT_KEYWORDS)) {
    for (const kw of keywords) {
      if (text.includes(kw)) {
        tags.add(kw.replace(/\s+/g, '-'));
      }
    }
  }

  // Match against urgency keywords
  for (const [level, keywords] of Object.entries(URGENCY_KEYWORDS)) {
    for (const kw of keywords) {
      if (text.includes(kw)) {
        tags.add(kw.replace(/\s+/g, '-'));
      }
    }
  }

  // Limit to 8 most relevant tags
  return [...tags].slice(0, 8);
}

/**
 * Calculate priority and severity based on text analysis
 * Returns { priority: 'low'|'medium'|'high'|'critical', severity: 1-10, confidence: 0-1 }
 */
export function assessPriority(title, description) {
  const text = `${title} ${description}`.toLowerCase();
  let score = 0;
  let matchCount = 0;

  // Score based on urgency keyword matches
  for (const kw of URGENCY_KEYWORDS.critical) {
    if (text.includes(kw)) { score += 4; matchCount++; }
  }
  for (const kw of URGENCY_KEYWORDS.high) {
    if (text.includes(kw)) { score += 3; matchCount++; }
  }
  for (const kw of URGENCY_KEYWORDS.medium) {
    if (text.includes(kw)) { score += 2; matchCount++; }
  }
  for (const kw of URGENCY_KEYWORDS.low) {
    if (text.includes(kw)) { score += 1; matchCount++; }
  }

  // Bonus for description length (more detail = likely more significant)
  if (description.length > 200) score += 1;
  if (description.length > 500) score += 1;

  // Normalize score
  const normalizedScore = Math.min(score, 20);

  let priority, severity;
  if (normalizedScore >= 12) {
    priority = 'critical'; severity = Math.min(9 + Math.floor(normalizedScore / 15), 10);
  } else if (normalizedScore >= 7) {
    priority = 'high'; severity = 7 + Math.floor((normalizedScore - 7) / 3);
  } else if (normalizedScore >= 3) {
    priority = 'medium'; severity = 4 + Math.floor((normalizedScore - 3) / 2);
  } else {
    priority = 'low'; severity = Math.max(1, normalizedScore + 1);
  }

  // Confidence is based on how many keywords matched
  const confidence = Math.min(matchCount * 0.15 + 0.3, 0.95);

  return { priority, severity, confidence: parseFloat(confidence.toFixed(2)) };
}

/**
 * Smart department suggestion — analyzes text to suggest a better department
 * than the simple category mapping
 */
export function suggestDepartment(title, description, userCategory) {
  const text = `${title} ${description}`.toLowerCase();
  const scores = {};

  for (const [dept, keywords] of Object.entries(DEPARTMENT_KEYWORDS)) {
    scores[dept] = 0;
    for (const kw of keywords) {
      if (text.includes(kw)) scores[dept]++;
    }
  }

  // Find department with highest keyword match
  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const topDept = sorted[0];

  // Only override if the AI-detected department scores significantly higher
  // than the user-selected category
  const userDeptScore = scores[userCategory] || 0;
  if (topDept && topDept[1] > 0 && topDept[1] > userDeptScore + 1) {
    return { department: topDept[0], confidence: Math.min(topDept[1] * 0.2, 0.9), overridden: true };
  }

  // Use the category-based default
  const CATEGORY_MAP = {
    roads: 'roads', sanitation: 'sanitation', water: 'water',
    electricity: 'electricity', parks: 'parks', traffic: 'traffic', other: 'general',
  };
  return { department: CATEGORY_MAP[userCategory] || 'general', confidence: 0.8, overridden: false };
}

/**
 * Spam / low-quality content detection
 * Returns { isSpam: boolean, reason: string|null, score: 0-1 }
 */
export function detectSpam(title, description) {
  const text = `${title} ${description}`.toLowerCase();
  let spamScore = 0;
  let reason = null;

  // Check minimum length
  if (title.trim().length < 5) {
    spamScore += 0.4;
    reason = 'Title too short';
  }
  if (description.trim().length < 10) {
    spamScore += 0.3;
    reason = reason || 'Description too short';
  }

  // Check for spam indicator words
  for (const indicator of SPAM_INDICATORS) {
    if (text.includes(indicator)) {
      spamScore += 0.3;
      reason = reason || `Contains test/spam text: "${indicator}"`;
    }
  }

  // Check for excessive repetition
  const words = tokenize(text);
  if (words.length > 3) {
    const uniqueRatio = new Set(words).size / words.length;
    if (uniqueRatio < 0.3) {
      spamScore += 0.4;
      reason = reason || 'Excessive word repetition';
    }
  }

  // Check for all caps (shouting)
  const uppercaseRatio = (title.replace(/[^A-Z]/g, '').length) / Math.max(title.length, 1);
  if (uppercaseRatio > 0.7 && title.length > 5) {
    spamScore += 0.15;
    // Not reason-worthy on its own, but add to score
  }

  return {
    isSpam: spamScore >= 0.6,
    reason: spamScore >= 0.6 ? reason : null,
    score: parseFloat(Math.min(spamScore, 1).toFixed(2)),
  };
}

/**
 * Find potential duplicate reports (checks recent reports in the same department)
 * Returns { isDuplicate: boolean, duplicateOf: ObjectId|null, similarity: number }
 */
export async function findDuplicates(title, description, department) {
  try {
    // Fetch recent open reports from the same department (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentReports = await Report.find({
      assignedDepartment: department,
      status: { $in: ['reported', 'acknowledged', 'assigned', 'in_progress'] },
      createdAt: { $gte: thirtyDaysAgo },
    })
      .select('title description _id trackingId')
      .limit(100)
      .lean();

    if (recentReports.length === 0) {
      return { isDuplicate: false, duplicateOf: null, similarity: 0, match: null };
    }

    const inputTokens = tokenize(`${title} ${description}`);
    let bestMatch = { similarity: 0, report: null };

    for (const report of recentReports) {
      const reportTokens = tokenize(`${report.title} ${report.description}`);
      const similarity = jaccardSimilarity(inputTokens, reportTokens);

      if (similarity > bestMatch.similarity) {
        bestMatch = { similarity, report };
      }
    }

    // Threshold: 0.45 = likely duplicate
    const isDuplicate = bestMatch.similarity >= 0.45;

    return {
      isDuplicate,
      duplicateOf: isDuplicate ? bestMatch.report._id : null,
      similarity: parseFloat(bestMatch.similarity.toFixed(3)),
      match: isDuplicate
        ? { trackingId: bestMatch.report.trackingId, title: bestMatch.report.title }
        : null,
    };
  } catch (err) {
    console.error('Duplicate detection error:', err);
    return { isDuplicate: false, duplicateOf: null, similarity: 0, match: null };
  }
}

/**
 * Estimate resolution time based on category + priority + historical data
 * Returns a Date
 */
export async function estimateResolutionTime(category, priority) {
  // Base resolution times in hours by category
  const BASE_HOURS = {
    roads: 72, sanitation: 24, water: 36, electricity: 24,
    parks: 120, traffic: 48, other: 72, general: 72,
  };

  // Priority multipliers
  const PRIORITY_MULT = {
    critical: 0.25, high: 0.5, medium: 1.0, low: 1.5,
  };

  try {
    // Check historical average for this category (resolved reports)
    const avgResolution = await Report.aggregate([
      {
        $match: {
          category,
          status: 'resolved',
          'resolution.resolvedAt': { $ne: null },
        },
      },
      {
        $project: {
          resolutionHours: {
            $divide: [
              { $subtract: ['$resolution.resolvedAt', '$createdAt'] },
              3600000, // ms to hours
            ],
          },
        },
      },
      {
        $group: {
          _id: null,
          avgHours: { $avg: '$resolutionHours' },
          count: { $sum: 1 },
        },
      },
    ]);

    let baseHours;
    if (avgResolution.length > 0 && avgResolution[0].count >= 3) {
      // Use historical average if we have enough data
      baseHours = avgResolution[0].avgHours;
    } else {
      baseHours = BASE_HOURS[category] || 72;
    }

    const adjustedHours = baseHours * (PRIORITY_MULT[priority] || 1.0);
    const eta = new Date();
    eta.setHours(eta.getHours() + Math.round(adjustedHours));

    return eta;
  } catch (err) {
    console.error('ETA estimation error:', err);
    // Fallback: 72 hours
    const fallback = new Date();
    fallback.setHours(fallback.getHours() + 72);
    return fallback;
  }
}

/**
 * Main analysis function — runs all AI modules on a report
 */
export async function analyzeReport(title, description, category) {
  const tags = extractTags(title, description, category);
  const priorityResult = assessPriority(title, description);
  const departmentResult = suggestDepartment(title, description, category);
  const spamResult = detectSpam(title, description);
  const duplicateResult = await findDuplicates(title, description, departmentResult.department);
  const eta = await estimateResolutionTime(category, priorityResult.priority);

  return {
    tags,
    priority: priorityResult.priority,
    severity: priorityResult.severity,
    confidence: priorityResult.confidence,
    department: departmentResult.department,
    departmentOverridden: departmentResult.overridden,
    spam: spamResult,
    duplicate: duplicateResult,
    estimatedResolution: eta,
  };
}
