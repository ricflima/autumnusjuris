import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Edit, 
  FileText, 
  Calendar,
  User,
  Building,
  DollarSign,
  Clock,
  AlertCircle,
  CheckCircle,
  Plus,
  Download,
  Eye,
  MessageSquare,
  ExternalLink
} from 'lucide-react';

import { casesService, Case } from '@/services/cases.service';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { LoadingSpinner } from '@/components/common/LoadingScreen';
import { formatDate, formatCurrency } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function CaseDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [newNote, setNewNote] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);

  // Query para buscar o caso
  const { 
    data: case_, 
    isLoading, 
    error 
  } = useQuery({
    queryKey: ['case', id],
    queryFn: () => casesService.getCaseById(id!),
    enabled: !!id,
  });

  // Mutation para adicionar nota
  const addNoteMutation = useMutation({
    mutationFn: (note: string) => casesService.addCaseNote(id!, note),
    onSuccess: () => {
      setNewNote('');
      setIsAddingNote(false);
      queryClient.invalidateQueries({ queryKey: ['case', id] });
      toast.success('Anotação adicionada com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao adicionar anotação');
    },
  });

  const handleAddNote = () => {
    if (!newNote.trim()) {
      toast.error('Digite uma anotação válida');
      return;
    }
    
    addNoteMutation.mutate(newNote.trim());
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error || !case_) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">Caso não encontrado</h2>
          <p className="text-gray-600 mt-2">O caso solicitado não foi encontrado ou não existe.</p>
        </div>
        <Link to="/cases">
          <Button>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para casos
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <Link to="/cases">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{case_.title}</h1>
            <p className="text-gray-600">#{case_.processNumber || `Caso ${case_.id}`}</p>
          </div>
        </div>
        
        <div className="flex gap-3">
          <Link to={`/cases/${case_.id}/edit`}>
            <Button variant="outline">
              <Edit className="w-4 h-4 mr-2" />
              Editar
            </Button>
          </Link>
          <Button>
            <FileText className="w-4 h-4 mr-2" />
            Gerar Relatório
          </Button>
        </div>
      </div>

      {/* Status e Info Básica */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm font-medium text-gray-600">Status</span>
            </div>
            <Badge className={`mt-2 ${casesService.getStatusColor(case_.status)}`}>
              {casesService.getStatusLabel(case_.status)}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-orange-500" />
              <span className="text-sm font-medium text-gray-600">Prioridade</span>
            </div>
            <div className={`mt-2 font-semibold ${casesService.getPriorityColor(case_.priority)}`}>
              {casesService.getPriorityLabel(case_.priority)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-green-500" />
              <span className="text-sm font-medium text-gray-600">Valor da Causa</span>
            </div>
            <div className="mt-2 text-lg font-semibold text-gray-900">
              {case_.value ? formatCurrency(case_.value) : 'Não informado'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-medium text-gray-600">Próxima Ação</span>
            </div>
            <div className="mt-2">
              {case_.nextActionDate ? (
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    {formatDate(case_.nextActionDate)}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    {case_.nextAction || 'Ação não especificada'}
                  </div>
                </div>
              ) : (
                <span className="text-sm text-gray-500">Nenhuma ação agendada</span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs Principal */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="client">Cliente</TabsTrigger>
          <TabsTrigger value="documents">Documentos</TabsTrigger>
          <TabsTrigger value="timeline">Histórico</TabsTrigger>
          <TabsTrigger value="notes">Anotações</TabsTrigger>
        </TabsList>

        {/* Visão Geral */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Informações do Caso */}
            <Card>
              <CardHeader>
                <CardTitle>Detalhes do Caso</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Descrição</label>
                  <p className="mt-1 text-sm text-gray-900">{case_.description}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Área do Direito</label>
                    <p className="mt-1 text-sm text-gray-900">{case_.subject}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Tribunal</label>
                    <p className="mt-1 text-sm text-gray-900">{case_.court || 'Não especificado'}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Data de Início</label>
                    <p className="mt-1 text-sm text-gray-900">{formatDate(case_.startDate)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Previsão de Conclusão</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {case_.expectedEndDate ? formatDate(case_.expectedEndDate) : 'Não definida'}
                    </p>
                  </div>
                </div>

                {case_.tags && case_.tags.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Tags</label>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {case_.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Progresso e Próximas Ações */}
            <Card>
              <CardHeader>
                <CardTitle>Acompanhamento</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Última Atualização</label>
                  <p className="mt-1 text-sm text-gray-900">{formatDate(case_.lastUpdate)}</p>
                </div>

                {case_.nextAction && (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <Clock className="w-5 h-5 text-yellow-600 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-medium text-yellow-800">Próxima Ação</h4>
                        <p className="text-sm text-yellow-700 mt-1">{case_.nextAction}</p>
                        {case_.nextActionDate && (
                          <p className="text-xs text-yellow-600 mt-2">
                            Prazo: {formatDate(case_.nextActionDate)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium text-gray-600">Advogado Responsável</label>
                  <p className="mt-1 text-sm text-gray-900">{case_.lawyerName}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Cliente */}
        <TabsContent value="client">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {case_.clientType === 'individual' ? (
                  <User className="w-5 h-5" />
                ) : (
                  <Building className="w-5 h-5" />
                )}
                Informações do Cliente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Nome</label>
                    <p className="mt-1 text-lg font-semibold text-gray-900">{case_.clientName}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-600">Tipo</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {case_.clientType === 'individual' ? 'Pessoa Física' : 'Pessoa Jurídica'}
                    </p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-600">Documento</label>
                    <p className="mt-1 text-sm text-gray-900">{case_.clientDocument || 'Não informado'}</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Email</label>
                    <p className="mt-1 text-sm text-gray-900">{case_.clientEmail || 'Não informado'}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-600">Telefone</label>
                    <p className="mt-1 text-sm text-gray-900">{case_.clientPhone || 'Não informado'}</p>
                  </div>
                  
                  <Link to={`/clients/${case_.clientId}`}>
                    <Button variant="outline" className="w-full">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Ver Perfil Completo
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Documentos */}
        <TabsContent value="documents">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Documentos</CardTitle>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Documento
              </Button>
            </CardHeader>
            <CardContent>
              {case_.documents && case_.documents.length > 0 ? (
                <div className="space-y-3">
                  {case_.documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-blue-500" />
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">{doc.name}</h4>
                          <p className="text-xs text-gray-500">
                            Enviado por {doc.uploadedBy} em {formatDate(doc.uploadedAt)}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                  <p>Nenhum documento adicionado</p>
                  <Button className="mt-2" size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar primeiro documento
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Histórico */}
        <TabsContent value="timeline">
          <Card>
            <CardHeader>
              <CardTitle>Histórico do Caso</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {case_.timeline && case_.timeline.length > 0 ? (
                  case_.timeline
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .map((item, index) => (
                      <div key={item.id} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className={`w-2 h-2 rounded-full ${
                            item.type === 'created' ? 'bg-green-500' :
                            item.type === 'updated' ? 'bg-blue-500' :
                            item.type === 'document' ? 'bg-purple-500' :
                            item.type === 'hearing' ? 'bg-orange-500' :
                            item.type === 'deadline' ? 'bg-red-500' :
                            'bg-gray-500'
                          }`}></div>
                          {index < case_.timeline.length - 1 && (
                            <div className="w-px h-12 bg-gray-200 mt-2"></div>
                          )}
                        </div>
                        <div className="flex-1 pb-4">
                          <h4 className="text-sm font-medium text-gray-900">{item.title}</h4>
                          <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                          <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                            <span>{formatDate(item.date)}</span>
                            <span>•</span>
                            <span>por {item.user}</span>
                          </div>
                        </div>
                      </div>
                    ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Calendar className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                    <p>Nenhum evento registrado</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Anotações */}
        <TabsContent value="notes">
          <Card>
            <CardHeader>
              <CardTitle>Anotações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Adicionar nova anotação */}
              <div className="space-y-3">
                <Textarea
                  placeholder="Adicionar nova anotação..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  rows={3}
                />
                <div className="flex justify-end gap-2">
                  {isAddingNote && (
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setIsAddingNote(false);
                        setNewNote('');
                      }}
                    >
                      Cancelar
                    </Button>
                  )}
                  <Button 
                    onClick={handleAddNote}
                    disabled={addNoteMutation.isPending || !newNote.trim()}
                  >
                    {addNoteMutation.isPending ? (
                      <>
                        <LoadingSpinner />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Adicionar Anotação
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Lista de anotações existentes */}
              <div className="space-y-3">
                {case_.timeline
                  .filter(item => item.type === 'note')
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map((note) => (
                    <div key={note.id} className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                      <p className="text-sm text-gray-900">{note.description}</p>
                      <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                        <span>{formatDate(note.date)}</span>
                        <span>•</span>
                        <span>por {note.user}</span>
                      </div>
                    </div>
                  ))}
                
                {case_.timeline.filter(item => item.type === 'note').length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <MessageSquare className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                    <p>Nenhuma anotação adicionada</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}