export interface WhatsAppBusinessConfig {
  id: string;
  businessName: string;
  phoneNumberId: string;
  businessAccountId: string;
  accessToken: string;
  webhookToken: string;
  webhookUrl: string;
  isActive: boolean;
  isVerified: boolean;
  features: WhatsAppFeature[];
  settings: WhatsAppSettings;
  createdAt: string;
  updatedAt: string;
}

export type WhatsAppFeature = 
  | 'messaging'
  | 'templates'
  | 'media'
  | 'interactive_messages'
  | 'webhook_notifications'
  | 'automated_responses'
  | 'bulk_messaging'
  | 'message_templates';

export interface WhatsAppSettings {
  autoReply: {
    enabled: boolean;
    message: string;
    businessHours: {
      enabled: boolean;
      timezone: string;
      schedule: WeeklySchedule;
    };
  };
  messageTemplates: {
    greeting: string;
    businessHours: string;
    afterHours: string;
  };
  notifications: {
    newMessages: boolean;
    deliveryStatus: boolean;
    templateStatus: boolean;
  };
  rateLimiting: {
    enabled: boolean;
    maxMessagesPerDay: number;
    maxMessagesPerHour: number;
  };
}

export interface WeeklySchedule {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
}

export interface DaySchedule {
  isOpen: boolean;
  openTime: string;
  closeTime: string;
}

export interface WhatsAppMessage {
  id: string;
  conversationId: string;
  recipientPhone: string;
  senderPhone: string;
  type: WhatsAppMessageType;
  content: WhatsAppMessageContent;
  status: WhatsAppMessageStatus;
  direction: 'inbound' | 'outbound';
  templateId?: string;
  timestamp: string;
  deliveredAt?: string;
  readAt?: string;
  failedAt?: string;
  errorCode?: string;
  errorMessage?: string;
  metadata?: Record<string, any>;
}

export type WhatsAppMessageType = 
  | 'text'
  | 'image'
  | 'document'
  | 'video'
  | 'audio'
  | 'location'
  | 'contact'
  | 'template'
  | 'interactive'
  | 'reaction'
  | 'sticker';

export type WhatsAppMessageStatus = 
  | 'sent'
  | 'delivered'
  | 'read'
  | 'failed'
  | 'pending';

export interface WhatsAppMessageContent {
  text?: string;
  media?: WhatsAppMedia;
  location?: WhatsAppLocation;
  contact?: WhatsAppContact;
  interactive?: WhatsAppInteractive;
  template?: WhatsAppTemplateMessage;
}

export interface WhatsAppMedia {
  id?: string;
  url?: string;
  filename?: string;
  caption?: string;
  mimeType: string;
  size?: number;
}

export interface WhatsAppLocation {
  latitude: number;
  longitude: number;
  name?: string;
  address?: string;
}

export interface WhatsAppContact {
  name: {
    formattedName: string;
    firstName?: string;
    lastName?: string;
  };
  phones?: Array<{
    phone: string;
    type?: string;
    waId?: string;
  }>;
  emails?: Array<{
    email: string;
    type?: string;
  }>;
}

export interface WhatsAppInteractive {
  type: 'button' | 'list';
  header?: {
    type: 'text' | 'image' | 'video' | 'document';
    text?: string;
    media?: WhatsAppMedia;
  };
  body: {
    text: string;
  };
  footer?: {
    text: string;
  };
  action: WhatsAppInteractiveAction;
}

export interface WhatsAppInteractiveAction {
  buttons?: Array<{
    type: 'reply';
    reply: {
      id: string;
      title: string;
    };
  }>;
  sections?: Array<{
    title?: string;
    rows: Array<{
      id: string;
      title: string;
      description?: string;
    }>;
  }>;
  button?: string;
}

export interface WhatsAppTemplateMessage {
  name: string;
  language: {
    code: string;
    policy?: string;
  };
  components?: Array<{
    type: 'header' | 'body' | 'footer' | 'button';
    parameters?: Array<{
      type: 'text' | 'currency' | 'date_time' | 'image' | 'document' | 'video';
      text?: string;
      currency?: {
        fallbackValue: string;
        code: string;
        amount1000: number;
      };
      dateTime?: {
        fallbackValue: string;
      };
      image?: WhatsAppMedia;
      document?: WhatsAppMedia;
      video?: WhatsAppMedia;
    }>;
  }>;
}

export interface WhatsAppConversation {
  id: string;
  clientId?: string;
  clientName?: string;
  phoneNumber: string;
  displayName?: string;
  profilePicUrl?: string;
  status: 'active' | 'archived' | 'blocked';
  lastMessage?: WhatsAppMessage;
  lastMessageAt?: string;
  unreadCount: number;
  tags: string[];
  assignedTo?: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface WhatsAppTemplate {
  id: string;
  name: string;
  language: string;
  status: 'APPROVED' | 'PENDING' | 'REJECTED' | 'DISABLED';
  category: 'AUTHENTICATION' | 'MARKETING' | 'UTILITY';
  components: WhatsAppTemplateComponent[];
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WhatsAppTemplateComponent {
  type: 'HEADER' | 'BODY' | 'FOOTER' | 'BUTTONS';
  format?: 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT' | 'LOCATION';
  text?: string;
  example?: {
    headerText?: string[];
    bodyText?: string[][];
    headerHandle?: string[];
  };
  buttons?: Array<{
    type: 'QUICK_REPLY' | 'PHONE_NUMBER' | 'URL';
    text: string;
    url?: string;
    phoneNumber?: string;
  }>;
}

export interface WhatsAppCampaign {
  id: string;
  name: string;
  description: string;
  templateId: string;
  templateName: string;
  recipients: WhatsAppRecipient[];
  status: 'draft' | 'scheduled' | 'sending' | 'completed' | 'cancelled';
  scheduledFor?: string;
  startedAt?: string;
  completedAt?: string;
  statistics: WhatsAppCampaignStats;
  settings: {
    respectBusinessHours: boolean;
    maxDailyMessages: number;
    delayBetweenMessages: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface WhatsAppRecipient {
  phoneNumber: string;
  name?: string;
  clientId?: string;
  variables?: Record<string, string>;
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
  sentAt?: string;
  deliveredAt?: string;
  readAt?: string;
  failedAt?: string;
  errorMessage?: string;
}

export interface WhatsAppCampaignStats {
  totalRecipients: number;
  sent: number;
  delivered: number;
  read: number;
  failed: number;
  pending: number;
  deliveryRate: number;
  readRate: number;
}

export interface WhatsAppAnalytics {
  period: 'day' | 'week' | 'month';
  startDate: string;
  endDate: string;
  metrics: {
    totalMessages: number;
    inboundMessages: number;
    outboundMessages: number;
    totalConversations: number;
    newConversations: number;
    activeConversations: number;
    avgResponseTime: number;
    avgConversationDuration: number;
    deliveryRate: number;
    readRate: number;
  };
  messagesByHour: Array<{
    hour: number;
    inbound: number;
    outbound: number;
  }>;
  messagesByDay: Array<{
    date: string;
    inbound: number;
    outbound: number;
  }>;
  conversationsBySource: Record<string, number>;
  templatePerformance: Array<{
    templateId: string;
    templateName: string;
    sent: number;
    delivered: number;
    read: number;
    deliveryRate: number;
    readRate: number;
  }>;
}

export interface WhatsAppWebhook {
  id: string;
  type: 'message' | 'status' | 'template_status' | 'account_alerts';
  payload: any;
  processed: boolean;
  processedAt?: string;
  error?: string;
  retryCount: number;
  createdAt: string;
}

export interface WhatsAppAutomation {
  id: string;
  name: string;
  description: string;
  trigger: WhatsAppTrigger;
  actions: WhatsAppAction[];
  conditions?: WhatsAppCondition[];
  isActive: boolean;
  statistics: {
    triggered: number;
    executed: number;
    failed: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface WhatsAppTrigger {
  type: 'message_received' | 'keyword_detected' | 'business_hours' | 'new_conversation';
  config: Record<string, any>;
}

export interface WhatsAppAction {
  type: 'send_message' | 'send_template' | 'assign_conversation' | 'add_tag' | 'create_task';
  config: Record<string, any>;
  delay?: number;
}

export interface WhatsAppCondition {
  field: string;
  operator: 'equals' | 'contains' | 'starts_with' | 'ends_with' | 'not_equals';
  value: any;
}

export interface WhatsAppIntegration {
  clientId?: string;
  caseId?: string;
  processId?: string;
  conversationId: string;
  type: 'client_support' | 'case_update' | 'process_notification' | 'general';
  createdAt: string;
}