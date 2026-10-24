
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import {
  generatePlanWithGemini,
  regenerateSectionWithGemini,
  isGeminiConfigured,
} from './gemini.js';

import {
  EventFormData,
  CelebrationPlan,
  PlanSectionKey,
} from './types.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Resolve the directory of the compiled server file.
// Expected layout:
// project/
//   dist/           -> built React frontend
//   dist-server/    -> compiled Express backend
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientDistPath = path.resolve(__dirname, '../dist');

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Health and configuration status
app.get('/api/health', (_req, res) => {
  const configured = isGeminiConfigured();

  res.json({
    status: 'ok',
    geminiConfigured: configured,
    mode: configured ? 'gemini_active' : 'curated_demo_mode',
    timestamp: new Date().toISOString(),
  });
});

// Generate a complete celebration plan
app.post('/api/plan/generate', async (req, res) => {
  try {
    const formData = req.body as EventFormData;

    if (
      !formData ||
      !formData.eventName ||
      !formData.location ||
      formData.totalBudgetINR == null
    ) {
      return res.status(400).json({
        error:
          'Missing required fields: eventName, location, and totalBudgetINR are required.',
      });
    }

    if (
      !Number.isFinite(Number(formData.totalBudgetINR)) ||
      Number(formData.totalBudgetINR) < 10000
    ) {
      return res.status(400).json({
        error:
          'Minimum budget must be at least ₹10,000 for realistic event planning.',
      });
    }

    if (
      !Number.isFinite(Number(formData.guestCount)) ||
      Number(formData.guestCount) < 1
    ) {
      return res.status(400).json({
        error: 'Guest count must be at least 1.',
      });
    }

    console.log(
      `[API] Generating plan for "${formData.eventName}" (${formData.eventType}) with budget ₹${formData.totalBudgetINR}`,
    );

    const plan = await generatePlanWithGemini(formData);

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
    console.error('[API] Error in /api/plan/generate:', error);

    const details =
      error instanceof Error ? error.message : 'Unknown error';

    return res.status(500).json({
      error: 'Failed to generate celebration plan. Please check server logs.',
      details,
    });
  }
});

// Regenerate one section of an existing plan
app.post('/api/plan/regenerate-section', async (req, res) => {
  try {
    const {
      currentPlan,
      sectionKey,
      refinementPrompt,
    }: {
      currentPlan: CelebrationPlan;
      sectionKey: PlanSectionKey;
      refinementPrompt?: string;
    } = req.body;

    if (!currentPlan || !sectionKey) {
      return res.status(400).json({
        error: 'currentPlan and sectionKey are required.',
      });
    }

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
    console.error(
      '[API] Error in /api/plan/regenerate-section:',
      error,
    );

    const details =
      error instanceof Error ? error.message : 'Unknown error';

    return res.status(500).json({
      error: 'Failed to regenerate section.',
      details,
    });
  }
});

// Serve the built React application
app.use(express.static(clientDistPath));

// Return the React entry point for frontend routes.
// API requests should continue to return normal API responses.
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

// Handle unknown API endpoints and other errors
app.use((req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found.' });
  }

  return res.status(404).send('Page not found.');
});

app.listen(PORT, () => {
  console.log(`CelebrationAI server listening on port ${PORT}`);
  console.log(
    `Gemini status: ${
      isGeminiConfigured()
        ? 'API key configured'
        : 'Curated fallback mode (GEMINI_API_KEY is not set)'
    }`,
  );
});
