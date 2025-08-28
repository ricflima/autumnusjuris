// src/pages/tasks/TasksList.tsx

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckSquare,
  Plus,
  Search,
  Filter,
  Calendar,
  Clock,
  AlertTriangle,
  User,
  FileText,
  Flag,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

interface Task {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  dueDate: string;
  assignedTo: string;
  caseId?: string;
  caseTitle?: string;
  clientId?: string;
  clientName?: string;
  createdAt: string;
  completedAt?: string;
}

const MOCK_TASKS: Task[] = [
  {
    id: '1',
    title: 'Preparar contestação - Caso Silva',
    description: 'Elaborar contestação do processo trabalhista com prazo para hoje',
    priority: 'urgent',
    status: 'pending',
    dueDate: '2025-08-27T17:00:00Z',
    assignedTo: 'Dr. João Silva',
    caseId: '1',
    caseTitle: 'Processo Trabalhista - Silva vs Empresa XYZ',
    clientId: '1',
    clientName: 'João Silva',
    createdAt: '2025-08-20T10:00:00Z'
  },
  {
    id: '2',
    title: 'Revisão de documentos - Divórcio Santos',
    description: 'Revisar certidões e documentos para processo de divórcio',
    priority: 'high',
    status: 'in_progress',
    dueDate: '2025-08-28T12:00:00Z',
    assignedTo: 'Dra. Maria Santos',
    caseId: '2',
    caseTitle: 'Divórcio Consensual - Maria Santos',
    clientId: '2',
    clientName: 'Maria Santos',
    createdAt: '2025-08-25T14:30:00Z'
  },
  {
    id: '3',
    title: 'Agendar reunião com cliente',
    description: 'Marcar reunião para discussão de estratégia processual',
    priority: 'medium',
    status: 'pending',
    dueDate: '2025-08-30T10:00:00Z',
    assignedTo: 'Dr. João Silva',
    clientId: '3',
    clientName: 'Empresa ABC Ltda',
    createdAt: '2025-08-26T09:15:00Z'
  },
  {
    id: '4',
    title: 'Preparar relatório mensal',
    description: 'Elaborar relatório de atividades do escritório para agosto/2025',
    priority: 'low',
    status: 'pending',
    dueDate: '2025-08-31T23:59:00Z',
    assignedTo: 'Dr. João Silva',
    createdAt: '2025-08-26T16:00:00Z'
  },
  {
    id: '5',
    title: 'Arquivo de processo concluído',
    description: 'Organizar e arquivar documentos do processo finalizado',
    priority: 'medium',
    status: 'completed',
    dueDate: '2025-08-25T15:00:00Z',
    assignedTo: 'Dra. Maria Santos',
    caseId: '4',
    caseTitle: 'Revisão de Contrato - Empresa ABC',
    createdAt: '2025-08-20T11:30:00Z',
    completedAt: '2025-08-25T14:45:00Z'
  }
];

export default function TasksList() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');

  const filteredTasks = MOCK_TASKS.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || task.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || task.priority === filterPriority;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const stats = {
    total: MOCK_TASKS.length,
    pending: MOCK_TASKS.filter(t => t.status === 'pending').length,
    inProgress: MOCK_TASKS.filter(t => t.status === 'in_progress').length,
    completed: MOCK_TASKS.filter(t => t.status === 'completed').length,
    overdue: MOCK_TASKS.filter(t => t.status !== 'completed' && new Date(t.dueDate) < new Date()).length
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-blue-100 text-blue-800';
      case 'low': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'pending': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'Urgente';
      case 'high': return 'Alta';
      case 'medium': return 'Média';
      case 'low': return 'Baixa';
      default: return priority;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendente';
      case 'in_progress': return 'Em Andamento';
      case 'completed': return 'Concluída';
      case 'cancelled': return 'Cancelada';
      default: return status;
    }
  };

  const isOverdue = (dueDate: string, status: string) => {
    return status !== 'completed' && new Date(dueDate) < new Date();
  };

  const handleTaskToggle = (taskId: string) => {
    toast.success('Status da tarefa atualizado!');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-blue-100 rounded-lg">
            <CheckSquare className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Tarefas</h1>
            <p className="text-gray-600">Gerencie suas atividades e prazos</p>
          </div>
        </div>

        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Nova Tarefa
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <CheckSquare className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pendentes</p>
                <p className="text-2xl font-bold text-blue-600">{stats.pending}</p>
              </div>
              <Clock className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Em Andamento</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.inProgress}</p>
              </div>
              <Flag className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Concluídas</p>
                <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
              </div>
              <CheckSquare className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Vencidas</p>
                <p className="text-2xl font-bold text-red-600">{stats.overdue}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar tarefas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex gap-2">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="all">Todos os status</option>
                <option value="pending">Pendente</option>
                <option value="in_progress">Em Andamento</option>
                <option value="completed">Concluída</option>
                <option value="cancelled">Cancelada</option>
              </select>
              
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="all">Todas as prioridades</option>
                <option value="urgent">Urgente</option>
                <option value="high">Alta</option>
                <option value="medium">Média</option>
                <option value="low">Baixa</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tasks List */}
      <Card>
        <CardContent className="p-0">
          <div className="space-y-0">
            {filteredTasks.length === 0 ? (
              <div className="text-center py-12">
                <CheckSquare className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Nenhuma tarefa encontrada
                </h3>
                <p className="text-gray-600 mb-6">
                  {searchTerm || filterStatus !== 'all' || filterPriority !== 'all'
                    ? 'Tente ajustar os filtros de busca.'
                    : 'Crie sua primeira tarefa para começar.'
                  }
                </p>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Tarefa
                </Button>
              </div>
            ) : (
              filteredTasks.map((task, index) => (
                <div
                  key={task.id}
                  className={`flex items-start gap-4 p-6 hover:bg-gray-50 transition-colors ${
                    index !== filteredTasks.length - 1 ? 'border-b border-gray-200' : ''
                  } ${isOverdue(task.dueDate, task.status) ? 'bg-red-50 border-l-4 border-l-red-500' : ''}`}
                >
                  <div className="flex-shrink-0 pt-1">
                    <Checkbox
                      checked={task.status === 'completed'}
                      onCheckedChange={() => handleTaskToggle(task.id)}
                    />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className={`text-lg font-medium ${
                          task.status === 'completed' 
                            ? 'text-gray-500 line-through' 
                            : 'text-gray-900'
                        }`}>
                          {task.title}
                        </h3>
                        
                        <p className={`text-sm mt-1 ${
                          task.status === 'completed' 
                            ? 'text-gray-400' 
                            : 'text-gray-600'
                        }`}>
                          {task.description}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-2 ml-4">
                        <Badge className={getPriorityColor(task.priority)}>
                          {getPriorityLabel(task.priority)}
                        </Badge>
                        <Badge className={getStatusColor(task.status)}>
                          {getStatusLabel(task.status)}
                        </Badge>
                        {isOverdue(task.dueDate, task.status) && (
                          <Badge className="bg-red-100 text-red-800">
                            Vencida
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-6 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>Prazo: {formatDate(task.dueDate)}</span>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        <span>{task.assignedTo}</span>
                      </div>
                      
                      {task.caseTitle && (
                        <div className="flex items-center gap-1">
                          <FileText className="w-4 h-4" />
                          <Link 
                            to={`/cases/${task.caseId}`}
                            className="text-blue-600 hover:underline"
                          >
                            {task.caseTitle}
                          </Link>
                        </div>
                      )}
                      
                      {task.clientName && (
                        <div className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          <Link
                            to={`/clients/${task.clientId}`}
                            className="text-blue-600 hover:underline"
                          >
                            {task.clientName}
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm">
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Edit className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}