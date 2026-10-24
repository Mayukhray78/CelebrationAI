import { CelebrationPlan, EventFormData, BudgetCategory, TimelinePhase, VendorItem, ThemeDecorSection, FoodEntertainmentSection } from './types.js';

export function generateCuratedPlan(formData: EventFormData): CelebrationPlan {
  const total = Math.max(10000, formData.totalBudgetINR || 100000);
  const eventDateObj = new Date(formData.eventDate || new Date().toISOString().split('T')[0]);
  const isWedding = formData.eventType === 'wedding';
  const isBirthday = formData.eventType === 'birthday';
  const isCommunity = formData.eventType === 'community';

  const budgetRatios = isWedding
    ? [
        { name: 'Venue & Staging', pct: 0.30, desc: 'Palace / Banquet grounds, stage setup, valet and basic utilities', priority: 'essential', color: '#6D28D9' },
        { name: 'Catering & Beverages', pct: 0.28, desc: 'Welcome drinks, multi-cuisine dinner buffet, live street chaat & dessert counters', priority: 'essential', color: '#7C3AED' },
        { name: 'Floral & Decor Design', pct: 0.15, desc: 'Floral mandap/stage, fairy light canopies, royal entrance arches, table centerpieces', priority: 'essential', color: '#EC4899' },
        { name: 'Cinematography & Photography', pct: 0.11, desc: 'Candid photographer, cinematic 4K drone videography, traditional album & reels', priority: 'recommended', color: '#3B82F6' },
        { name: 'Entertainment & DJ / Dhol', pct: 0.07, desc: 'Celebrity DJ, sound & light rig, live dhol troupe, sangeet emcee', priority: 'recommended', color: '#10B981' },
        { name: 'Invitations & Return Favors', pct: 0.04, desc: 'Digital animated invites, boxed mithai & artisanal handloom favors', priority: 'optional', color: '#F59E0B' },
        { name: 'Contingency & Emergency Buffer', pct: 0.05, desc: 'Power backup generator, unforeseen guest overrun, tipping & transport', priority: 'essential', color: '#64748B' },
      ]
    : isBirthday
    ? [
        { name: 'Venue & Terrace Setup', pct: 0.32, desc: 'Rooftop venue booking, ambient fairy light rigging, bar counter area', priority: 'essential', color: '#6D28D9' },
        { name: 'Food, Starters & Drinks', pct: 0.34, desc: 'Unlimited artisanal finger foods, live woodfired pizza station, mocktails', priority: 'essential', color: '#7C3AED' },
        { name: 'Theme Decor & Photo Backdrop', pct: 0.14, desc: 'Custom neon light sign, balloon garland arch, boho floor cushions', priority: 'recommended', color: '#EC4899' },
        { name: 'Music & Sound System', pct: 0.09, desc: 'Professional party DJ or acoustic live set, JBL sound rig & party lights', priority: 'recommended', color: '#10B981' },
        { name: 'Designer Cake & Sweet Treats', pct: 0.05, desc: 'Two-tier customized designer cake and dessert cupcakes', priority: 'essential', color: '#F59E0B' },
        { name: 'Photography & Favors', pct: 0.06, desc: 'Polaroid instant photo booth guestbook and curated return gift hampers', priority: 'optional', color: '#3B82F6' },
      ]
    : isCommunity
    ? [
        { name: 'Stage, Pandal & Ground Setup', pct: 0.35, desc: 'Weather-proof tenting, performance stage, chairs, carpet, podium, safety barricades', priority: 'essential', color: '#6D28D9' },
        { name: 'Sound, Lights & Generators', pct: 0.20, desc: 'Line-array PA system, stage lighting, silent backup gensets', priority: 'essential', color: '#10B981' },
        { name: 'Community Feast / Food Stalls', pct: 0.25, desc: 'Prasadam / community meal counters, drinking water stations, eco-friendly cutlery', priority: 'essential', color: '#7C3AED' },
        { name: 'Decor, Rangoli & Diyas', pct: 0.08, desc: 'Marigold floral torans, festive lighting along walkways, decorative entrance', priority: 'recommended', color: '#EC4899' },
        { name: 'Cultural Artists & Emcee', pct: 0.07, desc: 'Folk dancers, dhol performers, anchor, contest prizes and shields', priority: 'recommended', color: '#F59E0B' },
        { name: 'Sanitation, Permits & First-Aid', pct: 0.05, desc: 'Municipal permits, portable washrooms, dustbins, security and medical kit', priority: 'essential', color: '#64748B' },
      ]
    : [
        { name: 'Venue & Banquet Hall', pct: 0.35, desc: 'Banquet space, round tables, stage with LED backdrop and ambient lighting', priority: 'essential', color: '#6D28D9' },
        { name: 'Catering & Dining Feast', pct: 0.32, desc: 'Welcome drinks, 4-course dinner buffet with live culinary counters', priority: 'essential', color: '#7C3AED' },
        { name: 'Floral Decor & Memory Wall', pct: 0.13, desc: 'Fresh floral centerpieces, journey photo memory gallery, floral entrance arch', priority: 'recommended', color: '#EC4899' },
        { name: 'Photography & Memory Video', pct: 0.09, desc: 'Event photographer, interview video montage of couple, guestbook portraits', priority: 'recommended', color: '#3B82F6' },
        { name: 'Host / Emcee & Live Music', pct: 0.06, desc: 'Anchor for couple trivia and games, live saxophone/flute artist and DJ', priority: 'optional', color: '#10B981' },
        { name: 'Silver Mementos & Favors', pct: 0.05, desc: 'Personalized thank-you gifts, customized sweet boxes and floral corsages', priority: 'optional', color: '#F59E0B' },
      ];

  let accumulated = 0;
  const budgetCategories: BudgetCategory[] = budgetRatios.map((item, index) => {
    let allocated = 0;
    if (index === budgetRatios.length - 1) {
      allocated = total - accumulated;
    } else {
      allocated = Math.round(total * item.pct);
      accumulated += allocated;
    }
    return {
      id: `cat-${index + 1}`,
      name: item.name,
      allocatedAmount: allocated,
      percentage: Math.round((allocated / total) * 100),
      spentAmount: 0,
      description: item.desc,
      priority: item.priority as 'essential' | 'recommended' | 'optional',
      color: item.color,
    };
  });

  const createRelativeDate = (daysBefore: number) => {
    const d = new Date(eventDateObj);
    d.setDate(d.getDate() - daysBefore);
    return d.toISOString().split('T')[0];
  };

  const timelinePhases: TimelinePhase[] = [
    {
      id: 'phase-1',
      phaseName: 'Phase 1: Foundation & Bookings',
      timeframe: '6-8 Weeks Before Event',
      tasks: [
        { id: 't-1', title: 'Confirm Venue Agreement', description: `Finalize venue contract in ${formData.location} with deposit and timing slots.`, priority: 'high', dueDate: createRelativeDate(45), completed: true, category: 'Venue' },
        { id: 't-2', title: 'Lock Core Catering Menu', description: `Conduct tasting session with caterer; finalize menu: ${formData.dietaryPreference || 'buffet items'}.`, priority: 'high', dueDate: createRelativeDate(40), completed: false, category: 'Catering' },
        { id: 't-3', title: 'Book Primary Photographer & Videographer', description: 'Review portfolios, lock candid shooting hours and deliverables schedule.', priority: 'medium', dueDate: createRelativeDate(35), completed: false, category: 'Photography' },
      ],
    },
    {
      id: 'phase-2',
      phaseName: 'Phase 2: Theme, Decor & Entertainment',
      timeframe: '3-4 Weeks Before Event',
      tasks: [
        { id: 't-4', title: 'Decor Walkthrough & Mood Board Sign-off', description: `Review 3D layouts, floral palette and lighting setup for "${formData.theme}".`, priority: 'high', dueDate: createRelativeDate(25), completed: false, category: 'Decor' },
        { id: 't-5', title: 'Distribute Digital Invitations & RSVP Tracker', description: `Dispatch personalized invites to ${formData.guestCount} guests and set up WhatsApp RSVP line.`, priority: 'high', dueDate: createRelativeDate(21), completed: false, category: 'Invites' },
        { id: 't-6', title: 'Sound, DJ & Music Playlist Curations', description: 'Share list of couple entrance songs, sangeet tracks, and background lounge music.', priority: 'medium', dueDate: createRelativeDate(18), completed: false, category: 'Music' },
      ],
    },
    {
      id: 'phase-3',
      phaseName: 'Phase 3: Final Fittings & Logistical Sync',
      timeframe: '1-2 Weeks Before Event',
      tasks: [
        { id: 't-7', title: 'Final Headcount & Catering Reconfirmation', description: `Lock final guest tally with banquet manager (est. ${formData.guestCount} pax).`, priority: 'high', dueDate: createRelativeDate(10), completed: false, category: 'Catering' },
        { id: 't-8', title: 'Vendor Run-Sheet & Schedule Distribution', description: 'Share minute-by-minute timeline with photographer, emcee, DJ and venue manager.', priority: 'medium', dueDate: createRelativeDate(5), completed: false, category: 'Logistics' },
        { id: 't-9', title: 'Pack Emergency Kit & Favors', description: 'Assemble safety pins, scissors, backup power banks, guest favors, and token payments.', priority: 'low', dueDate: createRelativeDate(2), completed: false, category: 'Preparation' },
      ],
    },
    {
      id: 'phase-4',
      phaseName: 'Phase 4: Event Day Flawless Execution',
      timeframe: 'Day of Celebration',
      tasks: [
        { id: 't-10', title: 'Morning Decor & Stage Inspection', description: 'Check stage backdrop, floral freshness, audio check, and air-conditioning 3 hours prior.', priority: 'high', dueDate: createRelativeDate(0), completed: false, category: 'Coordination' },
        { id: 't-11', title: 'Welcome Drinks & Guest Arrival Flow', description: 'Ensure welcome drink service is ready 30 minutes before first arrival.', priority: 'medium', dueDate: createRelativeDate(0), completed: false, category: 'Hospitality' },
        { id: 't-12', title: 'Enjoy Every Moment!', description: 'Cherish the memories with loved ones while designated coordinators handle stage timings.', priority: 'high', dueDate: createRelativeDate(0), completed: false, category: 'Celebration' },
      ],
    },
  ];

  const vendors: VendorItem[] = [
    {
      id: 'v-1',
      category: 'Venue Coordinator',
      title: 'Banquet / Lawn Site Manager',
      targetBudgetINR: Math.round(total * 0.30),
      status: 'contacted',
      recommendedBookingTiming: 'Book 60-90 days in advance',
      keyDeliverables: ['Main hall & lawn access', 'Bridal green room', 'Valet parking space', 'Generator backup power'],
      essentialQuestions: [
        'What is the curfew timing for outdoor loud music?',
        'Are there any corkage or outside vendor royalty fees?',
        'Is dedicated valet parking included for all guest cars?',
      ],
      notes: `Target venue location in ${formData.location}. Requires advance site visit.`,
    },
    {
      id: 'v-2',
      category: 'Catering & Beverages',
      title: 'Premium Catering Services',
      targetBudgetINR: Math.round(total * 0.28),
      status: 'not_contacted',
      recommendedBookingTiming: 'Book 45-60 days in advance',
      keyDeliverables: ['Live food stations', 'Uniformed service staff', 'Cutlery, crockery & glassware', 'Welcome drink bar'],
      essentialQuestions: [
        'How many service staff members will be assigned per 25 guests?',
        'Can we schedule an in-person tasting session for the signature gravies and chaat?',
        'Do you provide dedicated chafing dishes and live flame burners?',
      ],
      notes: `Menu tailored for ~${formData.guestCount} guests. Special note: ${formData.dietaryPreference || 'Standard luxury spread'}.`,
    },
    {
      id: 'v-3',
      category: 'Decor & Florist',
      title: 'Atmospheric Event Decorator',
      targetBudgetINR: Math.round(total * 0.15),
      status: 'shortlisted',
      recommendedBookingTiming: 'Book 30-45 days in advance',
      keyDeliverables: ['Entrance arch & walkway styling', 'Stage backdrop with theme accents', 'Guest tablescapes & centerpieces', 'Ambient warm uplighting'],
      essentialQuestions: [
        'Are fresh exotic flowers sourced on the morning of the event?',
        'Do you provide 3D digital mockups of the stage before setup?',
        'How many hours before guest arrival will the setup be 100% complete?',
      ],
      notes: `Theme styling: "${formData.theme}". Emphasize warm purple and rich festive tones.`,
    },
    {
      id: 'v-4',
      category: 'Photography & Film',
      title: 'Cinematic & Candid Photography Team',
      targetBudgetINR: Math.round(total * 0.11),
      status: 'not_contacted',
      recommendedBookingTiming: 'Book 45 days in advance',
      keyDeliverables: ['1 Candid photographer + 1 Traditional shooter', '1 Cinematic 4K videographer', 'Teaser reel within 48 hours', 'Edited photobook album'],
      essentialQuestions: [
        'Do you provide same-day sneak-peek photos for social media sharing?',
        'What is the turnaround time for the full raw footage and final edited video?',
        'Do you bring backup cameras, lenses, and lighting equipment on-site?',
      ],
      notes: 'Ensure candid couple portraits during golden hour / evening lighting.',
    },
    {
      id: 'v-5',
      category: 'Entertainment & Sound',
      title: 'Professional DJ & Sound Engineer',
      targetBudgetINR: Math.round(total * 0.07),
      status: 'not_contacted',
      recommendedBookingTiming: 'Book 20-30 days in advance',
      keyDeliverables: ['JBL / RCF line-array sound system', 'Wireless handheld mics for toasts & announcements', 'Intelligent beam lights & smoke effect', 'Custom curated dance playlist'],
      essentialQuestions: [
        'Do you accommodate on-the-spot guest requests without disrupting the playlist vibe?',
        'Will you provide a dedicated sound engineer during speeches and cake cutting?',
        'Do you have the necessary licensing / permissions guidance?',
      ],
      notes: 'Include couple’s favorite genres and high-energy celebratory anthems.',
    },
  ];

  const themeAndDecor: ThemeDecorSection = {
    themeName: formData.theme || (isWedding ? 'Royal Marwar Elegance' : 'Modern Violet Serenade'),
    vibeDescription: `A mesmerizing blend of royal purple sophistication, golden warmth, and bespoke celebratory details crafted for ${formData.eventName}. The ambience evokes intimacy, luxury, and festive cheer.`,
    colorPalette: [
      { name: 'Royal Plum Violet', hex: '#6D28D9', usage: 'Drapes, signature velvet accents, stage canopy' },
      { name: 'Warm Cream Silk', hex: '#FAF8F5', usage: 'Linen base, table runners, candle lanterns' },
      { name: 'Shimmering Heritage Gold', hex: '#D97706', usage: 'Brass urli bowls, cutlery, laser-cut signage' },
      { name: 'Soft Blush Rose', hex: '#F43F5E', usage: 'Exotic roses, carnations, floral chandeliers' },
    ],
    keyVisualMotifs: [
      'Warm fairy light ceiling canopy creating an enchanted starry glow',
      'Cascading fresh floral hanging accents of blush roses, marigolds & baby’s breath',
      'Brass Moroccan lanterns casting ornate shadows along the entrance pathway',
      'Monogrammed customized neon crest highlighting the celebrants',
    ],
    entranceConcept: `An arched walkway lined with glowing brass floor lanterns, cascading purple and cream silk drapes, and a personalized welcome easel: "Welcome to ${formData.eventName}". A floral water fountain or rose-petal urli greets arriving guests.`,
    stageAndBackdrop: `A multi-layered architectural backdrop featuring soft cream arched paneling framed by luxuriant plum and dusty-rose floral installations, illuminated with warm cove backlighting and a glowing customized celebratory crest.`,
    tablescapeAndLighting: `Round banquet tables dressed in rich cream damask cloth, topped with miniature gold candelabras, floating tea-light glass votives, and customized menu cards tied with plum satin ribbons.`,
    photoOpportunityIdea: `A statement 3D floral selfie ring or velvet love-seat surrounded by vintage luggage trunks, brass floor lamps, and neon script saying "Best Night Ever" with instant Polaroid cameras for guests to sign the memory book.`,
  };

  const foodAndEntertainment: FoodEntertainmentSection = {
    diningStyle: isWedding ? 'Grand Multi-Cuisine Buffet with Live Interactive Galleys' : 'Contemporary Floating Appetizers & Live Gourmet Stations',
    welcomeDrinks: [
      'Royal Saffron & Pistachio Thandai Shaker',
      'Smoked Jamun & Rosemary Fizzy Spritzer',
      'Fresh tender coconut water infused with mint & lime in fresh coconuts',
      'Artisanal Peach & Basil Iced Tea',
    ],
    starters: [
      'Truffle Infused Paneer Tikka with Mint Coulis',
      'Crispy Lotus Stem in Sweet Chilli & Sesame Glaze',
      'Smoked Galouti Kebabs on Mini Sheermal Crisps',
      'Avocado Papdi Chaat with Pomegranate Pearls',
    ],
    mainCourses: [
      'Dal Bukhara slow-cooked overnight with churned white butter',
      'Paneer Lababdar in rich cashew-tomato reduction',
      'Subz Dum Biryani paired with Burani Garlic Raita & Salan',
      'Kashmiri Dum Aloo with fragrant star anise gravy',
      'Assorted Tandoori Breads (Garlic Naan, Laccha Paratha, Missi Roti)',
    ],
    liveCounters: [
      'Artisanal Chaat Street: Delhi Golgappas with 4 flavored water shots & Palak Patta Chaat',
      'Wood-Fired Neapolitan Pizza & Handmade Pasta Wheel Station',
      'Flambéed Mongolian Wok Station with customizable veggies and noodles',
    ],
    desserts: [
      'Hot Malpua with Rabdi & saffron slivers',
      'Warm Belgian Chocolate Lava Cake with Madagascar vanilla bean gelato',
      'Mini Baked Gulab Jamun Tartlets',
      'Liquid Nitrogen Kulfi & Ice Cream Bar with exotic dry-fruit toppings',
    ],
    dietaryHighlights: [
      formData.dietaryPreference || 'Extensive Pure-Vegetarian and Jain provisions clearly segregated with dedicated chef stations.',
      'Allergen tags (Nut-free, Gluten-conscious, Dairy-free) placed clearly on buffet display cards.',
    ],
    entertainmentHighlights: [
      {
        title: 'Grand Celebrant Welcome & Entrance Fanfare',
        timing: '7:30 PM - 8:00 PM',
        description: 'Atmospheric low-lying fog entry with custom soundtrack and cold-pyro sparklers greeting the hosts.',
      },
      {
        title: 'Acoustic Sunset Serenade / Cultural Performance',
        timing: '8:00 PM - 9:00 PM',
        description: 'Mellow melodies setting an intimate backdrop during cocktail & appetizer service.',
      },
      {
        title: 'The Spotlight Moment: Toast, Cake Cutting & Speeches',
        timing: '9:00 PM - 9:30 PM',
        description: 'Heartfelt storytelling, video memory reel on the LED wall, and champagne / sparkling cider toast.',
      },
      {
        title: 'High-Octane DJ & Dance Floor Open',
        timing: '9:30 PM Onwards',
        description: 'Bespoke playlist spanning Bollywood blockbusters, retro disco, and international dance hits with interactive LED dhol.',
      },
    ],
    signatureMoments: [
      'Personalized memory wall featuring polaroids pinned by guests with heartfelt handwritten notes',
      'Sparkler exit or confetti burst during the finale song',
      'Midnight snack bar featuring mini masala chai kulhads and hot samosas',
    ],
    partyFavors: [
      'Customized silver-foiled gift boxes with artisanal roasted nuts and saffron infused honey',
      'Personalized scented soy wax candles in lavender and sandalwood essence',
      'Traditional hand-block printed cotton pouches carrying gourmet confectionery',
    ],
  };

  return {
    id: `plan-${Date.now()}`,
    createdAt: new Date().toISOString(),
    eventDetails: formData,
    overviewSummary: `A masterfully designed event plan for "${formData.eventName}" in ${formData.location}. Crafted for ${formData.guestCount} esteemed guests with an optimized ₹${formData.totalBudgetINR.toLocaleString('en-IN')} allocation, harmonizing the "${formData.theme}" aesthetic with seamless timeline execution.`,
    generatedBy: 'curated_fallback',
    modelUsed: 'CelebrationAI Expert Curated Engine',
    budgetCategories,
    totalAllocatedBudget: total,
    timelinePhases,
    vendors,
    themeAndDecor,
    foodAndEntertainment,
  };
}
