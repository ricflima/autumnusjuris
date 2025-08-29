export type TribunalType = 
  | 'tjsp' | 'tjrj' | 'tjmg' | 'tjrs' | 'tjpr' | 'tjsc' | 'tjgo' | 'tjba' | 'tjce' | 'tjpe'
  | 'tjal' | 'tjam' | 'tjap' | 'tjdf' | 'tjes' | 'tjma' | 'tjmt' | 'tjms' | 'tjpa' | 'tjpb'
  | 'tjpi' | 'tjrn' | 'tjro' | 'tjrr' | 'tjse' | 'tjto' | 'tjac' // Tribunais Estaduais
  | 'trf1' | 'trf2' | 'trf3' | 'trf4' | 'trf5' | 'trf6' // Tribunais Federais
  | 'tst' | 'trt01' | 'trt02' | 'trt03' | 'trt04' | 'trt05' | 'trt06' | 'trt07' | 'trt08'
  | 'trt09' | 'trt10' | 'trt11' | 'trt12' | 'trt13' | 'trt14' | 'trt15' | 'trt16'
  | 'trt17' | 'trt18' | 'trt19' | 'trt20' | 'trt21' | 'trt22' | 'trt23' | 'trt24' // Tribunais Trabalhistas
  | 'stj' | 'stf' | 'tse' | 'stm' // Tribunais Superiores
  | 'cnj' // Conselho Nacional de Justiça
  | 'receita_federal' | 'inss' | 'carf' | 'bacen' // Órgãos Federais
  | 'detran' | 'junta_comercial' | 'cartorio'; // Órgãos Estaduais/Municipais

export type ConsultaStatus = 
  | 'pending' 
  | 'in_progress' 
  | 'completed' 
  | 'failed' 
  | 'timeout'
  | 'unauthorized';

export type TribunalAPIType = 
  | 'esaj' // Sistema dos Tribunais de SP
  | 'pje' // Processo Judicial Eletrônico
  | 'projudi' // Sistema antigo
  | 'eproc' // Sistema do TRF4
  | 'tucujuris' // Sistema do TJ-BA
  | 'soap' // APIs SOAP genéricas
  | 'rest' // APIs REST
  | 'scraping' // Web scraping quando API não disponível
  | 'manual'; // Consulta manual necessária

export interface TribunalConfig {
  id: TribunalType;
  nome: string;
  uf: string;
  jurisdicao: 'estadual' | 'federal' | 'trabalhista' | 'superior' | 'especial' | 'administrativa';
  apiType: TribunalAPIType;
  baseUrl?: string;
  apiKey?: string;
  certificateRequired: boolean;
  rateLimit: number; // requests per minute
  timeout: number; // in milliseconds
  active: boolean;
  supportedOperations: TribunalOperation[];
  customHeaders?: Record<string, string>;
  authConfig?: TribunalAuthConfig;
}

export interface TribunalAuthConfig {
  type: 'api_key' | 'oauth' | 'certificate' | 'basic' | 'none';
  tokenUrl?: string;
  clientId?: string;
  clientSecret?: string;
  scope?: string;
  certificatePath?: string;
  username?: string;
  password?: string;
}

export type TribunalOperation = 
  | 'consulta_processo'
  | 'consulta_movimentacoes'
  | 'consulta_audiencias'
  | 'consulta_prazos'
  | 'consulta_partes'
  | 'consulta_advogados'
  | 'consulta_documentos'
  | 'download_documentos';

export interface ConsultaTribunal {
  id: string;
  processId: string;
  processNumber: string;
  tribunalType: TribunalType;
  operation: TribunalOperation;
  status: ConsultaStatus;
  scheduledAt: string;
  startedAt?: string;
  completedAt?: string;
  nextAttemptAt?: string;
  attempts: number;
  maxAttempts: number;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  recurring: boolean;
  recurringConfig?: RecurringConfig;
  lastError?: string;
  result?: ConsultaResult;
  createdAt: string;
  updatedAt: string;
}

export interface RecurringConfig {
  interval: 'hourly' | 'daily' | 'weekly' | 'monthly';
  frequency: number; // Ex: a cada 2 horas, 3 dias, etc.
  daysOfWeek?: number[]; // 0-6 (domingo a sábado)
  timeOfDay?: string; // HH:mm
  endDate?: string; // Quando parar as consultas automáticas
}

export interface ConsultaResult {
  success: boolean;
  timestamp: string;
  data?: ProcessoTribunalData;
  error?: string;
  warning?: string;
  responseTime: number;
  tribunal: TribunalType;
  operation: TribunalOperation;
  newMovements?: MovimentacaoTribunal[];
  hasChanges: boolean;
}

export interface ProcessoTribunalData {
  numero: string;
  numeroInterno?: string;
  classe: string;
  assunto: string;
  dataAjuizamento: string;
  valorCausa?: number;
  situacao: string;
  localizacao: string;
  orgaoJulgador: string;
  magistrado?: string;
  ultimaMovimentacao?: string;
  partes: ParteTribunal[];
  advogados: AdvogadoTribunal[];
  movimentacoes: MovimentacaoTribunal[];
  audiencias: AudioenciaTribunal[];
  documentos: DocumentoTribunal[];
  recursos: RecursoTribunal[];
}

export interface ParteTribunal {
  nome: string;
  tipo: 'autor' | 'reu' | 'terceiro' | 'assistente' | 'litisconsorte' | 'outros';
  documento?: string;
  endereco?: string;
}

export interface AdvogadoTribunal {
  nome: string;
  oab: string;
  uf: string;
  tipo: 'parte_autora' | 'parte_re' | 'terceiro';
  ativo: boolean;
}

export interface MovimentacaoTribunal {
  id: string;
  data: string;
  dataHora?: string;
  codigo?: string;
  titulo: string;
  descricao: string;
  complemento?: string;
  magistrado?: string;
  tipoDecisao?: string;
  documentos?: DocumentoTribunal[];
  oficial: boolean;
  publicacao?: PublicacaoTribunal;
  prazoFatal?: PrazoFatalTribunal;
}

export interface AudioenciaTribunal {
  id: string;
  data: string;
  hora: string;
  tipo: string;
  situacao: 'agendada' | 'realizada' | 'cancelada' | 'redesignada';
  local?: string;
  magistrado?: string;
  resultado?: string;
  proximosAtos?: string;
}

export interface DocumentoTribunal {
  id: string;
  nome: string;
  tipo: string;
  data: string;
  tamanho?: number;
  hash?: string;
  disponivel: boolean;
  sigilo: boolean;
  downloadUrl?: string;
}

export interface RecursoTribunal {
  tipo: string;
  data: string;
  situacao: string;
  relator?: string;
  orgaoDestino?: string;
}

export interface PublicacaoTribunal {
  data: string;
  veiculo: string;
  caderno?: string;
  pagina?: string;
}

export interface PrazoFatalTribunal {
  data: string;
  tipo: string;
  descricao: string;
  parte?: string;
}

export interface TribunalMonitoringConfig {
  processId: string;
  tribunalType: TribunalType;
  active: boolean;
  operations: TribunalOperation[];
  recurringConfig: RecurringConfig;
  notifications: NotificationConfig;
  lastCheck?: string;
  nextCheck?: string;
  errorCount: number;
  maxErrors: number;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationConfig {
  onNewMovement: boolean;
  onNewAudience: boolean;
  onNewDeadline: boolean;
  onError: boolean;
  email: boolean;
  whatsapp: boolean;
  push: boolean;
  recipients: string[];
  template?: string;
}

export interface TribunalStats {
  tribunalType: TribunalType;
  totalConsultas: number;
  consultasRealizadas: number;
  consultasFalharam: number;
  ultimaConsulta?: string;
  tempoMedioResposta: number;
  taxaSucesso: number;
  movimentacoesEncontradas: number;
  processosMonitorados: number;
  status: 'online' | 'offline' | 'instavel' | 'manutencao';
  proximaManutencao?: string;
}

export interface ConsultaResponse {
  consulta: ConsultaTribunal;
  result?: ConsultaResult;
  stats: TribunalStats;
}

export interface BatchConsultaRequest {
  processIds: string[];
  tribunais: TribunalType[];
  operations: TribunalOperation[];
  priority: 'low' | 'medium' | 'high';
  scheduleFor?: string;
}

export interface BatchConsultaResponse {
  batchId: string;
  consultas: ConsultaTribunal[];
  estimatedCompletion: string;
  totalProcesses: number;
  status: 'queued' | 'processing' | 'completed' | 'failed';
}

// Legacy interfaces para compatibilidade
export interface ProcessMovement {
  id: string;
  processNumber: string;
  date: string; // Campo necessário para compatibilidade
  description: string;
  type: 'decision' | 'petition' | 'hearing' | 'notification' | 'other';
  documentUrl?: string;
  tribunal: string;
  lastSync: string;
  // Campos opcionais do MovimentacaoTribunal
  data?: string;
  dataHora?: string;
  codigo?: string;
  titulo?: string;
  descricao?: string;
  complemento?: string;
  magistrado?: string;
  tipoDecisao?: string;
  documentos?: DocumentoTribunal[];
  oficial?: boolean;
  publicacao?: PublicacaoTribunal;
  prazoFatal?: PrazoFatalTribunal;
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

// Constantes úteis
export const TRIBUNAL_NAMES: Record<TribunalType, string> = {
  // Tribunais Estaduais
  tjsp: 'Tribunal de Justiça de São Paulo',
  tjrj: 'Tribunal de Justiça do Rio de Janeiro',
  tjmg: 'Tribunal de Justiça de Minas Gerais',
  tjrs: 'Tribunal de Justiça do Rio Grande do Sul',
  tjpr: 'Tribunal de Justiça do Paraná',
  tjsc: 'Tribunal de Justiça de Santa Catarina',
  tjgo: 'Tribunal de Justiça de Goiás',
  tjba: 'Tribunal de Justiça da Bahia',
  tjce: 'Tribunal de Justiça do Ceará',
  tjpe: 'Tribunal de Justiça de Pernambuco',
  tjal: 'Tribunal de Justiça de Alagoas',
  tjam: 'Tribunal de Justiça do Amazonas',
  tjap: 'Tribunal de Justiça do Amapá',
  tjdf: 'Tribunal de Justiça do Distrito Federal',
  tjes: 'Tribunal de Justiça do Espírito Santo',
  tjma: 'Tribunal de Justiça do Maranhão',
  tjmt: 'Tribunal de Justiça de Mato Grosso',
  tjms: 'Tribunal de Justiça de Mato Grosso do Sul',
  tjpa: 'Tribunal de Justiça do Pará',
  tjpb: 'Tribunal de Justiça da Paraíba',
  tjpi: 'Tribunal de Justiça do Piauí',
  tjrn: 'Tribunal de Justiça do Rio Grande do Norte',
  tjro: 'Tribunal de Justiça de Rondônia',
  tjrr: 'Tribunal de Justiça de Roraima',
  tjse: 'Tribunal de Justiça de Sergipe',
  tjto: 'Tribunal de Justiça do Tocantins',
  tjac: 'Tribunal de Justiça do Acre',

  // Tribunais Federais
  trf1: 'Tribunal Regional Federal da 1ª Região',
  trf2: 'Tribunal Regional Federal da 2ª Região',
  trf3: 'Tribunal Regional Federal da 3ª Região',
  trf4: 'Tribunal Regional Federal da 4ª Região',
  trf5: 'Tribunal Regional Federal da 5ª Região',
  trf6: 'Tribunal Regional Federal da 6ª Região',

  // Tribunais Trabalhistas
  tst: 'Tribunal Superior do Trabalho',
  trt01: 'TRT da 1ª Região (RJ)',
  trt02: 'TRT da 2ª Região (SP)',
  trt03: 'TRT da 3ª Região (MG)',
  trt04: 'TRT da 4ª Região (RS)',
  trt05: 'TRT da 5ª Região (BA)',
  trt06: 'TRT da 6ª Região (PE)',
  trt07: 'TRT da 7ª Região (CE)',
  trt08: 'TRT da 8ª Região (PA/AP)',
  trt09: 'TRT da 9ª Região (PR)',
  trt10: 'TRT da 10ª Região (DF/TO)',
  trt11: 'TRT da 11ª Região (AM/RR)',
  trt12: 'TRT da 12ª Região (SC)',
  trt13: 'TRT da 13ª Região (PB)',
  trt14: 'TRT da 14ª Região (RO/AC)',
  trt15: 'TRT da 15ª Região (Campinas/SP)',
  trt16: 'TRT da 16ª Região (MA)',
  trt17: 'TRT da 17ª Região (ES)',
  trt18: 'TRT da 18ª Região (GO)',
  trt19: 'TRT da 19ª Região (AL)',
  trt20: 'TRT da 20ª Região (SE)',
  trt21: 'TRT da 21ª Região (RN)',
  trt22: 'TRT da 22ª Região (PI)',
  trt23: 'TRT da 23ª Região (MT)',
  trt24: 'TRT da 24ª Região (MS)',

  // Tribunais Superiores
  stj: 'Superior Tribunal de Justiça',
  stf: 'Supremo Tribunal Federal',
  tse: 'Tribunal Superior Eleitoral',
  stm: 'Superior Tribunal Militar',

  // CNJ
  cnj: 'Conselho Nacional de Justiça',

  // Órgãos Federais
  receita_federal: 'Receita Federal do Brasil',
  inss: 'Instituto Nacional do Seguro Social',
  carf: 'Conselho Administrativo de Recursos Fiscais',
  bacen: 'Banco Central do Brasil',

  // Órgãos Estaduais/Municipais
  detran: 'Departamento de Trânsito',
  junta_comercial: 'Junta Comercial',
  cartorio: 'Cartório'
};

export const OPERATION_LABELS: Record<TribunalOperation, string> = {
  consulta_processo: 'Consulta de Processo',
  consulta_movimentacoes: 'Consulta de Movimentações',
  consulta_audiencias: 'Consulta de Audiências',
  consulta_prazos: 'Consulta de Prazos',
  consulta_partes: 'Consulta de Partes',
  consulta_advogados: 'Consulta de Advogados',
  consulta_documentos: 'Consulta de Documentos',
  download_documentos: 'Download de Documentos'
};

export const STATUS_LABELS: Record<ConsultaStatus, string> = {
  pending: 'Pendente',
  in_progress: 'Em Andamento',
  completed: 'Concluída',
  failed: 'Falhou',
  timeout: 'Tempo Esgotado',
  unauthorized: 'Não Autorizada'
};