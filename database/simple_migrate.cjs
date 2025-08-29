// database/simple_migrate.cjs
// Script simples de migração
const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  user: process.env.DB_USER || 'autumnusjuris',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'autumnusjuris_db',
  password: process.env.DB_PASSWORD || 'autumnusjuris2024',
  port: parseInt(process.env.DB_PORT || '5432'),
});

const seedData = async () => {
  console.log('🌱 Iniciando migração simplificada...');
  
  try {
    // Teste de conexão
    const client = await pool.connect();
    console.log('✅ Conexão estabelecida');
    client.release();

    // 1. Criar usuários
    console.log('👤 Criando usuários...');
    const userResult = await pool.query(`
      INSERT INTO users (email, password_hash, full_name, role, oab_number, phone)
      VALUES 
        ('admin@autumnusjuris.com', '$2b$12$LQv3c1yqBwlkqynyb9FcweHQzK8dNVTcXzEDBjSCYWF1zGPBdP8R6', 'Dr. João Silva', 'admin', 'SP123456', '(11) 99999-9999'),
        ('lawyer1@autumnusjuris.com', '$2b$12$LQv3c1yqBwlkqynyb9FcweHQzK8dNVTcXzEDBjSCYWF1zGPBdP8R6', 'Dra. Maria Santos', 'lawyer', 'SP654321', '(11) 88888-8888')
      ON CONFLICT (email) DO NOTHING
      RETURNING id, email;
    `);
    
    const users = userResult.rows;
    console.log(`✅ ${users.length} usuários criados:`, users.map(u => u.email));
    
    const adminId = users.find(u => u.email === 'admin@autumnusjuris.com')?.id;
    const lawyerId = users.find(u => u.email === 'lawyer1@autumnusjuris.com')?.id;

    // 2. Criar clientes
    console.log('👥 Criando clientes...');
    const clientResult = await pool.query(`
      INSERT INTO clients (name, email, phone, document, document_type, type, status, classification,
                          street, number, neighborhood, city, state, zip_code, 
                          birth_date, profession, marital_status, notes,
                          total_cases, active_cases, total_billed)
      VALUES 
        ('João Silva', 'joao.silva@email.com', '(11) 99999-9999', '12345678900', 'cpf', 'individual', 'active', 'premium',
         'Rua das Flores', '123', 'Centro', 'São Paulo', 'SP', '01234567',
         '1985-06-15', 'Engenheiro', 'Casado', 'Cliente muito pontual e organizado.',
         3, 1, 25000),
        ('Maria Santos', 'maria.santos@email.com', '(11) 88888-8888', '98765432100', 'cpf', 'individual', 'active', 'standard',
         'Av. Paulista', '1000', 'Bela Vista', 'São Paulo', 'SP', '01310100',
         '1978-03-22', 'Professora', 'Divorciada', 'Caso de divórcio consensual.',
         1, 1, 8000),
        ('Empresa ABC Ltda', 'contato@empresaabc.com', '(11) 3333-3333', '12345678000190', 'cnpj', 'company', 'active', 'vip',
         'Rua do Comércio', '456', 'Vila Olimpia', 'São Paulo', 'SP', '04551060',
         null, null, null, 'Grande empresa cliente. Múltiplos contratos.',
         5, 2, 85000)
      RETURNING id, name;
    `);
    
    const clients = clientResult.rows;
    console.log(`✅ ${clients.length} clientes criados:`, clients.map(c => c.name));

    if (clients.length > 0 && adminId && lawyerId) {
      // 3. Criar casos
      console.log('⚖️ Criando casos...');
      const caseResult = await pool.query(`
        INSERT INTO cases (title, description, status, priority, client_id, lawyer_id,
                          process_number, court, subject, value, start_date, expected_end_date,
                          next_action, next_action_date)
        VALUES 
          ('Processo Trabalhista - João Silva', 
           'Ação trabalhista contra empresa XYZ por horas extras não pagas.',
           'active', 'high', $1, $2,
           '0001234-56.2024.5.02.0001', '2ª Vara do Trabalho de São Paulo',
           'Ação de Cobrança de Horas Extras', 15000, '2024-01-15', '2024-06-15',
           'Audiência de Instrução e Julgamento', '2024-03-20'),
          ('Divórcio Consensual - Maria Santos',
           'Processo de divórcio consensual com partilha de bens.',
           'active', 'medium', $3, $4,
           '0007890-12.2024.8.26.0100', '1ª Vara de Família de São Paulo',
           'Divórcio Consensual', 0, '2024-02-01', '2024-05-01',
           'Homologação do Acordo', '2024-03-15')
        RETURNING id, title;
      `, [clients[0]?.id, adminId, clients[1]?.id, lawyerId]);
      
      console.log(`✅ ${caseResult.rows.length} casos criados`);
      const cases = caseResult.rows;
      console.log('Casos:', cases.map(c => c.title));

      // 4. Criar algumas tarefas
      console.log('✅ Criando tarefas...');
      if (caseResult.rows.length > 0) {
        await pool.query(`
          INSERT INTO tasks (title, description, status, priority, assigned_to, created_by, case_id, due_date)
          VALUES 
            ('Preparar defesa para audiência', 'Elaborar defesa técnica para audiência de instrução',
             'in_progress', 'high', $1, $1, $2, '2024-03-18'),
            ('Coletar documentos divórcio', 'Solicitar documentos pendentes do cliente',
             'pending', 'medium', $3, $3, $4, '2024-03-10')
        `, [adminId, caseResult.rows[0]?.id, lawyerId, caseResult.rows[1]?.id]);
        
        console.log('✅ Tarefas criadas');
      }
    }

    console.log('🎉 Migração concluída com sucesso!');
    
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
    console.log('✅ Script finalizado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  });