import {
  DocumentAnalysis,
  AnalysisType,
  AnalysisResult,
  ContractAnalysisResult,
  EntityRecognition,
  SentimentAnalysis,
  AIModel,
  AnalysisTemplate
} from '../types/aiDocumentAnalysis';

class AIDocumentAnalysisService {
  private mockModels: AIModel[] = [
    {
      id: 'contract-analyzer-v2',
      name: 'Contract Analyzer v2.0',
      type: 'contract_analysis',
      version: '2.0.1',
      accuracy: 0.94,
      supportedLanguages: ['pt-BR', 'en-US'],
      isActive: true,
      lastUpdated: '2025-01-20T10:00:00Z'
    },
    {
      id: 'legal-ner-v1',
      name: 'Legal NER v1.5',
      type: 'extraction',
      version: '1.5.3',
      accuracy: 0.89,
      supportedLanguages: ['pt-BR'],
      isActive: true,
      lastUpdated: '2025-01-15T14:30:00Z'
    },
    {
      id: 'doc-classifier-v3',
      name: 'Document Classifier v3.0',
      type: 'classification',
      version: '3.0.0',
      accuracy: 0.92,
      supportedLanguages: ['pt-BR', 'en-US', 'es-ES'],
      isActive: true,
      lastUpdated: '2025-01-25T09:15:00Z'
    }
  ];

  private mockTemplates: AnalysisTemplate[] = [
    {
      id: 'contract-full',
      name: 'Análise Completa de Contrato',
      description: 'Análise abrangente incluindo cláusulas, riscos e compliance',
      analysisTypes: ['contract_analysis', 'entity_recognition', 'risk_assessment', 'compliance_check'],
      documentTypes: ['contract', 'agreement'],
      isDefault: true,
      settings: {
        extractClauses: true,
        assessRisks: true,
        checkCompliance: true
      }
    },
    {
      id: 'petition-analysis',
      name: 'Análise de Petição',
      description: 'Análise específica para petições e documentos processuais',
      analysisTypes: ['legal_classification', 'entity_recognition', 'date_extraction'],
      documentTypes: ['petition', 'legal_document'],
      isDefault: false,
      settings: {
        extractDates: true,
        identifyParties: true,
        classifyLegal: true
      }
    }
  ];

  private mockAnalyses: DocumentAnalysis[] = [
    {
      id: 'analysis-1',
      documentId: 'doc-1',
      documentName: 'Contrato de Prestação de Serviços.pdf',
      analysisType: ['contract_analysis', 'entity_recognition'],
      status: 'completed',
      createdAt: '2025-01-26T10:00:00Z',
      completedAt: '2025-01-26T10:03:45Z',
      confidence: 0.92,
      processingTime: 225000,
      results: []
    }
  ];

  async getAvailableModels(): Promise<AIModel[]> {
    return new Promise((resolve) => {
      setTimeout(() => resolve([...this.mockModels]), 300);
    });
  }

  async getAnalysisTemplates(): Promise<AnalysisTemplate[]> {
    return new Promise((resolve) => {
      setTimeout(() => resolve([...this.mockTemplates]), 200);
    });
  }

  async startDocumentAnalysis(
    documentId: string,
    documentName: string,
    analysisTypes: AnalysisType[],
    templateId?: string
  ): Promise<DocumentAnalysis> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const analysis: DocumentAnalysis = {
          id: `analysis-${Date.now()}`,
          documentId,
          documentName,
          analysisType: analysisTypes,
          status: 'processing',
          createdAt: new Date().toISOString(),
          confidence: 0,
          processingTime: 0,
          results: []
        };
        
        this.mockAnalyses.push(analysis);
        resolve(analysis);
        
        // Simular processamento assíncrono
        setTimeout(() => {
          this.completeAnalysis(analysis.id);
        }, 3000);
      }, 500);
    });
  }

  async getAnalysisStatus(analysisId: string): Promise<DocumentAnalysis | null> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const analysis = this.mockAnalyses.find(a => a.id === analysisId);
        resolve(analysis || null);
      }, 200);
    });
  }

  async getDocumentAnalyses(documentId?: string): Promise<DocumentAnalysis[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        let analyses = [...this.mockAnalyses];
        if (documentId) {
          analyses = analyses.filter(a => a.documentId === documentId);
        }
        resolve(analyses);
      }, 300);
    });
  }

  private async completeAnalysis(analysisId: string): Promise<void> {
    const analysis = this.mockAnalyses.find(a => a.id === analysisId);
    if (!analysis) return;

    analysis.status = 'completed';
    analysis.completedAt = new Date().toISOString();
    analysis.confidence = 0.85 + Math.random() * 0.1; // 0.85-0.95
    analysis.processingTime = 180000 + Math.random() * 120000; // 3-5 minutes
    
    // Gerar resultados mock baseados nos tipos de análise solicitados
    analysis.results = await this.generateMockResults(analysis.analysisType);
  }

  private async generateMockResults(analysisTypes: AnalysisType[]): Promise<AnalysisResult[]> {
    const results: AnalysisResult[] = [];

    for (const type of analysisTypes) {
      switch (type) {
        case 'contract_analysis':
          results.push({
            type: 'contract_analysis',
            confidence: 0.92,
            summary: 'Contrato de prestação de serviços com 15 cláusulas identificadas, 3 riscos médios e 1 alto.',
            highlights: [
              {
                text: 'O valor total do contrato é de R$ 50.000,00',
                startPosition: 1250,
                endPosition: 1290,
                type: 'clause',
                confidence: 0.95
              }
            ],
            data: this.generateContractAnalysis()
          });
          break;

        case 'entity_recognition':
          results.push({
            type: 'entity_recognition',
            confidence: 0.89,
            summary: 'Identificadas 12 entidades: 3 pessoas, 2 organizações, 4 datas e 3 valores monetários.',
            highlights: [
              {
                text: 'João Silva Advocacia LTDA',
                startPosition: 150,
                endPosition: 175,
                type: 'entity',
                confidence: 0.98,
                metadata: { entityType: 'organization' }
              }
            ],
            data: this.generateEntityRecognition()
          });
          break;

        case 'sentiment_analysis':
          results.push({
            type: 'sentiment_analysis',
            confidence: 0.87,
            summary: 'Sentimento geral neutro com tendência positiva. Alta profissionalidade.',
            highlights: [],
            data: this.generateSentimentAnalysis()
          });
          break;

        case 'risk_assessment':
          results.push({
            type: 'risk_assessment',
            confidence: 0.84,
            summary: 'Identificados 4 riscos: 1 alto (cláusula de rescisão), 2 médios e 1 baixo.',
            highlights: [
              {
                text: 'rescisão unilateral sem aviso prévio',
                startPosition: 2100,
                endPosition: 2135,
                type: 'risk',
                confidence: 0.91
              }
            ],
            data: {
              totalRisks: 4,
              highRisks: 1,
              mediumRisks: 2,
              lowRisks: 1
            }
          });
          break;

        default:
          results.push({
            type,
            confidence: 0.80 + Math.random() * 0.15,
            summary: `Análise de ${type} concluída com sucesso.`,
            highlights: [],
            data: {}
          });
      }
    }

    return results;
  }

  private generateContractAnalysis(): ContractAnalysisResult {
    return {
      contractType: 'Prestação de Serviços',
      parties: [
        {
          name: 'João Silva Advocacia LTDA',
          type: 'company',
          role: 'contractor',
          document: 'CNPJ 12.345.678/0001-90',
          confidence: 0.95
        },
        {
          name: 'Maria Santos',
          type: 'person',
          role: 'contractee',
          document: 'CPF 123.456.789-00',
          confidence: 0.93
        }
      ],
      clauses: [
        {
          id: 'clause-1',
          type: 'payment',
          title: 'Condições de Pagamento',
          content: 'O pagamento será efetuado em 3 parcelas mensais...',
          position: { start: 1200, end: 1450 },
          importance: 'high',
          riskLevel: 'low',
          suggestions: ['Especificar data de vencimento das parcelas']
        }
      ],
      obligations: [
        {
          party: 'João Silva Advocacia LTDA',
          description: 'Prestar serviços jurídicos conforme especificado',
          status: 'pending',
          priority: 'high'
        }
      ],
      dates: [
        {
          type: 'start_date',
          date: '2025-02-01T00:00:00Z',
          description: 'Início da prestação de serviços',
          daysFromNow: 6,
          isUrgent: true
        }
      ],
      risks: [
        {
          category: 'legal',
          level: 'high',
          description: 'Cláusula de rescisão muito permissiva',
          impact: 'Possibilidade de rescisão unilateral sem compensação',
          mitigation: ['Incluir cláusula de aviso prévio', 'Estabelecer compensação por rescisão'],
          confidence: 0.91
        }
      ],
      compliance: [
        {
          regulation: 'Código Civil - Contratos',
          status: 'compliant',
          description: 'Contrato atende aos requisitos básicos',
          recommendations: [],
          severity: 'low'
        }
      ],
      recommendations: [
        'Revisar cláusula de rescisão',
        'Especificar melhor as obrigações de cada parte',
        'Incluir cláusula de confidencialidade'
      ]
    };
  }

  private generateEntityRecognition(): EntityRecognition {
    return {
      entities: [
        {
          text: 'João Silva Advocacia LTDA',
          type: 'organization',
          confidence: 0.98,
          position: { start: 150, end: 175 }
        },
        {
          text: 'Maria Santos',
          type: 'person',
          confidence: 0.95,
          position: { start: 200, end: 212 }
        },
        {
          text: 'R$ 50.000,00',
          type: 'money',
          confidence: 0.97,
          position: { start: 1250, end: 1262 }
        }
      ],
      relationships: [
        {
          source: 'João Silva Advocacia LTDA',
          target: 'Maria Santos',
          relationship: 'prestador_serviço',
          confidence: 0.92
        }
      ],
      summary: 'Identificadas entidades principais do contrato com alta confiança'
    };
  }

  private generateSentimentAnalysis(): SentimentAnalysis {
    return {
      overallSentiment: 'neutral',
      confidence: 0.87,
      sections: [
        {
          text: 'As partes acordam mutuamente...',
          sentiment: 'positive',
          confidence: 0.78,
          position: { start: 100, end: 150 },
          emotions: ['cooperativo', 'formal']
        }
      ],
      emotionalTone: ['formal', 'profissional', 'neutro'],
      professionalismScore: 0.94
    };
  }

  async deleteAnalysis(analysisId: string): Promise<boolean> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const index = this.mockAnalyses.findIndex(a => a.id === analysisId);
        if (index > -1) {
          this.mockAnalyses.splice(index, 1);
          resolve(true);
        } else {
          resolve(false);
        }
      }, 200);
    });
  }

  async exportAnalysisReport(analysisId: string, format: 'pdf' | 'docx' | 'json'): Promise<string> {
    return new Promise((resolve) => {
      setTimeout(() => {
        // Mock de export - retorna URL do arquivo
        const fileName = `analysis-report-${analysisId}.${format}`;
        resolve(`/downloads/${fileName}`);
      }, 1500);
    });
  }

  async createAnalysisTemplate(template: Omit<AnalysisTemplate, 'id'>): Promise<AnalysisTemplate> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const newTemplate: AnalysisTemplate = {
          ...template,
          id: `template-${Date.now()}`
        };
        this.mockTemplates.push(newTemplate);
        resolve(newTemplate);
      }, 300);
    });
  }
}

export const aiDocumentAnalysisService = new AIDocumentAnalysisService();
export default aiDocumentAnalysisService;