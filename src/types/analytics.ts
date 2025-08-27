// src/types/analytics.ts

export interface AnalyticsFilters {
  period: 'week' | 'month' | 'quarter' | 'year' | 'custom';
  startDate?: Date;
  endDate?: Date;
  compareWith?: 'previous' | 'lastYear';
  groupBy: 'day' | 'week' | 'month' | 'quarter';
  clients?: string[];
  cases?: string[];
  categories?: string[];
  status?: string[];
}

export interface MetricCard {
  title: string;
  value: string;
  change: number;
  changeLabel: string;
  icon: React.ElementType;
  color: string;
  trend: 'up' | 'down' | 'stable';
}

export interface ChartDataPoint {
  period: string;
  [key: string]: any;
}

export interface RevenueProjectionData {
  month: string;
  atual: number | null;
  projetado: number;
  tendencia: number;
  cenarioOtimista?: number;
  cenarioPessimista?: number;
}

export interface ClientProfitabilityData {
  cliente: string;
  receita: number;
  custos: number;
  roi: number;
  casos: number;
  tempoMedioColeta: number;
}

export interface CaseCategoryData {
  name: string;
  value: number;
  color: string;
  growth?: number;
}

export interface CashFlowProjectionData {
  mes: string;
  entrada: number;
  saida: number;
  saldo: number;
  projecao?: number;
}

export interface PredictiveInsight {
  id: string;
  title: string;
  description: string;
  type: 'opportunity' | 'risk' | 'trend' | 'recommendation';
  confidence: number; // 0-100
  impact: 'high' | 'medium' | 'low';
  timeframe: string;
  action?: string;
  metrics?: {
    current: number;
    predicted: number;
    change: number;
  };
  category: 'financial' | 'operational' | 'strategic';
  priority: 'urgent' | 'high' | 'medium' | 'low';
  createdAt: Date;
  validUntil?: Date;
}

export interface KPITarget {
  id: string;
  name: string;
  current: number;
  target: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  status: 'on-track' | 'at-risk' | 'critical';
  daysToTarget: number;
  category: 'financial' | 'operational' | 'customer' | 'growth';
  owner?: string;
  lastUpdated: Date;
}

export interface CustomerSegment {
  name: string;
  description: string;
  count: number;
  revenue: number;
  averageClv: number;
  retentionRate: number;
  color: string;
  recommendedActions: string[];
}

export interface MarketingChannelROI {
  canal: string;
  investimento: number;
  retorno: number;
  roi: number;
  conversions: number;
  cac: number; // Customer Acquisition Cost
  ltv: number; // Lifetime Value
}

export interface BusinessIntelligenceData {
  insights: PredictiveInsight[];
  kpiTargets: KPITarget[];
  revenueProjection: RevenueProjectionData[];
  clientProfitability: ClientProfitabilityData[];
  customerSegments: CustomerSegment[];
  marketingROI: MarketingChannelROI[];
  generatedAt: Date;
  confidence: number;
}

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  type: 'financial' | 'operational' | 'analytical';
  icon: React.ElementType;
  estimatedTime: string;
  features: string[];
  lastGenerated?: string;
  frequency?: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  isActive?: boolean;
  template: ReportConfiguration;
}

export interface ReportConfiguration {
  name: string;
  description: string;
  period: {
    type: 'fixed' | 'relative';
    startDate?: Date;
    endDate?: Date;
    relativePeriod?: 'last7days' | 'last30days' | 'lastQuarter' | 'lastYear';
  };
  metrics: string[];
  groupBy: 'day' | 'week' | 'month' | 'quarter' | 'year';
  chartTypes: ChartType[];
  filters: AnalyticsFilters;
  scheduling: {
    enabled: boolean;
    frequency?: 'daily' | 'weekly' | 'monthly';
    recipients?: string[];
    nextRun?: Date;
    lastRun?: Date;
  };
  layout?: {
    sections: ReportSection[];
    theme: 'light' | 'dark' | 'corporate';
    includeHeader: boolean;
    includeFooter: boolean;
  };
}

export interface ReportSection {
  id: string;
  title: string;
  type: 'chart' | 'table' | 'kpi' | 'text';
  position: { row: number; col: number; span: number };
  config: any;
}

export interface ChartType {
  id: 'line' | 'bar' | 'pie' | 'area' | 'scatter' | 'heatmap';
  name: string;
  icon: React.ElementType;
}

export interface GeneratedReport {
  id: string;
  name: string;
  type: 'financial' | 'operational' | 'analytical';
  generatedAt: Date;
  size: string;
  downloads: number;
  format: 'pdf' | 'excel' | 'html';
  url: string;
  sharedWith?: string[];
  scheduledJob?: string;
}

export interface AnalyticsMetric {
  id: string;
  name: string;
  category: 'financial' | 'operational' | 'analytical';
  description: string;
  formula?: string;
  unit: string;
  dataType: 'currency' | 'number' | 'percentage' | 'date';
}

export interface MLModel {
  id: string;
  name: string;
  type: 'regression' | 'classification' | 'clustering' | 'time-series';
  description: string;
  accuracy: number;
  lastTrained: Date;
  status: 'active' | 'training' | 'inactive';
  version: string;
  features: string[];
  predictions: ModelPrediction[];
}

export interface ModelPrediction {
  id: string;
  modelId: string;
  target: string;
  value: number;
  confidence: number;
  features: Record<string, any>;
  createdAt: Date;
  validUntil: Date;
}

export interface RiskAssessment {
  id: string;
  entity: string; // client, case, project
  entityId: string;
  riskType: 'financial' | 'operational' | 'legal' | 'strategic';
  level: 'low' | 'medium' | 'high' | 'critical';
  probability: number; // 0-100
  impact: number; // 0-100
  description: string;
  mitigation: string[];
  owner?: string;
  dueDate?: Date;
  status: 'identified' | 'monitoring' | 'mitigating' | 'resolved';
}

export interface OpportunityAnalysis {
  id: string;
  title: string;
  description: string;
  category: 'revenue' | 'efficiency' | 'growth' | 'retention';
  potentialValue: number;
  effort: 'low' | 'medium' | 'high';
  timeframe: number; // days
  probability: number; // 0-100
  requirements: string[];
  dependencies: string[];
  risks: string[];
  status: 'identified' | 'evaluating' | 'approved' | 'implementing' | 'completed';
}

export interface BenchmarkData {
  metric: string;
  ourValue: number;
  industryAverage: number;
  topPerformer: number;
  percentile: number;
  trend: 'improving' | 'stable' | 'declining';
  source: string;
  lastUpdated: Date;
}

export interface AnalyticsDashboardConfig {
  userId: string;
  layout: {
    widgets: DashboardWidget[];
    columns: number;
    theme: 'light' | 'dark' | 'auto';
  };
  preferences: {
    defaultPeriod: string;
    refreshInterval: number; // minutes
    notifications: boolean;
    emailReports: boolean;
  };
  customMetrics: AnalyticsMetric[];
}

export interface DashboardWidget {
  id: string;
  type: 'metric' | 'chart' | 'table' | 'insight';
  title: string;
  position: { x: number; y: number; w: number; h: number };
  config: {
    metric?: string;
    chartType?: string;
    filters?: AnalyticsFilters;
    refreshRate?: number;
  };
  isVisible: boolean;
}

export interface AlertRule {
  id: string;
  name: string;
  description: string;
  metric: string;
  condition: 'greater_than' | 'less_than' | 'equals' | 'changes_by';
  threshold: number;
  severity: 'info' | 'warning' | 'critical';
  recipients: string[];
  isActive: boolean;
  lastTriggered?: Date;
  cooldown: number; // minutes
}

export interface AnalyticsAlert {
  id: string;
  ruleId: string;
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  triggeredAt: Date;
  acknowledgedAt?: Date;
  acknowledgedBy?: string;
  resolvedAt?: Date;
  data: Record<string, any>;
}

// Export functions types
export interface AnalyticsService {
  // Data retrieval
  getAnalyticsData: (filters: AnalyticsFilters) => Promise<BusinessIntelligenceData>;
  getRevenueProjection: (filters: AnalyticsFilters) => Promise<RevenueProjectionData[]>;
  getClientProfitability: (filters: AnalyticsFilters) => Promise<ClientProfitabilityData[]>;
  getCashFlowProjection: (filters: AnalyticsFilters) => Promise<CashFlowProjectionData[]>;
  
  // Insights and ML
  getPredictiveInsights: (category?: string) => Promise<PredictiveInsight[]>;
  getKPITargets: () => Promise<KPITarget[]>;
  updateKPITarget: (id: string, data: Partial<KPITarget>) => Promise<KPITarget>;
  
  // Reports
  generateReport: (config: ReportConfiguration) => Promise<GeneratedReport>;
  getReportTemplates: () => Promise<ReportTemplate[]>;
  saveReportTemplate: (template: ReportTemplate) => Promise<ReportTemplate>;
  getGeneratedReports: () => Promise<GeneratedReport[]>;
  
  // Benchmarking
  getBenchmarkData: (metrics: string[]) => Promise<BenchmarkData[]>;
  
  // Alerts and Monitoring
  getAlerts: () => Promise<AnalyticsAlert[]>;
  createAlertRule: (rule: Omit<AlertRule, 'id'>) => Promise<AlertRule>;
  updateAlertRule: (id: string, rule: Partial<AlertRule>) => Promise<AlertRule>;
}

// Hook return types
export interface UseAnalyticsReturn {
  data: BusinessIntelligenceData | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<any>; // Corrigido: era Promise<void>
}

export interface UseReportGeneratorReturn {
  generateReport: (config: ReportConfiguration) => Promise<GeneratedReport>;
  isGenerating: boolean;
  error: Error | null;
  progress?: number;
}