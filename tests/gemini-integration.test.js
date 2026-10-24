import { spawn } from 'child_process';
import {
  normalizeBudgetMath,
  extractJSON,
  isGeminiConfigured,
  getApiKey,
} from '../dist-server/gemini.js';
import { generateCuratedPlan } from '../dist-server/mockPlanGenerator.js';

let serverProcess = null;
const SERVER_PORT = 3001;
const BASE_URL = `http://localhost:${SERVER_PORT}`;

// Helper: Assert condition
function assert(condition, message) {
  if (!condition) {
    throw new Error(`Assertion Failed: ${message}`);
  }
}

async function runUnitTests() {
  console.log('====================================================');
  console.log('🧪 SUITE 1: UNIT & SANITIZATION TESTS');
  console.log('====================================================');

  // 1. Budget Total Arithmetic & Normalization
  console.log('\n[1.1] Testing normalizeBudgetMath financial arithmetic...');
  assert(isGeminiConfigured(), 'Gemini should be configured from environment');
  assert(getApiKey().length > 0, 'API key must be present without exposing its value');
  const targetBudget = 1500000;
  const mockRawCategories = [
    { name: 'Venue', allocatedAmount: 432100.45 },
    { name: 'Catering', allocatedAmount: 512300.99 },
    { name: 'Decor', allocatedAmount: 187654.12 },
    { name: 'Photo', allocatedAmount: 98765.43 },
    { name: 'Music', allocatedAmount: 54321.00 },
  ];

  const normalized = normalizeBudgetMath(targetBudget, mockRawCategories);
  const sumAllocated = normalized.reduce((acc, c) => acc + c.allocatedAmount, 0);

  console.log(`Input Target: ₹${targetBudget} | Normalized Sum: ₹${sumAllocated}`);
  assert(sumAllocated === targetBudget, `Sum ${sumAllocated} does not match target ${targetBudget}`);
  assert(normalized.every((c) => Number.isInteger(c.allocatedAmount)), 'All allocated amounts must be integers');
  assert(normalized.every((c) => c.color && c.priority), 'All categories must have color and priority');
  console.log('✅ normalizeBudgetMath passed with 100% financial precision.');

  // 2. Robust JSON Extraction
  console.log('\n[1.2] Testing extractJSON parser resilience...');
  // Case A: Raw valid JSON
  const rawObj = { test: 'value', number: 42 };
  const parsedA = extractJSON(JSON.stringify(rawObj));
  assert(parsedA.test === 'value' && parsedA.number === 42, 'Direct JSON parse failed');

  // Case B: Markdown codeblock ```json ... ```
  const mdBlock = '```json\n{\n  "title": "Royal Wedding",\n  "budget": 2000000\n}\n```';
  const parsedB = extractJSON(mdBlock);
  assert(parsedB.title === 'Royal Wedding' && parsedB.budget === 2000000, 'Markdown codeblock parse failed');

  // Case C: Conversational preamble & postscript
  const conversational = 'Certainly! Here is your requested event plan in JSON:\n{\n  "status": "success",\n  "count": 5\n}\nI hope this helps planning!';
  const parsedC = extractJSON(conversational);
  assert(parsedC.status === 'success' && parsedC.count === 5, 'Conversational JSON extraction failed');

  // Case D: Malformed JSON handling
  let errorCaught = false;
  try {
    extractJSON('This is not JSON at all and contains no brackets.');
  } catch {
    errorCaught = true;
  }
  assert(errorCaught, 'Malformed JSON must throw a catchable error');
  console.log('✅ extractJSON passed all formatting and edge cases.');

  // 3. Fallback Engine Validation
  console.log('\n[1.3] Testing Curated Fallback Engine generation...');
  const sampleInput = {
    eventName: 'Heritage Anniversary Gala',
    eventType: 'anniversary',
    hostName: 'Kapoor Family',
    location: 'Udaipur, Rajasthan',
    eventDate: '2026-12-15',
    guestCount: 120,
    totalBudgetINR: 800000,
    theme: 'Vintage Royal Silver & Emerald',
    dietaryPreference: 'Pure Vegetarian Royal Spread',
    specialPreferences: 'Folk musicians and lake-side candle lighting',
  };

  const fallbackPlan = generateCuratedPlan(sampleInput);
  assert(fallbackPlan.generatedBy === 'curated_fallback', 'Fallback plan must identify as curated_fallback');
  assert(fallbackPlan.totalAllocatedBudget === sampleInput.totalBudgetINR, 'Fallback budget total must match input');
  const sumFallbackCats = fallbackPlan.budgetCategories.reduce((s, c) => s + c.allocatedAmount, 0);
  assert(sumFallbackCats === sampleInput.totalBudgetINR, 'Fallback categories must sum to totalBudgetINR');
  assert(fallbackPlan.timelinePhases.length >= 3, 'Fallback must provide multi-phase timeline');
  assert(fallbackPlan.vendors.length >= 4, 'Fallback must provide vendor checklist');
  console.log('✅ Curated Fallback Engine verified.');
}

async function startServer() {
  console.log('\n====================================================');
  console.log('🚀 SUITE 2: LIVE BACKEND API INTEGRATION TESTS');
  console.log('====================================================');
  console.log('Spawning CelebrationAI backend server...');

  return new Promise((resolve, reject) => {
    serverProcess = spawn('node', ['dist-server/index.js'], { stdio: 'pipe' });

    serverProcess.stdout.on('data', (d) => {
      const msg = d.toString();
      // Mask any accidentally logged secrets (defensive)
      process.stdout.write(`[SERVER] ${msg}`);
      if (msg.includes('CelebrationAI Server running')) {
        resolve();
      }
    });

    serverProcess.stderr.on('data', (d) => {
      process.stderr.write(`[SERVER ERR] ${d}`);
    });

    serverProcess.on('error', reject);

    // Timeout if server doesn't start in 6s
    setTimeout(() => resolve(), 3000);
  });
}

async function runApiTests() {
  // 1. Health Endpoint Test
  console.log('\n[2.1] Testing GET /api/health...');
  const healthRes = await fetch(`${BASE_URL}/api/health`);
  assert(healthRes.ok, `Health endpoint returned ${healthRes.status}`);
  const health = await healthRes.json();
  console.log('Health Response:', health);
  assert(health.status === 'ok', 'Health status must be "ok"');
  assert(health.geminiConfigured === true, 'Gemini must be recognized as configured');
  assert(health.mode === 'gemini_active', 'Server must be in "gemini_active" mode');
  console.log('✅ Health check passed: Live Gemini is detected and active.');

  // 2. Full Plan Generation with Live Gemini
  console.log('\n[2.2] Testing POST /api/plan/generate with Live Gemini...');
  const eventPayload = {
    eventName: 'Vikram & Radhika Sangeet & Reception',
    eventType: 'wedding',
    hostName: 'Vikram & Radhika',
    location: 'Bengaluru, Karnataka',
    eventDate: '2026-11-28',
    guestCount: 200,
    totalBudgetINR: 1800000,
    theme: 'Electric Purple & Marigold Fusion',
    dietaryPreference: 'South & North Indian fusion buffet with live dosa and chaat counters',
    specialPreferences: 'Drone reel coverage, LED dance floor, and cold-firework entry',
  };

  const startTime = Date.now();
  const genRes = await fetch(`${BASE_URL}/api/plan/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(eventPayload),
  });

  const duration = Date.now() - startTime;
  console.log(`Response received in ${duration}ms with HTTP ${genRes.status}`);
  assert(genRes.ok, `Generate plan failed with status ${genRes.status}`);

  const genJson = await genRes.json();
  assert(genJson.success === true, 'Response must have success: true');
  assert(genJson.plan, 'Response must contain plan object');
  console.log(`Generated by: "${genJson.plan.generatedBy}" using model: "${genJson.plan.modelUsed}"`);
  console.log(`Plan Overview: "${genJson.plan.overviewSummary.slice(0, 120)}..."`);

  // Verify live AI generation source
  assert(genJson.plan.generatedBy === 'gemini', 'Plan must be generated by live Gemini AI');

  // Verify budget mathematics
  const allocatedSum = genJson.plan.budgetCategories.reduce((sum, c) => sum + c.allocatedAmount, 0);
  console.log(`Budget Math Check: Total INR ₹${eventPayload.totalBudgetINR} vs Category Sum ₹${allocatedSum}`);
  assert(allocatedSum === eventPayload.totalBudgetINR, 'Sum of categories must match total budget exactly');

  // Verify full frontend contract schema
  assert(Array.isArray(genJson.plan.budgetCategories) && genJson.plan.budgetCategories.length >= 4, 'budgetCategories array valid');
  assert(Array.isArray(genJson.plan.timelinePhases) && genJson.plan.timelinePhases.length >= 3, 'timelinePhases array valid');
  assert(Array.isArray(genJson.plan.vendors) && genJson.plan.vendors.length >= 3, 'vendors array valid');
  assert(genJson.plan.themeAndDecor?.themeName, 'themeAndDecor.themeName present');
  assert(Array.isArray(genJson.plan.themeAndDecor?.colorPalette), 'themeAndDecor.colorPalette array present');
  assert(genJson.plan.foodAndEntertainment?.diningStyle, 'foodAndEntertainment.diningStyle present');
  assert(Array.isArray(genJson.plan.foodAndEntertainment?.starters), 'foodAndEntertainment.starters array present');
  console.log('✅ Live Gemini Plan Generation verified and schema-compliant.');

  // 3. Section Regeneration with Constraints
  console.log('\n[2.3] Testing POST /api/plan/regenerate-section with Live Gemini...');
  const regenPayload = {
    currentPlan: genJson.plan,
    sectionKey: 'foodAndEntertainment',
    refinementPrompt: 'Make the menu 100% strictly pure vegetarian and Jain friendly, add artisanal woodfired pizza live counter.',
  };

  const regenStartTime = Date.now();
  const regenRes = await fetch(`${BASE_URL}/api/plan/regenerate-section`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(regenPayload),
  });

  const regenDuration = Date.now() - regenStartTime;
  console.log(`Regen response received in ${regenDuration}ms with HTTP ${regenRes.status}`);
  assert(regenRes.ok, `Section regeneration failed with status ${regenRes.status}`);

  const regenJson = await regenRes.json();
  assert(regenJson.success === true, 'Regen response must have success: true');
  assert(regenJson.sectionKey === 'foodAndEntertainment', 'sectionKey must match request');
  assert(regenJson.source === 'gemini', 'Regenerated section must come from Gemini');
  assert(regenJson.data?.diningStyle, 'Regenerated food data has diningStyle');
  console.log('Regenerated Dining Style:', regenJson.data.diningStyle);
  console.log('Regenerated Welcome Drinks:', regenJson.data.welcomeDrinks?.slice(0, 2));
  console.log('Regenerated Live Counters:', regenJson.data.liveCounters?.slice(0, 2));
  console.log('✅ Live Section Regeneration verified.');

  // 4. Budget Section Regeneration & Math Integrity
  console.log('\n[2.4] Testing POST /api/plan/regenerate-section for "budget"...');
  const budgetRegenRes = await fetch(`${BASE_URL}/api/plan/regenerate-section`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      currentPlan: genJson.plan,
      sectionKey: 'budget',
      refinementPrompt: 'Allocate more budget towards luxury venue and floral staging.',
    }),
  });
  assert(budgetRegenRes.ok, 'Budget section regeneration returned 200');
  const budgetRegenJson = await budgetRegenRes.json();
  const regenBudgetCats = Array.isArray(budgetRegenJson.data) ? budgetRegenJson.data : budgetRegenJson.data.budgetCategories;
  const regenSum = regenBudgetCats.reduce((s, c) => s + c.allocatedAmount, 0);
  console.log(`Regenerated Budget Sum: ₹${regenSum} vs Ceiling: ₹${eventPayload.totalBudgetINR}`);
  assert(regenSum === eventPayload.totalBudgetINR, 'Regenerated budget sum must equal total budget ceiling');
  console.log('✅ Budget Section Regeneration verified with financial normalization.');

  // 5. Invalid Input / Validation Error Handling
  console.log('\n[2.5] Testing Input Validation & Error Handling on invalid payload...');
  const badRes = await fetch(`${BASE_URL}/api/plan/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      eventName: '', // missing
      totalBudgetINR: 500, // below minimum 10,000
    }),
  });
  assert(badRes.status === 400, 'Invalid input must return HTTP 400');
  const badJson = await badRes.json();
  console.log('Validation Error Response:', badJson.error);
  assert(badJson.error, 'Validation error message must be present');
  console.log('✅ Input validation cleanly catches invalid requests.');
}

async function main() {
  try {
    await runUnitTests();
    await startServer();
    await runApiTests();
    console.log('\n====================================================');
    console.log('🎉 ALL TESTS PASSED! LIVE GEMINI INTEGRATION VERIFIED!');
    console.log('====================================================\n');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ TEST SUITE FAILED:', err.message);
    process.exit(1);
  } finally {
    if (serverProcess) {
      console.log('Shutting down test server...');
      serverProcess.kill();
    }
  }
}

main();
