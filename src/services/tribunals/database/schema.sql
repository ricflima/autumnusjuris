-- src/services/tribunals/database/schema.sql
-- Schema para persistência de movimentações processuais
-- Sistema de controle de novidades com TTL de 48h

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Tabela de tribunais configurados
CREATE TABLE IF NOT EXISTS tribunal_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(3) NOT NULL UNIQUE, -- Ex: "825" (TJSP)
    name VARCHAR(200) NOT NULL,
    segment VARCHAR(1) NOT NULL, -- 1-9 (segmento CNJ)
    segment_name VARCHAR(100) NOT NULL,
    region VARCHAR(20), -- Ex: "2ª Região"
    base_url VARCHAR(500) NOT NULL,
    query_path VARCHAR(200) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    scraper_class VARCHAR(50) NOT NULL,
    priority INTEGER DEFAULT 999,
    rate_limit_per_minute INTEGER DEFAULT 10,
    rate_limit_per_hour INTEGER DEFAULT 100,
    headers JSONB,
    cookies JSONB,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para tribunais
CREATE INDEX IF NOT EXISTS idx_tribunal_configs_code ON tribunal_configs(code);
CREATE INDEX IF NOT EXISTS idx_tribunal_configs_segment ON tribunal_configs(segment);
CREATE INDEX IF NOT EXISTS idx_tribunal_configs_active ON tribunal_configs(is_active);

-- Tabela de processos monitorados
CREATE TABLE IF NOT EXISTS monitored_processes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cnj_number VARCHAR(25) NOT NULL UNIQUE, -- Formato completo CNJ
    clean_number VARCHAR(20) NOT NULL, -- Apenas números
    tribunal_code VARCHAR(3) NOT NULL,
    tribunal_name VARCHAR(200) NOT NULL,
    status VARCHAR(20) DEFAULT 'active', -- active, suspended, archived
    monitoring_frequency INTEGER DEFAULT 60, -- minutos entre consultas
    last_query_at TIMESTAMP,
    last_movement_at TIMESTAMP,
    total_movements INTEGER DEFAULT 0,
    content_hash VARCHAR(32), -- MD5 da última consulta
    basic_info JSONB, -- Dados básicos do processo
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID, -- Referência ao usuário
    
    FOREIGN KEY (tribunal_code) REFERENCES tribunal_configs(code)
);

-- Índices para processos
CREATE INDEX IF NOT EXISTS idx_monitored_processes_cnj ON monitored_processes(cnj_number);
CREATE INDEX IF NOT EXISTS idx_monitored_processes_tribunal ON monitored_processes(tribunal_code);
CREATE INDEX IF NOT EXISTS idx_monitored_processes_status ON monitored_processes(status);
CREATE INDEX IF NOT EXISTS idx_monitored_processes_last_query ON monitored_processes(last_query_at);
CREATE INDEX IF NOT EXISTS idx_monitored_processes_clean_number ON monitored_processes USING gin(clean_number gin_trgm_ops);

-- Tabela de movimentações processuais (persistência permanente)
CREATE TABLE IF NOT EXISTS tribunal_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    process_id UUID NOT NULL,
    movement_id VARCHAR(100) NOT NULL, -- ID único da movimentação no tribunal
    movement_date DATE NOT NULL,
    movement_datetime TIMESTAMP,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    movement_type VARCHAR(20), -- decisao, despacho, peticao, juntada, audiencia, outros
    is_public BOOLEAN DEFAULT true,
    author VARCHAR(200),
    destination VARCHAR(200),
    attachments JSONB, -- Array de anexos
    raw_content TEXT, -- Conteúdo bruto da movimentação
    content_hash VARCHAR(32) NOT NULL, -- MD5 para detecção de duplicatas
    tribunal_source VARCHAR(3) NOT NULL, -- Código do tribunal de origem
    query_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_new BOOLEAN DEFAULT true, -- Flag para movimentações novas (TTL 48h)
    new_until TIMESTAMP, -- Timestamp até quando é considerada nova
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (process_id) REFERENCES monitored_processes(id) ON DELETE CASCADE,
    FOREIGN KEY (tribunal_source) REFERENCES tribunal_configs(code),
    
    -- Constraint para evitar duplicatas por processo + hash
    UNIQUE(process_id, content_hash)
);

-- Índices para movimentações
CREATE INDEX IF NOT EXISTS idx_tribunal_movements_process ON tribunal_movements(process_id);
CREATE INDEX IF NOT EXISTS idx_tribunal_movements_date ON tribunal_movements(movement_date);
CREATE INDEX IF NOT EXISTS idx_tribunal_movements_datetime ON tribunal_movements(movement_datetime);
CREATE INDEX IF NOT EXISTS idx_tribunal_movements_hash ON tribunal_movements(content_hash);
CREATE INDEX IF NOT EXISTS idx_tribunal_movements_is_new ON tribunal_movements(is_new);
CREATE INDEX IF NOT EXISTS idx_tribunal_movements_new_until ON tribunal_movements(new_until);
CREATE INDEX IF NOT EXISTS idx_tribunal_movements_movement_id ON tribunal_movements(process_id, movement_id);
CREATE INDEX IF NOT EXISTS idx_tribunal_movements_tribunal ON tribunal_movements(tribunal_source);
CREATE INDEX IF NOT EXISTS idx_tribunal_movements_type ON tribunal_movements(movement_type);

-- Tabela de cache de consultas
CREATE TABLE IF NOT EXISTS query_cache (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cache_key VARCHAR(100) NOT NULL UNIQUE, -- Chave única do cache
    cnj_number VARCHAR(25) NOT NULL,
    tribunal_code VARCHAR(3) NOT NULL,
    query_result JSONB NOT NULL, -- Resultado completo da consulta
    content_hash VARCHAR(32) NOT NULL,
    query_status VARCHAR(20) NOT NULL, -- success, error, not_found, etc.
    expires_at TIMESTAMP NOT NULL, -- TTL do cache
    hit_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (tribunal_code) REFERENCES tribunal_configs(code)
);

-- Índices para cache
CREATE INDEX IF NOT EXISTS idx_query_cache_key ON query_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_query_cache_cnj ON query_cache(cnj_number);
CREATE INDEX IF NOT EXISTS idx_query_cache_expires ON query_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_query_cache_tribunal ON query_cache(tribunal_code);

-- Tabela de logs de consultas
CREATE TABLE IF NOT EXISTS query_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cnj_number VARCHAR(25) NOT NULL,
    tribunal_code VARCHAR(3) NOT NULL,
    query_status VARCHAR(20) NOT NULL,
    response_time_ms INTEGER,
    error_message TEXT,
    from_cache BOOLEAN DEFAULT false,
    retry_count INTEGER DEFAULT 0,
    user_agent VARCHAR(500),
    ip_address INET,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (tribunal_code) REFERENCES tribunal_configs(code)
);

-- Índices para logs
CREATE INDEX IF NOT EXISTS idx_query_logs_cnj ON query_logs(cnj_number);
CREATE INDEX IF NOT EXISTS idx_query_logs_tribunal ON query_logs(tribunal_code);
CREATE INDEX IF NOT EXISTS idx_query_logs_status ON query_logs(query_status);
CREATE INDEX IF NOT EXISTS idx_query_logs_created ON query_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_query_logs_from_cache ON query_logs(from_cache);

-- Tabela de rate limiting
CREATE TABLE IF NOT EXISTS rate_limits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    identifier VARCHAR(100) NOT NULL, -- IP, user_id, ou tribunal_code
    tribunal_code VARCHAR(3),
    request_count INTEGER DEFAULT 1,
    window_start TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    window_end TIMESTAMP DEFAULT CURRENT_TIMESTAMP + INTERVAL '1 hour',
    is_blocked BOOLEAN DEFAULT false,
    block_until TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (tribunal_code) REFERENCES tribunal_configs(code)
);

-- Índices para rate limiting
CREATE INDEX IF NOT EXISTS idx_rate_limits_identifier ON rate_limits(identifier);
CREATE INDEX IF NOT EXISTS idx_rate_limits_tribunal ON rate_limits(tribunal_code);
CREATE INDEX IF NOT EXISTS idx_rate_limits_window ON rate_limits(window_start, window_end);
CREATE INDEX IF NOT EXISTS idx_rate_limits_blocked ON rate_limits(is_blocked);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar trigger nas tabelas
CREATE TRIGGER update_tribunal_configs_updated_at BEFORE UPDATE ON tribunal_configs FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_monitored_processes_updated_at BEFORE UPDATE ON monitored_processes FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_tribunal_movements_updated_at BEFORE UPDATE ON tribunal_movements FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_query_cache_updated_at BEFORE UPDATE ON query_cache FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_rate_limits_updated_at BEFORE UPDATE ON rate_limits FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Trigger para definir new_until automaticamente (48 horas)
CREATE OR REPLACE FUNCTION set_new_until_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_new = true THEN
        NEW.new_until = CURRENT_TIMESTAMP + INTERVAL '48 hours';
    ELSE
        NEW.new_until = NULL;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER set_tribunal_movements_new_until BEFORE INSERT OR UPDATE ON tribunal_movements FOR EACH ROW EXECUTE PROCEDURE set_new_until_timestamp();

-- Função para limpar movimentações antigas do status "novo" (cleanup automático)
CREATE OR REPLACE FUNCTION cleanup_old_new_movements()
RETURNS INTEGER AS $$
DECLARE
    affected_rows INTEGER;
BEGIN
    UPDATE tribunal_movements 
    SET is_new = false, new_until = NULL
    WHERE is_new = true AND new_until < CURRENT_TIMESTAMP;
    
    GET DIAGNOSTICS affected_rows = ROW_COUNT;
    RETURN affected_rows;
END;
$$ language 'plpgsql';

-- Função para limpar cache expirado
CREATE OR REPLACE FUNCTION cleanup_expired_cache()
RETURNS INTEGER AS $$
DECLARE
    affected_rows INTEGER;
BEGIN
    DELETE FROM query_cache WHERE expires_at < CURRENT_TIMESTAMP;
    GET DIAGNOSTICS affected_rows = ROW_COUNT;
    RETURN affected_rows;
END;
$$ language 'plpgsql';

-- Função para obter estatísticas do sistema
CREATE OR REPLACE FUNCTION get_tribunal_statistics()
RETURNS TABLE (
    tribunal_code VARCHAR(3),
    tribunal_name VARCHAR(200),
    total_processes BIGINT,
    total_movements BIGINT,
    new_movements BIGINT,
    last_query TIMESTAMP,
    avg_response_time NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        tc.code,
        tc.name,
        COUNT(DISTINCT mp.id)::BIGINT as total_processes,
        COUNT(tm.id)::BIGINT as total_movements,
        COUNT(tm.id) FILTER (WHERE tm.is_new = true)::BIGINT as new_movements,
        MAX(mp.last_query_at) as last_query,
        ROUND(AVG(ql.response_time_ms), 2) as avg_response_time
    FROM tribunal_configs tc
    LEFT JOIN monitored_processes mp ON tc.code = mp.tribunal_code
    LEFT JOIN tribunal_movements tm ON mp.id = tm.process_id
    LEFT JOIN query_logs ql ON tc.code = ql.tribunal_code
    WHERE tc.is_active = true
    GROUP BY tc.code, tc.name
    ORDER BY total_processes DESC, total_movements DESC;
END;
$$ language 'plpgsql';

-- Views úteis

-- View para movimentações com detalhes do processo
CREATE OR REPLACE VIEW v_movements_with_process AS
SELECT 
    tm.id,
    tm.movement_id,
    tm.movement_date,
    tm.movement_datetime,
    tm.title,
    tm.description,
    tm.movement_type,
    tm.is_public,
    tm.is_new,
    tm.new_until,
    tm.author,
    tm.destination,
    tm.attachments,
    mp.cnj_number,
    mp.tribunal_name,
    tc.name as tribunal_full_name,
    tc.segment_name
FROM tribunal_movements tm
JOIN monitored_processes mp ON tm.process_id = mp.id
JOIN tribunal_configs tc ON tm.tribunal_source = tc.code;

-- View para processos com contagem de movimentações
CREATE OR REPLACE VIEW v_processes_with_stats AS
SELECT 
    mp.id,
    mp.cnj_number,
    mp.tribunal_name,
    mp.status,
    mp.last_query_at,
    mp.last_movement_at,
    mp.total_movements,
    tc.name as tribunal_full_name,
    COUNT(tm.id) as actual_movement_count,
    COUNT(tm.id) FILTER (WHERE tm.is_new = true) as new_movement_count,
    MAX(tm.movement_date) as latest_movement_date
FROM monitored_processes mp
JOIN tribunal_configs tc ON mp.tribunal_code = tc.code
LEFT JOIN tribunal_movements tm ON mp.id = tm.process_id
GROUP BY mp.id, mp.cnj_number, mp.tribunal_name, mp.status, 
         mp.last_query_at, mp.last_movement_at, mp.total_movements, tc.name;

-- Comentários nas tabelas
COMMENT ON TABLE tribunal_configs IS 'Configurações dos tribunais disponíveis para consulta';
COMMENT ON TABLE monitored_processes IS 'Processos sendo monitorados pelo sistema';
COMMENT ON TABLE tribunal_movements IS 'Movimentações processuais com persistência permanente e controle de novidades';
COMMENT ON TABLE query_cache IS 'Cache de consultas aos tribunais com TTL configurável';
COMMENT ON TABLE query_logs IS 'Log de todas as consultas realizadas para auditoria';
COMMENT ON TABLE rate_limits IS 'Controle de rate limiting por tribunal e identificador';

COMMENT ON COLUMN tribunal_movements.is_new IS 'Flag para movimentações consideradas novas (TTL 48h)';
COMMENT ON COLUMN tribunal_movements.new_until IS 'Timestamp até quando a movimentação é considerada nova';
COMMENT ON COLUMN tribunal_movements.content_hash IS 'Hash MD5 do conteúdo para detecção de duplicatas';
COMMENT ON COLUMN monitored_processes.monitoring_frequency IS 'Frequência de monitoramento em minutos';
COMMENT ON COLUMN query_cache.expires_at IS 'Timestamp de expiração do cache';

-- Criar sequências para IDs numéricos se necessário
-- CREATE SEQUENCE IF NOT EXISTS movement_sequence START 1;