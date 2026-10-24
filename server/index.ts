import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { generatePlanWithGemini, regenerateSectionWithGemini, isGeminiConfigured } from './gemini.js';
import { EventFormData, CelebrationPlan, PlanSectionKey } from './types.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Health and Configuration Status
app.get('/api/health', (req, res) => {
  const configured = isGeminiConfigured();
  res.json({
    status: 'ok',
    geminiConfigured: configured,
    mode: configured ? 'gemini_active' : 'curated_demo_mode',
    timestamp: new Date().toISOString(),
  });
});

// Generate Full Plan
app.post('/api/plan/generate', async (req, res) => {
  try {
    const formData: EventFormData = req.body;

    // Strict validation
    if (!formData || !formData.eventName || !formData.location || !formData.totalBudgetINR) {
      return res.status(400).json({
        error: 'Missing required fields: eventName, location, and totalBudgetINR are required.',
      });
    }

    if (formData.totalBudgetINR < 10000) {
      return res.status(400).json({
        error: 'Minimum budget must be at least ₹10,000 for realistic event planning.',
      });
    }

    if (!formData.guestCount || formData.guestCount < 1) {
      return res.status(400).json({
        error: 'Guest count must be at least 1.',
      });
    }

    console.log(`[API] Generating plan for: "${formData.eventName}" (${formData.eventType}) with budget ₹${formData.totalBudgetINR}`);
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
  } catch (error: any) {
    console.error('[API] Error in /api/plan/generate:', error);
    return res.status(500).json({
      error: 'Failed to generate celebration plan. Please check server logs.',
      details: error?.message || 'Unknown error',
    });
  }
});

// Regenerate Single Section
app.post('/api/plan/regenerate-section', async (req, res) => {
  try {
    const { currentPlan, sectionKey, refinementPrompt }: {
      currentPlan: CelebrationPlan;
      sectionKey: PlanSectionKey;
      refinementPrompt?: string;
    } = req.body;

    if (!currentPlan || !sectionKey) {
      return res.status(400).json({
        error: 'currentPlan and sectionKey are required.',
      });
    }

    console.log(`[API] Regenerating section "${sectionKey}" with prompt: "${refinementPrompt || 'Default'}"`);
    const result = await regenerateSectionWithGemini(currentPlan, sectionKey, refinementPrompt);

    return res.json({
      success: true,
      sectionKey: result.sectionKey,
      data: result.data,
      source: result.source,
      modelUsed: result.modelUsed,
    });
  } catch (error: any) {
    console.error('[API] Error in /api/plan/regenerate-section:', error);
    return res.status(500).json({
      error: 'Failed to regenerate section.',
      details: error?.message || 'Unknown error',
    });
  }
});

app.listen(PORT, () => {
  console.log(`🌟 CelebrationAI Server running on http://localhost:${PORT}`);
  console.log(`🤖 Gemini Status: ${isGeminiConfigured() ? 'Active (API Key loaded)' : 'Demo / Curated Engine (Set GEMINI_API_KEY in .env for live AI)'}`);
});
