// src/services/tribunals/examples/usage.example.ts
// Exemplos de uso do sistema de consulta de tribunais - Fase 0

import TribunalMovementsService from '../../tribunalMovements.service';
import { CNJParser } from '../parsers/cnj.parser';
import TribunalIdentifierService from '../tribunalIdentifier.service';

/**
 * Exemplo 1: Consulta básica de movimentações
 */
export async function exemploConsultaBasica() {
  console.log('🔍 Exemplo 1: Consulta básica de movimentações');
  
  const service = TribunalMovementsService.getInstance();
  await service.initialize();
  
  const processNumber = '5001234-56.2023.8.26.0001'; // Exemplo TJSP
  
  try {
    const result = await service.queryMovements(processNumber);
    
    if (result.success) {
      console.log(`✅ Processo encontrado: ${result.processNumber}`);
      console.log(`📋 Tribunal: ${result.tribunal}`);
      console.log(`📊 Total de movimentações: ${result.totalMovements}`);
      console.log(`🆕 Movimentações novas: ${result.newMovements}`);
      console.log(`💾 Do cache: ${result.fromCache ? 'Sim' : 'Não'}`);
      
      if (result.novelties && result.novelties.length > 0) {
        console.log(`🔔 Novidades encontradas:`);
        result.novelties.forEach((novelty: any) => {
          console.log(`  - ${novelty.title} (${novelty.priority})`);
        });
      }
    } else {
      console.log(`❌ Erro na consulta: ${result.error}`);
    }
    
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

/**
 * Exemplo 2: Validação de números CNJ
 */
export async function exemploValidacaoCNJ() {
  console.log('🔍 Exemplo 2: Validação de números CNJ');
  
  const service = TribunalMovementsService.getInstance();
  
  const numerosParaTestar = [
    '5001234-56.2023.8.26.0001', // TJSP - válido
    '0000123-45.2023.5.02.0001', // TRT2 - válido  
    '1234567-89.2023.4.03.0001', // TRF3 - válido
    '12345678901234567890',       // Apenas números - inválido
    'abc123def',                  // Texto inválido
    ''                           // Vazio
  ];
  
  for (const numero of numerosParaTestar) {
    const validation = service.validateCNJNumber(numero);
    
    if (validation.isValid && validation.parsedNumber) {
      const cnj = validation.parsedNumber;
      console.log(`✅ ${numero}`);
      console.log(`  - Tribunal: ${cnj.tribunalName}`);
      console.log(`  - Segmento: ${cnj.judiciarySegmentName}`);
      console.log(`  - Ano: ${cnj.year}`);
      if (cnj.region) console.log(`  - Região: ${cnj.region}`);
    } else {
      console.log(`❌ ${numero || '(vazio)'}: ${validation.error}`);
    }
  }
}

/**
 * Exemplo 3: Listagem de tribunais disponíveis
 */
export async function exemploTribunaisDisponiveis() {
  console.log('🔍 Exemplo 3: Tribunais disponíveis');
  
  const service = TribunalMovementsService.getInstance();
  const tribunais = await service.getAvailableTribunals();
  
  console.log(`📋 Total de tribunais configurados: ${tribunais.length}`);
  
  // Agrupar por segmento
  const porSegmento = tribunais.reduce((acc: any, tribunal: any) => {
    if (!acc[tribunal.segmentName]) {
      acc[tribunal.segmentName] = [];
    }
    acc[tribunal.segmentName].push(tribunal);
    return acc;
  }, {} as Record<string, any[]>);
  
  Object.entries(porSegmento).forEach(([segmento, lista]) => {
    console.log(`\n📂 ${segmento} (${(lista as any[]).length} tribunais):`);
    (lista as any[])
      .sort((a: any, b: any) => a.priority - b.priority)
      .slice(0, 3) // Mostrar apenas os 3 primeiros
      .forEach((tribunal: any) => {
        const status = tribunal.isActive ? '🟢' : '🔴';
        console.log(`  ${status} ${tribunal.name} (${tribunal.code})`);
      });
    
    if ((lista as any[]).length > 3) {
      console.log(`  ... e mais ${(lista as any[]).length - 3} tribunais`);
    }
  });
}

/**
 * Exemplo 4: Monitoramento de novidades
 */
export async function exemploMonitoramentoNovidades() {
  console.log('🔍 Exemplo 4: Monitoramento de novidades');
  
  const service = TribunalMovementsService.getInstance();
  await service.initialize();
  
  try {
    // Buscar novidades não lidas
    const novidades = await service.getUnreadNovelties(10);
    
    if (novidades.length === 0) {
      console.log('📭 Nenhuma novidade não lida encontrada');
      return;
    }
    
    console.log(`🔔 ${novidades.length} novidades não lidas:`);
    
    // Agrupar por prioridade
    const porPrioridade = novidades.reduce((acc: any, nov: any) => {
      if (!acc[nov.priority]) acc[nov.priority] = [];
      acc[nov.priority].push(nov);
      return acc;
    }, {} as Record<string, any[]>);
    
    // Mostrar por prioridade (urgente primeiro)
    const prioridades = ['urgent', 'high', 'medium', 'low'];
    
    for (const prioridade of prioridades) {
      const lista = porPrioridade[prioridade];
      if (!lista?.length) continue;
      
      const emojiMap: Record<string, string> = {
        urgent: '🚨',
        high: '⚠️',
        medium: '📋',
        low: '📝'
      };
      const emoji = emojiMap[prioridade];
      
      console.log(`\n${emoji} ${prioridade.toUpperCase()} (${lista.length}):`);
      
      lista.slice(0, 3).forEach((nov: any) => {
        console.log(`  • ${nov.title}`);
        console.log(`    ${nov.cnjNumber} - ${nov.tribunalName}`);
        console.log(`    Expira em ${nov.remainingHours}h`);
      });
    }
    
    // Simular marcação como lida (apenas as 3 primeiras)
    const primeiras3 = novidades.slice(0, 3).map((n: any) => n.id);
    if (primeiras3.length > 0) {
      await service.markNoveltiesAsRead(primeiras3);
      console.log(`\n✅ ${primeiras3.length} novidades marcadas como lidas`);
    }
    
  } catch (error) {
    console.error('❌ Erro ao buscar novidades:', error);
  }
}

/**
 * Exemplo 5: Estatísticas do sistema
 */
export async function exemploEstatisticas() {
  console.log('🔍 Exemplo 5: Estatísticas do sistema');
  
  const service = TribunalMovementsService.getInstance();
  
  try {
    const stats = await service.getSystemStatistics();
    
    console.log('📊 Estatísticas do Sistema:');
    
    // Estatísticas de cache
    console.log('\n💾 Cache:');
    console.log(`  - Hits: ${stats.cache.memoryCache.hits}`);
    console.log(`  - Misses: ${stats.cache.memoryCache.misses}`);
    console.log(`  - Taxa de acerto: ${stats.cache.memoryCache.hitRate.toFixed(1)}%`);
    console.log(`  - Itens em memória: ${stats.cache.memoryCache.totalItems}`);
    console.log(`  - Tamanho: ${(stats.cache.memoryCache.totalSize / 1024).toFixed(1)} KB`);
    
    // Estatísticas de novidades
    console.log('\n🔔 Novidades:');
    console.log(`  - Total: ${stats.novelties.total}`);
    console.log(`  - Não lidas: ${stats.novelties.unread}`);
    
    if (stats.novelties.byPriority) {
      console.log('  - Por prioridade:');
      Object.entries(stats.novelties.byPriority).forEach(([prioridade, count]) => {
        console.log(`    ${prioridade}: ${count}`);
      });
    }
    
    // Estatísticas de tribunais
    if (stats.tribunals.length > 0) {
      console.log('\n🏛️ Tribunais mais consultados:');
      stats.tribunals
        .sort((a: any, b: any) => b.totalProcesses - a.totalProcesses)
        .slice(0, 5)
        .forEach((tribunal: any) => {
          console.log(`  - ${tribunal.tribunalName}: ${tribunal.totalProcesses} processos`);
        });
    }
    
  } catch (error) {
    console.error('❌ Erro ao buscar estatísticas:', error);
  }
}

/**
 * Exemplo 6: Limpeza automática do sistema
 */
export async function exemploLimpezaSistema() {
  console.log('🔍 Exemplo 6: Limpeza do sistema');
  
  const service = TribunalMovementsService.getInstance();
  
  try {
    console.log('🧹 Executando limpeza automática...');
    
    const resultado = await service.runSystemCleanup();
    
    console.log('✅ Limpeza concluída:');
    console.log(`  - Cache: ${resultado.cache.memoryCleared} itens removidos da memória`);
    console.log(`  - Cache: ${resultado.cache.persistentCleared} itens expirados removidos`);
    console.log(`  - Novidades: ${resultado.novelties.removed} novidades expiradas removidas`);
    
    if (resultado.novelties.errors > 0) {
      console.log(`  ⚠️ ${resultado.novelties.errors} erros durante a limpeza`);
    }
    
  } catch (error) {
    console.error('❌ Erro na limpeza:', error);
  }
}

/**
 * Executa todos os exemplos
 */
export async function executarTodosExemplos() {
  console.log('🚀 Executando exemplos do sistema de tribunais\n');
  
  try {
    await exemploValidacaoCNJ();
    console.log('\n' + '='.repeat(50) + '\n');
    
    await exemploTribunaisDisponiveis();
    console.log('\n' + '='.repeat(50) + '\n');
    
    await exemploConsultaBasica();
    console.log('\n' + '='.repeat(50) + '\n');
    
    await exemploMonitoramentoNovidades();
    console.log('\n' + '='.repeat(50) + '\n');
    
    await exemploEstatisticas();
    console.log('\n' + '='.repeat(50) + '\n');
    
    await exemploLimpezaSistema();
    
    console.log('\n✅ Todos os exemplos executados com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro ao executar exemplos:', error);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  executarTodosExemplos().catch(console.error);
}