export type ThemeMode = 'light' | 'dark' | 'system';

export type BrandGreenShade = 'botanical' | 'forest' | 'evergreen' | 'moss';

export type InterfaceDensity = 'comfortable' | 'balanced' | 'compact';

export type CardStyle = 'minimal' | 'bordered' | 'softly-elevated';

export type CornerRadius = 'sharp' | 'refined' | 'rounded';

export type TextScale = 'default' | 'large' | 'compact';

export type CurrencyCode = 'INR' | 'USD' | 'EUR' | 'GBP';

export type DateFormatStyle = 'dd-mmm-yyyy' | 'mmm-dd-yyyy' | 'yyyy-mm-dd';

export type RecurrenceType = 'none' | 'monthly' | 'yearly';

export type MomentStatus = 'upcoming' | 'in-progress' | 'completed' | 'cancelled';

export type ActivityPriority = 'low' | 'medium' | 'high';

export type AttachmentKind = 'photo' | 'document' | 'link' | 'camera';

export type GreetingCardStyle =
  | 'indigo-dusk'
  | 'ivory-botanical'
  | 'warm-terracotta'
  | 'midnight-gold'
  | 'minimal-linen';

export interface CustomTaxonomyItem {
  id: string;
  name: string;
  isBuiltIn: boolean;
  enabled: boolean;
}

export interface TimelineEventItem {
  id: string;
  timestamp: string;
  title: string;
  category: 'status' | 'activity' | 'memory' | 'expense' | 'attachment' | 'note';
}

export interface MomentRecord {
  id: string;
  title: string;
  type: string;
  date: string;
  time?: string;
  recurrence: RecurrenceType;
  status: MomentStatus;
  description: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
  history: TimelineEventItem[];
}

export interface ActivityRecord {
  id: string;
  momentId?: string; // Optional reference to an event
  title: string;
  date: string;
  priority: ActivityPriority;
  description: string;
  completed: boolean;
  completedAt?: string;
  expenseId?: string;
  attachmentId?: string;
  createdAt: string;
}

export interface MemoryRecord {
  id: string;
  title: string;
  description: string;
  caption?: string;
  date: string;
  location?: string;
  photoUrl?: string;
  momentId?: string; // Optional reference to an event
  activityId?: string; // Optional reference to an activity
  createdAt: string;
}

export interface AttachmentRecord {
  id: string;
  name: string;
  kind: AttachmentKind;
  mimeType: string;
  sizeBytes?: number;
  url: string;
  description?: string;
  momentId?: string; // Optional reference to an event
  activityId?: string; // Optional reference to an activity
  createdAt: string;
}

export interface GreetingRecord {
  id: string;
  recipientName: string;
  occasion: string;
  message: string;
  style: GreetingCardStyle;
  senderName: string;
  momentId?: string; // Optional reference to an event
  createdAt: string;
}

export interface FinanceRecord {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  date: string;
  title: string;
  category: string;
  notes?: string;
  momentId?: string; // Optional reference to an event
  activityId?: string; // Optional reference to an activity
  createdAt: string;
}

export interface UserProfile {
  displayName: string;
  nickname: string;
  bio: string;
  photoUrl?: string;
  deviceName: string;
  lastBackupAt?: string;
  backupCount: number;
}

export interface HomeSectionsVisibility {
  focus: boolean;
  events: boolean;
  activities: boolean;
  memories: boolean;
  onThisDay: boolean;
  finances: boolean;
}

export interface AppSettings {
  // Essential appearance
  theme: ThemeMode;
  currency: CurrencyCode;
  dateFormat: DateFormatStyle;
  defaultMomentType: string;
  
  // Taxonomies
  momentTypes: CustomTaxonomyItem[];
  expenseCategories: CustomTaxonomyItem[];
  incomeTypes: CustomTaxonomyItem[];

  // Deep Personalization: Appearance & Layout
  brandGreenShade?: BrandGreenShade;
  density?: InterfaceDensity;
  cardStyle?: CardStyle;
  cornerRadius?: CornerRadius;
  textScale?: TextScale;
  reducedMotion?: boolean;

  // Deep Personalization: Home Dashboard
  homeSections?: HomeSectionsVisibility;
  defaultLanding?: PrimarySection;
  hideFinancesOnHome?: boolean;
  homeProminence?: 'events' | 'memories' | 'balanced';

  // Deep Personalization: Modules
  eventViewMode?: 'list' | 'calendar' | 'timeline';
  defaultRecurrence?: RecurrenceType;
  activitySort?: 'date' | 'priority' | 'alphabetical';
  activityCardStyle?: 'compact' | 'detailed';
  hideCompletedActivities?: boolean;
  memoryViewMode?: 'gallery' | 'timeline' | 'list';
  financialMonthStartDay?: number;
  defaultReportingPeriod?: 'month' | 'quarter' | 'year' | 'all';
  weekStartDay?: 'monday' | 'sunday';
  timeFormat?: '12h' | '24h';
}

export interface DNDatabase {
  version: number;
  profile: UserProfile;
  settings: AppSettings;
  moments: MomentRecord[];
  activities: ActivityRecord[];
  memories: MemoryRecord[];
  attachments: AttachmentRecord[];
  greetings: GreetingRecord[];
  finances: FinanceRecord[];
}

export type PrimarySection =
  | 'home'
  | 'events'
  | 'moments' // backward-compat alias
  | 'activities'
  | 'memories'
  | 'attachments'
  | 'finances'
  | 'settings';

export type MemoriesSubTab = 'journal' | 'attachments' | 'greetings';
export type FinancesSubTab = 'overview' | 'transactions' | 'insights';
