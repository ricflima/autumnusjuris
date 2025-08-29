// database/migrate.js
// Script de migração em JavaScript puro
const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  user: process.env.DB_USER || 'autumnusjuris',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'autumnusjuris_db',
  password: process.env.DB_PASSWORD || 'autumnusjuris2024',
  port: parseInt(process.env.DB_PORT || '5432'),
});

async function testConnection() {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    client.release();
    console.log('✅ Conexão com PostgreSQL estabelecida:', result.rows[0].now);
    return true;
  } catch (error) {
    console.error('❌ Erro ao conectar com PostgreSQL:', error);
    return false;
  }
}

const seedData = async () => {
  console.log('🌱 Iniciando migração de dados mock para PostgreSQL...');
  
  try {
    const connected = await testConnection();
    if (!connected) {
      throw new Error('Não foi possível conectar à base de dados');
    }

    // 1. Criar usuário padrão
    console.log('👤 Criando usuários...');
    const userResult = await pool.query(`
      INSERT INTO users (email, password_hash, full_name, role, oab_number, phone)
      VALUES 
        ('admin@autumnusjuris.com', '$2b$12$LQv3c1yqBwlkqynyb9FcweHQzK8dNVTcXzEDBjSCYWF1zGPBdP8R6', 'Dr. João Silva', 'admin', 'SP123456', '(11) 99999-9999'),
        ('lawyer1@autumnusjuris.com', '$2b$12$LQv3c1yqBwlkqynyb9FcweHQzK8dNVTcXzEDBjSCYWF1zGPBdP8R6', 'Dra. Maria Santos', 'lawyer', 'SP654321', '(11) 88888-8888')
      ON CONFLICT (email) DO NOTHING
      RETURNING id;
    `);
    console.log(`✅ ${userResult.rowCount || 0} usuários criados`);

    // 2. Criar clientes
    console.log('👥 Criando clientes...');
    const clientsData = [
      ['c1e2f3g4-h5i6-j7k8-l9m0-n1o2p3q4r5s6', 'João Silva', 'joao.silva@email.com', '(11) 99999-9999', '12345678900', 'cpf', 'individual', 'active', 'premium', 'Rua das Flores', '123', 'Apto 45', 'Centro', 'São Paulo', 'SP', '01234567', '1985-06-15', 'Engenheiro', 'Casado', null, 'Cliente muito pontual e organizado. Sempre traz toda documentação necessária.', '{}', 3, 1, 25000, '2024-03-08T09:00:00Z'],
      ['c2e3f4g5-h6i7-j8k9-l0m1-n2o3p4q5r6s7', 'Maria Santos', 'maria.santos@email.com', '(11) 88888-8888', '98765432100', 'cpf', 'individual', 'active', 'standard', 'Av. Paulista', '1000', null, 'Bela Vista', 'São Paulo', 'SP', '01310100', '1978-03-22', 'Professora', 'Divorciada', null, 'Caso de divórcio consensual. Cliente colaborativa e compreensiva.', '{}', 1, 1, 8000, '2024-03-09T14:00:00Z'],
      ['c3e4f5g6-h7i8-j9k0-l1m2-n3o4p5q6r7s8', 'Empresa ABC Ltda', 'contato@empresaabc.com', '(11) 3333-3333', '12345678000190', 'cnpj', 'company', 'active', 'vip', 'Rua do Comércio', '456', null, 'Vila Olimpia', 'São Paulo', 'SP', '04551060', null, null, null, 'Carlos Oliveira (Diretor Jurídico)', 'Grande empresa cliente. Múltiplos contratos e demandas regulares.', '{"segmento": "Tecnologia", "funcionarios": 150}', 5, 2, 85000, '2024-03-05T15:30:00Z'],
      ['c4e5f6g7-h8i9-j0k1-l2m3-n4o5p6q7r8s9', 'Pedro Oliveira', 'pedro.oliveira@email.com', '(11) 77777-7777', '45678912300', 'cpf', 'individual', 'prospect', 'basic', 'Rua das Palmeiras', '789', null, 'Morumbi', 'São Paulo', 'SP', '05651000', '1990-11-03', 'Médico', 'Solteiro', null, 'Prospect interessado em consultoria tributária. Aguardando proposta.', '{}', 0, 0, 0, null],
      ['c5e6f7g8-h9i0-j1k2-l3m4-n5o6p7q8r9s0', 'Ana Costa', 'ana.costa@email.com', '(11) 66666-6666', '32165498700', 'cpf', 'individual', 'former', 'standard', 'Rua dos Jardins', '321', null, 'Jardins', 'São Paulo', 'SP', '01404000', '1983-09-12', 'Arquiteta', 'Casada', null, 'Ex-cliente. Caso trabalhista resolvido com sucesso em 2023.', '{}', 1, 0, 12000, '2023-12-15T10:00:00Z']
    ];

    for (const client of clientsData) {
      await pool.query(`
        INSERT INTO clients (
          id, name, email, phone, document, document_type, type, status, classification,
          street, number, complement, neighborhood, city, state, zip_code, country,
          birth_date, profession, marital_status, contact_person, notes, custom_fields,
          total_cases, active_cases, total_billed, last_contact, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9,
          $10, $11, $12, $13, $14, $15, $16, 'Brasil',
          $17, $18, $19, $20, $21, $22,
          $23, $24, $25, $26, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        ) ON CONFLICT (id) DO NOTHING;
      `, client);
    }
    console.log(`✅ ${clientsData.length} clientes criados`);

    // 3. Criar casos
    console.log('⚖️ Criando casos...');
    const casesData = [
      ['case1-2e3f-4g5h-6i7j-8k9l0m1n2o3p', 'Processo Trabalhista - João Silva', 'Ação trabalhista contra empresa XYZ por horas extras não pagas e adicional noturno.', 'active', 'high', 'c1e2f3g4-h5i6-j7k8-l9m0-n1o2p3q4r5s6', 'd1e2f3g4-h5i6-j7k8-l9m0-n1o2p3q4r5s6', '0001234-56.2024.5.02.0001', '2ª Vara do Trabalho de São Paulo', 'Ação de Cobrança de Horas Extras', 15000, '2024-01-15', '2024-06-15', 'Audiência de Instrução e Julgamento', '2024-03-20'],
      ['case2-3f4g-5h6i-7j8k-9l0m1n2o3p4q', 'Divórcio Consensual - Maria Santos', 'Processo de divórcio consensual com partilha de bens e guarda compartilhada.', 'active', 'medium', 'c2e3f4g5-h6i7-j8k9-l0m1-n2o3p4q5r6s7', 'e2f3g4h5-i6j7-k8l9-m0n1-o2p3q4r5s6t7', '0007890-12.2024.8.26.0100', '1ª Vara de Família de São Paulo', 'Divórcio Consensual', 0, '2024-02-01', '2024-05-01', 'Homologação do Acordo', '2024-03-15'],
      ['case3-4g5h-6i7j-8k9l-0m1n2o3p4q5r', 'Consultoria Empresarial - ABC Ltda', 'Consultoria jurídica para reestruturação societária e compliance.', 'active', 'high', 'c3e4f5g6-h7i8-j9k0-l1m2-n3o4p5q6r7s8', 'd1e2f3g4-h5i6-j7k8-l9m0-n1o2p3q4r5s6', null, 'Consultoria Extrajudicial', 'Reestruturação Societária', 50000, '2024-01-10', '2024-12-31', 'Reunião de Acompanhamento', '2024-03-25']
    ];

    for (const caseData of casesData) {
      await pool.query(`
        INSERT INTO cases (
          id, title, description, status, priority, client_id, lawyer_id,
          process_number, court, subject, value, start_date, expected_end_date,
          next_action, next_action_date, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
          CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        ) ON CONFLICT (id) DO NOTHING;
      `, caseData);
    }
    console.log(`✅ ${casesData.length} casos criados`);

    // 4. Criar processos
    console.log('📋 Criando processos...');
    const processesData = [
      ['proc1-2e3f-4g5h-6i7j-8k9l0m1n2o3p', '0001234-56.2024.5.02.0001', 'case1-2e3f-4g5h-6i7j-8k9l0m1n2o3p', '2ª Vara do Trabalho de São Paulo', '2ª Região', 'São Paulo', 'SP', 'João Silva', 'Empresa XYZ Ltda', 'Dr. João Silva - OAB/SP 123456', 'Ação de Cobrança de Horas Extras', 'Reclamação Trabalhista', '2024-01-15', 'Dr. Carlos Roberto Silva', 15000, 'active'],
      ['proc2-3f4g-5h6i-7j8k-9l0m1n2o3p4q', '0007890-12.2024.8.26.0100', 'case2-3f4g-5h6i-7j8k-9l0m1n2o3p4q', '1ª Vara de Família de São Paulo', 'Foro Central', 'São Paulo', 'SP', 'Maria Santos', 'José Santos', 'Dra. Maria Santos - OAB/SP 654321', 'Divórcio Consensual', 'Divórcio Consensual', '2024-02-01', 'Dra. Ana Paula Costa', 0, 'active']
    ];

    for (const process of processesData) {
      await pool.query(`
        INSERT INTO processes (
          id, number, case_id, court, judicial_district, city, state,
          plaintiff, defendant, lawyer_plaintiff, subject, class,
          distribution_date, judge, claim_value, status, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16,
          CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        ) ON CONFLICT (number) DO NOTHING;
      `, process);
    }
    console.log(`✅ ${processesData.length} processos criados`);

    console.log('🎉 Migração de dados concluída com sucesso!');

  } catch (error) {
    console.error('❌ Erro na migração:', error);
    throw error;
  } finally {
    await pool.end();
  }
};

// Executar
seedData()
  .then(() => {
    console.log('✅ Script de migração finalizado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  });