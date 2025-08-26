// src/types/processes.ts

export type ProcessStatus = 
  | 'active' 
  | 'suspended' 
  | 'archived' 
  | 'concluded' 
  | 'appealed';

export type ProcessPhase = 
  | 'initial' 
  | 'instruction' 
  | 'judgment' 
  | 'appeal' 
  | 'execution';

export type ProcessType = 
  | 'civil' 
  | 'criminal' 
  | 'labor' 
  | 'tax' 
  | 'family' 
  | 'administrative'
  | 'commercial'
  | 'consumer'
  | 'environmental'
  | 'constitutional';

export type ProcessPriority = 
  | 'low' 
  | 'medium' 
  | 'high' 
  | 'urgent';

export type DeadlineType = 
  | 'appeal' 
  | 'response' 
  | 'hearing' 
  | 'delivery' 
  | 'petition' 
  | 'payment';

export type DeadlineStatus = 
  | 'pending' 
  | 'completed' 
  | 'overdue' 
  | 'cancelled';

export interface ProcessAddress {
  court: string;
  district: string;
  city: string;
  state: string;
  country: string;
}

export interface ProcessValue {
  amount: number;
  currency: string;
  description?: string;
}

export interface ProcessCosts {
  initialFees: ProcessValue;
  courtCosts: ProcessValue;
  lawyerFees: ProcessValue;
  otherExpenses: ProcessValue[];
  totalCosts: ProcessValue;
}

export interface ProcessDeadline {
  id: string;
  processId: string;
  type: DeadlineType;
  title: string;
  description?: string;
  dueDate: string; // ISO date string
  status: DeadlineStatus;
  priority: ProcessPriority;
  isRecurring: boolean;
  recurringPattern?: string;
  completedAt?: string;
  completedBy?: string;
  notes?: string;
  attachments?: string[];
  createdAt: string;
  updatedAt: string;
  isOverdue?: boolean;
  daysUntilDue?: number;
  daysOverdue?: number;
  formattedDueDate?: string;
  daysUntilDueFormatted?: string;
  daysOverdueFormatted?: string;
  
}

export interface ProcessHearing {
  id: string;
  processId: string;
  title: string;
  description?: string;
  date: string; // ISO date string
  time: string;
  location: string;
  type: 'initial' | 'instruction' | 'judgment' | 'conciliation' | 'other';
  status: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled';
  participants: string[];
  notes?: string;
  outcome?: string;
  nextSteps?: string;
  attachments?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ProcessMovement {
  id: string;
  processId: string;
  date: string; // ISO date string
  description: string;
  type: 'filing' | 'decision' | 'hearing' | 'deadline' | 'document' | 'other';
  author: string;
  official: boolean; // se é movimento oficial do tribunal
  attachments?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Process {
  id: string;
  number: string; // Número único do processo (ex: 1234567-89.2024.8.26.0001)
  internalNumber?: string; // Numeração interna do escritório
  title: string;
  description?: string;
  
  // Classificação
  type: ProcessType;
  status: ProcessStatus;
  phase: ProcessPhase;
  priority: ProcessPriority;
  
  // Relacionamentos
  caseId?: string; // Relacionamento com caso
  clientIds: string[]; // Múltiplos clientes
  responsibleLawyerId: string;
  
  // Informações processuais
  court: ProcessAddress;
  opposingParty?: string;
  opposingLawyer?: string;
  
  // Valores e custas
  processValue?: ProcessValue;
  costs?: ProcessCosts;
  
  // Datas importantes
  filingDate: string; // Data de distribuição/ajuizamento
  citationDate?: string; // Data da citação
  lastMovementDate?: string; // Data do último movimento
  
  // Observações e anotações
  notes?: string;
  tags?: string[];
  isConfidential: boolean;
  
  // Metadados
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  
  // Campos calculados
  daysActive: number;
  nextDeadline?: ProcessDeadline;
  pendingDeadlines: number;
  recentMovements: ProcessMovement[];
}

// Request/Response types para API
export interface CreateProcessRequest {
  number: string;
  internalNumber?: string;
  title: string;
  description?: string;
  type: ProcessType;
  priority: ProcessPriority;
  caseId?: string;
  clientIds: string[];
  responsibleLawyerId: string;
  court: ProcessAddress;
  opposingParty?: string;
  opposingLawyer?: string;
  processValue?: Omit<ProcessValue, 'currency'> & { currency?: string };
  filingDate: string;
  citationDate?: string;
  notes?: string;
  tags?: string[];
  isConfidential?: boolean;
}

export interface UpdateProcessRequest extends Partial<CreateProcessRequest> {
  status?: ProcessStatus;
  phase?: ProcessPhase;
}

export interface ProcessesResponse {
  processes: Process[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface ProcessFilters {
  status?: ProcessStatus[];
  phase?: ProcessPhase[];
  type?: ProcessType[];
  priority?: ProcessPriority[];
  responsibleLawyerId?: string[];
  clientId?: string;
  caseId?: string;
  court?: string;
  search?: string;
  filingDateFrom?: string;
  filingDateTo?: string;
  hasOverdueDeadlines?: boolean;
  page?: number;
  limit?: number;
  sortBy?: 'number' | 'title' | 'filingDate' | 'lastMovementDate' | 'nextDeadline' | 'priority';
  sortOrder?: 'asc' | 'desc';
}

export interface CreateDeadlineRequest {
  processId: string;
  type: DeadlineType;
  title: string;
  description?: string;
  dueDate: string;
  priority: ProcessPriority;
  isRecurring?: boolean;
  recurringPattern?: string;
  notes?: string;
}

export interface UpdateDeadlineRequest extends Partial<CreateDeadlineRequest> {
  status?: DeadlineStatus;
  completedAt?: string;
  completedBy?: string;
}

export interface CreateHearingRequest {
  processId: string;
  title: string;
  description?: string;
  date: string;
  time: string;
  location: string;
  type: ProcessHearing['type'];
  participants: string[];
  notes?: string;
}

export interface UpdateHearingRequest extends Partial<CreateHearingRequest> {
  status?: ProcessHearing['status'];
  outcome?: string;
  nextSteps?: string;
}

export interface CreateMovementRequest {
  processId: string;
  date: string;
  description: string;
  type: ProcessMovement['type'];
  author: string;
  official?: boolean;
  attachments?: string[];
}

// Constantes úteis
export const PROCESS_STATUS_LABELS: Record<ProcessStatus, string> = {
  active: 'Ativo',
  suspended: 'Suspenso',
  archived: 'Arquivado',
  concluded: 'Concluído',
  appealed: 'Em Recurso',
};

export const PROCESS_PHASE_LABELS: Record<ProcessPhase, string> = {
  initial: 'Inicial',
  instruction: 'Instrução',
  judgment: 'Julgamento',
  appeal: 'Recurso',
  execution: 'Execução',
};

export const PROCESS_TYPE_LABELS: Record<ProcessType, string> = {
  civil: 'Cível',
  criminal: 'Criminal',
  labor: 'Trabalhista',
  tax: 'Tributário',
  family: 'Família',
  administrative: 'Administrativo',
  commercial: 'Comercial',
  consumer: 'Consumidor',
  environmental: 'Ambiental',
  constitutional: 'Constitucional',    
};

export const DEADLINE_TYPE_LABELS: Record<DeadlineType, string> = {
  appeal: 'Recurso',
  response: 'Resposta',
  hearing: 'Audiência',
  delivery: 'Entrega',
  petition: 'Petição',
  payment: 'Pagamento',
};

export const PRIORITY_LABELS: Record<ProcessPriority, string> = {
  low: 'Baixa',
  medium: 'Média',
  high: 'Alta',
  urgent: 'Urgente',
};

export const PRIORITY_COLORS: Record<ProcessPriority, string> = {
  low: 'bg-gray-100 text-gray-800',
  medium: 'bg-blue-100 text-blue-800',
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-800',
};