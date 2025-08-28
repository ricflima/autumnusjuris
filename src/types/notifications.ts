export interface AdvancedNotification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  priority: NotificationPriority;
  category: NotificationCategory;
  recipients: NotificationRecipient[];
  channels: NotificationChannel[];
  status: NotificationStatus;
  scheduledFor?: string;
  sentAt?: string;
  readAt?: string;
  actionUrl?: string;
  actionText?: string;
  data?: Record<string, any>;
  templateId?: string;
  campaignId?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export type NotificationType = 
  | 'reminder'
  | 'deadline'
  | 'hearing'
  | 'payment'
  | 'document'
  | 'task'
  | 'system'
  | 'marketing'
  | 'urgent';

export type NotificationPriority = 'low' | 'medium' | 'high' | 'critical';

export type NotificationCategory = 
  | 'legal'
  | 'financial'
  | 'administrative'
  | 'client'
  | 'system'
  | 'marketing';

export type NotificationChannel = 
  | 'push'
  | 'email'
  | 'sms'
  | 'whatsapp'
  | 'in_app'
  | 'webhook';

export type NotificationStatus = 
  | 'draft'
  | 'scheduled'
  | 'sent'
  | 'delivered'
  | 'read'
  | 'failed'
  | 'cancelled';

export interface NotificationRecipient {
  id: string;
  type: 'user' | 'client' | 'group' | 'role';
  name: string;
  email?: string;
  phone?: string;
  preferences: NotificationPreferences;
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
  sentAt?: string;
  deliveredAt?: string;
  readAt?: string;
  failureReason?: string;
}

export interface NotificationPreferences {
  channels: Record<NotificationChannel, boolean>;
  categories: Record<NotificationCategory, boolean>;
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
  };
  frequency: 'immediate' | 'hourly' | 'daily' | 'weekly';
}

export interface NotificationTemplate {
  id: string;
  name: string;
  description: string;
  type: NotificationType;
  category: NotificationCategory;
  channels: NotificationChannel[];
  subject: string;
  content: {
    email?: NotificationEmailContent;
    sms?: NotificationSMSContent;
    push?: NotificationPushContent;
    whatsapp?: NotificationWhatsAppContent;
  };
  variables: NotificationVariable[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationEmailContent {
  html: string;
  text: string;
  attachments?: NotificationAttachment[];
}

export interface NotificationSMSContent {
  message: string;
}

export interface NotificationPushContent {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  sound?: string;
  vibrate?: number[];
  actions?: NotificationAction[];
}

export interface NotificationWhatsAppContent {
  message: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'document' | 'video' | 'audio';
}

export interface NotificationVariable {
  name: string;
  description: string;
  type: 'string' | 'number' | 'date' | 'boolean';
  required: boolean;
  defaultValue?: any;
}

export interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
  url?: string;
}

export interface NotificationAttachment {
  filename: string;
  contentType: string;
  url: string;
  size: number;
}

export interface NotificationCampaign {
  id: string;
  name: string;
  description: string;
  type: 'one_time' | 'recurring' | 'triggered';
  templateId: string;
  targetAudience: CampaignAudience;
  schedule: CampaignSchedule;
  status: 'draft' | 'active' | 'paused' | 'completed' | 'cancelled';
  statistics: CampaignStatistics;
  createdAt: string;
  updatedAt: string;
}

export interface CampaignAudience {
  type: 'all' | 'segment' | 'custom';
  segments?: string[];
  customRecipients?: string[];
  filters?: AudienceFilter[];
}

export interface AudienceFilter {
  field: string;
  operator: 'equals' | 'contains' | 'starts_with' | 'ends_with' | 'greater_than' | 'less_than';
  value: any;
}

export interface CampaignSchedule {
  type: 'immediate' | 'scheduled' | 'recurring';
  sendAt?: string;
  timezone?: string;
  recurring?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    interval: number;
    endDate?: string;
  };
}

export interface CampaignStatistics {
  totalRecipients: number;
  sent: number;
  delivered: number;
  read: number;
  clicked: number;
  failed: number;
  unsubscribed: number;
  deliveryRate: number;
  openRate: number;
  clickRate: number;
}

export interface NotificationSettings {
  pushEnabled: boolean;
  emailEnabled: boolean;
  smsEnabled: boolean;
  whatsappEnabled: boolean;
  providers: {
    push: PushProvider;
    email: EmailProvider;
    sms: SMSProvider;
    whatsapp: WhatsAppProvider;
  };
  rateLimiting: {
    enabled: boolean;
    maxPerMinute: number;
    maxPerHour: number;
    maxPerDay: number;
  };
  retryPolicy: {
    enabled: boolean;
    maxRetries: number;
    backoffMultiplier: number;
    maxBackoffDelay: number;
  };
}

export interface PushProvider {
  service: 'firebase' | 'apns' | 'webpush';
  config: Record<string, any>;
  isActive: boolean;
}

export interface EmailProvider {
  service: 'smtp' | 'sendgrid' | 'mailgun' | 'ses';
  config: Record<string, any>;
  isActive: boolean;
}

export interface SMSProvider {
  service: 'twilio' | 'nexmo' | 'zenvia';
  config: Record<string, any>;
  isActive: boolean;
}

export interface WhatsAppProvider {
  service: 'twilio' | 'whatsapp_business_api';
  config: Record<string, any>;
  isActive: boolean;
}

export interface NotificationAnalytics {
  period: 'hour' | 'day' | 'week' | 'month';
  startDate: string;
  endDate: string;
  metrics: {
    totalSent: number;
    totalDelivered: number;
    totalRead: number;
    totalFailed: number;
    averageDeliveryTime: number;
    deliveryRate: number;
    openRate: number;
    clickRate: number;
  };
  byChannel: Record<NotificationChannel, NotificationAnalytics['metrics']>;
  byCategory: Record<NotificationCategory, NotificationAnalytics['metrics']>;
  timeline: NotificationTimelineData[];
}

export interface NotificationTimelineData {
  timestamp: string;
  sent: number;
  delivered: number;
  read: number;
  failed: number;
}