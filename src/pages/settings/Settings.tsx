// src/pages/settings/Settings.tsx

import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  User,
  Lock,
  Bell,
  Shield,
  Database,
  Palette,
  Globe,
  Mail,
  Phone,
  Save,
  Eye,
  EyeOff,
  Building,
  CreditCard,
  Users,
  FileText,
  Calendar
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/useAuth';
import toast from 'react-hot-toast';

export default function Settings() {
  const { user } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  
  // Estados para as configurações
  const [generalSettings, setGeneralSettings] = useState({
    companyName: 'Escritório Jurídico Silva & Associados',
    companyEmail: 'contato@silvajuridico.com',
    companyPhone: '(11) 3333-4444',
    companyAddress: 'Rua das Flores, 123 - Centro - São Paulo/SP',
    companyCnpj: '12.345.678/0001-90',
    oabNumber: 'SP 123.456'
  });

  const [userSettings, setUserSettings] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: '(11) 99999-8888',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    deadlineReminders: true,
    hearingReminders: true,
    clientUpdates: true,
    financialAlerts: true,
    systemUpdates: false
  });

  const [systemSettings, setSystemSettings] = useState({
    language: 'pt-BR',
    timezone: 'America/Sao_Paulo',
    dateFormat: 'DD/MM/YYYY',
    currency: 'BRL',
    theme: 'light',
    autoSave: true,
    enableAnalytics: true
  });

  const handleSaveGeneral = () => {
    // Simular salvamento
    toast.success('Configurações gerais salvas com sucesso!');
  };

  const handleSaveUser = () => {
    if (userSettings.newPassword && userSettings.newPassword !== userSettings.confirmPassword) {
      toast.error('As senhas não conferem!');
      return;
    }
    toast.success('Configurações do usuário salvas com sucesso!');
  };

  const handleSaveNotifications = () => {
    toast.success('Configurações de notificações salvas com sucesso!');
  };

  const handleSaveSystem = () => {
    toast.success('Configurações do sistema salvas com sucesso!');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="p-2 bg-blue-100 rounded-lg">
          <SettingsIcon className="h-6 w-6 text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
          <p className="text-gray-600">
            Gerencie as configurações do seu escritório e conta
          </p>
        </div>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            Geral
          </TabsTrigger>
          <TabsTrigger value="account" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Conta
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notificações
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Sistema
          </TabsTrigger>
        </TabsList>

        {/* Configurações Gerais */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Informações do Escritório
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Nome do Escritório
                  </label>
                  <Input
                    value={generalSettings.companyName}
                    onChange={(e) => setGeneralSettings(prev => ({
                      ...prev,
                      companyName: e.target.value
                    }))}
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    CNPJ
                  </label>
                  <Input
                    value={generalSettings.companyCnpj}
                    onChange={(e) => setGeneralSettings(prev => ({
                      ...prev,
                      companyCnpj: e.target.value
                    }))}
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    E-mail Principal
                  </label>
                  <Input
                    type="email"
                    value={generalSettings.companyEmail}
                    onChange={(e) => setGeneralSettings(prev => ({
                      ...prev,
                      companyEmail: e.target.value
                    }))}
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Telefone
                  </label>
                  <Input
                    value={generalSettings.companyPhone}
                    onChange={(e) => setGeneralSettings(prev => ({
                      ...prev,
                      companyPhone: e.target.value
                    }))}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Endereço Completo
                </label>
                <Textarea
                  value={generalSettings.companyAddress}
                  onChange={(e) => setGeneralSettings(prev => ({
                    ...prev,
                    companyAddress: e.target.value
                  }))}
                  rows={3}
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Número da OAB
                </label>
                <Input
                  value={generalSettings.oabNumber}
                  onChange={(e) => setGeneralSettings(prev => ({
                    ...prev,
                    oabNumber: e.target.value
                  }))}
                />
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveGeneral}>
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Configurações
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Configurações da Conta */}
        <TabsContent value="account">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Informações Pessoais
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Nome Completo
                    </label>
                    <Input
                      value={userSettings.name}
                      onChange={(e) => setUserSettings(prev => ({
                        ...prev,
                        name: e.target.value
                      }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      E-mail
                    </label>
                    <Input
                      type="email"
                      value={userSettings.email}
                      onChange={(e) => setUserSettings(prev => ({
                        ...prev,
                        email: e.target.value
                      }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Telefone
                    </label>
                    <Input
                      value={userSettings.phone}
                      onChange={(e) => setUserSettings(prev => ({
                        ...prev,
                        phone: e.target.value
                      }))}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Segurança
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Senha Atual
                  </label>
                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      value={userSettings.currentPassword}
                      onChange={(e) => setUserSettings(prev => ({
                        ...prev,
                        currentPassword: e.target.value
                      }))}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 transform -translate-y-1/2"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Nova Senha
                    </label>
                    <Input
                      type="password"
                      value={userSettings.newPassword}
                      onChange={(e) => setUserSettings(prev => ({
                        ...prev,
                        newPassword: e.target.value
                      }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Confirmar Nova Senha
                    </label>
                    <Input
                      type="password"
                      value={userSettings.confirmPassword}
                      onChange={(e) => setUserSettings(prev => ({
                        ...prev,
                        confirmPassword: e.target.value
                      }))}
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleSaveUser}>
                    <Save className="h-4 w-4 mr-2" />
                    Salvar Alterações
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Configurações de Notificações */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Preferências de Notificação
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">
                      Notificações por E-mail
                    </h4>
                    <p className="text-sm text-gray-600">
                      Receba notificações importantes por e-mail
                    </p>
                  </div>
                  <Switch
                    checked={notificationSettings.emailNotifications}
                    onCheckedChange={(checked) => setNotificationSettings(prev => ({
                      ...prev,
                      emailNotifications: checked
                    }))}
                  />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">
                      Notificações Push
                    </h4>
                    <p className="text-sm text-gray-600">
                      Notificações em tempo real no navegador
                    </p>
                  </div>
                  <Switch
                    checked={notificationSettings.pushNotifications}
                    onCheckedChange={(checked) => setNotificationSettings(prev => ({
                      ...prev,
                      pushNotifications: checked
                    }))}
                  />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">
                      Lembretes de Prazos
                    </h4>
                    <p className="text-sm text-gray-600">
                      Alertas sobre prazos processuais próximos
                    </p>
                  </div>
                  <Switch
                    checked={notificationSettings.deadlineReminders}
                    onCheckedChange={(checked) => setNotificationSettings(prev => ({
                      ...prev,
                      deadlineReminders: checked
                    }))}
                  />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">
                      Lembretes de Audiências
                    </h4>
                    <p className="text-sm text-gray-600">
                      Notificações sobre audiências agendadas
                    </p>
                  </div>
                  <Switch
                    checked={notificationSettings.hearingReminders}
                    onCheckedChange={(checked) => setNotificationSettings(prev => ({
                      ...prev,
                      hearingReminders: checked
                    }))}
                  />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">
                      Atualizações de Clientes
                    </h4>
                    <p className="text-sm text-gray-600">
                      Notificações sobre novos clientes e atualizações
                    </p>
                  </div>
                  <Switch
                    checked={notificationSettings.clientUpdates}
                    onCheckedChange={(checked) => setNotificationSettings(prev => ({
                      ...prev,
                      clientUpdates: checked
                    }))}
                  />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">
                      Alertas Financeiros
                    </h4>
                    <p className="text-sm text-gray-600">
                      Notificações sobre faturas, pagamentos e vencimentos
                    </p>
                  </div>
                  <Switch
                    checked={notificationSettings.financialAlerts}
                    onCheckedChange={(checked) => setNotificationSettings(prev => ({
                      ...prev,
                      financialAlerts: checked
                    }))}
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveNotifications}>
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Preferências
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Configurações do Sistema */}
        <TabsContent value="system">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Configurações do Sistema
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Idioma
                  </label>
                  <Select 
                    value={systemSettings.language}
                    onValueChange={(value) => setSystemSettings(prev => ({
                      ...prev,
                      language: value
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
                      <SelectItem value="en-US">English (US)</SelectItem>
                      <SelectItem value="es-ES">Español</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Fuso Horário
                  </label>
                  <Select 
                    value={systemSettings.timezone}
                    onValueChange={(value) => setSystemSettings(prev => ({
                      ...prev,
                      timezone: value
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="America/Sao_Paulo">São Paulo (GMT-3)</SelectItem>
                      <SelectItem value="America/New_York">New York (GMT-5)</SelectItem>
                      <SelectItem value="Europe/London">London (GMT+0)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Formato de Data
                  </label>
                  <Select 
                    value={systemSettings.dateFormat}
                    onValueChange={(value) => setSystemSettings(prev => ({
                      ...prev,
                      dateFormat: value
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                      <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                      <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Moeda
                  </label>
                  <Select 
                    value={systemSettings.currency}
                    onValueChange={(value) => setSystemSettings(prev => ({
                      ...prev,
                      currency: value
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BRL">Real (R$)</SelectItem>
                      <SelectItem value="USD">Dólar ($)</SelectItem>
                      <SelectItem value="EUR">Euro (€)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">
                      Salvamento Automático
                    </h4>
                    <p className="text-sm text-gray-600">
                      Salvar automaticamente alterações em formulários
                    </p>
                  </div>
                  <Switch
                    checked={systemSettings.autoSave}
                    onCheckedChange={(checked) => setSystemSettings(prev => ({
                      ...prev,
                      autoSave: checked
                    }))}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">
                      Analytics
                    </h4>
                    <p className="text-sm text-gray-600">
                      Permitir coleta de dados de uso para melhorias
                    </p>
                  </div>
                  <Switch
                    checked={systemSettings.enableAnalytics}
                    onCheckedChange={(checked) => setSystemSettings(prev => ({
                      ...prev,
                      enableAnalytics: checked
                    }))}
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveSystem}>
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Configurações
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}