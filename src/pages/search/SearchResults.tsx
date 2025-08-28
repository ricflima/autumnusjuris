// src/pages/search/SearchResults.tsx

import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Search,
  FileText,
  Users,
  Gavel,
  Calendar,
  DollarSign,
  Building,
  User,
  Clock,
  ArrowRight
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LoadingSpinner } from '@/components/common/LoadingScreen';
import { formatDate, formatCurrency } from '@/lib/utils';

interface SearchResult {
  id: string;
  type: 'case' | 'client' | 'process' | 'document' | 'invoice';
  title: string;
  description: string;
  metadata: any;
  relevance: number;
}

export default function SearchResults() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [searchTerm, setSearchTerm] = useState(query);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);

  // Simular busca
  useEffect(() => {
    if (query) {
      setIsLoading(true);
      // Simular delay de busca
      setTimeout(() => {
        const mockResults: SearchResult[] = [
          {
            id: '1',
            type: 'case' as const,
            title: 'Processo Trabalhista - Silva vs Empresa XYZ',
            description: 'Ação trabalhista por horas extras não pagas e rescisão indevida',
            metadata: {
              status: 'active',
              client: 'João Silva',
              value: 25000,
              lastUpdate: '2025-08-10T14:30:00Z'
            },
            relevance: 0.95
          },
          {
            id: '2',
            type: 'client' as const,
            title: 'João Silva',
            description: 'Cliente pessoa física - Direito Trabalhista',
            metadata: {
              type: 'individual',
              email: 'joao.silva@email.com',
              phone: '(11) 99999-9999',
              totalCases: 2
            },
            relevance: 0.90
          },
          {
            id: '3',
            type: 'document' as const,
            title: 'Petição Inicial - Caso Silva',
            description: 'Petição inicial do processo trabalhista',
            metadata: {
              size: '1.2 MB',
              uploadedAt: '2025-07-15T10:00:00Z',
              type: 'PDF'
            },
            relevance: 0.85
          },
          {
            id: '4',
            type: 'invoice' as const,
            title: 'Fatura #001234 - João Silva',
            description: 'Honorários advocatícios - Processo Trabalhista',
            metadata: {
              amount: 15000,
              status: 'paid',
              dueDate: '2025-08-15T00:00:00Z'
            },
            relevance: 0.75
          }
        ].filter(result => 
          query.toLowerCase().split(' ').some(term => 
            result.title.toLowerCase().includes(term) || 
            result.description.toLowerCase().includes(term)
          )
        );
        
        setResults(mockResults);
        setIsLoading(false);
      }, 800);
    }
  }, [query]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      setSearchParams({ q: searchTerm.trim() });
    }
  };

  const getResultIcon = (type: string) => {
    switch (type) {
      case 'case': return <FileText className="w-5 h-5 text-blue-600" />;
      case 'client': return <Users className="w-5 h-5 text-green-600" />;
      case 'process': return <Gavel className="w-5 h-5 text-purple-600" />;
      case 'document': return <FileText className="w-5 h-5 text-orange-600" />;
      case 'invoice': return <DollarSign className="w-5 h-5 text-emerald-600" />;
      default: return <FileText className="w-5 h-5 text-gray-600" />;
    }
  };

  const getResultLink = (result: SearchResult) => {
    switch (result.type) {
      case 'case': return `/cases/${result.id}`;
      case 'client': return `/clients/${result.id}`;
      case 'process': return `/processes/${result.id}`;
      case 'document': return `/documents/${result.id}/view`;
      case 'invoice': return `/financial/invoices/${result.id}`;
      default: return '#';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'case': return 'Caso';
      case 'client': return 'Cliente';
      case 'process': return 'Processo';
      case 'document': return 'Documento';
      case 'invoice': return 'Fatura';
      default: return type;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'case': return 'bg-blue-100 text-blue-800';
      case 'client': return 'bg-green-100 text-green-800';
      case 'process': return 'bg-purple-100 text-purple-800';
      case 'document': return 'bg-orange-100 text-orange-800';
      case 'invoice': return 'bg-emerald-100 text-emerald-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const groupedResults = results.reduce((acc, result) => {
    if (!acc[result.type]) {
      acc[result.type] = [];
    }
    acc[result.type].push(result);
    return acc;
  }, {} as Record<string, SearchResult[]>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="p-2 bg-blue-100 rounded-lg">
          <Search className="h-6 w-6 text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Resultados da Busca</h1>
          <p className="text-gray-600">
            {query ? `Resultados para "${query}"` : 'Digite algo para buscar'}
          </p>
        </div>
      </div>

      {/* Search Form */}
      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar casos, clientes, processos, documentos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? <LoadingSpinner /> : <Search className="w-4 h-4" />}
              Buscar
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      )}

      {/* Results */}
      {!isLoading && query && (
        <>
          {results.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Search className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Nenhum resultado encontrado
                </h3>
                <p className="text-gray-600">
                  Tente usar termos diferentes ou verificar a ortografia.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Summary */}
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  {results.length} resultado(s) encontrado(s)
                </p>
                
                <div className="flex items-center gap-2">
                  {Object.keys(groupedResults).map(type => (
                    <Badge key={type} className={getTypeColor(type)}>
                      {getTypeLabel(type)} ({groupedResults[type].length})
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Results List */}
              <div className="space-y-4">
                {results
                  .sort((a, b) => b.relevance - a.relevance)
                  .map((result) => (
                    <Card key={result.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <Link to={getResultLink(result)} className="block">
                          <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 mt-1">
                              {getResultIcon(result.type)}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex-1">
                                  <h3 className="text-lg font-medium text-gray-900 hover:text-blue-600 transition-colors">
                                    {result.title}
                                  </h3>
                                  <p className="text-sm text-gray-600 mt-1">
                                    {result.description}
                                  </p>
                                </div>
                                
                                <div className="flex items-center gap-2 ml-4">
                                  <Badge className={getTypeColor(result.type)}>
                                    {getTypeLabel(result.type)}
                                  </Badge>
                                  <ArrowRight className="w-4 h-4 text-gray-400" />
                                </div>
                              </div>
                              
                              {/* Metadata */}
                              <div className="flex items-center gap-4 text-xs text-gray-500">
                                {result.type === 'case' && (
                                  <>
                                    <span>Cliente: {result.metadata.client}</span>
                                    <span>•</span>
                                    <span>Valor: {formatCurrency(result.metadata.value)}</span>
                                    <span>•</span>
                                    <span>Atualizado: {formatDate(result.metadata.lastUpdate)}</span>
                                  </>
                                )}
                                
                                {result.type === 'client' && (
                                  <>
                                    <span>Tipo: {result.metadata.type === 'individual' ? 'Pessoa Física' : 'Pessoa Jurídica'}</span>
                                    <span>•</span>
                                    <span>Email: {result.metadata.email}</span>
                                    <span>•</span>
                                    <span>Casos: {result.metadata.totalCases}</span>
                                  </>
                                )}
                                
                                {result.type === 'document' && (
                                  <>
                                    <span>Tipo: {result.metadata.type}</span>
                                    <span>•</span>
                                    <span>Tamanho: {result.metadata.size}</span>
                                    <span>•</span>
                                    <span>Enviado: {formatDate(result.metadata.uploadedAt)}</span>
                                  </>
                                )}
                                
                                {result.type === 'invoice' && (
                                  <>
                                    <span>Valor: {formatCurrency(result.metadata.amount)}</span>
                                    <span>•</span>
                                    <span>Status: {result.metadata.status === 'paid' ? 'Pago' : 'Pendente'}</span>
                                    <span>•</span>
                                    <span>Vencimento: {formatDate(result.metadata.dueDate)}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </Link>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Empty State */}
      {!isLoading && !query && (
        <Card>
          <CardContent className="text-center py-12">
            <Search className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Busca Global
            </h3>
            <p className="text-gray-600 mb-6">
              Digite acima para buscar em casos, clientes, processos, documentos e faturas.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left max-w-2xl mx-auto">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <FileText className="w-5 h-5 text-blue-600" />
                <div>
                  <h4 className="font-medium text-sm">Casos</h4>
                  <p className="text-xs text-gray-600">Títulos e descrições</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Users className="w-5 h-5 text-green-600" />
                <div>
                  <h4 className="font-medium text-sm">Clientes</h4>
                  <p className="text-xs text-gray-600">Nomes e informações</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <FileText className="w-5 h-5 text-orange-600" />
                <div>
                  <h4 className="font-medium text-sm">Documentos</h4>
                  <p className="text-xs text-gray-600">Nomes de arquivos</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}