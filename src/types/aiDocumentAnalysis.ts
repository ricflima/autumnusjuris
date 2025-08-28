export interface DocumentAnalysis {
  id: string;
  documentId: string;
  documentName: string;
  analysisType: AnalysisType[];
  status: 'processing' | 'completed' | 'failed';
  createdAt: string;
  completedAt?: string;
  results: AnalysisResult[];
  confidence: number;
  processingTime: number;
  error?: string;
}

export type AnalysisType = 
  | 'text_extraction'
  | 'contract_analysis'
  | 'legal_classification'
  | 'entity_recognition'
  | 'sentiment_analysis'
  | 'compliance_check'
  | 'risk_assessment'
  | 'clause_extraction'
  | 'date_extraction'
  | 'signature_verification';

export interface AnalysisResult {
  type: AnalysisType;
  confidence: number;
  data: any;
  summary: string;
  highlights: TextHighlight[];
}

export interface TextHighlight {
  text: string;
  startPosition: number;
  endPosition: number;
  type: 'entity' | 'clause' | 'date' | 'signature' | 'risk' | 'compliance';
  confidence: number;
  metadata?: Record<string, any>;
}

export interface ContractAnalysisResult {
  contractType: string;
  parties: ContractParty[];
  clauses: ContractClause[];
  obligations: ContractObligation[];
  dates: ImportantDate[];
  risks: RiskAssessment[];
  compliance: ComplianceCheck[];
  recommendations: string[];
}

export interface ContractParty {
  name: string;
  type: 'person' | 'company';
  role: 'contractor' | 'contractee' | 'guarantor' | 'witness';
  document?: string;
  address?: string;
  confidence: number;
}

export interface ContractClause {
  id: string;
  type: 'payment' | 'termination' | 'liability' | 'force_majeure' | 'confidentiality' | 'other';
  title: string;
  content: string;
  position: { start: number; end: number };
  importance: 'high' | 'medium' | 'low';
  riskLevel: 'high' | 'medium' | 'low';
  suggestions: string[];
}

export interface ContractObligation {
  party: string;
  description: string;
  deadline?: string;
  penalty?: string;
  status: 'pending' | 'fulfilled' | 'overdue';
  priority: 'high' | 'medium' | 'low';
}

export interface ImportantDate {
  type: 'start_date' | 'end_date' | 'deadline' | 'renewal' | 'payment' | 'other';
  date: string;
  description: string;
  daysFromNow: number;
  isUrgent: boolean;
}

export interface RiskAssessment {
  category: 'legal' | 'financial' | 'operational' | 'compliance';
  level: 'high' | 'medium' | 'low';
  description: string;
  impact: string;
  mitigation: string[];
  confidence: number;
}

export interface ComplianceCheck {
  regulation: string;
  status: 'compliant' | 'non_compliant' | 'unclear';
  description: string;
  recommendations: string[];
  severity: 'critical' | 'high' | 'medium' | 'low';
}

export interface EntityRecognition {
  entities: RecognizedEntity[];
  relationships: EntityRelationship[];
  summary: string;
}

export interface RecognizedEntity {
  text: string;
  type: 'person' | 'organization' | 'location' | 'date' | 'money' | 'document' | 'law' | 'other';
  confidence: number;
  position: { start: number; end: number };
  metadata?: Record<string, any>;
}

export interface EntityRelationship {
  source: string;
  target: string;
  relationship: string;
  confidence: number;
}

export interface SentimentAnalysis {
  overallSentiment: 'positive' | 'negative' | 'neutral';
  confidence: number;
  sections: SentimentSection[];
  emotionalTone: string[];
  professionalismScore: number;
}

export interface SentimentSection {
  text: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  confidence: number;
  position: { start: number; end: number };
  emotions: string[];
}

export interface AIModel {
  id: string;
  name: string;
  type: 'text_analysis' | 'contract_analysis' | 'classification' | 'extraction';
  version: string;
  accuracy: number;
  supportedLanguages: string[];
  isActive: boolean;
  lastUpdated: string;
}

export interface AnalysisTemplate {
  id: string;
  name: string;
  description: string;
  analysisTypes: AnalysisType[];
  documentTypes: string[];
  isDefault: boolean;
  settings: Record<string, any>;
}