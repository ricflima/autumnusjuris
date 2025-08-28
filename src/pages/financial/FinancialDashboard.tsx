// src/pages/financial/FinancialDashboard.tsx

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Clock,
  CreditCard,
  Receipt,
  PieChart,
  Calendar,
  Plus,
  ArrowUp,
  ArrowDown,
  Eye,
  Download,
  Filter,
  FileText,
  Building
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { 
  useFinancialDashboard,
  useOverdueInvoices,
  usePendingReceivables,
  useFinancialFormatters,
  useFinancialStats
} from '@/hooks/useFinancial';

import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { EmptyState } from '@/components/common/EmptyState';

const FinancialDashboard: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<'month' | 'quarter' | 'year'>('month');
  
  const { summary, cashFlow, recentTransactions, isLoading, error } = useFinancialDashboard();
  const overdueInvoices = useOverdueInvoices();
  const pendingReceivables = usePendingReceivables();
  const financialStats = useFinancialStats();
  const { formatCurrency, formatPercentage, formatDateRelative, getStatusColor } = useFinancialFormatters();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        title="Erro ao carregar dados"
        description="Não foi possível carregar os dados financeiros. Tente novamente."
        action={
          <Button onClick={() => window.location.reload()}>
            Tentar novamente
          </Button>
        }
      />
    );
  }

  const summaryData = summary.data;
  const cashFlowData = cashFlow.data;
  const monthStats = financialStats.month.data;
  const yearStats = financialStats.year.data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Financeiro</h1>
          <p className="text-gray-600">Visão geral das finanças do escritório</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => {
            alert('Funcionalidade de filtros será implementada em breve!');
          }}>
            <Filter className="w-4 h-4 mr-2" />
            Filtros
          </Button>
          <Button variant="outline" size="sm" onClick={() => {
            alert('Exportação de relatórios será implementada em breve!');
          }}>
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
          <Link to="/financial/invoices/create">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nova Fatura
            </Button>
          </Link>
        </div>
      </div>

      {/* Alertas importantes */}
      {overdueInvoices.data && overdueInvoices.data.invoices.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <div className="flex-1">
                <p className="font-medium text-red-800">
                  {overdueInvoices.data.invoices.length} fatura(s) em atraso
                </p>
                <p className="text-sm text-red-600">
                  Total de {formatCurrency(overdueInvoices.data.invoices.reduce((sum, inv) => sum + inv.remainingAmount, 0))} em recebíveis vencidos
                </p>
              </div>
              <Link to="/financial/invoices?status=overdue">
                <Button variant="outline" size="sm">
                  <Eye className="w-4 h-4 mr-2" />
                  Ver Faturas
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cards de resumo */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita do Mês</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(monthStats?.totalReceived || 0)}
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              {monthStats?.growthRate.income && monthStats.growthRate.income > 0 ? (
                <>
                  <ArrowUp className="h-3 w-3 text-green-600" />
                  <span className="text-green-600">
                    +{formatPercentage(monthStats.growthRate.income)}
                  </span>
                </>
              ) : (
                <>
                  <ArrowDown className="h-3 w-3 text-red-600" />
                  <span className="text-red-600">
                    {formatPercentage(monthStats?.growthRate.income || 0)}
                  </span>
                </>
              )}
              em relação ao mês anterior
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Despesas do Mês</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(monthStats?.totalExpenses || 0)}
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              {monthStats?.growthRate.expenses && monthStats.growthRate.expenses > 0 ? (
                <>
                  <ArrowUp className="h-3 w-3 text-red-600" />
                  <span className="text-red-600">
                    +{formatPercentage(monthStats.growthRate.expenses)}
                  </span>
                </>
              ) : (
                <>
                  <ArrowDown className="h-3 w-3 text-green-600" />
                  <span className="text-green-600">
                    {formatPercentage(Math.abs(monthStats?.growthRate.expenses || 0))}
                  </span>
                </>
              )}
              em relação ao mês anterior
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lucro Líquido</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(monthStats?.netIncome || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Margem: {formatPercentage(monthStats?.profitMargin || 0)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">A Receber</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(summaryData?.pendingReceivables || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {summaryData?.invoicesCount.pending || 0} fatura(s) pendente(s)
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Conteúdo em abas */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="invoices">Faturas</TabsTrigger>
          <TabsTrigger value="expenses">Despesas</TabsTrigger>
          <TabsTrigger value="cashflow">Fluxo de Caixa</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Gráfico de receitas vs despesas */}
            <Card>
              <CardHeader>
                <CardTitle>Receitas vs Despesas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Receitas</span>
                      <span className="text-sm text-muted-foreground">
                        {formatCurrency(summaryData?.totalReceived || 0)}
                      </span>
                    </div>
                    <Progress 
                      value={75} 
                      className="h-2"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Despesas</span>
                      <span className="text-sm text-muted-foreground">
                        {formatCurrency(summaryData?.totalExpenses || 0)}
                      </span>
                    </div>
                    <Progress 
                      value={45} 
                      className="h-2"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Status das faturas */}
            <Card>
              <CardHeader>
                <CardTitle>Status das Faturas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-sm">Pagas</span>
                    </div>
                    <span className="text-sm font-medium">
                      {summaryData?.invoicesCount.paid || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <span className="text-sm">Pendentes</span>
                    </div>
                    <span className="text-sm font-medium">
                      {summaryData?.invoicesCount.pending || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <span className="text-sm">Vencidas</span>
                    </div>
                    <span className="text-sm font-medium">
                      {summaryData?.invoicesCount.overdue || 0}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Transações recentes */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Transações Recentes</CardTitle>
              <Link to="/financial/transactions">
                <Button variant="outline" size="sm">
                  Ver Todas
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {recentTransactions.data && recentTransactions.data.length > 0 ? (
                <div className="space-y-4">
                  {recentTransactions.data.slice(0, 5).map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${
                          transaction.type === 'income' 
                            ? 'bg-green-100 text-green-600' 
                            : 'bg-red-100 text-red-600'
                        }`}>
                          {transaction.type === 'income' ? (
                            <ArrowUp className="w-4 h-4" />
                          ) : (
                            <ArrowDown className="w-4 h-4" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{transaction.description}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatDateRelative(transaction.date)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-medium ${
                          transaction.type === 'income' 
                            ? 'text-green-600' 
                            : 'text-red-600'
                        }`}>
                          {transaction.type === 'income' ? '+' : '-'}
                          {formatCurrency(transaction.amount)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {transaction.category}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="Nenhuma transação"
                  description="Não há transações recentes para exibir"
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoices">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Faturas vencidas */}
            <Card>
              <CardHeader>
                <CardTitle className="text-red-600">Faturas Vencidas</CardTitle>
              </CardHeader>
              <CardContent>
                {overdueInvoices.data?.invoices && overdueInvoices.data.invoices.length > 0 ? (
                  <div className="space-y-3">
                    {overdueInvoices.data.invoices.slice(0, 5).map((invoice) => (
                      <div key={invoice.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                        <div>
                          <p className="font-medium">{invoice.client.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {invoice.invoiceNumber} • Venceu há {invoice.daysOverdue} dias
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-red-600">
                            {formatCurrency(invoice.remainingAmount)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    title="Nenhuma fatura vencida"
                    description="Todas as faturas estão em dia!"
                  />
                )}
              </CardContent>
            </Card>

            {/* Receitas pendentes */}
            <Card>
              <CardHeader>
                <CardTitle>Receitas Pendentes</CardTitle>
              </CardHeader>
              <CardContent>
                {pendingReceivables.data?.invoices && pendingReceivables.data.invoices.length > 0 ? (
                  <div className="space-y-3">
                    {pendingReceivables.data.invoices.slice(0, 5).map((invoice) => (
                      <div key={invoice.id} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                        <div>
                          <p className="font-medium">{invoice.client.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {invoice.invoiceNumber} • Vence em {formatDateRelative(invoice.dueDate)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">
                            {formatCurrency(invoice.remainingAmount)}
                          </p>
                          <Badge className={getStatusColor(invoice.status)}>
                            {invoice.status === 'sent' ? 'Enviada' : 'Parcial'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    title="Nenhuma receita pendente"
                    description="Todas as faturas foram pagas"
                  />
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="expenses">
          <div className="space-y-6">
            {/* Resumo das despesas */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Total do Mês</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">
                    {formatCurrency(monthStats?.totalExpenses || 2450)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Agosto 2025
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Despesas Pendentes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-600">
                    {formatCurrency(450)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    2 despesas
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Maior Categoria</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-lg font-bold text-gray-900">
                    Aluguel
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatCurrency(3500)}
                  </p>
                </CardContent>
              </Card>
            </div>
            
            {/* Lista de despesas recentes */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Despesas Recentes</CardTitle>
                <Link to="/financial/expenses">
                  <Button variant="outline" size="sm">
                    Ver Todas
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                        <Receipt className="w-5 h-5 text-red-600" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">Custas processuais - Processo Trabalhista</p>
                        <p className="text-xs text-gray-500">15/08/2025 • Transferência bancária</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-red-600">- {formatCurrency(450)}</p>
                      <p className="text-xs text-gray-500">João Silva</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <FileText className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">Material de escritório</p>
                        <p className="text-xs text-gray-500">10/08/2025 • Cartão de crédito</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-red-600">- {formatCurrency(250)}</p>
                      <p className="text-xs text-gray-500">Papelaria Central</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                        <Building className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">Aluguel do escritório</p>
                        <p className="text-xs text-gray-500">25/07/2025 • Transferência bancária</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-red-600">- {formatCurrency(3500)}</p>
                      <p className="text-xs text-gray-500">Recorrente</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Despesas por categoria */}
            <Card>
              <CardHeader>
                <CardTitle>Por Categoria</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Building className="w-4 h-4 text-purple-600" />
                      <span className="text-sm">Aluguel</span>
                    </div>
                    <span className="font-medium">{formatCurrency(3500)}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Receipt className="w-4 h-4 text-red-600" />
                      <span className="text-sm">Custas Processuais</span>
                    </div>
                    <span className="font-medium">{formatCurrency(450)}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-blue-600" />
                      <span className="text-sm">Material de Escritório</span>
                    </div>
                    <span className="font-medium">{formatCurrency(250)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="cashflow">
          <Card>
            <CardHeader>
              <CardTitle>Projeção de Fluxo de Caixa</CardTitle>
            </CardHeader>
            <CardContent>
              {cashFlowData && cashFlowData.length > 0 ? (
                <div className="space-y-4">
                  {cashFlowData.map((projection, index) => (
                    <div key={index} className="grid grid-cols-4 gap-4 p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium">
                          {new Date(projection.date).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Receita Projetada</p>
                        <p className="font-medium text-green-600">
                          {formatCurrency(projection.projectedIncome)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Despesa Projetada</p>
                        <p className="font-medium text-red-600">
                          {formatCurrency(projection.projectedExpenses)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Saldo Projetado</p>
                        <p className="font-medium">
                          {formatCurrency(projection.projectedBalance)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="Dados insuficientes"
                  description="Não há dados suficientes para projeção de fluxo de caixa"
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FinancialDashboard;