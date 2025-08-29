# 🌐 URLs de Acesso - Ambiente Produção

## 📱 **FRONTEND (Interface do Usuário)**
- **URL Principal**: http://172.25.132.0:5173/
- **URL Alternativa**: http://10.255.255.254:5173/
- **Local**: http://localhost:5173/

## 🔗 **API BACKEND (Dados e Serviços)**
- **URL Principal**: http://172.25.132.0:3001/api/
- **Local**: http://localhost:3001/api/

## 🏥 **Endpoints Principais**
- **Health Check**: http://172.25.132.0:3001/api/health
- **Clientes**: http://172.25.132.0:3001/api/clients
- **Casos**: http://172.25.132.0:3001/api/cases
- **Documentos**: http://172.25.132.0:3001/api/documents
- **Login**: http://172.25.132.0:3001/api/auth/login

## 💾 **Storage (Arquivos e Documentos)**
- **URL Principal**: http://172.25.132.0:3001/storage/
- **Local**: http://localhost:3001/storage/

## 🔐 **Usuários de Teste**
- **Admin**: admin@autumnusjuris.com (qualquer senha)
- **Advogada**: lawyer1@autumnusjuris.com (qualquer senha)

## 🖥️ **Para Acessar de Outros Computadores na Rede:**

### **Windows/Mac/Linux:**
1. Abra o navegador
2. Digite: `http://172.25.132.0:5173/`
3. Faça login com: `admin@autumnusjuris.com`

### **Mobile (Android/iPhone):**
1. Conecte na mesma rede WiFi
2. Abra o navegador
3. Digite: `http://172.25.132.0:5173/`
4. Use normalmente como um app web

## ⚙️ **Configurações Aplicadas:**

### **Servidor Express:**
- Aceita conexões de qualquer IP (`0.0.0.0`)
- Porta: 3001
- CORS habilitado para conexões externas

### **Frontend Vite:**
- Host: true (aceita conexões externas)
- Porta: 5173
- URLs configuradas para IP da rede

### **PostgreSQL:**
- Base de dados local
- Dados reais (sem mocks)
- Acesso via API

## 🔧 **Comandos para Iniciar (se necessário):**

```bash
# Servidor API
node server/index.cjs

# Frontend
npm run dev
```

## 📋 **Status:**
- ✅ Servidor API: Rodando em modo produção
- ✅ Frontend: Acessível pela rede
- ✅ Base de dados: PostgreSQL conectado
- ✅ Storage: Arquivos acessíveis
- ✅ CORS: Configurado para acesso externo

---

**🎯 URL PRINCIPAL PARA COMPARTILHAR:**
# http://172.25.132.0:5173/

**📱 Funciona em:** Computadores, tablets e smartphones na mesma rede!