# 🔧 Configuração DataJud - Variáveis de Ambiente

## 📋 Variáveis Obrigatórias

### `DATAJUD_BASE_URL`
- **Descrição**: URL base da API oficial DataJud do CNJ
- **Valor padrão**: `https://api-publica.datajud.cnj.jus.br`
- **Exemplo**: `DATAJUD_BASE_URL=https://api-publica.datajud.cnj.jus.br`

### `DATAJUD_API_KEY`
- **Descrição**: Chave de API fornecida pelo CNJ para acesso ao DataJud
- **Valor padrão**: Chave de demonstração (funciona para testes)
- **Exemplo**: `DATAJUD_API_KEY=cDZHYzlZa0JadVREZDJCendQbXY6SkJlTzNjLV9TRENyQk1RdnFKZGRQdw==`
- **⚠️ Importante**: Para produção, solicite uma chave própria no portal do CNJ

## 📋 Variáveis Opcionais

### `DATAJUD_TIMEOUT`
- **Descrição**: Timeout para requisições HTTP em milissegundos
- **Valor padrão**: `30000` (30 segundos)
- **Exemplo**: `DATAJUD_TIMEOUT=30000`

### `DATAJUD_MAX_RETRIES`
- **Descrição**: Número máximo de tentativas em caso de falha
- **Valor padrão**: `3`
- **Exemplo**: `DATAJUD_MAX_RETRIES=3`

### `DATAJUD_RATE_LIMIT_MS`
- **Descrição**: Intervalo mínimo entre requisições em milissegundos
- **Valor padrão**: `1000` (1 segundo)
- **Exemplo**: `DATAJUD_RATE_LIMIT_MS=1000`
- **⚠️ Importante**: Respeite os limites da API para evitar bloqueios

## 🔑 Como Obter uma Chave DataJud

1. Acesse o portal oficial do CNJ: https://www.cnj.jus.br/
2. Procure pela seção "DataJud" ou "API Pública"
3. Cadastre-se como desenvolvedor
4. Solicite acesso à API DataJud
5. Aguarde aprovação e receba sua chave pessoal

## ✅ Configuração nos Arquivos

### `.env.local` (Desenvolvimento)
```env
DATAJUD_BASE_URL="https://api-publica.datajud.cnj.jus.br"
DATAJUD_API_KEY="sua-chave-aqui"
DATAJUD_TIMEOUT=30000
DATAJUD_MAX_RETRIES=3
DATAJUD_RATE_LIMIT_MS=1000
```

### `.env.example` (Exemplo para equipe)
```env
DATAJUD_BASE_URL=https://api-publica.datajud.cnj.jus.br
DATAJUD_API_KEY=your-datajud-api-key-here
DATAJUD_TIMEOUT=30000
DATAJUD_MAX_RETRIES=3
DATAJUD_RATE_LIMIT_MS=1000
```

## 🧪 Teste da Configuração

Após configurar as variáveis, você pode testar a conectividade:

```typescript
import { DatajudClient } from './services/tribunals/clients/datajud.client';

const client = DatajudClient.getInstance();
const test = await client.testConnection();
console.log('Teste DataJud:', test);
```

## 🚨 Limitações e Boas Práticas

- **Rate Limit**: Mantenha pelo menos 1 segundo entre requisições
- **Timeout**: APIs governamentais podem ser lentas, use timeout de 30s+
- **Retry**: Implemente retry com backoff exponencial
- **Cache**: Implemente cache para evitar consultas repetitivas
- **Logs**: Registre todas as requisições para auditoria
- **Monitoramento**: Monitore quotas e limites de uso

## 📊 Tribunais Suportados

A API DataJud oferece cobertura para todos os tribunais brasileiros:
- **TRFs**: Tribunais Regionais Federais (TRF1-6)
- **TJs**: Tribunais de Justiça estaduais (todos os 27 estados)
- **TRTs**: Tribunais Regionais do Trabalho (TRT1-24)
- **STF**: Supremo Tribunal Federal
- **STJ**: Superior Tribunal de Justiça
- **TST**: Tribunal Superior do Trabalho

## 🔄 Integração com o Sistema

As variáveis são automaticamente carregadas pelo `DatajudClient` e utilizadas em:
- `TribunalMovementsService` - Orquestrador principal
- `CNJDatajudMapper` - Mapeamento de tribunais
- `DatajudParser` - Parsing de respostas
- Cache e persistência de dados