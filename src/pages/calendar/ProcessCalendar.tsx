// src/pages/calendar/ProcessCalendar.tsx

import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  AlertTriangle, 
  Gavel,
  Plus,
  Filter,
  Eye,
  X,
  Save,
  MapPin,
  Users
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { processesService } from '@/services/processes.service';
import { ProcessDeadline, ProcessHearing, PRIORITY_COLORS, DEADLINE_TYPE_LABELS } from '@/types/processes';
import { formatDate, formatTime } from '@/lib/utils';
import toast from 'react-hot-toast';

interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  time?: string;
  type: 'deadline' | 'hearing';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: string;
  processId: string;
  processTitle: string;
  isOverdue?: boolean;
}

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export default function ProcessCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [viewType, setViewType] = useState<'month' | 'week' | 'day'>('month');
  const [showFilters, setShowFilters] = useState(false);
  const [showNewEventModal, setShowNewEventModal] = useState(false);
  const [filters, setFilters] = useState({
    showDeadlines: true,
    showHearings: true,
    showOverdue: true,
    priorities: ['low', 'medium', 'high', 'urgent']
  });
  const [newEvent, setNewEvent] = useState({
    type: 'hearing' as 'hearing' | 'deadline',
    title: '',
    description: '',
    date: '',
    time: '',
    location: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    processId: '',
    participants: ''
  });
  
  const queryClient = useQueryClient();

  // Query para buscar prazos próximos (próximos 60 dias)
  const { data: upcomingDeadlines } = useQuery({
    queryKey: ['upcoming-deadlines'],
    queryFn: () => processesService.getUpcomingDeadlines(60),
  });

  // Query para buscar prazos vencidos
  const { data: overdueDeadlines } = useQuery({
    queryKey: ['overdue-deadlines'],
    queryFn: () => processesService.getOverdueDeadlines(),
  });

  // Query para buscar audiências (simulado - usaremos dados mock)
  const mockHearings: ProcessHearing[] = [
    {
      id: '1',
      processId: '1',
      title: 'Audiência de Instrução e Julgamento',
      date: '2025-07-15',
      time: '14:00',
      location: '1ª Vara Cível - Sala 1',
      type: 'instruction',
      status: 'scheduled',
      participants: [],
      createdAt: '2025-06-01T10:00:00Z',
      updatedAt: '2025-06-01T10:00:00Z'
    },
    {
      id: '2',
      processId: '3',
      title: 'Audiência de Conciliação',
      date: '2025-08-10',
      time: '09:30',
      location: '1ª Vara do Trabalho - Sala 3',
      type: 'conciliation',
      status: 'scheduled',
      participants: [],
      createdAt: '2025-07-05T10:00:00Z',
      updatedAt: '2025-07-05T10:00:00Z'
    },
    {
      id: '3',
      processId: '2',
      title: 'Audiência de Julgamento',
      date: '2025-08-22',
      time: '10:00',
      location: '2ª Vara de Família - Sala 2',
      type: 'instruction',
      status: 'scheduled',
      participants: [],
      createdAt: '2025-07-10T10:00:00Z',
      updatedAt: '2025-07-10T10:00:00Z'
    },
    {
      id: '4',
      processId: '1',
      title: 'Perícia Técnica',
      date: '2025-09-05',
      time: '15:00',
      location: 'Escritório Pericial - Centro',
      type: 'other',
      status: 'scheduled',
      participants: [],
      createdAt: '2025-08-01T10:00:00Z',
      updatedAt: '2025-08-01T10:00:00Z'
    }
  ];

  // Combinar todos os eventos
  const calendarEvents: CalendarEvent[] = useMemo(() => {
    const events: CalendarEvent[] = [];
    const now = new Date();

    // Adicionar prazos próximos
    if (filters.showDeadlines && upcomingDeadlines) {
      upcomingDeadlines.forEach(deadline => {
        if (filters.priorities.includes(deadline.priority)) {
          events.push({
            id: `deadline-${deadline.id}`,
            title: deadline.title,
            date: deadline.dueDate.split('T')[0],
            type: 'deadline',
            priority: deadline.priority,
            status: deadline.status,
            processId: deadline.processId,
            processTitle: `Processo ${deadline.processId}`, // Em produção, buscar título real
          });
        }
      });
    }

    // Adicionar prazos vencidos
    if (filters.showOverdue && overdueDeadlines) {
      overdueDeadlines.forEach(deadline => {
        if (filters.priorities.includes(deadline.priority)) {
          events.push({
            id: `overdue-${deadline.id}`,
            title: deadline.title,
            date: deadline.dueDate.split('T')[0],
            type: 'deadline',
            priority: deadline.priority,
            status: deadline.status,
            processId: deadline.processId,
            processTitle: `Processo ${deadline.processId}`,
            isOverdue: true,
          });
        }
      });
    }

    // Adicionar audiências
    if (filters.showHearings) {
      mockHearings.forEach(hearing => {
        events.push({
          id: `hearing-${hearing.id}`,
          title: hearing.title,
          date: hearing.date,
          time: hearing.time,
          type: 'hearing',
          priority: 'medium', // Audiências sempre média prioridade por padrão
          status: hearing.status,
          processId: hearing.processId,
          processTitle: `Processo ${hearing.processId}`,
        });
      });
    }

    return events;
  }, [upcomingDeadlines, overdueDeadlines, filters]);

  // Eventos do mês atual
  const currentMonthEvents = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    return calendarEvents.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate.getFullYear() === year && eventDate.getMonth() === month;
    });
  }, [calendarEvents, currentDate]);

  // Eventos do dia selecionado
  const selectedDateEvents = useMemo(() => {
    if (!selectedDate) return [];
    
    const dateStr = selectedDate.toISOString().split('T')[0];
    return calendarEvents.filter(event => event.date === dateStr);
  }, [calendarEvents, selectedDate]);

  // Gerar dias do calendário
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const firstCalendarDay = new Date(firstDay);
    firstCalendarDay.setDate(firstCalendarDay.getDate() - firstDay.getDay());
    
    const days = [];
    const currentDay = new Date(firstCalendarDay);
    
    for (let i = 0; i < 42; i++) { // 6 semanas × 7 dias
      const dayEvents = calendarEvents.filter(event => 
        event.date === currentDay.toISOString().split('T')[0]
      );
      
      days.push({
        date: new Date(currentDay),
        isCurrentMonth: currentDay.getMonth() === month,
        isToday: currentDay.toDateString() === new Date().toDateString(),
        events: dayEvents
      });
      
      currentDay.setDate(currentDay.getDate() + 1);
    }
    
    return days;
  }, [currentDate, calendarEvents]);

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
      return newDate;
    });
  };

  const getEventColor = (event: CalendarEvent) => {
    if (event.isOverdue) {
      return 'bg-red-100 text-red-800 border-red-200';
    }
    
    if (event.type === 'deadline') {
      return PRIORITY_COLORS[event.priority];
    }
    
    return 'bg-blue-100 text-blue-800 border-blue-200';
  };

  const getEventIcon = (event: CalendarEvent) => {
    return event.type === 'deadline' ? Clock : Calendar;
  };

  // Mutation para criar novo evento
  const createEventMutation = useMutation({
    mutationFn: async (eventData: typeof newEvent) => {
      // Simular criação de evento
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (eventData.type === 'hearing') {
        const newHearing = {
          id: Date.now().toString(),
          processId: eventData.processId || '1',
          title: eventData.title,
          description: eventData.description,
          date: eventData.date,
          time: eventData.time,
          location: eventData.location,
          type: 'instruction' as const,
          status: 'scheduled' as const,
          participants: eventData.participants.split(',').map(p => p.trim()).filter(Boolean),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        return newHearing;
      } else {
        const newDeadline = {
          id: Date.now().toString(),
          processId: eventData.processId || '1',
          type: 'other' as const,
          title: eventData.title,
          description: eventData.description,
          dueDate: `${eventData.date}T${eventData.time || '23:59'}:00Z`,
          status: 'pending' as const,
          priority: eventData.priority,
          isRecurring: false,
          attachments: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        return newDeadline;
      }
    },
    onSuccess: () => {
      toast.success('Evento criado com sucesso!');
      setShowNewEventModal(false);
      setNewEvent({
        type: 'hearing',
        title: '',
        description: '',
        date: '',
        time: '',
        location: '',
        priority: 'medium',
        processId: '',
        participants: ''
      });
      queryClient.invalidateQueries({ queryKey: ['upcoming-deadlines'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao criar evento');
    }
  });

  const handleCreateEvent = () => {
    if (!newEvent.title.trim()) {
      toast.error('Título é obrigatório');
      return;
    }
    if (!newEvent.date) {
      toast.error('Data é obrigatória');
      return;
    }
    
    createEventMutation.mutate(newEvent);
  };

  // Função para obter eventos da semana atual
  const getCurrentWeekEvents = () => {
    const weekStart = new Date(currentDate);
    weekStart.setDate(currentDate.getDate() - currentDate.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    
    return calendarEvents.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate >= weekStart && eventDate <= weekEnd;
    });
  };

  // Função para obter dias da semana
  const getWeekDays = () => {
    const weekStart = new Date(currentDate);
    weekStart.setDate(currentDate.getDate() - currentDate.getDay());
    
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(weekStart);
      day.setDate(weekStart.getDate() + i);
      days.push(day);
    }
    return days;
  };

  // Função para obter eventos do dia atual
  const getCurrentDayEvents = () => {
    const dateStr = currentDate.toISOString().split('T')[0];
    return calendarEvents.filter(event => event.date === dateStr);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Calendar className="h-8 w-8 text-blue-600" />
                Calendário Processual
              </h1>
              <p className="mt-1 text-gray-600">
                Acompanhe prazos, audiências e compromissos
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                Filtros
              </Button>
              
              <div className="flex items-center border border-gray-300 rounded-md">
                {(['month', 'week', 'day'] as const).map(type => (
                  <Button
                    key={type}
                    variant={viewType === type ? "default" : "outline"}
                    size="sm"
                    onClick={() => setViewType(type)}
                    className="border-0 rounded-none first:rounded-l-md last:rounded-r-md"
                  >
                    {type === 'month' ? 'Mês' : type === 'week' ? 'Semana' : 'Dia'}
                  </Button>
                ))}
              </div>
              
              <Button 
                className="flex items-center gap-2" 
                onClick={() => {
                  setShowNewEventModal(true);
                  if (selectedDate) {
                    setNewEvent(prev => ({
                      ...prev,
                      date: selectedDate.toISOString().split('T')[0]
                    }));
                  }
                }}
              >
                <Plus className="h-4 w-4" />
                Novo Evento
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Filtros */}
        {showFilters && (
          <Card className="mb-6 p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipos de Evento
                </label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={filters.showDeadlines}
                      onChange={(e) => setFilters(prev => ({ 
                        ...prev, 
                        showDeadlines: e.target.checked 
                      }))}
                    />
                    <span className="text-sm">Prazos</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={filters.showHearings}
                      onChange={(e) => setFilters(prev => ({ 
                        ...prev, 
                        showHearings: e.target.checked 
                      }))}
                    />
                    <span className="text-sm">Audiências</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={filters.showOverdue}
                      onChange={(e) => setFilters(prev => ({ 
                        ...prev, 
                        showOverdue: e.target.checked 
                      }))}
                    />
                    <span className="text-sm">Prazos Vencidos</span>
                  </label>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prioridades
                </label>
                <div className="space-y-2">
                  {[
                    { value: 'urgent', label: 'Urgente', color: 'text-red-600' },
                    { value: 'high', label: 'Alta', color: 'text-orange-600' },
                    { value: 'medium', label: 'Média', color: 'text-blue-600' },
                    { value: 'low', label: 'Baixa', color: 'text-gray-600' }
                  ].map(priority => (
                    <label key={priority.value} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={filters.priorities.includes(priority.value)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFilters(prev => ({ 
                              ...prev, 
                              priorities: [...prev.priorities, priority.value] 
                            }));
                          } else {
                            setFilters(prev => ({ 
                              ...prev, 
                              priorities: prev.priorities.filter(p => p !== priority.value) 
                            }));
                          }
                        }}
                      />
                      <span className={`text-sm ${priority.color}`}>
                        {priority.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
              
              <div className="md:col-span-2 flex items-end">
                <Button
                  variant="outline"
                  onClick={() => setFilters({
                    showDeadlines: true,
                    showHearings: true,
                    showOverdue: true,
                    priorities: ['low', 'medium', 'high', 'urgent']
                  })}
                >
                  Limpar Filtros
                </Button>
              </div>
            </div>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Calendário Principal */}
          <div className="lg:col-span-3">
            <Card>
              {/* Header do Calendário */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">
                    {viewType === 'month' && `${MONTHS[currentDate.getMonth()]} ${currentDate.getFullYear()}`}
                    {viewType === 'week' && `Semana de ${formatDate(getWeekDays()[0].toISOString())} - ${formatDate(getWeekDays()[6].toISOString())}`}
                    {viewType === 'day' && `${formatDate(currentDate.toISOString())}`}
                  </h2>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newDate = new Date(currentDate);
                        if (viewType === 'month') {
                          newDate.setMonth(newDate.getMonth() - 1);
                        } else if (viewType === 'week') {
                          newDate.setDate(newDate.getDate() - 7);
                        } else {
                          newDate.setDate(newDate.getDate() - 1);
                        }
                        setCurrentDate(newDate);
                      }}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentDate(new Date())}
                    >
                      Hoje
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newDate = new Date(currentDate);
                        if (viewType === 'month') {
                          newDate.setMonth(newDate.getMonth() + 1);
                        } else if (viewType === 'week') {
                          newDate.setDate(newDate.getDate() + 7);
                        } else {
                          newDate.setDate(newDate.getDate() + 1);
                        }
                        setCurrentDate(newDate);
                      }}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Conteúdo do Calendário */}
              <div className="p-6">
                {/* Visualização Mensal */}
                {viewType === 'month' && (
                  <>
                    {/* Cabeçalho dos dias da semana */}
                    <div className="grid grid-cols-7 gap-1 mb-2">
                      {WEEKDAYS.map(day => (
                        <div key={day} className="p-2 text-center text-sm font-medium text-gray-600">
                          {day}
                        </div>
                      ))}
                    </div>
                    
                    {/* Dias do calendário */}
                    <div className="grid grid-cols-7 gap-1">
                      {calendarDays.map((day, index) => (
                        <div
                          key={index}
                          className={`min-h-[120px] p-2 border border-gray-200 rounded-md cursor-pointer transition-colors ${
                            day.isCurrentMonth 
                              ? 'bg-white hover:bg-gray-50' 
                              : 'bg-gray-50 text-gray-400'
                          } ${
                            day.isToday ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                          } ${
                            selectedDate && day.date.toDateString() === selectedDate.toDateString()
                              ? 'bg-blue-100 border-blue-500'
                              : ''
                          }`}
                          onClick={() => setSelectedDate(day.date)}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className={`text-sm font-medium ${
                              day.isToday ? 'text-blue-600' : ''
                            }`}>
                              {day.date.getDate()}
                            </span>
                            
                            {day.events.length > 0 && (
                              <Badge className="bg-gray-100 text-gray-800 text-xs">
                                {day.events.length}
                              </Badge>
                            )}
                          </div>
                          
                          {/* Eventos do dia */}
                          <div className="space-y-1">
                            {day.events.slice(0, 3).map(event => {
                              const Icon = getEventIcon(event);
                              return (
                                <div
                                  key={event.id}
                                  className={`p-1 rounded text-xs flex items-center gap-1 ${getEventColor(event)}`}
                                  title={`${event.title} - ${event.processTitle}`}
                                >
                                  <Icon className="h-3 w-3 flex-shrink-0" />
                                  <span className="truncate">
                                    {event.time && `${event.time} `}
                                    {event.title}
                                  </span>
                                </div>
                              );
                            })}
                            
                            {day.events.length > 3 && (
                              <div className="text-xs text-gray-500 text-center">
                                +{day.events.length - 3} mais
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {/* Visualização Semanal */}
                {viewType === 'week' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-7 gap-2">
                      {getWeekDays().map((day, index) => {
                        const dayEvents = calendarEvents.filter(event => 
                          event.date === day.toISOString().split('T')[0]
                        );
                        const isToday = day.toDateString() === new Date().toDateString();
                        
                        return (
                          <div
                            key={index}
                            className={`min-h-[300px] p-3 border border-gray-200 rounded-lg cursor-pointer ${
                              isToday ? 'ring-2 ring-blue-500 bg-blue-50' : 'bg-white hover:bg-gray-50'
                            }`}
                            onClick={() => setSelectedDate(day)}
                          >
                            <div className="text-center mb-3">
                              <div className="text-xs text-gray-500 uppercase">
                                {WEEKDAYS[day.getDay()]}
                              </div>
                              <div className={`text-lg font-semibold ${isToday ? 'text-blue-600' : ''}`}>
                                {day.getDate()}
                              </div>
                            </div>
                            
                            <div className="space-y-2">
                              {dayEvents.map(event => {
                                const Icon = getEventIcon(event);
                                return (
                                  <div
                                    key={event.id}
                                    className={`p-2 rounded text-xs ${getEventColor(event)}`}
                                    title={event.title}
                                  >
                                    <div className="flex items-center gap-1 mb-1">
                                      <Icon className="h-3 w-3 flex-shrink-0" />
                                      {event.time && (
                                        <span className="font-medium">{event.time}</span>
                                      )}
                                    </div>
                                    <div className="font-medium">{event.title}</div>
                                  </div>
                                );
                              })}
                              
                              {dayEvents.length === 0 && (
                                <div className="text-xs text-gray-400 text-center py-4">
                                  Sem eventos
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Visualização Diária */}
                {viewType === 'day' && (
                  <div className="space-y-4">
                    <div className="bg-white border border-gray-200 rounded-lg">
                      <div className="p-4 border-b border-gray-200 bg-gray-50">
                        <h3 className="font-semibold text-lg">
                          {currentDate.toLocaleDateString('pt-BR', { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}
                        </h3>
                      </div>
                      
                      <div className="p-4">
                        {getCurrentDayEvents().length > 0 ? (
                          <div className="space-y-3">
                            {getCurrentDayEvents()
                              .sort((a, b) => (a.time || '00:00').localeCompare(b.time || '00:00'))
                              .map(event => {
                                const Icon = getEventIcon(event);
                                return (
                                  <div
                                    key={event.id}
                                    className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                                  >
                                    <div className="flex-shrink-0 mt-1">
                                      <Icon className="h-5 w-5 text-gray-600" />
                                    </div>
                                    
                                    <div className="flex-1">
                                      <div className="flex items-start justify-between">
                                        <div>
                                          <h4 className="font-medium text-gray-900">{event.title}</h4>
                                          <p className="text-sm text-gray-600 mt-1">{event.processTitle}</p>
                                        </div>
                                        
                                        <div className="text-right">
                                          <div className="text-sm font-medium text-gray-900">
                                            {event.time || 'Dia todo'}
                                          </div>
                                          <Badge className={`${getEventColor(event)} mt-1`}>
                                            {event.type === 'deadline' ? 'Prazo' : 'Audiência'}
                                          </Badge>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                          </div>
                        ) : (
                          <div className="text-center py-12">
                            <Calendar className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                              Nenhum evento hoje
                            </h3>
                            <p className="text-gray-600">
                              Clique em "Novo Evento" para adicionar um compromisso.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Sidebar - Resumo e Detalhes */}
          <div className="space-y-6">
            {/* Estatísticas Rápidas */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Resumo do Mês
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-blue-600" />
                    <span className="text-sm text-gray-600">Prazos</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {currentMonthEvents.filter(e => e.type === 'deadline').length}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-gray-600">Audiências</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {currentMonthEvents.filter(e => e.type === 'hearing').length}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <span className="text-sm text-gray-600">Vencidos</span>
                  </div>
                  <span className="text-sm font-medium text-red-600">
                    {currentMonthEvents.filter(e => e.isOverdue).length}
                  </span>
                </div>
              </div>
            </Card>

            {/* Eventos do Dia Selecionado */}
            {selectedDate && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {formatDate(selectedDate.toISOString())}
                </h3>
                
                {selectedDateEvents.length > 0 ? (
                  <div className="space-y-3">
                    {selectedDateEvents.map(event => {
                      const Icon = getEventIcon(event);
                      return (
                        <div
                          key={event.id}
                          className="p-3 border border-gray-200 rounded-md hover:bg-gray-50"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Icon className="h-4 w-4 text-gray-600" />
                              <span className="font-medium text-gray-900">
                                {event.title}
                              </span>
                            </div>
                            
                            <Button variant="outline" size="sm" onClick={() => {
                              // TODO: Implementar visualização detalhada do evento
                              alert(`Detalhes do evento: ${event.title}`);
                            }}>
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                          
                          <div className="text-sm text-gray-600">
                            {event.time && (
                              <p>Horário: {event.time}</p>
                            )}
                            <p>Processo: {event.processTitle}</p>
                            <p>Tipo: {event.type === 'deadline' ? 'Prazo' : 'Audiência'}</p>
                          </div>
                          
                          <div className="mt-2">
                            <Badge className={getEventColor(event)}>
                              {event.type === 'deadline' 
                                ? (event.isOverdue ? 'Vencido' : 'Pendente')
                                : 'Agendada'
                              }
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-gray-600 text-sm text-center py-4">
                    Nenhum evento nesta data
                  </p>
                )}
              </Card>
            )}

            {/* Próximos Prazos Urgentes */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                Prazos Urgentes
              </h3>
              
              {upcomingDeadlines && upcomingDeadlines.filter(d => d.priority === 'urgent').length > 0 ? (
                <div className="space-y-3">
                  {upcomingDeadlines
                    .filter(d => d.priority === 'urgent')
                    .slice(0, 5)
                    .map(deadline => (
                      <div key={deadline.id} className="p-3 bg-red-50 border border-red-200 rounded-md">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-red-900 text-sm">
                            {deadline.title}
                          </span>
                          <Badge className="bg-red-100 text-red-800 text-xs">
                            Urgente
                          </Badge>
                        </div>
                        <p className="text-xs text-red-700">
                          Vence em {formatDate(deadline.dueDate)}
                        </p>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-gray-600 text-sm text-center py-4">
                  Nenhum prazo urgente
                </p>
              )}
            </Card>
          </div>
        </div>
      </div>

      {/* Modal Novo Evento */}
      <Dialog open={showNewEventModal} onOpenChange={setShowNewEventModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Novo Evento
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de Evento
              </label>
              <Select
                value={newEvent.type}
                onValueChange={(value: 'hearing' | 'deadline') => 
                  setNewEvent(prev => ({ ...prev, type: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hearing">Audiência</SelectItem>
                  <SelectItem value="deadline">Prazo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Título *
              </label>
              <Input
                placeholder="Ex: Audiência de Instrução"
                value={newEvent.title}
                onChange={(e) => setNewEvent(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descrição
              </label>
              <Textarea
                placeholder="Detalhes do evento..."
                rows={3}
                value={newEvent.description}
                onChange={(e) => setNewEvent(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data *
                </label>
                <Input
                  type="date"
                  value={newEvent.date}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, date: e.target.value }))}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Horário
                </label>
                <Input
                  type="time"
                  value={newEvent.time}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, time: e.target.value }))}
                />
              </div>
            </div>

            {newEvent.type === 'hearing' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Local
                </label>
                <Input
                  placeholder="Ex: 1ª Vara Cível - Sala 1"
                  value={newEvent.location}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, location: e.target.value }))}
                />
              </div>
            )}

            {newEvent.type === 'deadline' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prioridade
                </label>
                <Select
                  value={newEvent.priority}
                  onValueChange={(value: 'low' | 'medium' | 'high' | 'urgent') => 
                    setNewEvent(prev => ({ ...prev, priority: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Baixa</SelectItem>
                    <SelectItem value="medium">Média</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                    <SelectItem value="urgent">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Processo (ID)
              </label>
              <Input
                placeholder="Ex: 1, 2, 3..."
                value={newEvent.processId}
                onChange={(e) => setNewEvent(prev => ({ ...prev, processId: e.target.value }))}
              />
            </div>

            {newEvent.type === 'hearing' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Participantes
                </label>
                <Input
                  placeholder="Separados por vírgula"
                  value={newEvent.participants}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, participants: e.target.value }))}
                />
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button 
              variant="outline" 
              onClick={() => setShowNewEventModal(false)}
              disabled={createEventMutation.isPending}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleCreateEvent}
              disabled={createEventMutation.isPending}
              className="flex items-center gap-2"
            >
              {createEventMutation.isPending ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Salvar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}