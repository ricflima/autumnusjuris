# 🧪 Cenários de Teste - AutumnusJuris

Este documento contém os cenários funcionais para validar todas as implementações do sistema AutumnusJuris.

---

## 📋 Índice
- [Fase 9 - Funcionalidades Avançadas](#fase-9---funcionalidades-avançadas)
  - [Sistema de Assinatura Digital](#sistema-de-assinatura-digital)
  - [IA para Análise de Documentos](#ia-para-análise-de-documentos)
  - [Sistema de Notificações Push Avançadas](#sistema-de-notificações-push-avançadas)
  - [Business Intelligence Avançado](#business-intelligence-avançado)

---

## 🚀 Fase 9 - Funcionalidades Avançadas

### 📝 Sistema de Assinatura Digital

#### CT-AS-001: Criar Solicitação de Assinatura
**Cenário:** Como usuário, quero criar uma solicitação de assinatura digital

**Pré-condições:**
- Usuário autenticado
- Documento válido disponível no sistema

**Entrada:**
- Título: "Assinatura do Contrato de Prestação de Serviços"
- Documento: "Contrato de Prestação de Serviços.pdf"
- Signatários: João Silva (joao@email.com), Maria Santos (maria@email.com)
- Fluxo: Sequencial
- Prazo: 7 dias

**Saída Esperada:**
- Solicitação criada com status "rascunho"
- ID único gerado
- Signatários listados com status "pendente"
- Mensagem de sucesso exibida

**Critérios de Aceitação:**
- ✅ Solicitação deve ser salva no banco de dados
- ✅ Todos os campos obrigatórios devem ser validados
- ✅ Email dos signatários deve ser validado
- ✅ Status inicial deve ser "rascunho"

#### CT-AS-002: Enviar Solicitação de Assinatura
**Cenário:** Como usuário, quero enviar uma solicitação de assinatura para os signatários

**Pré-condições:**
- Solicitação em status "rascunho"
- Signatários válidos configurados

**Entrada:**
- ID da solicitação
- Ação: "Enviar"

**Saída Esperada:**
- Status alterado para "enviado"
- Notificações enviadas para todos os signatários
- Timestamp de envio registrado

**Critérios de Aceitação:**
- ✅ Status deve mudar para "enviado"
- ✅ Email deve ser enviado para cada signatário
- ✅ Data/hora de envio deve ser registrada
- ✅ Não deve permitir edição após envio

#### CT-AS-003: Validar Assinatura Digital
**Cenário:** Como usuário, quero validar uma assinatura digital existente

**Pré-condições:**
- Documento com assinatura digital válida
- Certificado digital válido

**Entrada:**
- ID da assinatura
- Hash da assinatura: "sha256:a1b2c3d4e5f6"

**Saída Esperada:**
- Status de validação: "válida"
- Informações do certificado exibidas
- Integridade do documento confirmada

**Critérios de Aceitação:**
- ✅ Deve verificar integridade do documento
- ✅ Deve validar certificado digital
- ✅ Deve exibir informações do signatário
- ✅ Deve mostrar data/hora da assinatura

---

### 🤖 IA para Análise de Documentos

#### CT-IA-001: Iniciar Análise de Contrato
**Cenário:** Como usuário, quero analisar um contrato usando IA

**Pré-condições:**
- Usuário autenticado
- Documento PDF válido
- Modelos de IA disponíveis

**Entrada:**
- Documento: "Contrato de Prestação de Serviços.pdf"
- Tipos de análise: ["contract_analysis", "entity_recognition", "risk_assessment"]
- Template: "Análise Completa de Contrato"

**Saída Esperada:**
- Análise iniciada com status "processando"
- ID único de análise gerado
- Tempo estimado de processamento exibido

**Critérios de Aceitação:**
- ✅ Análise deve ser criada com status "processando"
- ✅ Deve iniciar processamento assíncrono
- ✅ Deve mostrar progresso em tempo real
- ✅ Deve permitir cancelamento durante processamento

#### CT-IA-002: Visualizar Resultados da Análise
**Cenário:** Como usuário, quero visualizar os resultados da análise de IA

**Pré-condições:**
- Análise concluída com status "completed"
- Resultados gerados pelos modelos

**Entrada:**
- ID da análise concluída

**Saída Esperada:**
- Dashboard com resumo da análise
- Cláusulas identificadas (mínimo 5)
- Riscos detectados com níveis de severidade
- Entidades reconhecidas (pessoas, organizações, datas)
- Recomendações acionáveis

**Critérios de Aceitação:**
- ✅ Deve exibir confiança geral da análise (>70%)
- ✅ Deve listar todas as cláusulas encontradas
- ✅ Deve categorizar riscos por severidade
- ✅ Deve permitir export dos resultados

#### CT-IA-003: Exportar Relatório de Análise
**Cenário:** Como usuário, quero exportar um relatório detalhado da análise

**Pré-condições:**
- Análise concluída
- Resultados disponíveis

**Entrada:**
- ID da análise
- Formato: PDF
- Seções: [resumo, cláusulas, riscos, recomendações]

**Saída Esperada:**
- Arquivo PDF gerado
- Link de download disponibilizado
- Conteúdo estruturado e formatado

**Critérios de Aceitação:**
- ✅ PDF deve ser gerado corretamente
- ✅ Deve conter todas as seções selecionadas
- ✅ Formatação deve estar profissional
- ✅ Download deve funcionar em todos os browsers

---

### 🔔 Sistema de Notificações Push Avançadas

#### CT-NP-001: Criar Campanha de Notificação
**Cenário:** Como administrador, quero criar uma campanha de notificações

**Pré-condições:**
- Usuário com permissões de administrador
- Template de notificação disponível

**Entrada:**
- Nome: "Lembretes de Prazos Semanais"
- Template: "Aviso de Prazo"
- Destinatários: Todos os advogados
- Canais: [push, email, whatsapp]
- Agendamento: Semanal, segundas-feiras 09:00

**Saída Esperada:**
- Campanha criada com status "ativo"
- Agendamento configurado
- Lista de destinatários validada

**Critérios de Aceitação:**
- ✅ Campanha deve ser salva corretamente
- ✅ Agendamento deve ser validado
- ✅ Destinatários devem existir no sistema
- ✅ Template deve ser válido

#### CT-NP-002: Enviar Notificação Multi-canal
**Cenário:** Como sistema, quero enviar notificações através de múltiplos canais

**Pré-condições:**
- Campanha ativa
- Provedores configurados (email, push, whatsapp)
- Destinatários com preferências definidas

**Entrada:**
- ID da campanha
- Variáveis: {userName: "João", processNumber: "123456", daysRemaining: 3}
- Canais ativos: [push, email, whatsapp]

**Saída Esperada:**
- Notificações enviadas em todos os canais
- Status de entrega rastreado
- Métricas de engajamento coletadas

**Critérios de Aceitação:**
- ✅ Deve respeitar preferências do usuário
- ✅ Deve registrar tentativas de envio
- ✅ Deve implementar retry para falhas
- ✅ Deve coletar métricas de entrega

#### CT-NP-003: Visualizar Analytics de Campanhas
**Cenário:** Como administrador, quero visualizar o desempenho das campanhas

**Pré-condições:**
- Campanha executada
- Dados de entrega e engajamento coletados

**Entrada:**
- ID da campanha
- Período: Últimos 30 dias

**Saída Esperada:**
- Taxa de entrega por canal
- Taxa de abertura/leitura
- Taxa de cliques
- Gráfico de evolução temporal
- Comparação entre canais

**Critérios de Aceitação:**
- ✅ Métricas devem ser precisas
- ✅ Gráficos devem ser interativos
- ✅ Deve permitir filtros por período
- ✅ Deve exportar relatórios

---

### 📊 Business Intelligence Avançado

#### CT-BI-001: Visualizar Dashboard de KPIs
**Cenário:** Como gestor, quero visualizar os principais KPIs do escritório

**Pré-condições:**
- Dados financeiros e operacionais disponíveis
- KPIs configurados no sistema

**Entrada:**
- Período: Último mês
- Filtros: Todos os departamentos

**Saída Esperada:**
- 4 KPIs principais exibidos
- Comparação com período anterior
- Indicadores visuais de performance (cores)
- Gráficos de tendência

**Critérios de Aceitação:**
- ✅ KPIs devem refletir dados reais
- ✅ Cálculos devem estar corretos
- ✅ Cores devem seguir semáforo (verde/amarelo/vermelho)
- ✅ Deve atualizar em tempo real

#### CT-BI-002: Gerar Insights Automatizados
**Cenário:** Como usuário, quero receber insights automatizados sobre o negócio

**Pré-condições:**
- Dados históricos suficientes (mínimo 3 meses)
- Algoritmos de IA treinados

**Entrada:**
- Período de análise: Último trimestre
- Métricas: [receita, casos_fechados, satisfacao_cliente]

**Saída Esperada:**
- Mínimo 2 insights relevantes
- Nível de confiança para cada insight (>80%)
- Recomendações acionáveis
- Impacto estimado das recomendações

**Critérios de Aceitação:**
- ✅ Insights devem ser baseados em dados reais
- ✅ Confiança deve ser superior a 80%
- ✅ Recomendações devem ser específicas
- ✅ Deve identificar tendências e anomalias

#### CT-BI-003: Visualizar Previsões Futuras
**Cenário:** Como gestor, quero ver previsões de receita para os próximos 6 meses

**Pré-condições:**
- Histórico de receita dos últimos 12 meses
- Modelo preditivo treinado

**Entrada:**
- Métrica: Receita mensal
- Horizonte: 6 meses
- Intervalo de confiança: 95%

**Saída Esperada:**
- Gráfico com previsões mensais
- Bandas de confiança (min/max)
- Fatores que influenciam a previsão
- Cenários otimista/pessimista/realista

**Critérios de Aceitação:**
- ✅ Previsões devem ser plausíveis
- ✅ Intervalo de confiança deve ser calculado
- ✅ Deve mostrar fatores de influência
- ✅ Deve permitir ajuste de parâmetros

---

## 📋 Resumo de Execução

### Estatísticas de Cobertura:
- **Total de Cenários:** 12 cenários funcionais
- **Funcionalidades Cobertas:** 4 principais + integrações
- **Critérios de Aceitação:** 48 critérios específicos
- **Tipos de Teste:** Funcionais, Integração, Performance

### Priorização dos Testes:
1. **Alta Prioridade:** CT-AS-001, CT-IA-001, CT-NP-001, CT-BI-001
2. **Média Prioridade:** CT-AS-002, CT-IA-002, CT-NP-002, CT-BI-002
3. **Baixa Prioridade:** CT-AS-003, CT-IA-003, CT-NP-003, CT-BI-003

### Automação Recomendada:
- ✅ Testes de validação de dados (formulários)
- ✅ Testes de integração com APIs mock
- ✅ Testes de interface do usuário (componentes)
- ❌ Testes de IA (requer dados reais)

---

## 🔌 Fase 10 - Integração Completa com APIs Reais

### 🏗️ Sistema de Processos com API Real

#### CT-PR-001: Criar Processo com API Real
**Cenário:** Como usuário, quero criar um processo utilizando a API real (não mock)

**Pré-condições:**
- Backend Express.js rodando com PostgreSQL
- Usuário autenticado
- Cliente válido existente no sistema

**Entrada:**
- Número: "10005926520255020003"
- Título: "Reclamação Trabalhista - Rescisão Indireta"
- Tipo: "labor"
- Prioridade: "medium"
- Cliente selecionado
- Responsável selecionado
- Tribunal: "15ª Vara do Trabalho de São Paulo"

**Saída Esperada:**
- Processo criado com número formatado: "1000592-65.2025.5.02.0003"
- Processo aparece na lista imediatamente
- Status: "active"
- Dados salvos no PostgreSQL

**Critérios de Aceitação:**
- ✅ Número deve ser formatado automaticamente no padrão CNJ
- ✅ Processo deve aparecer na lista após criação
- ✅ Todas as validações de campo devem funcionar
- ✅ Relacionamentos FK com clientes/casos devem ser criados

#### CT-PR-002: Identificar Tribunal Automaticamente
**Cenário:** Como usuário, quero que o tribunal seja identificado automaticamente baseado no número do processo

**Pré-condições:**
- Processo criado com número formatado
- Parser de números CNJ funcionando

**Entrada:**
- Número do processo: "1000592-65.2025.5.02.0003"
- Acesso à página de detalhes do processo
- Clique em "Consultar Movimentações"

**Saída Esperada:**
- Tribunal identificado: "TRT02 - Tribunal Regional do Trabalho da 2ª Região"
- Consulta iniciada automaticamente
- Não solicitação de seleção manual de tribunal

**Critérios de Aceitação:**
- ✅ Deve identificar segmento judiciário (Justiça do Trabalho)
- ✅ Deve mapear código do tribunal (02)
- ✅ Deve exibir nome completo do tribunal
- ✅ Interface não deve mostrar campos de seleção manual

#### CT-PR-003: Consultar Movimentações sem CORS
**Cenário:** Como usuário, quero consultar movimentações processuais sem erros de CORS

**Pré-condições:**
- Processo com tribunal identificado
- Backend proxy configurado
- URLs usando IP de rede (não localhost)

**Entrada:**
- Número do processo: "1000592-65.2025.5.02.0003"
- Tribunal: "TRT02"
- Clique em consultar movimentações

**Saída Esperada:**
- Requisição feita para backend proxy
- Sem erros de CORS no DevTools
- Resposta da consulta exibida
- Loading states funcionando

**Critérios de Aceitação:**
- ✅ Não deve haver erros "Private Network Request" no Chrome
- ✅ Requisição deve usar IP 172.25.132.0:3001
- ✅ Backend deve proxificar para tribunal correto
- ✅ Resposta deve ser formatada corretamente

### 🔄 Eliminação Completa de Mock Data

#### CT-MD-001: Verificar Ausência de Dados Mock em Processes
**Cenário:** Como desenvolvedor, quero garantir que nenhum dado mock seja usado no serviço de processos

**Pré-condições:**
- Código atualizado com todas as APIs reais
- Mock arrays removidos ou desabilitados

**Entrada:**
- Inspeção do código em `processes.service.ts`
- Execução de operações CRUD de processos

**Saída Esperada:**
- Todas as condicionais mock devem estar como `false` ou removidas
- Todas as operações devem usar axios/fetch para APIs
- Nenhuma referência a arrays mock ativos

**Critérios de Aceitação:**
- ✅ Busca por `if (false)` ou `if (USE_MOCK_DATA)` deve mostrar desabilitado
- ✅ Todas as funções devem usar API_BASE_URL
- ✅ Nenhum MOCK_PROCESSES array deve estar ativo
- ✅ TypeScript deve compilar sem erros

#### CT-MD-002: Verificar Integração Database PostgreSQL
**Cenário:** Como usuário, quero que todos os dados sejam persistidos no PostgreSQL

**Pré-condições:**
- PostgreSQL rodando na porta 5432
- Tabelas criadas corretamente
- Relacionamentos FK configurados

**Entrada:**
- Criar processo via interface
- Atualizar processo
- Deletar processo
- Listar processos

**Saída Esperada:**
- Todos os dados devem ser salvos no banco
- Consultas SQL devem retornar dados corretos
- Foreign keys devem ser respeitadas
- UUIDs devem ser gerados automaticamente

**Critérios de Aceitação:**
- ✅ Query direta no PostgreSQL deve mostrar dados inseridos
- ✅ Relacionamentos devem estar corretos
- ✅ Validações de integridade devem funcionar
- ✅ Logs do backend devem mostrar queries executadas

### 🛠️ Correções de Infraestrutura

#### CT-IF-001: Validar Configuração de Rede
**Cenário:** Como administrador, quero garantir que a configuração de rede evita problemas de CORS

**Pré-condições:**
- Backend rodando em 172.25.132.0:3001
- Frontend configurado para usar IP de rede
- Variáveis de ambiente configuradas

**Entrada:**
- Verificação de URLs em todos os serviços
- Teste de conectividade entre frontend e backend

**Saída Esperada:**
- Todas as URLs devem usar IP de rede
- Conectividade deve funcionar sem erros
- VITE_API_BASE_URL deve estar configurado

**Critérios de Aceitação:**
- ✅ Nenhuma URL localhost deve estar presente em produção
- ✅ Variável VITE_API_BASE_URL deve apontar para IP correto
- ✅ Backend deve responder na porta configurada
- ✅ Não deve haver Mixed Content warnings

#### CT-IF-002: Verificar Tratamento de Erros
**Cenário:** Como usuário, quero receber mensagens de erro claras quando algo falha

**Pré-condições:**
- Sistema funcionando com APIs reais
- Validações de backend implementadas

**Entrada:**
- Tentar criar processo com dados inválidos
- Tentar acessar processo inexistente
- Simular erro de rede

**Saída Esperada:**
- Mensagens de erro específicas
- Estados de loading apropriados
- Fallback para erros de rede
- Logs detalhados no backend

**Critérios de Aceitação:**
- ✅ Mensagens devem ser user-friendly
- ✅ Erros 400/500 devem ser tratados diferentemente
- ✅ Loading states devem desaparecer após erro
- ✅ Console logs devem ajudar no debug

---

## 📊 Resumo de Execução Atualizado

### Estatísticas de Cobertura:
- **Total de Cenários:** 18 cenários funcionais (6 novos da Fase 10)
- **Funcionalidades Cobertas:** 5 principais + integrações + infraestrutura
- **Critérios de Aceitação:** 72 critérios específicos (24 novos)
- **Tipos de Teste:** Funcionais, Integração, Performance, Infraestrutura

### Priorização dos Testes Fase 10:
1. **Alta Prioridade:** CT-PR-001, CT-MD-001, CT-IF-001
2. **Média Prioridade:** CT-PR-002, CT-MD-002, CT-IF-002  
3. **Baixa Prioridade:** CT-PR-003 (após os outros funcionarem)

### Automação Recomendada Fase 10:
- ✅ Testes de integração com PostgreSQL
- ✅ Testes de validação de APIs REST
- ✅ Testes de parsing de números CNJ
- ✅ Testes de conectividade de rede
- ❌ Testes de consulta real tribunais (requer conexão externa)

---

*Documento atualizado em: Janeiro 2025 - Fase 10*
*Próxima revisão: Implementação das próximas funcionalidades*