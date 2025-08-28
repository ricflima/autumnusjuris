export interface AdvancedReport {
  id: string;
  name: string;
  description: string;
  type: ReportType;
  category: ReportCategory;
  config: ReportConfig;
  schedule?: ReportSchedule;
  status: ReportStatus;
  lastGenerated?: string;
  nextGeneration?: string;
  recipients: string[];
  format: ReportFormat[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export type ReportType = 
  | 'financial_analysis'
  | 'case_performance'
  | 'client_analytics'
  | 'process_tracking'
  | 'productivity_metrics'
  | 'revenue_analysis'
  | 'deadline_analysis'
  | 'document_analytics'
  | 'custom_kpi';

export type ReportCategory = 
  | 'financial'
  | 'operational'
  | 'strategic'
  | 'compliance'
  | 'performance';

export type ReportStatus = 
  | 'active'
  | 'paused'
  | 'draft'
  | 'archived';

export type ReportFormat = 'pdf' | 'excel' | 'csv' | 'powerpoint' | 'dashboard';

export interface ReportConfig {
  dataSource: DataSource[];
  filters: ReportFilter[];
  groupBy: string[];
  aggregations: ReportAggregation[];
  visualizations: ReportVisualization[];
  customFields: CustomField[];
}

export interface DataSource {
  entity: string;
  fields: string[];
  joins?: DataJoin[];
}

export interface DataJoin {
  entity: string;
  type: 'inner' | 'left' | 'right' | 'full';
  on: { left: string; right: string }[];
}

export interface ReportFilter {
  field: string;
  operator: FilterOperator;
  value: any;
  condition?: 'and' | 'or';
}

export type FilterOperator = 
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'not_contains'
  | 'starts_with'
  | 'ends_with'
  | 'greater_than'
  | 'less_than'
  | 'greater_or_equal'
  | 'less_or_equal'
  | 'between'
  | 'in'
  | 'not_in'
  | 'is_null'
  | 'is_not_null';

export interface ReportAggregation {
  field: string;
  function: AggregationFunction;
  alias?: string;
}

export type AggregationFunction = 
  | 'sum'
  | 'avg'
  | 'count'
  | 'count_distinct'
  | 'min'
  | 'max'
  | 'median'
  | 'stddev';

export interface ReportVisualization {
  type: VisualizationType;
  title: string;
  config: VisualizationConfig;
  position: { x: number; y: number; width: number; height: number };
}

export type VisualizationType = 
  | 'table'
  | 'bar_chart'
  | 'line_chart'
  | 'pie_chart'
  | 'area_chart'
  | 'scatter_plot'
  | 'heatmap'
  | 'gauge'
  | 'kpi_card'
  | 'trend_line';

export interface VisualizationConfig {
  xAxis?: string;
  yAxis?: string[];
  series?: string;
  colors?: string[];
  showLegend?: boolean;
  showGrid?: boolean;
  showLabels?: boolean;
  aggregation?: AggregationFunction;
  threshold?: { value: number; color: string }[];
}

export interface CustomField {
  name: string;
  expression: string;
  type: 'number' | 'string' | 'date' | 'boolean';
  format?: string;
}

export interface ReportSchedule {
  frequency: ScheduleFrequency;
  time?: string;
  timezone?: string;
  dayOfWeek?: number[];
  dayOfMonth?: number[];
  endDate?: string;
  isActive: boolean;
}

export type ScheduleFrequency = 
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'quarterly'
  | 'yearly'
  | 'custom';

export interface ReportExecution {
  id: string;
  reportId: string;
  reportName: string;
  status: ExecutionStatus;
  startedAt: string;
  completedAt?: string;
  duration?: number;
  recordCount?: number;
  fileSize?: number;
  filePath?: string;
  error?: string;
  triggeredBy: 'schedule' | 'manual' | 'api';
}

export type ExecutionStatus = 
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface DashboardWidget {
  id: string;
  title: string;
  type: WidgetType;
  dataSource: string;
  config: WidgetConfig;
  position: { x: number; y: number; width: number; height: number };
  refreshInterval?: number;
  lastUpdated?: string;
}

export type WidgetType = 
  | 'metric'
  | 'chart'
  | 'table'
  | 'progress'
  | 'alert'
  | 'iframe';

export interface WidgetConfig {
  query: string;
  visualization: ReportVisualization;
  thresholds?: Threshold[];
  alerts?: AlertConfig[];
}

export interface Threshold {
  value: number;
  condition: 'above' | 'below' | 'equal';
  color: string;
  label?: string;
}

export interface AlertConfig {
  condition: string;
  message: string;
  severity: 'info' | 'warning' | 'error';
  recipients: string[];
}

export interface BusinessIntelligence {
  id: string;
  name: string;
  description: string;
  dashboards: Dashboard[];
  kpis: KPI[];
  insights: BusinessInsight[];
  predictions: Prediction[];
  createdAt: string;
  updatedAt: string;
}

export interface Dashboard {
  id: string;
  name: string;
  description: string;
  widgets: DashboardWidget[];
  filters: DashboardFilter[];
  isPublic: boolean;
  permissions: Permission[];
  createdAt: string;
  updatedAt: string;
}

export interface DashboardFilter {
  id: string;
  name: string;
  type: 'select' | 'multiselect' | 'date' | 'daterange' | 'text' | 'number';
  options?: FilterOption[];
  defaultValue?: any;
  affectedWidgets: string[];
}

export interface FilterOption {
  value: any;
  label: string;
}

export interface Permission {
  userId: string;
  role: 'viewer' | 'editor' | 'admin';
  grantedAt: string;
}

export interface KPI {
  id: string;
  name: string;
  description: string;
  metric: string;
  target: number;
  currentValue: number;
  previousValue?: number;
  trend: 'up' | 'down' | 'stable';
  status: 'good' | 'warning' | 'critical';
  unit: string;
  category: string;
  calculationMethod: string;
  lastCalculated: string;
}

export interface BusinessInsight {
  id: string;
  title: string;
  description: string;
  category: InsightCategory;
  priority: 'low' | 'medium' | 'high' | 'critical';
  impact: number;
  confidence: number;
  recommendations: string[];
  dataPoints: InsightDataPoint[];
  generatedAt: string;
  validUntil?: string;
}

export type InsightCategory = 
  | 'performance'
  | 'efficiency'
  | 'risk'
  | 'opportunity'
  | 'trend'
  | 'anomaly';

export interface InsightDataPoint {
  metric: string;
  value: number;
  comparison?: {
    baseline: number;
    change: number;
    changePercent: number;
  };
  context?: string;
}

export interface Prediction {
  id: string;
  name: string;
  description: string;
  model: PredictionModel;
  predictions: PredictionResult[];
  accuracy: number;
  confidence: number;
  generatedAt: string;
  validUntil: string;
}

export interface PredictionModel {
  type: 'linear_regression' | 'time_series' | 'classification' | 'clustering';
  algorithm: string;
  features: string[];
  trainedOn: string;
  lastTrained: string;
}

export interface PredictionResult {
  period: string;
  predictedValue: number;
  confidence: number;
  lowerBound: number;
  upperBound: number;
  factors: PredictionFactor[];
}

export interface PredictionFactor {
  name: string;
  impact: number;
  direction: 'positive' | 'negative';
}