// Teste rápido da nova implementação DataJud
const TribunalMovementsService = require('./dist/services/tribunalMovements.service').default;

async function testDatajud() {
  console.log('🚀 Iniciando teste da API DataJud...');
  
  try {
    const service = TribunalMovementsService.getInstance();
    
    // Processo real do usuário
    const processNumber = '1000057-13.2025.8.26.0232';
    
    console.log(`📋 Testando processo: ${processNumber}`);
    
    // Testar conectividade primeiro
    console.log('🔌 Testando conectividade...');
    const connectivity = await service.testConnectivity();
    console.log('Conectividade:', connectivity);
    
    if (!connectivity.success) {
      console.error('❌ Falha na conectividade');
      return;
    }
    
    // Testar consulta de movimento
    console.log('🔍 Consultando movimentações...');
    const result = await service.queryMovements(processNumber, {
      useCache: false, // Forçar consulta na API
      enablePersistence: false,
      enableNoveltyDetection: false
    });
    
    console.log('📊 Resultado da consulta:');
    console.log(`  ✅ Sucesso: ${result.success}`);
    console.log(`  🏛️ Tribunal: ${result.tribunal}`);
    console.log(`  📝 Movimentações: ${result.totalMovements || 0}`);
    console.log(`  ⏱️ Tempo: ${result.queryDuration}ms`);
    console.log(`  🔄 Fonte: ${result.source}`);
    
    if (result.error) {
      console.error(`  ❌ Erro: ${result.error}`);
    }
    
    if (result.movements && result.movements.length > 0) {
      console.log('  📋 Últimas movimentações:');
      result.movements.slice(0, 3).forEach((mov, i) => {
        console.log(`    ${i + 1}. ${mov.title} (${mov.movementDate.toLocaleDateString ? mov.movementDate.toLocaleDateString('pt-BR') : mov.movementDate})`);
      });
    }
    
    // Testar estatísticas
    console.log('📈 Estatísticas do serviço:');
    const stats = await service.getServiceStats();
    console.log(`  🏛️ Tribunais suportados: ${stats.tribunalsSupported}`);
    console.log(`  📊 Cobertura DataJud: ${stats.datajudCoverage}%`);
    
    console.log('✅ Teste concluído com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
  }
}

testDatajud();