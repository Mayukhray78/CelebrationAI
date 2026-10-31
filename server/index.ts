import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import {
  generatePlanWithGemini,
  regenerateSectionWithGemini,
  isGeminiConfigured,
  getGeminiModelName,
} from './gemini.js';

import {
  validateEventFormData,
  validateRegenerateSectionInput,
} from './validators.js';

import {
  securityHeadersMiddleware,
  configureCors,
  createRateLimiter,
  errorHandlerMiddleware,
} from './middleware.js';

import {
  planCache,
  healthCache,
} from './cache.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Resolve directory of compiled server file (for serving built React frontend in production)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientDistPath = path.resolve(__dirname, '../dist');

// Disable X-Powered-By Express header for security
app.disable('x-powered-by');

// Trust reverse proxies (Render, Cloudflare, etc.) for correct IP resolution in rate limiting
app.set('trust proxy', 1);

// Apply enhanced security headers
app.use(securityHeadersMiddleware);

// Apply configured CORS
app.use(configureCors(process.env.ALLOWED_ORIGINS));

// Enforce safe payload size limits (500KB protects against DoS while accommodating rich event configs)
app.use(express.json({ limit: '500kb' }));

// Global API rate limiter (150 requests per 15 minutes per IP)
const globalApiLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  maxRequests: 150,
  message: 'Too many API requests from this IP. Please try again in a few minutes.',
});

// Stricter rate limiter for AI generation endpoints (30 requests per minute per IP)
const aiGenerationLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 30,
  message: 'Plan generation rate limit reached. Please wait a minute before generating again.',
});

// Apply global rate limiting to all /api/ routes
app.use('/api/', globalApiLimiter);

// Health and Configuration Status (cached for 30 seconds for efficiency)
app.get('/api/health', (_req, res) => {
  const cachedHealth = healthCache.get('server_health');
  if (cachedHealth) {
    return res.json(cachedHealth);
  }

  const configured = isGeminiConfigured();
  const healthData = {
    status: 'ok',
    geminiConfigured: configured,
    mode: configured ? 'gemini_active' : 'curated_demo_mode',
    model: configured ? getGeminiModelName() : 'curated_engine',
    timestamp: new Date().toISOString(),
  };

  healthCache.set('server_health', healthData);
  return res.json(healthData);
});

// Generate Full Celebration Plan (with validation, caching & rate limiting)
app.post('/api/plan/generate', aiGenerationLimiter, async (req, res, next) => {
  try {
    const validation = validateEventFormData(req.body);
    if (!validation.isValid || !validation.sanitized) {
      return res.status(400).json({
        error: validation.errors[0] || 'Invalid event parameters.',
        details: validation.errors,
      });
    }

    const formData = validation.sanitized;

    // Generate deterministic cache key for exact repeat queries (e.g. rapid reloads / identical presets)
    const cacheKey = `plan:${formData.eventType}:${formData.location}:${formData.guestCount}:${formData.totalBudgetINR}:${formData.theme}`;
    const cachedPlan = planCache.get(cacheKey);
    if (cachedPlan) {
      return res.json({
        success: true,
        plan: cachedPlan,
        meta: {
          geminiConfigured: isGeminiConfigured(),
          source: cachedPlan.generatedBy,
          modelUsed: cachedPlan.modelUsed,
          cached: true,
        },
      });
    }

    console.log(
      `[API] Generating plan for "${formData.eventName}" (${formData.eventType}) with budget ₹${formData.totalBudgetINR}`,
    );

    const plan = await generatePlanWithGemini(formData);

    // Cache successful generation
    planCache.set(cacheKey, plan);

    return res.json({
      success: true,
      plan,
      meta: {
        geminiConfigured: isGeminiConfigured(),
        source: plan.generatedBy,
        modelUsed: plan.modelUsed,
      },
    });
  } catch (error: unknown) {
    next(error);
  }
});

// Regenerate Single Section (with validation & rate limiting)
app.post('/api/plan/regenerate-section', aiGenerationLimiter, async (req, res, next) => {
  try {
    const validation = validateRegenerateSectionInput(req.body);
    if (!validation.isValid || !validation.sanitized) {
      return res.status(400).json({
        error: validation.errors[0] || 'Invalid section regeneration parameters.',
        details: validation.errors,
      });
    }

    const { currentPlan, sectionKey, refinementPrompt } = validation.sanitized;

    console.log(
      `[API] Regenerating section "${sectionKey}" with prompt: "${refinementPrompt || 'Default'}"`,
    );

    const result = await regenerateSectionWithGemini(
      currentPlan,
      sectionKey,
      refinementPrompt,
    );

    return res.json({
      success: true,
      sectionKey: result.sectionKey,
      data: result.data,
      source: result.source,
      modelUsed: result.modelUsed,
    });
  } catch (error: unknown) {
    next(error);
  }
});

// Serve the built React application in production (Render deployment)
app.use(express.static(clientDistPath, {
  maxAge: '1h',
  etag: true,
}));

// Return the React entry point for frontend SPA routes
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return next();
  }

  res.sendFile(path.join(clientDistPath, 'index.html'), (error) => {
    if (error) {
      next(error);
    }
  });
});

// Handle unknown API endpoints
app.use('/api/*', (_req, res) => {
  return res.status(404).json({ error: 'API endpoint not found.' });
});

// Attach centralized error handler
app.use(errorHandlerMiddleware);

app.listen(PORT, () => {
  console.log(`CelebrationAI server listening on port ${PORT}`);
  console.log(
    `Gemini status: ${
      isGeminiConfigured()
        ? `API key configured (model: ${getGeminiModelName()})`
        : 'Curated fallback mode (GEMINI_API_KEY is not set)'
    }`,
  );
});
