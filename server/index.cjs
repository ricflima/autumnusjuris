// server/index.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const fs = require('fs');
const fileUpload = require('express-fileupload');
const { Pool } = require('pg');

// Carregar variáveis de ambiente
require('dotenv').config({ path: '.env.local' });

const app = express();
const PORT = process.env.PORT || 3001;

// PostgreSQL connection
const pool = new Pool({
  user: process.env.DB_USER || 'autumnusjuris',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'autumnusjuris_db',
  password: process.env.DB_PASSWORD || 'autumnusjuris2024',
  port: parseInt(process.env.DB_PORT || '5432'),
});

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: false,
}));
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://172.25.132.0:5173',
    'http://10.255.255.254:5173'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(fileUpload({
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  useTempFiles: true,
  tempFileDir: '/tmp/'
}));

// Servir arquivos estáticos (storage)
app.use('/storage', express.static(path.join(__dirname, '../storage')));

// Middleware adicional para CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin);
  res.header('Access-Control-Allow-Credentials', true);
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

// Middleware de log
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// ===== ROTAS DE CLIENTES =====
app.get('/api/clients', async (req, res) => {
  try {
    const { 
      status, classification, type, search, city, state, 
      page = 1, limit = 10, sortBy = 'name', sortOrder = 'asc' 
    } = req.query;

    let whereConditions = [];
    let queryParams = [];
    let paramCount = 0;

    // Filtros
    if (status) {
      const statusArray = Array.isArray(status) ? status : [status];
      paramCount++;
      whereConditions.push(`status = ANY($${paramCount})`);
      queryParams.push(statusArray);
    }

    if (classification) {
      const classArray = Array.isArray(classification) ? classification : [classification];
      paramCount++;
      whereConditions.push(`classification = ANY($${paramCount})`);
      queryParams.push(classArray);
    }

    if (type) {
      const typeArray = Array.isArray(type) ? type : [type];
      paramCount++;
      whereConditions.push(`type = ANY($${paramCount})`);
      queryParams.push(typeArray);
    }

    if (search) {
      paramCount++;
      whereConditions.push(`(
        name ILIKE $${paramCount} OR 
        email ILIKE $${paramCount} OR 
        document ILIKE $${paramCount} OR 
        city ILIKE $${paramCount}
      )`);
      queryParams.push(`%${search}%`);
    }

    if (city) {
      paramCount++;
      whereConditions.push(`city ILIKE $${paramCount}`);
      queryParams.push(`%${city}%`);
    }

    if (state) {
      paramCount++;
      whereConditions.push(`state = $${paramCount}`);
      queryParams.push(state);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Order by
    let orderByClause = '';
    switch (sortBy) {
      case 'createdAt':
        orderByClause = `ORDER BY created_at ${sortOrder}`;
        break;
      case 'updatedAt':
        orderByClause = `ORDER BY updated_at ${sortOrder}`;
        break;
      case 'name':
        orderByClause = `ORDER BY name ${sortOrder}`;
        break;
      default:
        orderByClause = `ORDER BY created_at ${sortOrder}`;
    }
    
    // Paginação
    const offset = (page - 1) * limit;
    paramCount++;
    const limitParam = paramCount;
    queryParams.push(parseInt(limit));
    
    paramCount++;
    const offsetParam = paramCount;
    queryParams.push(offset);

    // Query principal
    const mainQuery = `
      SELECT * FROM clients 
      ${whereClause} 
      ${orderByClause} 
      LIMIT $${limitParam} OFFSET $${offsetParam}
    `;

    const result = await pool.query(mainQuery, queryParams);

    // Contar total
    const countQuery = `SELECT COUNT(*) as total FROM clients ${whereClause}`;
    const countResult = await pool.query(countQuery, queryParams.slice(0, paramCount - 2));
    const total = parseInt(countResult.rows[0].total);

    // Mapear resultados
    const clients = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      email: row.email,
      phone: row.phone,
      document: row.document,
      documentType: row.document_type,
      type: row.type,
      status: row.status,
      classification: row.classification,
      address: {
        street: row.street || '',
        number: row.number || '',
        complement: row.complement || '',
        neighborhood: row.neighborhood || '',
        city: row.city || '',
        state: row.state || '',
        zipCode: row.zip_code || '',
        country: row.country || 'Brasil'
      },
      contactPerson: row.contact_person,
      birthDate: row.birth_date,
      profession: row.profession,
      maritalStatus: row.marital_status,
      notes: row.notes || '',
      customFields: row.custom_fields || {},
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      lastContact: row.last_contact,
      totalCases: row.total_cases || 0,
      activeCases: row.active_cases || 0,
      totalBilled: parseFloat(row.total_billed || '0'),
      avatar: row.avatar_url
    }));

    res.json({
      clients,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      hasMore: offset + parseInt(limit) < total
    });

  } catch (error) {
    console.error('Erro ao buscar clientes:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

app.get('/api/clients/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM clients WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Cliente não encontrado' });
    }

    const row = result.rows[0];
    const client = {
      id: row.id,
      name: row.name,
      email: row.email,
      phone: row.phone,
      document: row.document,
      documentType: row.document_type,
      type: row.type,
      status: row.status,
      classification: row.classification,
      address: {
        street: row.street || '',
        number: row.number || '',
        complement: row.complement || '',
        neighborhood: row.neighborhood || '',
        city: row.city || '',
        state: row.state || '',
        zipCode: row.zip_code || '',
        country: row.country || 'Brasil'
      },
      contactPerson: row.contact_person,
      birthDate: row.birth_date,
      profession: row.profession,
      maritalStatus: row.marital_status,
      notes: row.notes || '',
      customFields: row.custom_fields || {},
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      lastContact: row.last_contact,
      totalCases: row.total_cases || 0,
      activeCases: row.active_cases || 0,
      totalBilled: parseFloat(row.total_billed || '0'),
      avatar: row.avatar_url
    };

    res.json(client);
  } catch (error) {
    console.error('Erro ao buscar cliente:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// ===== ROTAS DE CASOS =====
app.get('/api/cases', async (req, res) => {
  try {
    const { 
      status, priority, clientId, lawyerId, 
      page = 1, limit = 10, sortBy = 'created_at', sortOrder = 'desc' 
    } = req.query;

    let whereConditions = [];
    let queryParams = [];
    let paramCount = 0;

    if (status) {
      paramCount++;
      whereConditions.push(`c.status = $${paramCount}`);
      queryParams.push(status);
    }

    if (priority) {
      paramCount++;
      whereConditions.push(`c.priority = $${paramCount}`);
      queryParams.push(priority);
    }

    if (clientId) {
      paramCount++;
      whereConditions.push(`c.client_id = $${paramCount}`);
      queryParams.push(clientId);
    }

    if (lawyerId) {
      paramCount++;
      whereConditions.push(`c.lawyer_id = $${paramCount}`);
      queryParams.push(lawyerId);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Order by
    let orderByClause = '';
    switch (sortBy) {
      case 'createdAt':
        orderByClause = `ORDER BY c.created_at ${sortOrder}`;
        break;
      case 'updatedAt':
        orderByClause = `ORDER BY c.updated_at ${sortOrder}`;
        break;
      case 'startDate':
        orderByClause = `ORDER BY c.start_date ${sortOrder}`;
        break;
      default:
        orderByClause = `ORDER BY c.created_at ${sortOrder}`;
    }

    const offset = (page - 1) * limit;
    paramCount++;
    queryParams.push(parseInt(limit));
    paramCount++;
    queryParams.push(offset);

    const query = `
      SELECT 
        c.*,
        cl.name as client_name,
        cl.type as client_type,
        cl.document as client_document,
        cl.email as client_email,
        cl.phone as client_phone,
        u.full_name as lawyer_name
      FROM cases c
      LEFT JOIN clients cl ON c.client_id = cl.id
      LEFT JOIN users u ON c.lawyer_id = u.id
      ${whereClause}
      ${orderByClause}
      LIMIT $${paramCount - 1} OFFSET $${paramCount}
    `;

    const result = await pool.query(query, queryParams);

    // Contar total
    const countQuery = `SELECT COUNT(*) as total FROM cases c ${whereClause}`;
    const countResult = await pool.query(countQuery, queryParams.slice(0, paramCount - 2));
    const total = parseInt(countResult.rows[0].total);

    const cases = result.rows.map(row => ({
      id: row.id,
      title: row.title,
      description: row.description,
      status: row.status,
      priority: row.priority,
      clientId: row.client_id,
      clientName: row.client_name || 'Cliente não encontrado',
      clientType: row.client_type,
      clientDocument: row.client_document,
      clientEmail: row.client_email,
      clientPhone: row.client_phone,
      lawyerId: row.lawyer_id,
      lawyerName: row.lawyer_name || 'Advogado não encontrado',
      processNumber: row.process_number,
      court: row.court,
      subject: row.subject,
      value: parseFloat(row.value || '0'),
      startDate: row.start_date,
      expectedEndDate: row.expected_end_date,
      lastUpdate: row.updated_at,
      nextAction: row.next_action,
      nextActionDate: row.next_action_date,
      documents: [], // Buscar documentos separadamente se necessário
      timeline: [], // Buscar timeline separadamente se necessário
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      tags: row.tags || []
    }));

    res.json({
      cases,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      hasMore: offset + parseInt(limit) < total
    });

  } catch (error) {
    console.error('Erro ao buscar casos:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// POST - Criar novo caso
app.post('/api/cases', async (req, res) => {
  try {
    const { 
      title, description, clientId, lawyerId, status = 'active', 
      priority = 'medium', subject, value, startDate, expectedEndDate,
      processNumber, court, nextAction, nextActionDate, tags = [] 
    } = req.body;

    // Validações básicas
    if (!title || !clientId || !subject || !startDate) {
      return res.status(400).json({ 
        message: 'Título, cliente, assunto e data de início são obrigatórios' 
      });
    }

    // Verificar se cliente existe
    const clientResult = await pool.query('SELECT id FROM clients WHERE id = $1', [clientId]);
    if (clientResult.rows.length === 0) {
      return res.status(404).json({ message: 'Cliente não encontrado' });
    }

    // Se lawyerId fornecido, verificar se existe
    if (lawyerId) {
      const lawyerResult = await pool.query('SELECT id FROM users WHERE id = $1', [lawyerId]);
      if (lawyerResult.rows.length === 0) {
        return res.status(404).json({ message: 'Advogado não encontrado' });
      }
    }

    const insertQuery = `
      INSERT INTO cases (
        title, description, client_id, lawyer_id, status, priority, 
        subject, value, start_date, expected_end_date, process_number,
        court, next_action, next_action_date, tags
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15
      ) RETURNING *
    `;

    const result = await pool.query(insertQuery, [
      title, description, clientId, lawyerId || null, status, priority,
      subject, value || 0, startDate, expectedEndDate || null, 
      processNumber || null, court || null, nextAction || null, 
      nextActionDate || null, tags
    ]);

    const newCase = result.rows[0];

    // Buscar dados completos com JOINs
    const fullCaseQuery = `
      SELECT 
        c.*,
        cl.name as client_name,
        cl.type as client_type,
        cl.document as client_document,
        cl.email as client_email,
        cl.phone as client_phone,
        u.full_name as lawyer_name
      FROM cases c
      LEFT JOIN clients cl ON c.client_id = cl.id
      LEFT JOIN users u ON c.lawyer_id = u.id
      WHERE c.id = $1
    `;

    const fullResult = await pool.query(fullCaseQuery, [newCase.id]);
    const row = fullResult.rows[0];

    const responseCase = {
      id: row.id,
      title: row.title,
      description: row.description,
      status: row.status,
      priority: row.priority,
      clientId: row.client_id,
      clientName: row.client_name,
      clientType: row.client_type,
      clientDocument: row.client_document,
      clientEmail: row.client_email,
      clientPhone: row.client_phone,
      lawyerId: row.lawyer_id,
      lawyerName: row.lawyer_name,
      subject: row.subject,
      value: parseFloat(row.value || '0'),
      startDate: row.start_date,
      expectedEndDate: row.expected_end_date,
      processNumber: row.process_number,
      court: row.court,
      nextAction: row.next_action,
      nextActionDate: row.next_action_date,
      tags: row.tags || [],
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };

    res.status(201).json({
      success: true,
      case: responseCase,
      message: 'Caso criado com sucesso'
    });

  } catch (error) {
    console.error('Erro ao criar caso:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// GET - Buscar caso específico por ID
app.get('/api/cases/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = `
      SELECT 
        c.*,
        cl.name as client_name,
        cl.type as client_type,
        cl.document as client_document,
        cl.email as client_email,
        cl.phone as client_phone,
        u.full_name as lawyer_name
      FROM cases c
      LEFT JOIN clients cl ON c.client_id = cl.id
      LEFT JOIN users u ON c.lawyer_id = u.id
      WHERE c.id = $1
    `;

    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Caso não encontrado' });
    }

    const row = result.rows[0];
    const case_detail = {
      id: row.id,
      title: row.title,
      description: row.description,
      status: row.status,
      priority: row.priority,
      clientId: row.client_id,
      clientName: row.client_name || 'Cliente não encontrado',
      clientType: row.client_type,
      clientDocument: row.client_document,
      clientEmail: row.client_email,
      clientPhone: row.client_phone,
      lawyerId: row.lawyer_id,
      lawyerName: row.lawyer_name || 'Advogado não atribuído',
      processNumber: row.process_number,
      court: row.court,
      subject: row.subject,
      value: parseFloat(row.value || '0'),
      startDate: row.start_date,
      expectedEndDate: row.expected_end_date,
      nextAction: row.next_action,
      nextActionDate: row.next_action_date,
      tags: row.tags || [],
      customFields: row.custom_fields || {},
      lastUpdate: row.last_update,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      // Adicionar campos que o frontend espera
      documents: [],
      timeline: []
    };

    res.json(case_detail);

  } catch (error) {
    console.error('Erro ao buscar caso:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// ===== ROTAS DE DOCUMENTOS =====
app.get('/api/documents', async (req, res) => {
  try {
    const { caseId, clientId, folder, type } = req.query;
    
    let whereConditions = [];
    let queryParams = [];
    let paramCount = 0;

    if (caseId) {
      paramCount++;
      whereConditions.push(`case_id = $${paramCount}`);
      queryParams.push(caseId);
    }

    if (clientId) {
      paramCount++;
      whereConditions.push(`client_id = $${paramCount}`);
      queryParams.push(clientId);
    }

    if (folder) {
      paramCount++;
      whereConditions.push(`folder = $${paramCount}`);
      queryParams.push(folder);
    }

    if (type) {
      paramCount++;
      whereConditions.push(`type = $${paramCount}`);
      queryParams.push(type);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const query = `
      SELECT d.*, u.full_name as created_by_name
      FROM documents d
      LEFT JOIN users u ON d.created_by = u.id
      ${whereClause}
      ORDER BY d.created_at DESC
    `;

    const result = await pool.query(query, queryParams);

    const documents = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      description: row.description,
      type: row.type,
      filePath: row.file_path,
      fileSize: row.file_size,
      mimeType: row.mime_type,
      status: row.status,
      caseId: row.case_id,
      processId: row.process_id,
      clientId: row.client_id,
      folder: row.folder,
      tags: row.tags || [],
      version: row.version,
      isTemplate: row.is_template,
      isPublic: row.is_public,
      accessPermissions: row.access_permissions || {},
      createdBy: row.created_by,
      createdByName: row.created_by_name,
      updatedBy: row.updated_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));

    res.json({ documents });

  } catch (error) {
    console.error('Erro ao buscar documentos:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// GET - Buscar documento específico por ID
app.get('/api/documents/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = `
      SELECT d.*, u.full_name as created_by_name
      FROM documents d
      LEFT JOIN users u ON d.created_by = u.id
      WHERE d.id = $1
    `;

    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Documento não encontrado' });
    }

    const row = result.rows[0];
    const document = {
      id: row.id,
      title: row.name,
      fileName: row.name,
      description: row.description,
      type: row.type,
      category: row.type, // Map type to category
      priority: 'medium', // Default value since not stored in DB
      security: 'internal', // Default value since not stored in DB
      status: row.status,
      filePath: row.file_path,
      fileSize: row.file_size,
      mimeType: row.mime_type,
      caseId: row.case_id,
      processId: row.process_id,
      clientId: row.client_id,
      folder: row.folder,
      folderId: row.folder, // Use folder as folderId
      tags: row.tags || [],
      version: row.version,
      isTemplate: row.is_template,
      isPublic: row.is_public,
      accessPermissions: row.access_permissions || {},
      createdBy: row.created_by,
      createdByName: row.created_by_name,
      updatedBy: row.updated_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };

    res.json(document);

  } catch (error) {
    console.error('Erro ao buscar documento:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// PUT - Atualizar documento
app.put('/api/documents/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      title, description, category, priority, security, status, 
      folderId, tags 
    } = req.body;

    // Verificar se documento existe
    const existingDoc = await pool.query('SELECT id FROM documents WHERE id = $1', [id]);
    if (existingDoc.rows.length === 0) {
      return res.status(404).json({ message: 'Documento não encontrado' });
    }

    const updateQuery = `
      UPDATE documents SET 
        name = $1,
        description = $2,
        type = $3,
        status = $4,
        folder = $5,
        tags = $6,
        updated_at = NOW()
      WHERE id = $7
      RETURNING *
    `;

    const result = await pool.query(updateQuery, [
      title, description, category, status, 
      folderId || null, tags || [], id
    ]);

    const updatedDoc = result.rows[0];
    
    const response = {
      id: updatedDoc.id,
      title: updatedDoc.name,
      fileName: updatedDoc.name,
      description: updatedDoc.description,
      category: updatedDoc.type,
      priority: priority || 'medium', // Return what was sent since not stored
      security: security || 'internal', // Return what was sent since not stored
      status: updatedDoc.status,
      folderId: updatedDoc.folder,
      tags: updatedDoc.tags || [],
      updatedAt: updatedDoc.updated_at
    };

    res.json({
      success: true,
      document: response,
      message: 'Documento atualizado com sucesso'
    });

  } catch (error) {
    console.error('Erro ao atualizar documento:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// ===== ROTAS DE PROCESSOS =====
app.get('/api/processes', async (req, res) => {
  try {
    const { 
      caseId, status, court, 
      page = 1, limit = 10, sortBy = 'created_at', sortOrder = 'desc' 
    } = req.query;

    let whereConditions = [];
    let queryParams = [];
    let paramCount = 0;

    if (caseId) {
      paramCount++;
      whereConditions.push(`p.case_id = $${paramCount}`);
      queryParams.push(caseId);
    }

    if (status) {
      paramCount++;
      whereConditions.push(`p.status = $${paramCount}`);
      queryParams.push(status);
    }

    if (court) {
      paramCount++;
      whereConditions.push(`p.court ILIKE $${paramCount}`);
      queryParams.push(`%${court}%`);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Order by
    let orderByClause = '';
    switch (sortBy) {
      case 'createdAt':
        orderByClause = `ORDER BY p.created_at ${sortOrder}`;
        break;
      case 'distributionDate':
        orderByClause = `ORDER BY p.distribution_date ${sortOrder}`;
        break;
      case 'number':
        orderByClause = `ORDER BY p.number ${sortOrder}`;
        break;
      default:
        orderByClause = `ORDER BY p.created_at ${sortOrder}`;
    }

    const offset = (page - 1) * limit;
    paramCount++;
    queryParams.push(parseInt(limit));
    paramCount++;
    queryParams.push(offset);

    const query = `
      SELECT 
        p.*,
        c.title as case_title,
        c.client_id,
        cl.name as client_name,
        u.full_name as lawyer_name
      FROM processes p
      LEFT JOIN cases c ON p.case_id = c.id
      LEFT JOIN clients cl ON c.client_id = cl.id
      LEFT JOIN users u ON c.lawyer_id = u.id
      ${whereClause}
      ${orderByClause}
      LIMIT $${paramCount - 1} OFFSET $${paramCount}
    `;

    const result = await pool.query(query, queryParams);

    // Contar total
    const countQuery = `SELECT COUNT(*) as total FROM processes p ${whereClause}`;
    const countResult = await pool.query(countQuery, queryParams.slice(0, paramCount - 2));
    const total = parseInt(countResult.rows[0].total);

    const processes = result.rows.map(row => ({
      id: row.id,
      number: row.number,
      caseId: row.case_id,
      caseTitle: row.case_title,
      clientName: row.client_name,
      lawyerName: row.lawyer_name,
      court: row.court,
      judicialDistrict: row.judicial_district,
      city: row.city,
      state: row.state,
      plaintiff: row.plaintiff,
      defendant: row.defendant,
      otherParties: row.other_parties || [],
      lawyerPlaintiff: row.lawyer_plaintiff,
      lawyerDefendant: row.lawyer_defendant,
      subject: row.subject,
      class: row.class,
      distributionDate: row.distribution_date,
      judge: row.judge,
      courtClerk: row.court_clerk,
      status: row.status,
      claimValue: parseFloat(row.claim_value || '0'),
      sentenceValue: parseFloat(row.sentence_value || '0'),
      observations: row.observations,
      tags: row.tags || [],
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));

    res.json({
      processes,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      hasMore: offset + parseInt(limit) < total
    });

  } catch (error) {
    console.error('Erro ao buscar processos:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// GET - Buscar processo específico por ID
app.get('/api/processes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = `
      SELECT 
        p.*,
        c.title as case_title,
        c.client_id,
        cl.name as client_name,
        u.full_name as lawyer_name
      FROM processes p
      LEFT JOIN cases c ON p.case_id = c.id
      LEFT JOIN clients cl ON c.client_id = cl.id
      LEFT JOIN users u ON c.lawyer_id = u.id
      WHERE p.id = $1
    `;

    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Processo não encontrado' });
    }

    const row = result.rows[0];
    
    // Buscar movimentações do processo
    const movementsQuery = `
      SELECT * FROM process_movements 
      WHERE process_id = $1 
      ORDER BY date DESC, created_at DESC
    `;
    const movementsResult = await pool.query(movementsQuery, [id]);
    
    const process = {
      id: row.id,
      number: row.number,
      caseId: row.case_id,
      caseTitle: row.case_title,
      clientName: row.client_name,
      lawyerName: row.lawyer_name,
      court: row.court,
      judicialDistrict: row.judicial_district,
      city: row.city,
      state: row.state,
      plaintiff: row.plaintiff,
      defendant: row.defendant,
      otherParties: row.other_parties || [],
      lawyerPlaintiff: row.lawyer_plaintiff,
      lawyerDefendant: row.lawyer_defendant,
      subject: row.subject,
      class: row.class,
      distributionDate: row.distribution_date,
      judge: row.judge,
      courtClerk: row.court_clerk,
      status: row.status,
      claimValue: parseFloat(row.claim_value || '0'),
      sentenceValue: parseFloat(row.sentence_value || '0'),
      observations: row.observations,
      tags: row.tags || [],
      movements: movementsResult.rows.map(mov => ({
        id: mov.id,
        date: mov.date,
        description: mov.description,
        type: mov.type,
        responsible: mov.responsible,
        documentUrl: mov.document_url,
        isDeadline: mov.is_deadline,
        deadlineDate: mov.deadline_date,
        createdAt: mov.created_at
      })),
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };

    res.json(process);

  } catch (error) {
    console.error('Erro ao buscar processo:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Função para formatar número de processo
function formatProcessNumber(numero) {
  // Remover caracteres especiais e manter apenas números
  const cleanNumber = numero.replace(/[^\d]/g, '');
  
  if (cleanNumber.length !== 20) {
    return numero; // Retorna original se não tem 20 dígitos
  }

  // Aplicar máscara: NNNNNNN-DD.AAAA.J.TR.OOOO
  return `${cleanNumber.substring(0, 7)}-${cleanNumber.substring(7, 9)}.${cleanNumber.substring(9, 13)}.${cleanNumber.substring(13, 14)}.${cleanNumber.substring(14, 16)}.${cleanNumber.substring(16, 20)}`;
}

// Criar processo
app.post('/api/processes', async (req, res) => {
  try {
    const {
      number,
      caseId,
      plaintiff,
      defendant,
      otherParties = [],
      lawyerPlaintiff,
      lawyerDefendant,
      subject,
      class: processClass,
      distributionDate,
      judge,
      courtClerk,
      court,
      district,
      city,
      state,
      status = 'active',
      claimValue = 0,
      sentenceValue = 0,
      observations,
      tags = []
    } = req.body;

    // Formatar o número automaticamente
    const formattedNumber = formatProcessNumber(number);
    
    console.log(`${new Date().toISOString()} POST /api/processes - Number: ${number} -> ${formattedNumber}`);

    // Validação dos campos obrigatórios
    if (!number || !plaintiff || !subject) {
      return res.status(400).json({
        success: false,
        message: 'Campos obrigatórios: number, plaintiff, subject'
      });
    }

    // Verificar se o processo já existe (com número formatado)
    const existingProcess = await pool.query(
      'SELECT id FROM processes WHERE number = $1',
      [formattedNumber]
    );

    if (existingProcess.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Processo com este número já existe'
      });
    }

    // Inserir processo
    const result = await pool.query(`
      INSERT INTO processes (
        number, case_id, plaintiff, defendant, other_parties,
        lawyer_plaintiff, lawyer_defendant, subject, class,
        distribution_date, judge, court_clerk, court, judicial_district,
        city, state, status, claim_value, sentence_value,
        observations, tags, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15, $16, $17, $18, $19,
        $20, $21, NOW(), NOW()
      ) RETURNING *
    `, [
      formattedNumber, 
      caseId && caseId !== '' ? caseId : null, // Tratar string vazia como null
      plaintiff, defendant, JSON.stringify(otherParties || []),
      lawyerPlaintiff, lawyerDefendant, subject, processClass,
      distributionDate, judge, courtClerk, court, district,
      city, state, status, claimValue, sentenceValue,
      observations, tags || []
    ]);

    const createdProcess = {
      id: result.rows[0].id,
      number: result.rows[0].number,
      caseId: result.rows[0].case_id,
      plaintiff: result.rows[0].plaintiff,
      defendant: result.rows[0].defendant,
      otherParties: result.rows[0].other_parties || [],
      lawyerPlaintiff: result.rows[0].lawyer_plaintiff,
      lawyerDefendant: result.rows[0].lawyer_defendant,
      subject: result.rows[0].subject,
      class: result.rows[0].class,
      distributionDate: result.rows[0].distribution_date,
      judge: result.rows[0].judge,
      courtClerk: result.rows[0].court_clerk,
      court: result.rows[0].court,
      district: result.rows[0].judicial_district,
      city: result.rows[0].city,
      state: result.rows[0].state,
      status: result.rows[0].status,
      claimValue: parseFloat(result.rows[0].claim_value || '0'),
      sentenceValue: parseFloat(result.rows[0].sentence_value || '0'),
      observations: result.rows[0].observations,
      tags: result.rows[0].tags || [],
      movements: [],
      createdAt: result.rows[0].created_at,
      updatedAt: result.rows[0].updated_at
    };

    res.status(201).json({
      success: true,
      message: 'Processo criado com sucesso',
      process: createdProcess
    });

  } catch (error) {
    console.error('Erro ao criar processo:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Atualizar processo
app.put('/api/processes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    console.log(`${new Date().toISOString()} PUT /api/processes/${id}`);

    // Verificar se o processo existe
    const existingProcess = await pool.query(
      'SELECT id FROM processes WHERE id = $1',
      [id]
    );

    if (existingProcess.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Processo não encontrado'
      });
    }

    // Construir query de atualização dinamicamente
    const updateFields = [];
    const values = [];
    let paramCount = 0;

    const fieldMap = {
      number: 'number',
      plaintiff: 'plaintiff',
      defendant: 'defendant',
      subject: 'subject',
      class: 'class',
      distributionDate: 'distribution_date',
      judge: 'judge',
      court: 'court',
      district: 'judicial_district',
      city: 'city',
      state: 'state',
      status: 'status',
      claimValue: 'claim_value',
      observations: 'observations'
    };

    for (const [frontendField, dbField] of Object.entries(fieldMap)) {
      if (updateData[frontendField] !== undefined) {
        paramCount++;
        updateFields.push(`${dbField} = $${paramCount}`);
        values.push(updateData[frontendField]);
      }
    }

    // Sempre atualizar updated_at
    paramCount++;
    updateFields.push(`updated_at = $${paramCount}`);
    values.push(new Date().toISOString());

    // Adicionar ID no final
    paramCount++;
    values.push(id);

    const query = `
      UPDATE processes 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(query, values);

    const updatedProcess = {
      id: result.rows[0].id,
      number: result.rows[0].number,
      plaintiff: result.rows[0].plaintiff,
      defendant: result.rows[0].defendant,
      subject: result.rows[0].subject,
      class: result.rows[0].class,
      distributionDate: result.rows[0].distribution_date,
      judge: result.rows[0].judge,
      court: result.rows[0].court,
      district: result.rows[0].judicial_district,
      city: result.rows[0].city,
      state: result.rows[0].state,
      status: result.rows[0].status,
      claimValue: parseFloat(result.rows[0].claim_value || '0'),
      observations: result.rows[0].observations,
      updatedAt: result.rows[0].updated_at
    };

    res.json({
      success: true,
      message: 'Processo atualizado com sucesso',
      process: updatedProcess
    });

  } catch (error) {
    console.error('Erro ao atualizar processo:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Deletar processo
app.delete('/api/processes/:id', async (req, res) => {
  try {
    const { id } = req.params;

    console.log(`${new Date().toISOString()} DELETE /api/processes/${id}`);

    // Verificar se o processo existe
    const existingProcess = await pool.query(
      'SELECT id FROM processes WHERE id = $1',
      [id]
    );

    if (existingProcess.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Processo não encontrado'
      });
    }

    // Deletar movimentações relacionadas primeiro (por causa da foreign key)
    await pool.query('DELETE FROM process_movements WHERE process_id = $1', [id]);

    // Deletar o processo
    await pool.query('DELETE FROM processes WHERE id = $1', [id]);

    res.json({
      success: true,
      message: 'Processo deletado com sucesso'
    });

  } catch (error) {
    console.error('Erro ao deletar processo:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// ===== ROTAS DE AUTENTICAÇÃO =====
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Por enquanto, aceitar qualquer login para desenvolvimento
    if (email && password) {
      // Buscar usuário na base
      const result = await pool.query('SELECT id, email, full_name, role FROM users WHERE email = $1', [email]);
      
      if (result.rows.length > 0) {
        const user = result.rows[0];
        res.json({
          success: true,
          user: {
            id: user.id,
            email: user.email,
            name: user.full_name,
            role: user.role
          },
          token: 'mock_token_for_development'
        });
      } else {
        res.status(401).json({ 
          success: false, 
          message: 'Credenciais inválidas' 
        });
      }
    } else {
      res.status(400).json({ 
        success: false, 
        message: 'Email e senha são obrigatórios' 
      });
    }
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor' 
    });
  }
});

app.post('/api/auth/logout', (req, res) => {
  res.json({ success: true, message: 'Logout realizado com sucesso' });
});


// ===== ROTA DE BOAS-VINDAS DA API =====
app.get('/api', (req, res) => {
  res.json({
    message: 'AutumnusJuris API v1.0',
    status: 'Online',
    endpoints: [
      'POST /api/auth/login - Autenticação',
      'POST /api/auth/logout - Logout',
      'GET /api/health - Health check',
      'GET /api/clients - Lista de clientes',
      'GET /api/clients/:id - Cliente específico',
      'GET /api/cases - Lista de casos',
      'GET /api/documents - Lista de documentos',
    ],
    storage: '/storage/ - Arquivos e documentos',
    timestamp: new Date().toISOString()
  });
});

// ===== HEALTH CHECK =====
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: 'production'
  });
});

// Função para iniciar o servidor
const startServer = async () => {
  try {
    // Testar conexão com PostgreSQL
    const result = await pool.query('SELECT NOW()');
    console.log('✅ Conectado ao PostgreSQL');

    // Iniciar servidor (aceitar conexões de qualquer IP)
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Servidor rodando na porta ${PORT}`);
      console.log(`📡 URLs de Acesso:`);
      console.log(`   • Local: http://localhost:${PORT}/api`);
      console.log(`   • Rede: http://172.25.132.0:${PORT}/api`);
      console.log(`💾 Storage disponível em:`);
      console.log(`   • Local: http://localhost:${PORT}/storage`);
      console.log(`   • Rede: http://172.25.132.0:${PORT}/storage`);
      console.log(`🏥 Health check: http://172.25.132.0:${PORT}/api/health`);
      console.log(`🌐 Ambiente: PRODUÇÃO - Aceita conexões externas`);
    });
  } catch (error) {
    console.error('❌ Erro ao iniciar servidor:', error);
    process.exit(1);
  }
};


startServer();
