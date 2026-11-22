export type UserRole = 'klien' | 'pengawas' | 'manajemen';

export interface Milestone {
  id: string;
  name: string;
  category: 'persiapan' | 'struktur' | 'arsitektur' | 'mep' | 'finishing';
  weight: number; // in percent (e.g., 15%)
  startDate: string;
  targetEndDate: string;
  actualEndDate?: string;
  status: 'selesai' | 'dalam_pengerjaan' | 'tertunda' | 'belum_mulai';
  progressPercent: number; // 0 - 100
  supervisorNotes?: string;
}

export interface WeeklyProgress {
  week: number;
  periodLabel: string;
  startDate: string;
  endDate: string;
  planCumulative: number; // %
  actualCumulative: number; // %
  planWeekly: number; // %
  actualWeekly: number; // %
  deviation: number; // actualCumulative - planCumulative
  evaluationStatus: 'Sesuai Jadwal' | 'Lebih Cepat' | 'Perlu Perhatian' | 'Kritis';
  highlight: string;
}

export interface DailyLog {
  id: string;
  date: string;
  dayLabel: string;
  workersCount: number;
  weather: 'Cerah' | 'Berawan' | 'Hujan Ringan' | 'Hujan Lebat';
  completedWork: string[];
  obstacles?: string;
  dailyEstimatedDelta: number; // e.g. +0.8%
  cumulativeProgress: number; // e.g. 58.4%
  supervisorName: string;
}

export interface SitePhoto {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  beforeImageUrl?: string; // for before-after comparison
  date: string;
  time: string;
  phaseName: string;
  category: string;
  supervisorName: string;
  weather?: string;
  isMilestoneProof?: boolean;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  avatarUrl?: string;
  text: string;
  timestamp: string;
  timeString: string;
  read: boolean;
  attachmentUrl?: string;
  isVoiceNote?: boolean;
  voiceDuration?: string;
}

export interface ProjectNotification {
  id: string;
  projectId: string;
  title: string;
  description: string;
  type: 'foto' | 'progres' | 'milestone' | 'chat' | 'peringatan';
  timestamp: string;
  relativeTime: string;
  read: boolean;
  linkTab?: 'rekap' | 'timeline' | 'galeri' | 'harian' | 'chat';
}

export interface PaymentTerm {
  termin: string;
  percentage: number;
  nominalFormatted: string;
  scope: string;
  targetBobot: number;
  status: 'Lunas' | 'Menunggu Progres' | 'Belum Jatuh Tempo';
}

export interface Project {
  id: string;
  contractNumber: string;
  title: string;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  location: string;
  city: string;
  totalBudgetFormatted: string;
  landArea: string;
  buildingArea: string;
  startDate: string;
  targetCompletionDate: string;
  totalWeeks: number;
  currentWeek: number;
  supervisorName: string;
  supervisorTitle: string;
  supervisorPhone: string;
  projectManager: string;
  currentProgress: number; // Realisasi saat ini (%)
  plannedProgress: number; // Target rencana saat ini (%)
  status: 'On Track' | 'Ahead' | 'Delayed';
  milestones: Milestone[];
  weeklyRecords: WeeklyProgress[];
  dailyLogs: DailyLog[];
  photos: SitePhoto[];
  messages: ChatMessage[];
  paymentTerms?: PaymentTerm[];
  unreadNotificationsCount: number;
}
