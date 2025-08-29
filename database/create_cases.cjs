// database/create_cases.cjs
const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  user: process.env.DB_USER || 'autumnusjuris',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'autumnusjuris_db',
  password: process.env.DB_PASSWORD || 'autumnusjuris2024',
  port: parseInt(process.env.DB_PORT || '5432'),
});

const createCases = async () => {
  console.log('⚖️ Criando casos...');
  
  try {
    // Buscar IDs de usuários e clientes
    const usersResult = await pool.query('SELECT id, email FROM users');
    const clientsResult = await pool.query('SELECT id, name FROM clients');
    
    const adminUser = usersResult.rows.find(u => u.email === 'admin@autumnusjuris.com');
    const lawyerUser = usersResult.rows.find(u => u.email === 'lawyer1@autumnusjuris.com');
    
    const joaoClient = clientsResult.rows.find(c => c.name === 'João Silva');
    const mariaClient = clientsResult.rows.find(c => c.name === 'Maria Santos');
    const abcClient = clientsResult.rows.find(c => c.name === 'Empresa ABC Ltda');
    
    console.log('Admin:', adminUser);
    console.log('Lawyer:', lawyerUser);
    console.log('Clientes:', clientsResult.rows.map(c => c.name));

    if (!adminUser || !lawyerUser || !joaoClient || !mariaClient || !abcClient) {
      console.log('❌ Usuários ou clientes não encontrados');
      return;
    }

    // Casos para criar
    const cases = [
      {
        title: 'Processo Trabalhista - João Silva',
        description: 'Ação trabalhista contra empresa XYZ por horas extras não pagas e adicional noturno.',
        status: 'active',
        priority: 'high',
        client_id: joaoClient.id,
        lawyer_id: adminUser.id,
        process_number: '0001234-56.2024.5.02.0001',
        court: '2ª Vara do Trabalho de São Paulo',
        subject: 'Ação de Cobrança de Horas Extras',
        value: 15000,
        start_date: '2024-01-15',
        expected_end_date: '2024-06-15',
        next_action: 'Audiência de Instrução e Julgamento',
        next_action_date: '2024-03-20'
      },
      {
        title: 'Divórcio Consensual - Maria Santos',
        description: 'Processo de divórcio consensual com partilha de bens e guarda compartilhada.',
        status: 'active',
        priority: 'medium',
        client_id: mariaClient.id,
        lawyer_id: lawyerUser.id,
        process_number: '0007890-12.2024.8.26.0100',
        court: '1ª Vara de Família de São Paulo',
        subject: 'Divórcio Consensual',
        value: 0,
        start_date: '2024-02-01',
        expected_end_date: '2024-05-01',
        next_action: 'Homologação do Acordo',
        next_action_date: '2024-03-15'
      },
      {
        title: 'Consultoria Empresarial - ABC Ltda',
        description: 'Consultoria jurídica para reestruturação societária e compliance.',
        status: 'active',
        priority: 'high',
        client_id: abcClient.id,
        lawyer_id: adminUser.id,
        court: 'Consultoria Extrajudicial',
        subject: 'Reestruturação Societária',
        value: 50000,
        start_date: '2024-01-10',
        expected_end_date: '2024-12-31',
        next_action: 'Reunião de Acompanhamento',
        next_action_date: '2024-03-25'
      }
    ];

    for (const caseData of cases) {
      const result = await pool.query(`
        INSERT INTO cases (
          title, description, status, priority, client_id, lawyer_id,
          process_number, court, subject, value, start_date, expected_end_date,
          next_action, next_action_date
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14
        ) RETURNING id, title;
      `, [
        caseData.title, caseData.description, caseData.status, caseData.priority,
        caseData.client_id, caseData.lawyer_id, caseData.process_number,
        caseData.court, caseData.subject, caseData.value, caseData.start_date,
        caseData.expected_end_date, caseData.next_action, caseData.next_action_date
      ]);
      
      console.log(`✅ Caso criado: ${result.rows[0].title}`);
    }

    console.log('🎉 Todos os casos foram criados!');
    
  } catch (error) {
    console.error('❌ Erro ao criar casos:', error);
    throw error;
  } finally {
    await pool.end();
  }
};

// Executar
createCases()
  .then(() => {
    console.log('✅ Script finalizado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  });