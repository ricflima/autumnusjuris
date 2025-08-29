# Autumnus Juris

Sistema jurídico moderno construído com React, TypeScript e tecnologias de ponta para gestão de casos legais.

## 🏛️ Sobre o Projeto

Autumnus Juris é uma plataforma completa para gestão jurídica, oferecendo uma interface moderna e intuitiva para advogados e escritórios de advocacia gerenciarem seus casos, clientes e documentos.

## 🚀 Tecnologias Utilizadas

- **Frontend:** React 18 + TypeScript
- **Backend:** Node.js + Express.js
- **Banco de Dados:** PostgreSQL 15+
- **Gerenciamento de Estado:** TanStack Query (React Query v5)
- **Styling:** Tailwind CSS + Shadcn/ui
- **Roteamento:** React Router DOM v6
- **Validação:** React Hook Form + Zod
- **Build Tool:** Vite
- **Integrações:** Tribunais Brasileiros (PJe, ESAJ, TRT)
- **IA:** Análise de Documentos e Business Intelligence
- **Desenvolvimento:** TanStack Query DevTools

## 📋 Pré-requisitos

- Node.js (versão 18 ou superior)
- npm ou yarn
- PostgreSQL 15+
- Git

## 🛠️ Instalação e Configuração

### Para Windows WSL

1. **Clone o repositório:**
   ```bash
   cd /home/radmin/
   git clone <seu-repositorio> autumnus-juris
   cd autumnus-juris
   ```

2. **Instale as dependências:**
   ```bash
   npm install
   ```

3. **Configure o PostgreSQL:**
   ```bash
   # Configurar database
   sudo -u postgres createdb autumnusjuris_db
   sudo -u postgres createuser autumnusjuris
   sudo -u postgres psql -c "ALTER USER autumnusjuris WITH ENCRYPTED PASSWORD 'autumnusjuris2024';"
   sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE autumnusjuris_db TO autumnusjuris;"
   
   # Executar migrações
   PGPASSWORD=autumnusjuris2024 psql -h localhost -U autumnusjuris -d autumnusjuris_db -f database/migrations/001_initial_schema.sql
   ```

4. **Configure as variáveis de ambiente:**
   ```bash
   cp .env.example .env.local
   ```
   Edite o arquivo `.env.local` com suas configurações:
   ```
   VITE_API_BASE_URL=http://172.25.132.0:3001/api
   DATABASE_URL=postgresql://autumnusjuris:autumnusjuris2024@localhost:5432/autumnusjuris_db
   ```

5. **Execute o backend:**
   ```bash
   # Em um terminal separado
   node server/index.cjs
   ```

6. **Execute o frontend:**
   ```bash
   npm run dev
   ```

7. **Acesse a aplicação:**
   Abra seu navegador e vá para: `http://localhost:5173`

### Comandos Disponíveis

- `npm run dev` - Executa o servidor de desenvolvimento
- `npm run build` - Gera build de produção
- `npm run preview` - Visualiza o build de produção
- `npm run lint` - Executa o linter
- `npm run type-check` - Verifica tipos TypeScript

## ⚡ Principais Funcionalidades

### 🏛️ Gestão Jurídica Completa
- **Gestão de Clientes:** CRUD completo com categorização PF/PJ
- **Casos Jurídicos:** Workflow completo com timeline e histórico
- **Processos Judiciais:** Integração com sistemas tribunais brasileiros
- **Prazos e Deadlines:** Sistema automatizado de controle de prazos
- **Audiências:** Agendamento e controle de audiências

### 🤖 Integrações Avançadas
- **Tribunais Brasileiros:** Consulta automática em TJ, TRT, TRF
- **Identificação Automática:** Parser CNJ para identificação de tribunais
- **APIs Reais:** Sistema completamente integrado com PostgreSQL
- **Consulta de Movimentações:** Atualizações processuais em tempo real

### 🎯 Business Intelligence
- **Dashboards Interativos:** KPIs personalizáveis e métricas em tempo real
- **IA para Análise:** Análise inteligente de documentos e contratos
- **Relatórios Avançados:** Business Intelligence com previsões
- **Analytics:** Insights automatizados e análises preditivas

### 💼 Gestão Empresarial
- **Sistema Financeiro:** Controle completo de receitas e despesas
- **Assinatura Digital:** Sistema completo de assinatura eletrônica
- **Notificações Push:** Sistema multi-canal avançado
- **Gestão Documental:** Upload, organização e análise de documentos

## 📁 Estrutura do Projeto

```
autumnus-juris/
├── src/
│   ├── components/         # Componentes reutilizáveis
│   │   ├── ui/            # Componentes base (shadcn/ui)
│   │   ├── common/        # Componentes comuns
│   │   └── processes/     # Componentes específicos de processos
│   ├── pages/             # Páginas da aplicação
│   │   ├── auth/          # Páginas de autenticação
│   │   ├── dashboard/     # Dashboard principal
│   │   ├── cases/         # Gestão de casos
│   │   ├── processes/     # Gestão processual
│   │   ├── clients/       # Gestão de clientes
│   │   ├── financial/     # Sistema financeiro
│   │   └── analytics/     # Business Intelligence
│   ├── hooks/             # Custom hooks
│   ├── services/          # Serviços e APIs
│   │   ├── tribunals/     # Integrações com tribunais
│   │   └── ai/           # Serviços de IA
│   ├── types/             # Definições TypeScript
│   ├── utils/             # Utilitários
│   └── styles/            # Estilos globais
├── server/                # Backend Express.js
├── database/              # Migrações PostgreSQL
├── public/                # Arquivos públicos
└── docs/                  # Documentação completa
```

## 🔧 Configuração de Desenvolvimento

### TanStack Query DevTools

As DevTools estão habilitadas automaticamente em modo de desenvolvimento para facilitar o debug de queries e mutations.

### Tailwind CSS

O projeto utiliza Tailwind CSS com configurações personalizadas. Os estilos estão organizados em:
- `globals.css` - Estilos globais e variáveis CSS
- Componentes com classes utilitárias do Tailwind

## 📊 Estado da Aplicação

O gerenciamento de estado é feito através do TanStack Query para:
- Cache de dados do servidor
- Sincronização automática
- Loading e error states
- Otimistic updates

## 🔐 Autenticação

Sistema de autenticação implementado com:
- Login/logout
- Proteção de rotas
- Gerenciamento de tokens
- Persistência de sessão

## 📱 Responsividade

A interface é totalmente responsiva, adaptando-se a:
- Desktop (1024px+)
- Tablet (768px - 1023px)
- Mobile (até 767px)

## 🧪 Testes

Para executar os testes:
```bash
npm run test        # Testes unitários
npm run test:e2e    # Testes end-to-end
```

## 📖 Documentação Adicional

- [Guia de Componentes](./docs/components-guide.md)
- [API Reference](./docs/api-reference.md)
- [Guia de Deployment](./docs/deployment-guide.md)

## 🤝 Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 👨‍💻 Autor

Desenvolvido com ❤️ para modernizar a gestão jurídica.

---

**Autumnus Juris** - Transformando a advocacia com tecnologia moderna.
