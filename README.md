# CelebrationAI ✨ — PromptWars Challenge

> **Polished, responsive GenAI-powered event planning web application** designed for Indian celebrations, milestone birthdays, royal weddings, anniversaries, and community galas.

---

## 🌟 Overview & Key Features

CelebrationAI delivers an end-to-end event planning studio with a warm cream and royal purple aesthetic, mathematically guaranteed Indian Rupee (INR ₹) budget normalization, chronological roadmaps, vendor procurement guidelines, and section-by-section GenAI regeneration powered by Google Gemini.

### Core Capabilities:
1. **Intelligent Event Configuration Form**:
   - Event Types: Weddings 💍, Milestone Birthdays 🎂, Anniversaries 🥂, Community Festivals 🎪, Corporate Galas 💼, Housewarmings 🏡.
   - Comprehensive parameters: Event Name, Host/Organizer, City/Location, Countdown Date, Guest Count with scale indicators, Total Budget in INR (with Lakhs/Crore helpers and quick presets), Theme/Vibe, Dietary Requirements (Pure-Veg/Jain segregation), and Special Requests.
   - 1-Click Sample Blueprints: Instantly load curated events like *Jaipur Royal Palace Wedding*, *Bengaluru Sunset Terrace 30th*, *Mumbai Silver Jubilee*, or *Delhi Diwali Mela*.
   - Real-time field validation with helpful guidance.

2. **Google Gemini GenAI & Financial Engine**:
   - Secure server-side endpoint (`/api/plan/generate` & `/api/plan/regenerate-section`) keeping API keys out of frontend source code.
   - Mathematical normalization ensuring the sum of all category allocations strictly matches the total budget in INR.
   - Graceful resilience: Seamlessly runs in **Curated Intelligent Mode** when offline or if no key is configured, and switches to **Google Gemini 1.5 Flash** as soon as `GEMINI_API_KEY` is added to `.env`.

3. **Organized Plan Sections**:
   - **Budget Allocation & Spend Tracker**:
     - Metric cards: Total Budget, Estimated Allocation, Actual Spent, and Remaining Balance.
     - Budget utilization visual gauge with warning indicators (<85% On Track, 85-100% Near Cap, >100% Over Budget).
     - Proportional category breakdown bar.
     - Stream-by-stream expense logger allowing users to record actual spending in real time.
   - **Preparation Roadmap & Milestones**:
     - 4-phase chronological milestones (Foundation, Theme & Vendors, Final Logistics, Day of Celebration).
     - Actionable priorities (High, Medium, Low) and relative target dates.
     - Interactive checklist: clicking marks items done, recalculates progress %, and launches celebration confetti on 100% completion!
   - **Vendor Procurement Guide**:
     - Categorized checklists (Venue, Catering, Florist & Decor, Photography & Film, DJ & Sound).
     - Real-time status tracker (To Research, Shortlisted, Contacted, Confirmed & Booked).
     - Target budget in INR, key deliverables, and essential interview questions.
     - Transparent advisory notice clarifying that checklists guide RFP hiring without fabricating fake vendor availability.
   - **Theme, Decor & Culinary Experience**:
     - Visual color palette swatches with hex codes and styling roles.
     - Architectural decor concepts: Entrance walkway, Stage backdrop, Tablescapes, and 3D photo opportunity.
     - Curated dining courses: Welcome drinks, Artisanal starters, Signature mains, Live culinary counters, Desserts, and Dietary segregation notes.
     - Entertainment highlights and timed run-of-show.

4. **Interactive Section Regeneration**:
   - Regenerate individual sections (Budget, Timeline, Vendors, Theme & Decor, Food & Entertainment) without losing the rest of your plan.
   - Modal supports custom natural-language refinement prompts (e.g., *"Make entire menu 100% Pure Vegetarian and Jain friendly"*, *"Add outdoor bonfire and live saxophone"*).

5. **Persistence & Export**:
   - Auto-saves plans to browser `localStorage`.
   - 1-click **Export Plan (JSON)**.
   - Print-ready format (`Ctrl + P` / Print Plan) styled with clean print CSS.
   - **Firebase Firestore Phase 2 Preview**: Transparently showcases the planned collection schema (`celebration_plans`) without making false claims of unverified deployment.

---

## 🛠️ Technology Stack

- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Lucide React icons, Canvas Confetti.
- **Backend**: Node.js, Express, TypeScript, `@google/generative-ai`, `dotenv`, `cors`.
- **Styling**: Modern event dashboard with warm cream background (`#FAF8F5`), rich royal purple accents (`#6D28D9`), clean Plus Jakarta Sans & Playfair Display typography, rounded cards (`rounded-3xl`), and soft drop shadows.
- **AI Model**: Google Gemini 1.5 Flash via official SDK.

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment (Optional for Live Gemini AI)
Copy `.env.example` to `.env`:
```bash
# Add your Gemini API key from Google AI Studio: https://aistudio.google.com/
GEMINI_API_KEY=your_actual_gemini_api_key_here
PORT=3001
```
> *Note: If no API key is provided, CelebrationAI runs in Curated Demo Mode with full functionality.*

### 3. Start Development Servers
Run both backend Express server and Vite frontend concurrently:
```bash
npm run dev
```
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:3001`

### 4. Build for Production
```bash
npm run build
```
Builds both client (`dist/`) and server (`dist-server/`).

---

## 🔒 Security & Best Practices
- **Zero Exposed Secrets**: API keys are strictly accessed on the Node.js backend (`process.env.GEMINI_API_KEY`) and never included in client-side bundles.
- **Input Validation**: Rigorous schema checks on both client and server prevent invalid or negative budget values and past dates.
- **Reliable Math**: Financial calculations are normalized in application code to eliminate floating-point discrepancies.
- **Honest Vendor Availability**: The vendor section acts as an RFP checklist and inquiry guide, avoiding fabricated live booking calendars.
