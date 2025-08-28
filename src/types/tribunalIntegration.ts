export interface TribunalConfig {
  id: string;
  name: string;
  type: 'tjsp' | 'tjrj' | 'stf' | 'stj' | 'trt' | 'other';
  apiUrl: string;
  apiKey?: string;
  certificatePath?: string;
  isActive: boolean;
  supportedFeatures: TribunalFeature[];
}

export type TribunalFeature = 
  | 'process_consultation'
  | 'movement_tracking'
  | 'document_download'
  | 'hearing_schedule'
  | 'petition_filing'
  | 'notification_receipt';

export interface ProcessMovement {
  id: string;
  processNumber: string;
  date: string;
  description: string;
  type: 'decision' | 'petition' | 'hearing' | 'notification' | 'other';
  documentUrl?: string;
  tribunal: string;
  lastSync: string;
}

export interface TribunalNotification {
  id: string;
  processNumber: string;
  tribunal: string;
  type: 'intimation' | 'citation' | 'decision' | 'hearing';
  title: string;
  content: string;
  deadline?: string;
  isRead: boolean;
  receivedAt: string;
  documentUrl?: string;
}

export interface ProcessConsultation {
  processNumber: string;
  tribunal: string;
  status: 'active' | 'archived' | 'suspended' | 'concluded';
  lastMovement?: ProcessMovement;
  parties: ProcessParty[];
  subject: string;
  distributionDate: string;
  judge?: string;
  court?: string;
  movements: ProcessMovement[];
}

export interface ProcessParty {
  name: string;
  type: 'author' | 'defendant' | 'third_party';
  lawyer?: string;
  oab?: string;
}

export interface HearingSchedule {
  id: string;
  processNumber: string;
  tribunal: string;
  date: string;
  time: string;
  type: 'instruction' | 'conciliation' | 'judgment' | 'other';
  location: string;
  judge?: string;
  status: 'scheduled' | 'completed' | 'postponed' | 'cancelled';
  observations?: string;
}

export interface PetitionFiling {
  id: string;
  processNumber: string;
  tribunal: string;
  type: 'petition' | 'appeal' | 'response' | 'counter_petition';
  title: string;
  documents: FilingDocument[];
  status: 'draft' | 'submitted' | 'accepted' | 'rejected';
  submittedAt?: string;
  protocolNumber?: string;
  rejectionReason?: string;
}

export interface FilingDocument {
  name: string;
  type: 'main' | 'attachment' | 'power_of_attorney';
  filePath: string;
  size: number;
  hash: string;
}

export interface TribunalSyncStatus {
  tribunal: string;
  lastSync: string;
  status: 'success' | 'error' | 'in_progress';
  processesUpdated: number;
  notificationsReceived: number;
  errors?: string[];
}