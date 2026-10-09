import coorgPhoto from '../assets/images/memory_coorg_hills_1791565206142.jpg';
import diwaliPhoto from '../assets/images/memory_courtyard_lamps_1791565216516.jpg';
import anniversaryPhoto from '../assets/images/memory_window_table_1791565227584.jpg';
import {
  CurrencyCode,
  CustomTaxonomyItem,
  DateFormatStyle,
  DNDatabase,
  GreetingCardStyle,
  MomentRecord,
} from '../types/dn';

export const BUILT_IN_MOMENT_TYPES: CustomTaxonomyItem[] = [
  { id: 'mt-birthday', name: 'Birthday', isBuiltIn: true, enabled: true },
  { id: 'mt-anniversary', name: 'Anniversary', isBuiltIn: true, enabled: true },
  { id: 'mt-festival', name: 'Festival', isBuiltIn: true, enabled: true },
  { id: 'mt-family', name: 'Family function', isBuiltIn: true, enabled: true },
  { id: 'mt-milestone', name: 'Personal milestone', isBuiltIn: true, enabled: true },
  { id: 'mt-travel', name: 'Travel', isBuiltIn: true, enabled: true },
  { id: 'mt-other', name: 'Other', isBuiltIn: true, enabled: true },
];

export const BUILT_IN_EXPENSE_CATEGORIES: CustomTaxonomyItem[] = [
  { id: 'ec-food', name: 'Food & Dining', isBuiltIn: true, enabled: true },
  { id: 'ec-groceries', name: 'Groceries', isBuiltIn: true, enabled: true },
  { id: 'ec-travel', name: 'Travel', isBuiltIn: true, enabled: true },
  { id: 'ec-shopping', name: 'Shopping', isBuiltIn: true, enabled: true },
  { id: 'ec-healthcare', name: 'Healthcare', isBuiltIn: true, enabled: true },
  { id: 'ec-entertainment', name: 'Entertainment', isBuiltIn: true, enabled: true },
  { id: 'ec-bills', name: 'Bills & Utilities', isBuiltIn: true, enabled: true },
  { id: 'ec-gifts', name: 'Celebrations & Gifts', isBuiltIn: true, enabled: true },
  { id: 'ec-other', name: 'Other', isBuiltIn: true, enabled: true },
];

export const BUILT_IN_INCOME_TYPES: CustomTaxonomyItem[] = [
  { id: 'it-salary', name: 'Salary', isBuiltIn: true, enabled: true },
  { id: 'it-freelance', name: 'Freelance & Consulting', isBuiltIn: true, enabled: true },
  { id: 'it-bonus', name: 'Bonus', isBuiltIn: true, enabled: true },
  { id: 'it-returns', name: 'Dividends & Returns', isBuiltIn: true, enabled: true },
  { id: 'it-gift', name: 'Family & Gifts', isBuiltIn: true, enabled: true },
  { id: 'it-other', name: 'Other', isBuiltIn: true, enabled: true },
];

export function getTodayISO(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function offsetDateISO(daysOffset: number, yearsOffset = 0): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() + yearsOffset);
  d.setDate(d.getDate() + daysOffset);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function createInitialDatabase(): DNDatabase {
  return {
    version: 1,
    profile: {
      displayName: 'Aarav',
      nickname: 'Aarav',
      bio: 'Keeping track of meaningful occasions, personal reflections, and mindful spending.',
      deviceName: 'Personal Companion',
      backupCount: 0,
    },
    settings: {
      theme: 'system',
      currency: 'INR',
      dateFormat: 'dd-mmm-yyyy',
      defaultMomentType: 'Birthday',
      momentTypes: [...BUILT_IN_MOMENT_TYPES],
      expenseCategories: [...BUILT_IN_EXPENSE_CATEGORIES],
      incomeTypes: [...BUILT_IN_INCOME_TYPES],
      brandGreenShade: 'botanical',
      density: 'balanced',
      cardStyle: 'bordered',
      cornerRadius: 'refined',
      textScale: 'default',
      reducedMotion: false,
      homeSections: {
        focus: true,
        events: true,
        activities: true,
        memories: true,
        onThisDay: true,
        finances: true,
      },
      defaultLanding: 'home',
      hideFinancesOnHome: false,
      homeProminence: 'balanced',
      eventViewMode: 'list',
      defaultRecurrence: 'none',
      activitySort: 'date',
      activityCardStyle: 'detailed',
      hideCompletedActivities: false,
      memoryViewMode: 'gallery',
      financialMonthStartDay: 1,
      defaultReportingPeriod: 'month',
      weekStartDay: 'monday',
      timeFormat: '12h',
    },
    moments: [],
    activities: [],
    memories: [],
    attachments: [],
    greetings: [],
    finances: [],
  };
}

export function createDemoDatabase(): DNDatabase {
  const today = getTodayISO();
  const oneYearAgoToday = offsetDateISO(0, -1);
  const inThreeDays = offsetDateISO(3, -1);
  const inNineDays = offsetDateISO(9, 0);
  const inSixteenDays = offsetDateISO(16, -2);
  const fiveDaysAgo = offsetDateISO(-5, 0);
  const twelveDaysAgo = offsetDateISO(-12, 0);
  const twentyTwoDaysAgo = offsetDateISO(-22, 0);
  const fortyDaysAgo = offsetDateISO(-40, 0);

  return {
    version: 1,
    profile: {
      displayName: 'Divin Kumar',
      nickname: 'Divin',
      bio: 'Product thinker, coffee enthusiast, and collector of quiet family moments.',
      deviceName: 'iPhone 16 Pro · Private Vault',
      lastBackupAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      backupCount: 2,
    },
    settings: {
      theme: 'system',
      currency: 'INR',
      dateFormat: 'dd-mmm-yyyy',
      defaultMomentType: 'Personal milestone',
      momentTypes: [
        ...BUILT_IN_MOMENT_TYPES,
        { id: 'mt-wellness', name: 'Wellness Retreat', isBuiltIn: false, enabled: true },
      ],
      expenseCategories: [...BUILT_IN_EXPENSE_CATEGORIES],
      incomeTypes: [...BUILT_IN_INCOME_TYPES],
    },
    moments: [
      {
        id: 'mom-1',
        title: 'Evening Family Tea & Courtyards',
        type: 'Family function',
        date: today,
        time: '18:30',
        recurrence: 'none',
        status: 'in-progress',
        description: 'Hosting close family at home for filter coffee, cardamom snacks, and music on the terrace.',
        notes: 'Pick up fresh jasmine garlands and Mysore pak from Venkateshwara Sweets before 5 PM.',
        createdAt: new Date(Date.now() - 86400000 * 6).toISOString(),
        updatedAt: new Date().toISOString(),
        history: [
          {
            id: 'h-1',
            timestamp: new Date(Date.now() - 86400000 * 6).toISOString(),
            title: 'Moment created and scheduled for today',
            category: 'status',
          },
          {
            id: 'h-2',
            timestamp: new Date(Date.now() - 86400000 * 1).toISOString(),
            title: 'Marked status as In Progress',
            category: 'status',
          },
        ],
      },
      {
        id: 'mom-2',
        title: "Amma's Birthday Celebration",
        type: 'Birthday',
        date: inThreeDays,
        time: '19:30',
        recurrence: 'yearly',
        status: 'upcoming',
        description: 'Annual family dinner and handwritten silk saree gift for Amma.',
        notes: 'She loves Kanjeevaram pastel shades and pistachio cake with low sugar.',
        createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
        updatedAt: new Date().toISOString(),
        history: [
          {
            id: 'h-3',
            timestamp: new Date(Date.now() - 86400000 * 30).toISOString(),
            title: 'Recurring yearly birthday registered',
            category: 'status',
          },
        ],
      },
      {
        id: 'mom-3',
        title: 'Festival of Lights — Courtyard Gathering',
        type: 'Festival',
        date: inNineDays,
        time: '18:00',
        recurrence: 'yearly',
        status: 'upcoming',
        description: 'Lighting handcrafted terracotta diyas across the verandah and sharing homemade sweets with neighbors.',
        notes: 'Order 48 clay lamps and organic sesame oil early.',
        createdAt: new Date(Date.now() - 86400000 * 14).toISOString(),
        updatedAt: new Date().toISOString(),
        history: [
          {
            id: 'h-4',
            timestamp: new Date(Date.now() - 86400000 * 14).toISOString(),
            title: 'Created festival preparation workspace',
            category: 'status',
          },
        ],
      },
      {
        id: 'mom-4',
        title: 'Wedding Anniversary — Meera & Divin',
        type: 'Anniversary',
        date: inSixteenDays,
        time: '20:00',
        recurrence: 'yearly',
        status: 'upcoming',
        description: 'Quiet window-side tasting dinner overlooking the city skyline.',
        notes: 'Book corner table by the glass window at least a week ahead.',
        createdAt: new Date(Date.now() - 86400000 * 60).toISOString(),
        updatedAt: new Date().toISOString(),
        history: [
          {
            id: 'h-5',
            timestamp: new Date(Date.now() - 86400000 * 60).toISOString(),
            title: 'Anniversary milestone added with yearly recurrence',
            category: 'status',
          },
        ],
      },
      {
        id: 'mom-5',
        title: 'Coorg Coffee Estate Monsoon Escape',
        type: 'Travel',
        date: oneYearAgoToday,
        time: '07:00',
        recurrence: 'none',
        status: 'completed',
        description: 'Four days unplugged among misty Arabica coffee slopes in Pollibetta, Coorg.',
        notes: 'Brought back 2kg of single-estate peaberry roast and pepper vines.',
        createdAt: new Date(Date.now() - 86400000 * 365).toISOString(),
        updatedAt: new Date(Date.now() - 86400000 * 360).toISOString(),
        history: [
          {
            id: 'h-6',
            timestamp: new Date(Date.now() - 86400000 * 365).toISOString(),
            title: 'Completed Coorg estate trip',
            category: 'status',
          },
        ],
      },
    ],
    activities: [
      {
        id: 'act-1',
        momentId: 'mom-1',
        title: 'Pick up fresh jasmine garlands & Mysore pak',
        date: today,
        priority: 'high',
        description: 'Visit Venkateshwara Sweets and flower market on 4th Main before 5:00 PM.',
        completed: false,
        expenseId: 'fin-3',
        createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      },
      {
        id: 'act-2',
        momentId: 'mom-1',
        title: 'Set up warm string lights on the terrace',
        date: today,
        priority: 'medium',
        description: 'Check extension cord and arrange cane chairs for 8 guests.',
        completed: true,
        completedAt: new Date(Date.now() - 3600000 * 3).toISOString(),
        createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      },
      {
        id: 'act-3',
        momentId: 'mom-2',
        title: 'Select pastel Kanjeevaram saree & gift wrap',
        date: offsetDateISO(1),
        priority: 'high',
        description: 'Compare seafoam green and soft ivory silk weaves at Nalli.',
        completed: true,
        completedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
        expenseId: 'fin-4',
        attachmentId: 'att-2',
        createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
      },
      {
        id: 'act-4',
        momentId: 'mom-2',
        title: 'Pre-order low-sugar pistachio rose cake',
        date: offsetDateISO(2),
        priority: 'medium',
        description: 'Include handwritten chocolate plaque.',
        completed: false,
        createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
      },
      {
        id: 'act-5',
        momentId: 'mom-3',
        title: 'Unpack terracotta diyas & cotton wicks',
        date: offsetDateISO(7),
        priority: 'low',
        description: 'Soak new clay lamps in water for 2 hours so they absorb less oil.',
        completed: false,
        createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
      },
    ],
    memories: [
      {
        id: 'mem-1',
        title: 'Sunrise Walk Through Pollibetta Coffee Slopes',
        description:
          'We woke at 5:45 AM as the mist drifted across the silver oak canopy. The estate caretaker walked ahead along the red-earth trail while the first golden rays broke over the Western Ghats. The air smelled of damp earth, woodsmoke, and roasted Arabica.',
        caption: 'First light over the Coorg coffee terraces — exactly one year ago today.',
        date: oneYearAgoToday,
        location: 'Pollibetta, Kodagu (Coorg)',
        photoUrl: coorgPhoto,
        momentId: 'mom-5',
        createdAt: new Date(Date.now() - 86400000 * 365).toISOString(),
      },
      {
        id: 'mem-2',
        title: 'Forty-Eight Clay Lamps Along the Stone Steps',
        description:
          'Three generations gathered in the courtyard as dusk settled. Every child took turns lighting the terracotta diyas along the granite steps while grandmother told stories of how the courtyard looked in the 1970s.',
        caption: 'Terracotta oil lamps warming the ancestral courtyard at twilight.',
        date: twentyTwoDaysAgo,
        location: 'Indiranagar Family Home, Bengaluru',
        photoUrl: diwaliPhoto,
        momentId: 'mom-3',
        createdAt: new Date(Date.now() - 86400000 * 22).toISOString(),
      },
      {
        id: 'mem-3',
        title: 'Quiet Twilight Toast Above the Riverfront',
        description:
          'No loud music or rushed schedules—just a single beeswax candle, handmade ceramic plates, and two hours talking about the year ahead while city lights flickered on across the water.',
        caption: 'Window table at twilight — celebrating another year of building a life together.',
        date: fortyDaysAgo,
        location: 'Skyline Conservatory',
        photoUrl: anniversaryPhoto,
        momentId: 'mom-4',
        createdAt: new Date(Date.now() - 86400000 * 40).toISOString(),
      },
    ],
    attachments: [
      {
        id: 'att-1',
        name: 'Coorg_Estate_Morning_Terrace.jpg',
        kind: 'photo',
        mimeType: 'image/jpeg',
        sizeBytes: 428500,
        url: coorgPhoto,
        description: 'High-resolution photograph from the Pollibetta estate trail.',
        momentId: 'mom-5',
        createdAt: new Date(Date.now() - 86400000 * 365).toISOString(),
      },
      {
        id: 'att-2',
        name: 'Kanjeevaram_Silk_Care_Receipt.pdf',
        kind: 'document',
        mimeType: 'application/pdf',
        sizeBytes: 142000,
        url: 'data:text/plain;charset=utf-8,Nalli%20Silk%20Sarees%20-%20Authentic%20Zari%20Warranty%20%26%20Dry%20Clean%20Care%20Guide.%20Invoice%20Total%3A%20INR%2018%2C500',
        description: 'Silk mark authenticity certificate and dry-clean instructions for Amma’s gift.',
        momentId: 'mom-2',
        activityId: 'act-3',
        createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
      },
      {
        id: 'att-3',
        name: 'Pollibetta Sanctuary Estate Guide',
        kind: 'link',
        mimeType: 'text/uri-list',
        url: 'https://karnatakatourism.org/tour-item/coorg/',
        description: 'Official travel route and plantation stay reference for future family visits.',
        momentId: 'mom-5',
        createdAt: new Date(Date.now() - 86400000 * 120).toISOString(),
      },
      {
        id: 'att-4',
        name: 'Courtyard_Diyas_Reference.jpg',
        kind: 'photo',
        mimeType: 'image/jpeg',
        sizeBytes: 389200,
        url: diwaliPhoto,
        description: 'Lighting arrangement reference for the courtyard steps.',
        momentId: 'mom-3',
        createdAt: new Date(Date.now() - 86400000 * 22).toISOString(),
      },
    ],
    greetings: [
      {
        id: 'grt-1',
        recipientName: 'Amma',
        occasion: 'Birthday',
        message:
          'Dearest Amma, your warmth, quiet strength, and kindness anchor our entire family. Wishing you a year filled with good health, peaceful mornings, and endless joy.',
        style: 'ivory-botanical',
        senderName: 'Divin & Meera',
        momentId: 'mom-2',
        createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      },
      {
        id: 'grt-2',
        recipientName: 'Meera',
        occasion: 'Anniversary',
        message:
          'To my favorite companion in every season—thank you for turning ordinary days into cherished memories. Here is to many more years of quiet laughter and shared dreams.',
        style: 'indigo-dusk',
        senderName: 'Divin',
        momentId: 'mom-4',
        createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
      },
    ],
    finances: [
      {
        id: 'fin-1',
        type: 'income',
        amount: 185000,
        date: fiveDaysAgo,
        title: 'Monthly Product Design Lead Salary',
        category: 'Salary',
        notes: 'Credited after tax deductions',
        createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
      },
      {
        id: 'fin-2',
        type: 'income',
        amount: 42000,
        date: twelveDaysAgo,
        title: 'Design System Advisory Retainer',
        category: 'Freelance & Consulting',
        notes: 'Weekend architecture review session',
        createdAt: new Date(Date.now() - 86400000 * 12).toISOString(),
      },
      {
        id: 'fin-3',
        type: 'expense',
        amount: 3450,
        date: today,
        title: 'Filter coffee roast, jasmine garlands & sweets',
        category: 'Food & Dining',
        notes: 'For today’s evening family tea on the terrace',
        momentId: 'mom-1',
        activityId: 'act-1',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'fin-4',
        type: 'expense',
        amount: 18500,
        date: offsetDateISO(-3),
        title: 'Pastel Kanjeevaram Silk Saree for Amma',
        category: 'Celebrations & Gifts',
        notes: 'Purchased at Nalli Silks for upcoming birthday',
        momentId: 'mom-2',
        activityId: 'act-3',
        createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
      },
      {
        id: 'fin-5',
        type: 'expense',
        amount: 9200,
        date: offsetDateISO(-6),
        title: 'Monthly Organic Groceries & Cold-Pressed Oils',
        category: 'Groceries',
        notes: 'Fresh produce, millets, and pantry staples',
        createdAt: new Date(Date.now() - 86400000 * 6).toISOString(),
      },
      {
        id: 'fin-6',
        type: 'expense',
        amount: 6400,
        date: offsetDateISO(-8),
        title: 'Fiber Broadband, Electricity & Water Bills',
        category: 'Bills & Utilities',
        notes: 'Monthly home utilities',
        createdAt: new Date(Date.now() - 86400000 * 8).toISOString(),
      },
      {
        id: 'fin-7',
        type: 'expense',
        amount: 4800,
        date: offsetDateISO(-14),
        title: 'Handcrafted Terracotta Lamps & Festive Decor',
        category: 'Celebrations & Gifts',
        notes: 'Artisan clay diyas and brass urli',
        momentId: 'mom-3',
        createdAt: new Date(Date.now() - 86400000 * 14).toISOString(),
      },
      {
        id: 'fin-8',
        type: 'expense',
        amount: 5500,
        date: offsetDateISO(-18),
        title: 'Annual Preventive Health Checkup',
        category: 'Healthcare',
        notes: 'Complete blood panel and consultation',
        createdAt: new Date(Date.now() - 86400000 * 18).toISOString(),
      },
    ],
  };
}

export function formatCurrency(amount: number, currency: CurrencyCode = 'INR'): string {
  const localeMap: Record<CurrencyCode, string> = {
    INR: 'en-IN',
    USD: 'en-US',
    EUR: 'de-DE',
    GBP: 'en-GB',
  };
  try {
    return new Intl.NumberFormat(localeMap[currency] || 'en-IN', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `₹${amount.toLocaleString('en-IN')}`;
  }
}

export function formatDate(dateStr: string, style: DateFormatStyle = 'dd-mmm-yyyy'): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-').map(Number);
  if (parts.length !== 3 || isNaN(parts[0])) return dateStr;
  const date = new Date(parts[0], parts[1] - 1, parts[2]);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const dd = String(date.getDate()).padStart(2, '0');
  const mmm = months[date.getMonth()];
  const yyyy = date.getFullYear();

  if (style === 'mmm-dd-yyyy') return `${mmm} ${dd}, ${yyyy}`;
  if (style === 'yyyy-mm-dd') return `${yyyy}-${String(date.getMonth() + 1).padStart(2, '0')}-${dd}`;
  return `${dd} ${mmm} ${yyyy}`;
}

export function getNextOccurrenceDate(moment: MomentRecord, referenceDateISO = getTodayISO()): string {
  if (!moment.date) return referenceDateISO;
  if (moment.recurrence === 'none') {
    return moment.date;
  }

  const [refY, refM, refD] = referenceDateISO.split('-').map(Number);
  const [origY, origM, origD] = moment.date.split('-').map(Number);
  const refDate = new Date(refY, refM - 1, refD);

  if (moment.recurrence === 'yearly') {
    let candidate = new Date(refY, origM - 1, origD);
    if (candidate < refDate) {
      candidate = new Date(refY + 1, origM - 1, origD);
    }
    const y = candidate.getFullYear();
    const m = String(candidate.getMonth() + 1).padStart(2, '0');
    const d = String(candidate.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  if (moment.recurrence === 'monthly') {
    const maxDayThisMonth = new Date(refY, refM, 0).getDate();
    let candidate = new Date(refY, refM - 1, Math.min(origD, maxDayThisMonth));
    if (candidate < refDate) {
      const nextMonthY = refM === 12 ? refY + 1 : refY;
      const nextMonthM = refM === 12 ? 1 : refM + 1;
      const maxDayNextMonth = new Date(nextMonthY, nextMonthM, 0).getDate();
      candidate = new Date(nextMonthY, nextMonthM - 1, Math.min(origD, maxDayNextMonth));
    }
    const y = candidate.getFullYear();
    const m = String(candidate.getMonth() + 1).padStart(2, '0');
    const d = String(candidate.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  return moment.date;
}

export function getDaysUntil(targetDateISO: string, referenceDateISO = getTodayISO()): number {
  const [tY, tM, tD] = targetDateISO.split('-').map(Number);
  const [rY, rM, rD] = referenceDateISO.split('-').map(Number);
  const t = new Date(tY, tM - 1, tD).getTime();
  const r = new Date(rY, rM - 1, rD).getTime();
  return Math.round((t - r) / (1000 * 60 * 60 * 24));
}

export function getRelativeDayText(days: number): string {
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  if (days === -1) return 'Yesterday';
  if (days > 1) return `In ${days} days`;
  return `${Math.abs(days)} days ago`;
}

export function isOnThisDayInPast(dateISO: string, todayISO = getTodayISO()): { matches: boolean; yearsAgo: number } {
  if (!dateISO || dateISO === todayISO) return { matches: false, yearsAgo: 0 };
  const [y, m, d] = dateISO.split('-').map(Number);
  const [ty, tm, td] = todayISO.split('-').map(Number);
  if (m === tm && d === td && y < ty) {
    return { matches: true, yearsAgo: ty - y };
  }
  return { matches: false, yearsAgo: 0 };
}

export interface GreetingTemplate {
  id: string;
  occasion: string;
  label: string;
  style: GreetingCardStyle;
  buildMessage: (name: string) => string;
}

export const GREETING_TEMPLATES: GreetingTemplate[] = [
  {
    id: 'tpl-bday-warm',
    occasion: 'Birthday',
    label: 'Warm & Heartfelt',
    style: 'ivory-botanical',
    buildMessage: (name) =>
      `Dearest ${name || 'Friend'}, wishing you a year filled with calm mornings, meaningful conversations, and good health. May every day ahead bring you closer to what matters most.`,
  },
  {
    id: 'tpl-bday-gratitude',
    occasion: 'Birthday',
    label: 'Gratitude & Family',
    style: 'warm-terracotta',
    buildMessage: (name) =>
      `Happy Birthday, ${name || 'Friend'}! Thank you for being the steady warmth and anchor in our lives. Celebrating your kindness today and always.`,
  },
  {
    id: 'tpl-anniv-intimate',
    occasion: 'Anniversary',
    label: 'Quiet Companionship',
    style: 'indigo-dusk',
    buildMessage: (name) =>
      `To ${name || 'my favorite person'} — thank you for turning ordinary days into cherished memories. Here is to another year of shared laughter, patience, and building our life together.`,
  },
  {
    id: 'tpl-festival-light',
    occasion: 'Festival',
    label: 'Light & Prosperity',
    style: 'midnight-gold',
    buildMessage: (name) =>
      `Warmest festive wishes to ${name || 'you and your family'}. May your home be filled with gentle light, peace, and joyful gatherings throughout the season.`,
  },
  {
    id: 'tpl-milestone-proud',
    occasion: 'Personal milestone',
    label: 'Milestone & Pride',
    style: 'minimal-linen',
    buildMessage: (name) =>
      `Congratulations on this special milestone, ${name || 'Friend'}! Your dedication and quiet persistence made this possible. Wishing you continued fulfillment on the journey ahead.`,
  },
];

export interface BackupValidationResult {
  valid: boolean;
  error?: string;
  summary?: {
    profileName: string;
    momentsCount: number;
    activitiesCount: number;
    memoriesCount: number;
    attachmentsCount: number;
    financesCount: number;
    greetingsCount: number;
    version: number;
  };
  data?: DNDatabase;
}

export function validateBackupJSON(rawText: string): BackupValidationResult {
  try {
    const parsed = JSON.parse(rawText);
    if (!parsed || typeof parsed !== 'object') {
      return { valid: false, error: 'File does not contain a valid JSON object.' };
    }
    if (
      !Array.isArray(parsed.moments) ||
      !Array.isArray(parsed.activities) ||
      !Array.isArray(parsed.memories) ||
      !Array.isArray(parsed.finances) ||
      !parsed.profile ||
      !parsed.settings
    ) {
      return {
        valid: false,
        error: 'Backup structure is incomplete. Expected DN moments, activities, memories, finances, profile, and settings.',
      };
    }

    return {
      valid: true,
      summary: {
        profileName: parsed.profile.displayName || 'Unnamed Profile',
        momentsCount: parsed.moments.length,
        activitiesCount: parsed.activities.length,
        memoriesCount: parsed.memories.length,
        attachmentsCount: Array.isArray(parsed.attachments) ? parsed.attachments.length : 0,
        financesCount: parsed.finances.length,
        greetingsCount: Array.isArray(parsed.greetings) ? parsed.greetings.length : 0,
        version: parsed.version || 1,
      },
      data: {
        ...createInitialDatabase(),
        ...parsed,
        attachments: Array.isArray(parsed.attachments) ? parsed.attachments : [],
        greetings: Array.isArray(parsed.greetings) ? parsed.greetings : [],
      },
    };
  } catch (err) {
    return {
      valid: false,
      error: err instanceof Error ? `Invalid JSON format: ${err.message}` : 'Unable to parse backup file.',
    };
  }
}
