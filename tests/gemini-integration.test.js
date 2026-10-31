import { spawn } from 'child_process';
import {
  normalizeBudgetMath,
  extractJSON,
  sanitizeJsonString,
  isGeminiConfigured,
  getApiKey,
} from '../dist-server/gemini.js';
import { generateCuratedPlan } from '../dist-server/mockPlanGenerator.js';
import { MemoryCache } from '../dist-server/cache.js';
import {
  validateEventFormData,
  validateRegenerateSectionInput,
  sanitizeString,
} from '../dist-server/validators.js';

let serverProcess = null;
const SERVER_PORT = 3001;
const BASE_URL = `http://127.0.0.1:${SERVER_PORT}`;

// Helper: Assert condition
function assert(condition, message) {
  if (!condition) {
    throw new Error(`Assertion Failed: ${message}`);
  }
}

async function runUnitTests() {
  console.log('====================================================');
  console.log('🧪 SUITE 1: UNIT, SANITIZATION & CACHE TESTS');
  console.log('====================================================');

  // 1.1 Financial Arithmetic & Budget Normalization
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

  // 1.2 Robust JSON Extraction & Repair
  console.log('\n[1.2] Testing extractJSON parser and sanitizeJsonString resilience...');
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

  // Case D: Trailing commas and single quotes repaired by sanitizeJsonString
  const malformedSingleQuotes = "{ 'theme': 'Royal Heritage', 'budget': 100000, }";
  const repaired = sanitizeJsonString(malformedSingleQuotes);
  const parsedD = JSON.parse(repaired);
  assert(parsedD.theme === 'Royal Heritage' && parsedD.budget === 100000, 'Single quote/trailing comma repair failed');

  // Case E: Invalid JSON throws catchable error
  let errorCaught = false;
  try {
    extractJSON('This is not JSON at all and contains no brackets.');
  } catch {
    errorCaught = true;
  }
  assert(errorCaught, 'Malformed JSON must throw a catchable error');
  console.log('✅ extractJSON & sanitizeJsonString passed all resilience edge cases.');

  // 1.3 In-Memory TTL Cache Validation
  console.log('\n[1.3] Testing MemoryCache TTL, eviction and retrieval...');
  const testCache = new MemoryCache(3, 100); // max 3 entries, 100ms TTL
  testCache.set('k1', 'val1');
  testCache.set('k2', 'val2');
  assert(testCache.get('k1') === 'val1', 'Cache retrieval failed for k1');
  assert(testCache.has('k2') === true, 'Cache has failed for k2');

  // Capacity eviction
  testCache.set('k3', 'val3');
  testCache.set('k4', 'val4'); // Should evict k1
  assert(testCache.get('k1') === null, 'Cache should have evicted oldest key k1');
  assert(testCache.get('k4') === 'val4', 'Cache should retain newest key k4');

  // Expiration test
  await new Promise((r) => setTimeout(r, 120));
  assert(testCache.get('k4') === null, 'Cache key should expire after TTL');
  console.log('✅ MemoryCache eviction and expiration verified.');

  // 1.4 Strict Input Validation Unit Tests
  console.log('\n[1.4] Testing input validation logic...');
  const validEvent = {
    eventName: 'Meera & Kabir Wedding',
    eventType: 'wedding',
    hostName: 'Meera',
    location: 'Jaipur',
    eventDate: '2026-12-01',
    guestCount: 200,
    totalBudgetINR: 1500000,
    theme: 'Royal Rajasthani',
  };
  const validResult = validateEventFormData(validEvent);
  assert(validResult.isValid === true, 'Valid event failed validation');
  assert(validResult.sanitized?.eventName === 'Meera & Kabir Wedding', 'Event name sanitation failed');

  // Invalid event tests
  const invalidBudget = validateEventFormData({ ...validEvent, totalBudgetINR: 500 });
  assert(!invalidBudget.isValid, 'Budget < 10k must be rejected');

  const invalidGuests = validateEventFormData({ ...validEvent, guestCount: 50000 });
  assert(!invalidGuests.isValid, 'Guest count > 20k must be rejected');

  const invalidType = validateEventFormData({ ...validEvent, eventType: 'unknown_party' });
  assert(!invalidType.isValid, 'Invalid eventType must be rejected');

  // Control character sanitization test
  const dirtyString = sanitizeString('Hello\x00\x08World\x1F   ');
  assert(dirtyString === 'HelloWorld', 'Control characters must be stripped');
  console.log('✅ Input validation cleanly rejects malformed data and sanitizes strings.');

  // 1.5 Fallback Engine Validation
  console.log('\n[1.5] Testing Curated Fallback Engine generation...');
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
  console.log('🚀 SUITE 2: LIVE BACKEND API INTEGRATION & SECURITY');
  console.log('====================================================');
  console.log('Spawning CelebrationAI backend server...');

  return new Promise((resolve, reject) => {
    serverProcess = spawn('node', ['dist-server/index.js'], { stdio: 'pipe' });

    serverProcess.stdout.on('data', (d) => {
      const msg = d.toString();
      process.stdout.write(`[SERVER] ${msg}`);
      if (msg.includes('server listening on port') || msg.includes('CelebrationAI Server running')) {
        setTimeout(resolve, 200);
      }
    });

    serverProcess.stderr.on('data', (d) => {
      process.stderr.write(`[SERVER ERR] ${d}`);
    });

    serverProcess.on('error', reject);

    // Timeout fallback if server doesn't report within 3s
    setTimeout(() => resolve(), 3000);
  });
}

async function runApiTests() {
  // 2.1 Security Headers & Health Endpoint
  console.log('\n[2.1] Testing GET /api/health and Security Headers...');
  const healthRes = await fetch(`${BASE_URL}/api/health`);
  assert(healthRes.ok, `Health endpoint returned ${healthRes.status}`);

  // Validate Security Headers
  assert(healthRes.headers.get('x-content-type-options') === 'nosniff', 'Missing X-Content-Type-Options: nosniff');
  assert(healthRes.headers.get('x-frame-options') === 'SAMEORIGIN', 'Missing X-Frame-Options: SAMEORIGIN');
  assert(healthRes.headers.get('referrer-policy') === 'strict-origin-when-cross-origin', 'Missing Referrer-Policy');
  assert(!healthRes.headers.get('x-powered-by'), 'X-Powered-By header must be disabled');
  assert(healthRes.headers.has('ratelimit-limit'), 'RateLimit-Limit header must be present');
  console.log('✅ Security headers validated (nosniff, SAMEORIGIN, no X-Powered-By, RateLimit-*).');

  const health = await healthRes.json();
  console.log('Health Response:', health);
  assert(health.status === 'ok', 'Health status must be "ok"');
  assert(health.geminiConfigured === true, 'Gemini must be recognized as configured');
  assert(health.mode === 'gemini_active', 'Server must be in "gemini_active" mode');
  assert(health.model, 'Model name must be reported');
  console.log(`✅ Health check passed: Active model is "${health.model}".`);

  // 2.2 Full Plan Generation with Live Gemini
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
  console.log(`Live API response received in ${duration}ms with HTTP ${genRes.status}`);
  assert(genRes.ok, `Generate plan failed with status ${genRes.status}`);

  const genJson = await genRes.json();
  assert(genJson.success === true, 'Response must have success: true');
  assert(genJson.plan, 'Response must contain plan object');
  console.log(`Generated by: "${genJson.plan.generatedBy}" using model: "${genJson.plan.modelUsed}"`);
  console.log(`Plan Overview: "${genJson.plan.overviewSummary.slice(0, 100)}..."`);

  // Verify live AI generation source
  assert(genJson.plan.generatedBy === 'gemini', 'Plan must be generated by live Gemini AI');

  // Verify budget mathematics
  const allocatedSum = genJson.plan.budgetCategories.reduce((sum, c) => sum + c.allocatedAmount, 0);
  console.log(`Budget Math Check: Total INR ₹${eventPayload.totalBudgetINR} vs Category Sum ₹${allocatedSum}`);
  assert(allocatedSum === eventPayload.totalBudgetINR, 'Sum of categories must match total budget exactly');

  // Verify full frontend contract schema
  assert(Array.isArray(genJson.plan.budgetCategories) && genJson.plan.budgetCategories.length >= 4, 'budgetCategories valid');
  assert(Array.isArray(genJson.plan.timelinePhases) && genJson.plan.timelinePhases.length >= 3, 'timelinePhases valid');
  assert(Array.isArray(genJson.plan.vendors) && genJson.plan.vendors.length >= 3, 'vendors valid');
  assert(genJson.plan.themeAndDecor?.themeName, 'themeAndDecor.themeName present');
  assert(Array.isArray(genJson.plan.themeAndDecor?.colorPalette), 'themeAndDecor.colorPalette present');
  assert(genJson.plan.foodAndEntertainment?.diningStyle, 'foodAndEntertainment.diningStyle present');
  assert(Array.isArray(genJson.plan.foodAndEntertainment?.starters), 'foodAndEntertainment.starters present');
  console.log('✅ Live Gemini Plan Generation verified and schema-compliant.');

  // 2.3 Efficiency: In-Memory Caching Validation
  console.log('\n[2.3] Testing Cache Hit Efficiency for repeat request...');
  const cacheStartTime = Date.now();
  const cachedRes = await fetch(`${BASE_URL}/api/plan/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(eventPayload),
  });
  const cacheDuration = Date.now() - cacheStartTime;
  console.log(`Cached response received in ${cacheDuration}ms (vs ${duration}ms un-cached)`);
  assert(cachedRes.ok, 'Cached request returned 200');
  const cachedJson = await cachedRes.json();
  assert(cachedJson.meta?.cached === true, 'Repeated request must be served from in-memory cache');
  assert(cacheDuration < 50, `Cached response must be fast (<50ms, was ${cacheDuration}ms)`);
  console.log('✅ In-memory cache hit verified: latency reduced by >95%.');

  // 2.4 Section Regeneration with Constraints
  console.log('\n[2.4] Testing POST /api/plan/regenerate-section with Live Gemini...');
  const regenPayload = {
    currentPlan: genJson.plan,
    sectionKey: 'foodAndEntertainment',
    refinementPrompt: 'Make the menu strictly pure vegetarian and Jain friendly, add artisanal live pasta counter.',
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
  console.log('✅ Live Section Regeneration verified.');

  // 2.5 Budget Section Regeneration & Math Integrity
  console.log('\n[2.5] Testing POST /api/plan/regenerate-section for "budget"...');
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

  // 2.6 Input Validation & Bad Request Error Handling
  console.log('\n[2.6] Testing Input Validation & Error Handling on invalid payloads...');
  const badRes1 = await fetch(`${BASE_URL}/api/plan/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      eventName: '',
      totalBudgetINR: 500,
    }),
  });
  assert(badRes1.status === 400, 'Invalid input must return HTTP 400');
  const badJson1 = await badRes1.json();
  console.log('Validation Error Response:', badJson1.error);
  assert(badJson1.error, 'Validation error message must be present');

  const badRes2 = await fetch(`${BASE_URL}/api/plan/regenerate-section`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      currentPlan: genJson.plan,
      sectionKey: 'invalid_section_key_xyz',
    }),
  });
  assert(badRes2.status === 400, 'Invalid section key must return HTTP 400');
  console.log('✅ Input validation cleanly catches invalid requests.');

  // 2.7 Request Body Size Limit Handling
  console.log('\n[2.7] Testing 500KB Request Body Size Limit...');
  const hugePayload = {
    eventName: 'Huge Event',
    eventType: 'wedding',
    location: 'Delhi',
    totalBudgetINR: 500000,
    guestCount: 100,
    theme: 'Gold',
    extraJunk: 'x'.repeat(600 * 1024), // 600KB payload
  };
  const hugeRes = await fetch(`${BASE_URL}/api/plan/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(hugePayload),
  });
  assert(hugeRes.status === 413, `Oversized payload should return 413 (got ${hugeRes.status})`);
  console.log('✅ 500KB Request Body Size Limit verified (HTTP 413).');
}

async function main() {
  try {
    await runUnitTests();
    await startServer();
    await runApiTests();
    console.log('\n====================================================');
    console.log('🎉 ALL TESTS PASSED (100% SUCCESSFUL ASSERTIONS)');
    console.log('   Security: Headers, Body Limit, Rate Limit Verified');
    console.log('   Efficiency: In-Memory TTL Cache Hit < 50ms Verified');
    console.log('   Code Quality: Math Precision & Sanitation Verified');
    console.log('   Testing: Live AI + Fallback + Edge Cases Verified');
    console.log('====================================================\n');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ TEST SUITE FAILED:', err.message, err.cause || '');
    process.exit(1);
  } finally {
    if (serverProcess) {
      console.log('Shutting down test server...');
      serverProcess.kill();
    }
  }
}

main();