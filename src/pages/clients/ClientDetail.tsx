// src/pages/clients/ClientDetail.tsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Edit, 
  Plus, 
  Mail, 
  Phone, 
  MapPin, 
  User, 
  Building, 
  Calendar, 
  DollarSign,
  FileText,
  Clock,
  MessageCircle,
  Video,
  Send,
  Paperclip,
  AlertCircle
} from 'lucide-react';
import { clientsService, type ClientInteraction, type InteractionType } from '@/services/clients.service';
import { casesService } from '@/services/cases.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingScreen, LoadingSpinner } from '@/components/common/LoadingScreen';
import toast from 'react-hot-toast';
import { formatDate, formatCurrency, formatDateWithTime } from '@/lib/utils';

export default function ClientDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [showAddInteraction, setShowAddInteraction] = useState(false);
  const [newInteraction, setNewInteraction] = useState({
    type: 'note' as InteractionType,
    subject: '',
    description: '',
    date: new Date().toISOString().slice(0, 16)
  });

  // Query para buscar cliente
  const { 
    data: client, 
    isLoading: clientLoading, 
    error: clientError 
  } = useQuery({
    queryKey: ['client', id],
    queryFn: () => clientsService.getClientById(id!),
    enabled: !!id,
  });

  // Query para buscar interações
  const { 
    data: interactions, 
    isLoading: interactionsLoading 
  } = useQuery({
    queryKey: ['client-interactions', id],
    queryFn: () => clientsService.getClientInteractions(id!),
    enabled: !!id,
  });

  // Query para buscar casos do cliente
  const { 
    data: clientCases, 
    isLoading: casesLoading 
  } = useQuery({
    queryKey: ['client-cases', id],
    queryFn: () => casesService.getCases({ clientId: id }),
    enabled: !!id,
  });

  // Mutation para adicionar interação
  const addInteractionMutation = useMutation({
    mutationFn: (interaction: Omit<ClientInteraction, 'id' | 'clientId' | 'createdAt'>) =>
      clientsService.addClientInteraction(id!, interaction),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-interactions', id] });
      queryClient.invalidateQueries({ queryKey: ['client', id] });
      toast.success('Interação adicionada com sucesso!');
      setShowAddInteraction(false);
      setNewInteraction({
        type: 'note',
        subject: '',
        description: '',
        date: new Date().toISOString().slice(0, 16)
      });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao adicionar interação');
    },
  });

  const handleAddInteraction = () => {
    if (!newInteraction.subject.trim() || !newInteraction.description.trim()) {
      toast.error('Assunto e descrição são obrigatórios');
      return;
    }

    addInteractionMutation.mutate({
      ...newInteraction,
      userId: '1', // TODO: Usar ID do usuário logado
      userName: 'Dr. João Silva', // TODO: Usar nome do usuário logado
    });
  };

  const getInteractionIcon = (type: InteractionType) => {
    const icons = {
      call: Phone,
      email: Mail,
      meeting: Video,
      document: FileText,
      note: MessageCircle,
      task: Clock
    };
    const Icon = icons[type] || MessageCircle;
    return <Icon className="w-4 h-4" />;
  };

  const getInteractionColor = (type: InteractionType) => {
    const colors = {
      call: 'bg-green-100 text-green-800 border-green-200',
      email: 'bg-blue-100 text-blue-800 border-blue-200',
      meeting: 'bg-purple-100 text-purple-800 border-purple-200',
      document: 'bg-orange-100 text-orange-800 border-orange-200',
      note: 'bg-gray-100 text-gray-800 border-gray-200',
      task: 'bg-yellow-100 text-yellow-800 border-yellow-200'
    };
    return colors[type] || colors.note;
  };

  const getInteractionLabel = (type: InteractionType) => {
    const labels = {
      call: 'Ligação',
      email: 'E-mail',
      meeting: 'Reunião',
      document: 'Documento',
      note: 'Anotação',
      task: 'Tarefa'
    };
    return labels[type] || 'Interação';
  };

  if (clientLoading) {
    return <LoadingScreen message="Carregando dados do cliente..." />;
  }

  if (clientError || !client) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Cliente não encontrado</h3>
        <p className="text-gray-500 mb-4">O cliente solicitado não foi encontrado.</p>
        <Button onClick={() => navigate('/clients')}>
          Voltar para Lista de Clientes
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => navigate('/clients')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Button>
          
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              {client.type === 'company' ? (
                <Building className="w-8 h-8 text-white" />
              ) : (
                <User className="w-8 h-8 text-white" />
              )}
            </div>
            
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                {client.name}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${clientsService.getStatusColor(client.status)}`}>
                  {clientsService.getStatusLabel(client.status)}
                </span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${clientsService.getClassificationColor(client.classification)}`}>
                  {clientsService.getClassificationLabel(client.classification)}
                </span>
                <span className="text-sm text-gray-500">
                  {clientsService.getTypeLabel(client.type)}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => setShowAddInteraction(!showAddInteraction)}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Nova Interação
          </Button>
          
          <Link to={`/clients/${client.id}/edit`}>
            <Button className="flex items-center gap-2">
              <Edit className="w-4 h-4" />
              Editar Cliente
            </Button>
          </Link>
        </div>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Casos Ativos</p>
                <p className="text-2xl font-bold text-blue-600">{client.activeCases}</p>
              </div>
              <FileText className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total de Casos</p>
                <p className="text-2xl font-bold text-green-600">{client.totalCases}</p>
              </div>
              <FileText className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Faturamento Total</p>
                <p className="text-2xl font-bold text-purple-600">{formatCurrency(client.totalBilled)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Último Contato</p>
                <p className="text-sm font-medium text-yellow-800">
                  {client.lastContact ? formatDateWithTime(client.lastContact) : 'Nunca'}
                </p>
              </div>
              <Calendar className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Informações do Cliente */}
        <div className="lg:col-span-1 space-y-6">
          {/* Informações de Contato */}
          <Card>
            <CardHeader>
              <CardTitle>Informações de Contato</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">E-mail</p>
                  <p className="font-medium">{client.email}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Telefone</p>
                  <p className="font-medium">{clientsService.formatPhone(client.phone)}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <User className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">{client.documentType.toUpperCase()}</p>
                  <p className="font-medium">{clientsService.formatDocument(client.document, client.documentType)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Endereço */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Endereço
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <p>{client.address.street}, {client.address.number}</p>
                {client.address.complement && <p>{client.address.complement}</p>}
                <p>{client.address.neighborhood}</p>
                <p>{client.address.city}, {client.address.state}</p>
                <p>CEP: {client.address.zipCode}</p>
                <p>{client.address.country}</p>
              </div>
            </CardContent>
          </Card>

          {/* Informações Específicas */}
          <Card>
            <CardHeader>
              <CardTitle>
                {client.type === 'individual' ? 'Informações Pessoais' : 'Informações da Empresa'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {client.type === 'individual' ? (
                <>
                  {client.birthDate && (
                    <div>
                      <p className="text-sm text-gray-600">Data de Nascimento</p>
                      <p className="font-medium">{new Date(client.birthDate).toLocaleDateString('pt-BR')}</p>
                    </div>
                  )}
                  {client.profession && (
                    <div>
                      <p className="text-sm text-gray-600">Profissão</p>
                      <p className="font-medium">{client.profession}</p>
                    </div>
                  )}
                  {client.maritalStatus && (
                    <div>
                      <p className="text-sm text-gray-600">Estado Civil</p>
                      <p className="font-medium">{client.maritalStatus}</p>
                    </div>
                  )}
                </>
              ) : (
                <>
                  {client.contactPerson && (
                    <div>
                      <p className="text-sm text-gray-600">Pessoa de Contato</p>
                      <p className="font-medium">{client.contactPerson}</p>
                    </div>
                  )}
                </>
              )}
              
              <div>
                <p className="text-sm text-gray-600">Cliente desde</p>
                <p className="font-medium">{new Date(client.createdAt).toLocaleDateString('pt-BR')}</p>
              </div>
            </CardContent>
          </Card>

          {/* Observações */}
          {client.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Observações</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{client.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Área principal - Interações e Casos */}
        <div className="lg:col-span-2 space-y-6">
          {/* Formulário de Nova Interação */}
          {showAddInteraction && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  Nova Interação
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Tipo de Interação</Label>
                    <select
                      value={newInteraction.type}
                      onChange={(e) => setNewInteraction(prev => ({ ...prev, type: e.target.value as InteractionType }))}
                      className="mt-1 block w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
                    >
                      <option value="note">Anotação</option>
                      <option value="call">Ligação</option>
                      <option value="email">E-mail</option>
                      <option value="meeting">Reunião</option>
                      <option value="document">Documento</option>
                      <option value="task">Tarefa</option>
                    </select>
                  </div>
                  
                  <div>
                    <Label>Data e Hora</Label>
                    <Input
                      type="datetime-local"
                      value={newInteraction.date}
                      onChange={(e) => setNewInteraction(prev => ({ ...prev, date: e.target.value }))}
                      className="mt-1"
                    />
                  </div>
                </div>
                
                <div>
                  <Label>Assunto</Label>
                  <Input
                    value={newInteraction.subject}
                    onChange={(e) => setNewInteraction(prev => ({ ...prev, subject: e.target.value }))}
                    placeholder="Assunto da interação..."
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label>Descrição</Label>
                  <textarea
                    value={newInteraction.description}
                    onChange={(e) => setNewInteraction(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    placeholder="Descreva os detalhes da interação..."
                    className="mt-1 block w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 resize-vertical"
                  />
                </div>
                
                <div className="flex items-center justify-end gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowAddInteraction(false)}
                    disabled={addInteractionMutation.isPending}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleAddInteraction}
                    disabled={addInteractionMutation.isPending}
                    className="flex items-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    {addInteractionMutation.isPending ? 'Salvando...' : 'Salvar Interação'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Timeline de Interações */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5" />
                  Histórico de Interações
                </CardTitle>
                <span className="text-sm text-gray-500">
                  {interactions?.length || 0} interações
                </span>
              </div>
            </CardHeader>
            <CardContent>
              {interactionsLoading ? (
                <div className="text-center py-6">
                  <LoadingSpinner message="Carregando interações..." />
                </div>
              ) : interactions && interactions.length > 0 ? (
                <div className="space-y-4">
                  {interactions.map((interaction, index) => (
                    <div key={interaction.id} className="flex gap-3">
                      {/* Timeline line */}
                      <div className="flex flex-col items-center">
                        <div className={`p-2 rounded-full border ${getInteractionColor(interaction.type)}`}>
                          {getInteractionIcon(interaction.type)}
                        </div>
                        {index < interactions.length - 1 && (
                          <div className="w-px h-8 bg-gray-200 mt-2"></div>
                        )}
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h4 className="font-medium text-gray-900">{interaction.subject}</h4>
                              <p className="text-sm text-gray-600">
                                {getInteractionLabel(interaction.type)} • {interaction.userName}
                              </p>
                            </div>
                            <time className="text-xs text-gray-500">
                              {formatDate(interaction.date)}
                            </time>
                          </div>
                          
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">
                            {interaction.description}
                          </p>
                          
                          {interaction.attachments && interaction.attachments.length > 0 && (
                            <div className="mt-3 flex items-center gap-2">
                              <Paperclip className="w-4 h-4 text-gray-400" />
                              <span className="text-xs text-gray-500">
                                {interaction.attachments.length} anexo(s)
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500">
                  <MessageCircle className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>Nenhuma interação registrada</p>
                  <p className="text-sm">Clique em "Nova Interação" para adicionar a primeira</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Casos do Cliente */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Casos do Cliente
                </CardTitle>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">
                    {clientCases?.total || 0} casos
                  </span>
                  <Link to={`/cases/new?clientId=${client.id}`}>
                    <Button size="sm" className="flex items-center gap-1">
                      <Plus className="w-4 h-4" />
                      Novo Caso
                    </Button>
                  </Link>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {casesLoading ? (
                <div className="text-center py-6">
                  <LoadingSpinner message="Carregando casos..." />
                </div>
              ) : clientCases && clientCases.cases.length > 0 ? (
                <div className="space-y-4">
                  {clientCases.cases.map((case_) => (
                    <div key={case_.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 mb-1">
                            {case_.title}
                          </h4>
                          <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                            {case_.description}
                          </p>
                          
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span className={`px-2 py-1 rounded-full font-medium ${casesService.getStatusColor(case_.status)}`}>
                              {casesService.getStatusLabel(case_.status)}
                            </span>
                            <span className={`font-medium ${casesService.getPriorityColor(case_.priority)}`}>
                              {casesService.getPriorityLabel(case_.priority)} prioridade
                            </span>
                            <span>Criado em {new Date(case_.createdAt).toLocaleDateString('pt-BR')}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 ml-4">
                          <Link to={`/cases/${case_.id}`}>
                            <Button variant="outline" size="sm">
                              Ver Detalhes
                            </Button>
                          </Link>
                        </div>
                      </div>
                      
                      {case_.nextAction && (
                        <div className="mt-3 p-2 bg-blue-50 border-l-4 border-blue-400 rounded">
                          <p className="text-xs text-blue-700">
                            <strong>Próxima ação:</strong> {case_.nextAction}
                            {case_.nextActionDate && (
                              <span> - {new Date(case_.nextActionDate).toLocaleDateString('pt-BR')}</span>
                            )}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {clientCases.hasMore && (
                    <div className="text-center pt-4">
                      <Link to={`/cases?clientId=${client.id}`}>
                        <Button variant="outline">
                          Ver Todos os Casos
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500">
                  <FileText className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>Nenhum caso registrado</p>
                  <p className="text-sm mb-4">Este cliente ainda não possui casos cadastrados</p>
                  <Link to={`/cases/new?clientId=${client.id}`}>
                    <Button className="flex items-center gap-2">
                      <Plus className="w-4 h-4" />
                      Criar Primeiro Caso
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
