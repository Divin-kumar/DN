export type ThemeMode = 'light' | 'dark' | 'system';

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
  momentId?: string;
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
  momentId?: string;
  activityId?: string;
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
  momentId?: string;
  activityId?: string;
  createdAt: string;
}

export interface GreetingRecord {
  id: string;
  recipientName: string;
  occasion: string;
  message: string;
  style: GreetingCardStyle;
  senderName: string;
  momentId?: string;
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
  momentId?: string;
  activityId?: string;
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

export interface AppSettings {
  theme: ThemeMode;
  currency: CurrencyCode;
  dateFormat: DateFormatStyle;
  defaultMomentType: string;
  momentTypes: CustomTaxonomyItem[];
  expenseCategories: CustomTaxonomyItem[];
  incomeTypes: CustomTaxonomyItem[];
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

export type PrimarySection = 'home' | 'moments' | 'memories' | 'finances' | 'settings';

export type MemoriesSubTab = 'journal' | 'attachments' | 'greetings';
export type FinancesSubTab = 'overview' | 'transactions' | 'insights';
