// src/services/tribunals/index.ts
// Exportações do Sistema de Tribunais - DataJud API

// Parser CNJ
export { CNJParser } from './parsers/cnj.parser';
export type { 
  CNJProcessNumber, 
  CNJValidationResult 
} from './parsers/cnj.parser';

// DataJud API Client e Parser
export { DatajudClient } from './clients/datajud.client';
export { CNJDatajudMapper } from './mappers/cnj-datajud.mapper';
export { DatajudParser } from './parsers/datajud.parser';
export { DatajudPaginatorService } from './core/datajud-paginator.service';

// Database Service
export { 
  default as TribunalDatabaseService 
} from './database/tribunalDatabase.service';
export type {
  MonitoredProcess,
  PersistedMovement,
  TribunalStatistics,
  QueryCache
} from './database/tribunalDatabase.service';

// Cache Service
export { 
  default as TribunalCacheService 
} from './cache/tribunalCache.service';
export type {
  CacheConfig,
  CacheStats
} from './cache/tribunalCache.service';

// Hash Generator
export { 
  default as HashGeneratorService 
} from './utils/hashGenerator.service';
export type {
  HashContentType,
  HashConfig,
  HashResult
} from './utils/hashGenerator.service';

// Novelty Controller
export { 
  default as NoveltyControllerService 
} from './novelty/noveltyController.service';
export type {
  Novelty,
  NoveltyConfig,
  NoveltyStats,
  NoveltyFilters
} from './novelty/noveltyController.service';

// Service Principal
export { 
  default as TribunalMovementsService 
} from '../tribunalMovements.service';
export type {
  MovementQueryResult,
  QueryConfig
} from '../tribunalMovements.service';