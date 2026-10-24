import 'dotenv/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

async function inspectRaw() {
  const apiKey = process.env.GEMINI_API_KEY;
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: 'gemini-3.5-flash-lite',
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.7,
    },
  });

  const prompt = `Return a JSON object for an event plan with keys: overviewSummary, budgetCategories, timelinePhases, vendors, themeAndDecor, foodAndEntertainment.`;
  const result = await model.generateContent(prompt);
  const text = result.response.text();
  console.log('--- RAW RESPONSE LENGTH ---', text.length);
  console.log(text.slice(0, 1000));
  try {
    JSON.parse(text);
    console.log('--- DIRECT JSON.PARSE: SUCCESS ---');
  } catch (e) {
    console.log('--- DIRECT JSON.PARSE ERROR ---', e.message);
    const pos = parseInt(e.message.match(/position (\d+)/)?.[1] || '0');
    console.log('AROUND POSITION:', text.slice(Math.max(0, pos - 50), pos + 50));
  }
}

inspectRaw();
