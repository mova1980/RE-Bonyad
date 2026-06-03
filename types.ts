
import { LucideIcon } from 'lucide-react';

export const UserRole = {
  ADMIN: 'ADMIN',
  EXPERT: 'EXPERT',
  MANAGER: 'MANAGER',
  USER: 'USER'
};
export type UserRole = string;

export interface User {
  id: number;
  name: string;
  username: string;
  role: UserRole;
  avatar?: string;
  status: 'active' | 'inactive';
  lastLogin: string;
}

export interface NavItem {
  id: string;
  titleKey: string;
  icon: LucideIcon;
  role: UserRole[];
  badge?: number;
  badgeColor?: string;
}

export type DocumentType = 'image' | 'pdf' | 'text' | 'video' | 'audio';

export interface Document {
  id: string;
  title: string;
  type: DocumentType;
  category: string;
  date: string;
  status: 'processed' | 'pending' | 'failed';
  tags: string[];
  thumbnail?: string;
  profileId: string;
  description?: string;
  aiSuggestedProfileName?: string;
  aiSuggestedProfileId?: string;
  aiConfidence?: number;
  aiAnalysis?: string;
  extraMetadata?: any;
}

export const IsargarCategory = {
  MARTYR: 'شهید و خانواده',
  JANBAZ: 'جانباز (۵۰٪+) و خانواده',
  AZADEGAN: 'آزاده و خانواده',
  LIVING_PARENT: 'پدر/مادر شهید در قید حیات',
  LIVING_SPOUSE: 'همسر شهید در قید حیات',
  NUCLEAR: 'شهدای هسته‌ای',
  RESISTANCE: 'شهدای مقاومت',
  SECURITY: 'شهدای امنیت',
};
export type IsargarCategory = string;

export const AlborzCity = {
  KARAJ: 'کرج',
  FARDIS: 'فردیس',
  KAMALSHAHR: 'کمال‌شهر',
  NAZARABAD: 'نظرآباد',
  MOHAMMADSHAHR: 'محمدشهر',
  MAHDASHT: 'ماهدشت',
  MESHKINDASHT: 'مشکین‌دشت',
  HASHTGERD: 'هشتگرد',
  SAVOJBOLAGH: 'ساوجبلاغ',
  TALEGHAN: 'طالقان',
  CHAHARBAGH: 'چهارباغ',
  ESHTEHARD: 'اشتهارد',
  OTHER: 'سایر',
};
export type AlborzCity = string;

export interface MartyrProfile {
  id: string;
  name: string;
  family: string;
  fatherName: string;
  nationalCode: string;
  gender: 'مرد' | 'زن';
  birthDate: string;
  martyrdomDate?: string;
  education?: string;
  province: string;
  city: string;
  burialPlace?: string;
  unit?: string;
  bio: string;
  avatar: string;
  status: 'فعال' | 'غیرفعال';
  isVerified: boolean;
  category: IsargarCategory; 
  razmanCategory?: string;
}

export type LanguageCode = 'fa' | 'en' | 'ar' | 'tr' | 'ku' | 'bal' | 'ru' | 'zh' | 'es';

export interface Notification {
  id: number;
  type: 'system' | 'ai' | 'user';
  message: string;
  time: string;
  read: boolean;
}

export interface StatCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  color: 'green' | 'gold' | 'blue' | 'gray';
  trend?: string;
}

export interface Memoir {
    id: string;
    profileId: string;
    senderName: string;
    content: string;
    date: string;
    type: 'text' | 'voice';
    tags: string[];
    status: 'pending' | 'approved' | 'rejected' | 'archived';
    audioUrl?: string;
}

export interface HistoricalEvent {
    day: number;
    month: number;
    title: string;
    description: string;
}

export interface TranslationStructure {
    appTitle: string;
    appSubtitle: string;
    culturalUnit: string;
    foundationName: string;
    dashboard: string;
    archive: string;
    restoration: string;
    search: string;
    aiProcessor: string;
    tags: string;
    users: string;
    reports: string;
    settings: string;
    loginTitle: string;
    loginSubtitle: string;
    username: string;
    password: string;
    loginButton: string;
    version: string;
    logout: string;
    admin: string;
    aiChatTitle: string;
    aiChatWelcome: string;
    typeMessage: string;
    online: string;
    placeholderTitle: string;
    placeholderDesc: string;
    menuGeneral: string;
    menuSmartArchive: string;
    menuStrategic: string;
    menuBaseInfo: string;
    sloganSaadi: string;
    sloganRazm: string;
    statsProfiles: string;
    statsDocs: string;
    statsUsers: string;
    statsStatus: string;
    chartDocsTrend: string;
    chartCategories: string;
    chartMedia: string;
    recentActivity: string;
    newFile: string;
    addDoc: string;
    searchPlaceholder: string;
    noDocs: string;
    langCatNative: string;
    langCatResistance: string;
    langCatRegional: string;
    langCatIntl: string;
    razmanNovin: string;
    catNuclear: string;
    cat12DayWar: string;
    catModernEra: string;
    catRegional: string;
    subDanayan: string;
    subNegahbanan: string;
    subCyberSoldiers: string;
    subTirandazan: string;
    subCheshmha: string;
    subJangavaran: string;
    subZabanha: string;
    subSoftWar: string;
    subMediaWar: string;
    subDiplomacy: string;
    subEconomy: string;
    subYemen: string;
    subSyria: string;
    subLebanon: string;
    subIraq: string;
    subPalestine: string;
    hooshmandNegar: string;
    farazJavidan: string;
    secHeroes: string;
    subRazmNegasht: string;
    subAudioBio: string;
    subDigitalStatue: string;
    subFamilyGallery: string;
    subInteractiveMemorial: string;
    secEncyclopedia: string;
    subCultureDict: string;
    subOpsEncyclopedia: string;
    subTacticsLib: string;
    subWeaponsInfo: string;
    subRazmGeo: string;
    secTraining: string;
    subModernCombat: string;
    subOpsSim: string;
    subSpecialExams: string;
    subCertificates: string;
    subSkillRank: string;
    secSecrets: string;
    subSpecialDocs: string;
    subConfidentialReports: string;
    subStratAnalysis: string;
    subOpsMaps: string;
    subSecretStats: string;
    secForum: string;
    subSpecialCircles: string;
    subWarriorsChat: string;
    subOpsCoord: string;
    subCommNetwork: string;
    subConsultRooms: string;
    revayatTitle: string;
    revayatSubtitle: string;
    speakVasiat: string;
    semanticSearch: string;
}
