// database/insert_documents.cjs
const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  user: process.env.DB_USER || 'autumnusjuris',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'autumnusjuris_db',
  password: process.env.DB_PASSWORD || 'autumnusjuris2024',
  port: parseInt(process.env.DB_PORT || '5432'),
});

const insertDocuments = async () => {
  console.log('📄 Inserindo documentos na base...');
  
  try {
    // Buscar IDs de clientes e casos
    const clientResult = await pool.query(`
      SELECT id, name FROM clients WHERE name IN ('João Silva', 'Maria Santos', 'Empresa ABC Ltda')
    `);
    
    const caseResult = await pool.query(`
      SELECT id, title FROM cases WHERE title LIKE '%João Silva%' OR title LIKE '%Maria Santos%'
    `);
    
    const userResult = await pool.query(`
      SELECT id FROM users WHERE email = 'admin@autumnusjuris.com'
    `);
    
    const joaoClient = clientResult.rows.find(c => c.name === 'João Silva');
    const mariaClient = clientResult.rows.find(c => c.name === 'Maria Santos');
    const abcClient = clientResult.rows.find(c => c.name === 'Empresa ABC Ltda');
    
    const joaoCase = caseResult.rows.find(c => c.title.includes('João Silva'));
    const mariaCase = caseResult.rows.find(c => c.title.includes('Maria Santos'));
    
    const adminUser = userResult.rows[0];

    if (!adminUser) {
      console.log('❌ Usuário admin não encontrado');
      return;
    }

    // Documentos para inserir
    const documents = [
      {
        name: 'Contrato de Trabalho - João Silva',
        description: 'Contrato de trabalho original do processo trabalhista',
        type: 'contrato',
        file_path: '/storage/documents/contracts/contrato_trabalho_joao_silva.txt',
        file_size: 1024,
        mime_type: 'text/plain',
        case_id: joaoCase?.id,
        client_id: joaoClient?.id,
        folder: 'Contratos',
        tags: ['contrato', 'trabalhista', 'evidencia']
      },
      {
        name: 'Petição Inicial Trabalhista',
        description: 'Petição inicial do processo de horas extras',
        type: 'peticao',
        file_path: '/storage/documents/petitions/peticao_inicial_trabalhista.txt',
        file_size: 2048,
        mime_type: 'text/plain',
        case_id: joaoCase?.id,
        client_id: joaoClient?.id,
        folder: 'Petições',
        tags: ['peticao', 'inicial', 'trabalhista']
      },
      {
        name: 'Holerites - Comprovação Horas Extras',
        description: 'Holerites comprovando horas extras não pagas',
        type: 'evidencia',
        file_path: '/storage/documents/evidence/holerites_joao_silva.txt',
        file_size: 1536,
        mime_type: 'text/plain',
        case_id: joaoCase?.id,
        client_id: joaoClient?.id,
        folder: 'Evidências',
        tags: ['evidencia', 'holerite', 'horas-extras']
      },
      {
        name: 'Documento Identidade - Maria Santos',
        description: 'Cópia do documento de identidade para divórcio',
        type: 'documento',
        file_path: '/storage/documents/identity_maria_santos.pdf',
        file_size: 512,
        mime_type: 'application/pdf',
        case_id: mariaCase?.id,
        client_id: mariaClient?.id,
        folder: 'Documentos Pessoais',
        tags: ['identidade', 'divorcio', 'pessoal']
      },
      {
        name: 'Contrato Consultoria - ABC Ltda',
        description: 'Contrato de prestação de serviços jurídicos',
        type: 'contrato',
        file_path: '/storage/documents/contracts/contrato_consultoria_abc.pdf',
        file_size: 3072,
        mime_type: 'application/pdf',
        client_id: abcClient?.id,
        folder: 'Contratos',
        tags: ['contrato', 'consultoria', 'empresarial']
      }
    ];

    for (const doc of documents) {
      const result = await pool.query(`
        INSERT INTO documents (
          name, description, type, file_path, file_size, mime_type,
          case_id, client_id, folder, tags, status, created_by
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'final', $11
        ) RETURNING id, name;
      `, [
        doc.name, doc.description, doc.type, doc.file_path, doc.file_size, 
        doc.mime_type, doc.case_id, doc.client_id, doc.folder, doc.tags, adminUser.id
      ]);
      
      console.log(`✅ Documento inserido: ${result.rows[0].name}`);
    }

    console.log('📄 Todos os documentos foram inseridos!');
    
  } catch (error) {
    console.error('❌ Erro ao inserir documentos:', error);
    throw error;
  } finally {
    await pool.end();
  }
};

// Executar
insertDocuments()
  .then(() => {
    console.log('✅ Script finalizado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  });