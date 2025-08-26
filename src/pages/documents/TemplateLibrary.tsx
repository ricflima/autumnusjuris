// src/pages/documents/TemplateLibrary.tsx

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Download,
  Search,
  Filter,
  Plus,
  Star,
  TrendingUp,
  Calendar,
  Tag,
  Grid3X3,
  List,
  Eye,
  BookOpen,
  Layout,
  FileCheck,
  Briefcase,
  Scale,
  Home,
  RefreshCw,
  Loader2
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { useTemplates } from '@/hooks/useDocuments';
import { documentsService } from '@/services/documents.service';
import { DocumentTemplate, DocumentCategory } from '@/types/documents';

const CATEGORY_ICONS: Record<DocumentCategory, React.ElementType> = {
  contract: Briefcase,
  petition: Scale,
  evidence: FileCheck,
  certificate: FileText,
  correspondence: BookOpen,
  report: Layout,
  template: FileText,
  personal_document: FileText,
  court_decision: Scale,
  legal_opinion: FileText,
  invoice: FileText,
  receipt: FileText,
  other: FileText
};

export default function TemplateLibrary() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<DocumentCategory | 'all'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'name' | 'usage' | 'recent'>('usage');

  const { data: templates, isLoading, error, refetch } = useTemplates();

  const handleDownload = (template: DocumentTemplate) => {
    window.open(template.downloadUrl, '_blank');
  };

  const handleUseTemplate = (template: DocumentTemplate) => {
    // Implementar criação de documento baseado no template
    console.log('Use template', template.id);
  };

  const filteredTemplates = templates?.filter(template => {
    const matchesSearch = !searchTerm || 
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  }) || [];

  const sortedTemplates = [...filteredTemplates].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'usage':
        return b.usageCount - a.usageCount;
      case 'recent':
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      default:
        return 0;
    }
  });

  const groupedByCategory = filteredTemplates.reduce((acc, template) => {
    if (!acc[template.category]) {
      acc[template.category] = [];
    }
    acc[template.category].push(template);
    return acc;
  }, {} as Record<DocumentCategory, DocumentTemplate[]>);

  const formatFileSize = (bytes: number) => {
    return documentsService.formatFileSize(bytes);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const renderTemplateCard = (template: DocumentTemplate) => {
    const IconComponent = CATEGORY_ICONS[template.category];

    if (viewMode === 'list') {
      return (
        <Card key={template.id} className="hover:shadow-lg transition-all">
          <CardContent className="p-4">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <IconComponent className="w-6 h-6 text-blue-600" />
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-gray-900 truncate">
                  {template.name}
                </h3>
                <p className="text-sm text-gray-600 line-clamp-2">
                  {template.description}
                </p>
                <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                  <span>{documentsService.getCategoryLabel(template.category)}</span>
                  <span>{template.usageCount} usos</span>
                  <span>Atualizado em {formatDate(template.updatedAt)}</span>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleUseTemplate(template)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Usar Template
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDownload(template)}
                >
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card key={template.id} className="group hover:shadow-lg transition-all">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <IconComponent className="w-6 h-6 text-blue-600" />
            </div>
            
            {template.usageCount > 50 && (
              <Badge variant="outline" className="text-orange-600 border-orange-200">
                <TrendingUp className="w-3 h-3 mr-1" />
                Popular
              </Badge>
            )}
          </div>

          <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
            {template.name}
          </h3>
          
          <p className="text-sm text-gray-600 mb-4 line-clamp-3">
            {template.description}
          </p>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>{documentsService.getCategoryLabel(template.category)}</span>
              <span>{template.usageCount} usos</span>
            </div>

            {template.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {template.tags.slice(0, 3).map(tag => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    <Tag className="w-3 h-3 mr-1" />
                    {tag}
                  </Badge>
                ))}
                {template.tags.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{template.tags.length - 3}
                  </Badge>
                )}
              </div>
            )}

            <div className="flex space-x-2">
              <Button
                size="sm"
                onClick={() => handleUseTemplate(template)}
                className="flex-1"
              >
                <Plus className="w-4 h-4 mr-2" />
                Usar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDownload(template)}
              >
                <Download className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <FileText className="w-12 h-12 text-gray-400 mb-4" />
        <p className="text-gray-600 mb-4">Erro ao carregar templates</p>
        <Button onClick={() => refetch()}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Tentar Novamente
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Biblioteca de Templates</h1>
          <p className="text-gray-600">
            Modelos de documentos jurídicos prontos para uso
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="outline" asChild>
            <Link to="/templates/create">
              <Plus className="w-4 h-4 mr-2" />
              Criar Template
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats */}
      {templates && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <FileText className="w-8 h-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total de Templates</p>
                  <p className="text-2xl font-bold">{templates.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <TrendingUp className="w-8 h-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Mais Usado</p>
                  <p className="text-sm font-bold truncate">
                    {templates.sort((a, b) => b.usageCount - a.usageCount)[0]?.name || 'N/A'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <Star className="w-8 h-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Categorias</p>
                  <p className="text-2xl font-bold">
                    {new Set(templates.map(t => t.category)).size}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <Calendar className="w-8 h-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Adicionados Este Mês</p>
                  <p className="text-2xl font-bold">
                    {templates.filter(t => {
                      const created = new Date(t.createdAt);
                      const thisMonth = new Date();
                      return created.getMonth() === thisMonth.getMonth() && 
                             created.getFullYear() === thisMonth.getFullYear();
                    }).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters and Search */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Buscar templates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value as any)}
            className="border rounded-md px-3 py-2 text-sm"
          >
            <option value="all">Todas as Categorias</option>
            {Object.entries(documentsService.getCategoryLabel).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
          
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="border rounded-md px-3 py-2 text-sm"
          >
            <option value="usage">Mais Usados</option>
            <option value="name">Nome A-Z</option>
            <option value="recent">Mais Recentes</option>
          </select>
          
          <div className="flex items-center border rounded-lg">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="rounded-r-none"
            >
              <Grid3X3 className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="rounded-l-none"
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Templates */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="flex items-center mb-3">
                  <div className="w-12 h-12 bg-gray-200 rounded-lg mr-3"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : sortedTemplates.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Nenhum template encontrado
          </h3>
          <p className="text-gray-600 mb-6">
            {searchTerm || selectedCategory !== 'all'
              ? 'Tente ajustar os filtros de busca.'
              : 'Ainda não há templates disponíveis.'
            }
          </p>
          
          {!searchTerm && selectedCategory === 'all' && (
            <Button asChild>
              <Link to="/templates/create">
                <Plus className="w-4 h-4 mr-2" />
                Criar Primeiro Template
              </Link>
            </Button>
          )}
        </div>
      ) : (
        <Tabs defaultValue="all" className="space-y-6">
          <TabsList className="w-full justify-start overflow-x-auto">
            <TabsTrigger value="all" className="whitespace-nowrap">
              Todos ({sortedTemplates.length})
            </TabsTrigger>
            {Object.entries(groupedByCategory).map(([category, categoryTemplates]) => (
              <TabsTrigger 
                key={category} 
                value={category}
                className="whitespace-nowrap"
              >
                {documentsService.getCategoryLabel(category as DocumentCategory)} ({categoryTemplates.length})
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="all">
            <div className={
              viewMode === 'grid' 
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
                : 'space-y-3'
            }>
              {sortedTemplates.map(renderTemplateCard)}
            </div>
          </TabsContent>

          {Object.entries(groupedByCategory).map(([category, categoryTemplates]) => (
            <TabsContent key={category} value={category}>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  {React.createElement(CATEGORY_ICONS[category as DocumentCategory], {
                    className: "w-5 h-5 text-blue-600"
                  })}
                  <h2 className="text-lg font-semibold">
                    {documentsService.getCategoryLabel(category as DocumentCategory)}
                  </h2>
                  <Badge variant="outline">
                    {categoryTemplates.length} template{categoryTemplates.length !== 1 ? 's' : ''}
                  </Badge>
                </div>
                
                <div className={
                  viewMode === 'grid' 
                    ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
                    : 'space-y-3'
                }>
                  {categoryTemplates
                    .sort((a, b) => {
                      switch (sortBy) {
                        case 'name':
                          return a.name.localeCompare(b.name);
                        case 'usage':
                          return b.usageCount - a.usageCount;
                        case 'recent':
                          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
                        default:
                          return 0;
                      }
                    })
                    .map(renderTemplateCard)
                  }
                </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  );
}