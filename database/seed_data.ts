// database/seed_data.ts
// Script para migrar dados mock para PostgreSQL
import { pool, testConnection } from '../src/lib/database.js';
import * as fs from 'fs';
import * as path from 'path';

const seedData = async () => {
  console.log('🌱 Iniciando migração de dados mock para PostgreSQL...');
  
  try {
    // Teste de conexão
    const connected = await testConnection();
    if (!connected) {
      throw new Error('Não foi possível conectar à base de dados');
    }

    // 1. Criar usuário padrão (advogado principal)
    console.log('👤 Criando usuários...');
    const userResult = await pool.query(`
      INSERT INTO users (id, email, password_hash, full_name, role, oab_number, phone)
      VALUES 
        ('d1e2f3g4-h5i6-j7k8-l9m0-n1o2p3q4r5s6', 'admin@autumnusjuris.com', '$2b$12$LQv3c1yqBwlkqynyb9FcweHQzK8dNVTcXzEDBjSCYWF1zGPBdP8R6', 'Dr. João Silva', 'admin', 'SP123456', '(11) 99999-9999'),
        ('e2f3g4h5-i6j7-k8l9-m0n1-o2p3q4r5s6t7', 'lawyer1@autumnusjuris.com', '$2b$12$LQv3c1yqBwlkqynyb9FcweHQzK8dNVTcXzEDBjSCYWF1zGPBdP8R6', 'Dra. Maria Santos', 'lawyer', 'SP654321', '(11) 88888-8888')
      ON CONFLICT (email) DO NOTHING
      RETURNING id;
    `);
    console.log(`✅ ${userResult.rowCount || 0} usuários criados`);

    // 2. Criar clientes
    console.log('👥 Criando clientes...');
    const clientsData = [
      {
        id: 'c1e2f3g4-h5i6-j7k8-l9m0-n1o2p3q4r5s6',
        name: 'João Silva',
        email: 'joao.silva@email.com',
        phone: '(11) 99999-9999',
        document: '12345678900',
        document_type: 'cpf',
        type: 'individual',
        classification: 'premium',
        street: 'Rua das Flores',
        number: '123',
        complement: 'Apto 45',
        neighborhood: 'Centro',
        city: 'São Paulo',
        state: 'SP',
        zip_code: '01234567',
        birth_date: '1985-06-15',
        profession: 'Engenheiro',
        marital_status: 'Casado',
        notes: 'Cliente muito pontual e organizado. Sempre traz toda documentação necessária.',
        total_cases: 3,
        active_cases: 1,
        total_billed: 25000,
        last_contact: '2024-03-08T09:00:00Z'
      },
      {
        id: 'c2e3f4g5-h6i7-j8k9-l0m1-n2o3p4q5r6s7',
        name: 'Maria Santos',
        email: 'maria.santos@email.com',
        phone: '(11) 88888-8888',
        document: '98765432100',
        document_type: 'cpf',
        type: 'individual',
        classification: 'standard',
        street: 'Av. Paulista',
        number: '1000',
        neighborhood: 'Bela Vista',
        city: 'São Paulo',
        state: 'SP',
        zip_code: '01310100',
        birth_date: '1978-03-22',
        profession: 'Professora',
        marital_status: 'Divorciada',
        notes: 'Caso de divórcio consensual. Cliente colaborativa e compreensiva.',
        total_cases: 1,
        active_cases: 1,
        total_billed: 8000,
        last_contact: '2024-03-09T14:00:00Z'
      },
      {
        id: 'c3e4f5g6-h7i8-j9k0-l1m2-n3o4p5q6r7s8',
        name: 'Empresa ABC Ltda',
        email: 'contato@empresaabc.com',
        phone: '(11) 3333-3333',
        document: '12345678000190',
        document_type: 'cnpj',
        type: 'company',
        classification: 'vip',
        street: 'Rua do Comércio',
        number: '456',
        neighborhood: 'Vila Olimpia',
        city: 'São Paulo',
        state: 'SP',
        zip_code: '04551060',
        contact_person: 'Carlos Oliveira (Diretor Jurídico)',
        notes: 'Grande empresa cliente. Múltiplos contratos e demandas regulares.',
        custom_fields: JSON.stringify({ segmento: 'Tecnologia', funcionarios: 150 }),
        total_cases: 5,
        active_cases: 2,
        total_billed: 85000,
        last_contact: '2024-03-05T15:30:00Z'
      },
      {
        id: 'c4e5f6g7-h8i9-j0k1-l2m3-n4o5p6q7r8s9',
        name: 'Pedro Oliveira',
        email: 'pedro.oliveira@email.com',
        phone: '(11) 77777-7777',
        document: '45678912300',
        document_type: 'cpf',
        type: 'individual',
        status: 'prospect',
        classification: 'basic',
        street: 'Rua das Palmeiras',
        number: '789',
        neighborhood: 'Morumbi',
        city: 'São Paulo',
        state: 'SP',
        zip_code: '05651000',
        birth_date: '1990-11-03',
        profession: 'Médico',
        marital_status: 'Solteiro',
        notes: 'Prospect interessado em consultoria tributária. Aguardando proposta.',
        total_cases: 0,
        active_cases: 0,
        total_billed: 0
      },
      {
        id: 'c5e6f7g8-h9i0-j1k2-l3m4-n5o6p7q8r9s0',
        name: 'Ana Costa',
        email: 'ana.costa@email.com',
        phone: '(11) 66666-6666',
        document: '32165498700',
        document_type: 'cpf',
        type: 'individual',
        status: 'former',
        classification: 'standard',
        street: 'Rua dos Jardins',
        number: '321',
        neighborhood: 'Jardins',
        city: 'São Paulo',
        state: 'SP',
        zip_code: '01404000',
        birth_date: '1983-09-12',
        profession: 'Arquiteta',
        marital_status: 'Casada',
        notes: 'Ex-cliente. Caso trabalhista resolvido com sucesso em 2023.',
        total_cases: 1,
        active_cases: 0,
        total_billed: 12000,
        last_contact: '2023-12-15T10:00:00Z'
      }
    ];

    for (const client of clientsData) {
      await pool.query(`
        INSERT INTO clients (
          id, name, email, phone, document, document_type, type, status, classification,
          street, number, complement, neighborhood, city, state, zip_code, country,
          birth_date, profession, marital_status, contact_person, notes, custom_fields,
          total_cases, active_cases, total_billed, last_contact, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, COALESCE($8, 'active'), $9,
          $10, $11, $12, $13, $14, $15, $16, 'Brasil',
          $17, $18, $19, $20, $21, COALESCE($22, '{}'),
          $23, $24, $25, $26, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        ) ON CONFLICT (id) DO NOTHING;
      `, [
        client.id, client.name, client.email, client.phone, client.document, 
        client.document_type, client.type, client.status || 'active', client.classification,
        client.street, client.number, client.complement, client.neighborhood, 
        client.city, client.state, client.zip_code,
        client.birth_date, client.profession, client.marital_status, 
        client.contact_person, client.notes, client.custom_fields,
        client.total_cases, client.active_cases, client.total_billed, client.last_contact
      ]);
    }
    console.log(`✅ ${clientsData.length} clientes criados`);

    // 3. Criar casos
    console.log('⚖️ Criando casos...');
    const casesData = [
      {
        id: 'case1-2e3f-4g5h-6i7j-8k9l0m1n2o3p',
        title: 'Processo Trabalhista - João Silva',
        description: 'Ação trabalhista contra empresa XYZ por horas extras não pagas e adicional noturno.',
        status: 'active',
        priority: 'high',
        client_id: 'c1e2f3g4-h5i6-j7k8-l9m0-n1o2p3q4r5s6',
        lawyer_id: 'd1e2f3g4-h5i6-j7k8-l9m0-n1o2p3q4r5s6',
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
        id: 'case2-3f4g-5h6i-7j8k-9l0m1n2o3p4q',
        title: 'Divórcio Consensual - Maria Santos',
        description: 'Processo de divórcio consensual com partilha de bens e guarda compartilhada.',
        status: 'active',
        priority: 'medium',
        client_id: 'c2e3f4g5-h6i7-j8k9-l0m1-n2o3p4q5r6s7',
        lawyer_id: 'e2f3g4h5-i6j7-k8l9-m0n1-o2p3q4r5s6t7',
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
        id: 'case3-4g5h-6i7j-8k9l-0m1n2o3p4q5r',
        title: 'Consultoria Empresarial - ABC Ltda',
        description: 'Consultoria jurídica para reestruturação societária e compliance.',
        status: 'active',
        priority: 'high',
        client_id: 'c3e4f5g6-h7i8-j9k0-l1m2-n3o4p5q6r7s8',
        lawyer_id: 'd1e2f3g4-h5i6-j7k8-l9m0-n1o2p3q4r5s6',
        court: 'Consultoria Extrajudicial',
        subject: 'Reestruturação Societária',
        value: 50000,
        start_date: '2024-01-10',
        expected_end_date: '2024-12-31',
        next_action: 'Reunião de Acompanhamento',
        next_action_date: '2024-03-25'
      }
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
      `, [
        caseData.id, caseData.title, caseData.description, caseData.status, 
        caseData.priority, caseData.client_id, caseData.lawyer_id, 
        caseData.process_number, caseData.court, caseData.subject, caseData.value,
        caseData.start_date, caseData.expected_end_date, caseData.next_action, 
        caseData.next_action_date
      ]);
    }
    console.log(`✅ ${casesData.length} casos criados`);

    // 4. Criar processos
    console.log('📋 Criando processos...');
    const processesData = [
      {
        id: 'proc1-2e3f-4g5h-6i7j-8k9l0m1n2o3p',
        number: '0001234-56.2024.5.02.0001',
        case_id: 'case1-2e3f-4g5h-6i7j-8k9l0m1n2o3p',
        court: '2ª Vara do Trabalho de São Paulo',
        judicial_district: '2ª Região',
        city: 'São Paulo',
        state: 'SP',
        plaintiff: 'João Silva',
        defendant: 'Empresa XYZ Ltda',
        lawyer_plaintiff: 'Dr. João Silva - OAB/SP 123456',
        subject: 'Ação de Cobrança de Horas Extras',
        class: 'Reclamação Trabalhista',
        distribution_date: '2024-01-15',
        judge: 'Dr. Carlos Roberto Silva',
        claim_value: 15000,
        status: 'active'
      },
      {
        id: 'proc2-3f4g-5h6i-7j8k-9l0m1n2o3p4q',
        number: '0007890-12.2024.8.26.0100',
        case_id: 'case2-3f4g-5h6i-7j8k-9l0m1n2o3p4q',
        court: '1ª Vara de Família de São Paulo',
        judicial_district: 'Foro Central',
        city: 'São Paulo',
        state: 'SP',
        plaintiff: 'Maria Santos',
        defendant: 'José Santos',
        lawyer_plaintiff: 'Dra. Maria Santos - OAB/SP 654321',
        subject: 'Divórcio Consensual',
        class: 'Divórcio Consensual',
        distribution_date: '2024-02-01',
        judge: 'Dra. Ana Paula Costa',
        claim_value: 0,
        status: 'active'
      }
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
      `, [
        process.id, process.number, process.case_id, process.court,
        process.judicial_district, process.city, process.state,
        process.plaintiff, process.defendant, process.lawyer_plaintiff,
        process.subject, process.class, process.distribution_date,
        process.judge, process.claim_value, process.status
      ]);
    }
    console.log(`✅ ${processesData.length} processos criados`);

    // 5. Criar movimentações processuais
    console.log('📝 Criando movimentações processuais...');
    const movementsData = [
      {
        process_id: 'proc1-2e3f-4g5h-6i7j-8k9l0m1n2o3p',
        date: '2024-01-15',
        description: 'Distribuída a Reclamação Trabalhista',
        type: 'Distribuição',
        responsible: 'Sistema'
      },
      {
        process_id: 'proc1-2e3f-4g5h-6i7j-8k9l0m1n2o3p',
        date: '2024-01-20',
        description: 'Designada audiência de conciliação para 15/02/2024',
        type: 'Designação de Audiência',
        responsible: 'Dr. Carlos Roberto Silva'
      },
      {
        process_id: 'proc1-2e3f-4g5h-6i7j-8k9l0m1n2o3p',
        date: '2024-02-15',
        description: 'Realizada audiência de conciliação - sem acordo',
        type: 'Ata de Audiência',
        responsible: 'Dr. Carlos Roberto Silva'
      },
      {
        process_id: 'proc2-3f4g-5h6i-7j8k-9l0m1n2o3p4q',
        date: '2024-02-01',
        description: 'Distribuído o pedido de divórcio consensual',
        type: 'Distribuição',
        responsible: 'Sistema'
      },
      {
        process_id: 'proc2-3f4g-5h6i-7j8k-9l0m1n2o3p4q',
        date: '2024-02-10',
        description: 'Juntada procuração e documentos',
        type: 'Juntada',
        responsible: 'Cartório'
      }
    ];

    for (const movement of movementsData) {
      await pool.query(`
        INSERT INTO process_movements (
          process_id, date, description, type, responsible, created_at
        ) VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP);
      `, [movement.process_id, movement.date, movement.description, movement.type, movement.responsible]);
    }
    console.log(`✅ ${movementsData.length} movimentações criadas`);

    // 6. Criar faturas
    console.log('💰 Criando faturas...');
    const invoicesData = [
      {
        id: 'inv1-2e3f-4g5h-6i7j-8k9l0m1n2o3p',
        invoice_number: 'FAT-2024-001',
        client_id: 'c1e2f3g4-h5i6-j7k8-l9m0-n1o2p3q4r5s6',
        case_id: 'case1-2e3f-4g5h-6i7j-8k9l0m1n2o3p',
        description: 'Honorários advocatícios - Processo Trabalhista',
        issue_date: '2024-02-01',
        due_date: '2024-02-15',
        subtotal: 5000,
        tax_rate: 5,
        tax_amount: 250,
        total: 5250,
        status: 'paid',
        payment_date: '2024-02-14',
        payment_method: 'Transferência Bancária'
      },
      {
        id: 'inv2-3f4g-5h6i-7j8k-9l0m1n2o3p4q',
        invoice_number: 'FAT-2024-002',
        client_id: 'c2e3f4g5-h6i7-j8k9-l0m1-n2o3p4q5r6s7',
        case_id: 'case2-3f4g-5h6i-7j8k-9l0m1n2o3p4q',
        description: 'Honorários advocatícios - Divórcio Consensual',
        issue_date: '2024-02-15',
        due_date: '2024-03-01',
        subtotal: 3000,
        tax_rate: 5,
        tax_amount: 150,
        total: 3150,
        status: 'sent',
        payment_method: null
      }
    ];

    for (const invoice of invoicesData) {
      await pool.query(`
        INSERT INTO invoices (
          id, invoice_number, client_id, case_id, description, issue_date, due_date,
          subtotal, tax_rate, tax_amount, total, status, payment_date, payment_method,
          created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14,
          CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        ) ON CONFLICT (invoice_number) DO NOTHING;
      `, [
        invoice.id, invoice.invoice_number, invoice.client_id, invoice.case_id,
        invoice.description, invoice.issue_date, invoice.due_date,
        invoice.subtotal, invoice.tax_rate, invoice.tax_amount, invoice.total,
        invoice.status, invoice.payment_date, invoice.payment_method
      ]);
    }
    console.log(`✅ ${invoicesData.length} faturas criadas`);

    // 7. Criar tarefas
    console.log('✅ Criando tarefas...');
    const tasksData = [
      {
        id: 'task1-2e3f-4g5h-6i7j-8k9l0m1n2o3p',
        title: 'Preparar defesa para audiência',
        description: 'Elaborar defesa técnica para audiência de instrução do processo trabalhista',
        status: 'in_progress',
        priority: 'high',
        assigned_to: 'd1e2f3g4-h5i6-j7k8-l9m0-n1o2p3q4r5s6',
        created_by: 'd1e2f3g4-h5i6-j7k8-l9m0-n1o2p3q4r5s6',
        case_id: 'case1-2e3f-4g5h-6i7j-8k9l0m1n2o3p',
        client_id: 'c1e2f3g4-h5i6-j7k8-l9m0-n1o2p3q4r5s6',
        due_date: '2024-03-18'
      },
      {
        id: 'task2-3f4g-5h6i-7j8k-9l0m1n2o3p4q',
        title: 'Coletar documentos divórcio',
        description: 'Solicitar documentos pendentes do cliente para finalizar divórcio',
        status: 'pending',
        priority: 'medium',
        assigned_to: 'e2f3g4h5-i6j7-k8l9-m0n1-o2p3q4r5s6t7',
        created_by: 'e2f3g4h5-i6j7-k8l9-m0n1-o2p3q4r5s6t7',
        case_id: 'case2-3f4g-5h6i-7j8k-9l0m1n2o3p4q',
        client_id: 'c2e3f4g5-h6i7-j8k9-l0m1-n2o3p4q5r6s7',
        due_date: '2024-03-10'
      },
      {
        id: 'task3-4g5h-6i7j-8k9l-0m1n2o3p4q5r',
        title: 'Relatório mensal - ABC Ltda',
        description: 'Elaborar relatório mensal de atividades para o cliente ABC Ltda',
        status: 'completed',
        priority: 'medium',
        assigned_to: 'd1e2f3g4-h5i6-j7k8-l9m0-n1o2p3q4r5s6',
        created_by: 'd1e2f3g4-h5i6-j7k8-l9m0-n1o2p3q4r5s6',
        case_id: 'case3-4g5h-6i7j-8k9l-0m1n2o3p4q5r',
        client_id: 'c3e4f5g6-h7i8-j9k0-l1m2-n3o4p5q6r7s8',
        due_date: '2024-02-28',
        completed_at: '2024-02-27T15:30:00Z'
      }
    ];

    for (const task of tasksData) {
      await pool.query(`
        INSERT INTO tasks (
          id, title, description, status, priority, assigned_to, created_by,
          case_id, client_id, due_date, completed_at, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11,
          CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        ) ON CONFLICT (id) DO NOTHING;
      `, [
        task.id, task.title, task.description, task.status, task.priority,
        task.assigned_to, task.created_by, task.case_id, task.client_id,
        task.due_date, task.completed_at
      ]);
    }
    console.log(`✅ ${tasksData.length} tarefas criadas`);

    // 8. Criar interações com clientes
    console.log('📞 Criando interações com clientes...');
    const interactionsData = [
      {
        client_id: 'c1e2f3g4-h5i6-j7k8-l9m0-n1o2p3q4r5s6',
        user_id: 'd1e2f3g4-h5i6-j7k8-l9m0-n1o2p3q4r5s6',
        type: 'meeting',
        subject: 'Reunião inicial - Processo Trabalhista',
        description: 'Reunião para discutir os detalhes do processo trabalhista. Cliente apresentou toda documentação necessária.',
        interaction_date: '2024-03-08T09:00:00Z'
      },
      {
        client_id: 'c1e2f3g4-h5i6-j7k8-l9m0-n1o2p3q4r5s6',
        user_id: 'd1e2f3g4-h5i6-j7k8-l9m0-n1o2p3q4r5s6',
        type: 'call',
        subject: 'Atualização sobre audiência',
        description: 'Ligação para informar data da audiência de conciliação marcada para 15/03.',
        interaction_date: '2024-03-10T14:00:00Z'
      },
      {
        client_id: 'c2e3f4g5-h6i7-j8k9-l0m1-n2o3p4q5r6s7',
        user_id: 'e2f3g4h5-i6j7-k8l9-m0n1-o2p3q4r5s6t7',
        type: 'email',
        subject: 'Documentos para divórcio',
        description: 'Enviado lista de documentos necessários para prosseguir com o divórcio consensual.',
        interaction_date: '2024-03-09T14:00:00Z'
      }
    ];

    for (const interaction of interactionsData) {
      await pool.query(`
        INSERT INTO client_interactions (
          client_id, user_id, type, subject, description, interaction_date, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP);
      `, [
        interaction.client_id, interaction.user_id, interaction.type,
        interaction.subject, interaction.description, interaction.interaction_date
      ]);
    }
    console.log(`✅ ${interactionsData.length} interações criadas`);

    console.log('🎉 Migração de dados concluída com sucesso!');
    console.log('📊 Resumo:');
    console.log(`  - 2 usuários`);
    console.log(`  - ${clientsData.length} clientes`);
    console.log(`  - ${casesData.length} casos`);
    console.log(`  - ${processesData.length} processos`);
    console.log(`  - ${movementsData.length} movimentações`);
    console.log(`  - ${invoicesData.length} faturas`);
    console.log(`  - ${tasksData.length} tarefas`);
    console.log(`  - ${interactionsData.length} interações`);

  } catch (error) {
    console.error('❌ Erro na migração:', error);
    throw error;
  } finally {
    await pool.end();
  }
};

// Executar se chamado diretamente
if (require.main === module) {
  seedData()
    .then(() => {
      console.log('✅ Script de migração finalizado');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Erro fatal:', error);
      process.exit(1);
    });
}

export { seedData };