// src/pages/integrations/WhatsAppBusiness.tsx
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  MessageSquare,
  Phone,
  Users,
  Send,
  Settings,
  Plus,
  CheckCircle,
  Clock,
  AlertCircle,
  TrendingUp,
  Calendar,
  FileText,
  Webhook,
  Shield
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Mock data para demonstração
const WHATSAPP_STATS = {
  messagesThisMonth: 1847,
  deliveryRate: 98.2,
  responseRate: 87.5,
  clientsSatisfaction: 94.1,
};

const RECENT_CONVERSATIONS = [
  {
    id: '1',
    contact: 'João Silva',
    lastMessage: 'Obrigado pelas informações sobre o processo',
    time: '14:32',
    status: 'read',
    caseId: 'case-123',
    caseName: 'Processo Trabalhista'
  },
  {
    id: '2',
    contact: 'Maria Santos',
    lastMessage: 'Quando será a próxima audiência?',
    time: '13:45',
    status: 'delivered',
    caseId: 'case-456',
    caseName: 'Ação de Cobrança'
  },
  {
    id: '3',
    contact: 'Pedro Costa',
    lastMessage: 'Documentos enviados por email',
    time: '12:20',
    status: 'sent',
    caseId: 'case-789',
    caseName: 'Inventário'
  },
];

const MESSAGE_TEMPLATES = [
  {
    id: '1',
    name: 'Confirmação de Audiência',
    category: 'legal',
    content: 'Olá {nome}, sua audiência foi marcada para {data} às {horario}. Local: {local}',
    usageCount: 45
  },
  {
    id: '2',
    name: 'Prazo de Documentos',
    category: 'administrative',
    content: 'Prezado {nome}, favor enviar os documentos solicitados até {prazo}',
    usageCount: 32
  },
  {
    id: '3',
    name: 'Andamento Processual',
    category: 'legal',
    content: 'Novo andamento no processo {numero}: {descricao}',
    usageCount: 78
  },
];

const STATUS_ICONS = {
  sent: Clock,
  delivered: CheckCircle,
  read: CheckCircle,
  failed: AlertCircle,
};

const STATUS_COLORS = {
  sent: 'text-yellow-600',
  delivered: 'text-green-600',
  read: 'text-blue-600',
  failed: 'text-red-600',
};

export function WhatsAppBusiness() {
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [messageText, setMessageText] = useState('');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            WhatsApp Business
          </h1>
          <p className="text-gray-600">
            Comunique-se com clientes via WhatsApp Business API
          </p>
        </div>
        
        <div className="flex gap-3">
          <Button variant="outline">
            <Settings className="w-4 h-4 mr-2" />
            Configurações
          </Button>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Nova Mensagem
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <MessageSquare className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Mensagens/Mês</p>
                <p className="text-2xl font-bold">{WHATSAPP_STATS.messagesThisMonth}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <CheckCircle className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Taxa de Entrega</p>
                <p className="text-2xl font-bold">{WHATSAPP_STATS.deliveryRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Taxa de Resposta</p>
                <p className="text-2xl font-bold">{WHATSAPP_STATS.responseRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Users className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Satisfação</p>
                <p className="text-2xl font-bold">{WHATSAPP_STATS.clientsSatisfaction}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="conversations" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="conversations">Conversas</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="broadcast">Broadcast</TabsTrigger>
          <TabsTrigger value="settings">Configurações</TabsTrigger>
        </TabsList>

        {/* Conversas */}
        <TabsContent value="conversations" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Conversas Recentes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {RECENT_CONVERSATIONS.map((conversation) => {
                      const StatusIcon = STATUS_ICONS[conversation.status as keyof typeof STATUS_ICONS];
                      const statusColor = STATUS_COLORS[conversation.status as keyof typeof STATUS_COLORS];
                      
                      return (
                        <div key={conversation.id} className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-medium text-sm">{conversation.contact}</h3>
                            <div className="flex items-center gap-1">
                              <StatusIcon className={`w-3 h-3 ${statusColor}`} />
                              <span className="text-xs text-gray-500">{conversation.time}</span>
                            </div>
                          </div>
                          <p className="text-xs text-gray-600 mb-1">
                            {conversation.lastMessage}
                          </p>
                          <Badge variant="outline" className="text-xs">
                            {conversation.caseName}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Nova Mensagem</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        Destinatário
                      </label>
                      <Input placeholder="Número do WhatsApp" className="mt-1" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        Template
                      </label>
                      <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Selecionar template" />
                        </SelectTrigger>
                        <SelectContent>
                          {MESSAGE_TEMPLATES.map((template) => (
                            <SelectItem key={template.id} value={template.id}>
                              {template.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Mensagem
                    </label>
                    <Textarea
                      placeholder="Digite sua mensagem..."
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      rows={4}
                      className="mt-1"
                    />
                  </div>
                  
                  <div className="flex justify-end gap-2">
                    <Button variant="outline">
                      Salvar Rascunho
                    </Button>
                    <Button>
                      <Send className="w-4 h-4 mr-2" />
                      Enviar Mensagem
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Templates */}
        <TabsContent value="templates" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Templates de Mensagem</h2>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Novo Template
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {MESSAGE_TEMPLATES.map((template) => (
              <Card key={template.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{template.name}</CardTitle>
                    <Badge variant="outline">{template.category}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                    {template.content}
                  </p>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">
                      {template.usageCount} usos
                    </span>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm">
                        Editar
                      </Button>
                      <Button size="sm">
                        Usar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Broadcast */}
        <TabsContent value="broadcast" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Mensagem em Massa</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Lista de Destinatários
                </label>
                <Select>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Selecionar lista" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all-clients">Todos os Clientes</SelectItem>
                    <SelectItem value="active-cases">Clientes com Casos Ativos</SelectItem>
                    <SelectItem value="pending-payments">Pagamentos Pendentes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Template da Mensagem
                </label>
                <Select>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Escolher template" />
                  </SelectTrigger>
                  <SelectContent>
                    {MESSAGE_TEMPLATES.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-yellow-600" />
                  <span className="text-sm font-medium">
                    Estimativa: 234 destinatários
                  </span>
                </div>
                <span className="text-sm text-gray-600">
                  Custo aproximado: R$ 23,40
                </span>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline">
                  Prévia
                </Button>
                <Button>
                  <Send className="w-4 h-4 mr-2" />
                  Enviar Broadcast
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Configurações */}
        <TabsContent value="settings" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Configurações da API</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Token de Acesso
                  </label>
                  <Input 
                    type="password" 
                    placeholder="Seu token do WhatsApp Business API"
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Número de Telefone
                  </label>
                  <Input 
                    placeholder="+55 11 99999-9999"
                    className="mt-1"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Status da Conexão</h3>
                    <p className="text-sm text-gray-600">
                      API conectada e funcionando
                    </p>
                  </div>
                  <Badge className="bg-green-100 text-green-800">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Conectado
                  </Badge>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Automações</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Auto-resposta</h3>
                    <p className="text-sm text-gray-600">
                      Resposta automática fora do horário
                    </p>
                  </div>
                  <Switch checked={false} onCheckedChange={() => {}} />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Notificações de Prazos</h3>
                    <p className="text-sm text-gray-600">
                      Avisar clientes sobre prazos importantes
                    </p>
                  </div>
                  <Switch checked={true} onCheckedChange={() => {}} />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Confirmação de Audiências</h3>
                    <p className="text-sm text-gray-600">
                      Confirmar audiências automaticamente
                    </p>
                  </div>
                  <Switch checked={true} onCheckedChange={() => {}} />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}