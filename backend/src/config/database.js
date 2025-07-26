const knex = require('knex');
const config = require('./index');
const logger = require('../utils/logger');

class DatabaseManager {
  constructor() {
    this.connection = null;
    this.type = config.database.type;
  }

  getKnexConfig() {
    const baseConfig = {
      pool: config.database.pool,
      migrations: {
        directory: './migrations',
        tableName: 'knex_migrations'
      },
      seeds: {
        directory: './seeds'
      }
    };

    switch (this.type) {
      case 'postgresql':
        return {
          ...baseConfig,
          client: 'pg',
          connection: {
            host: config.database.host,
            port: config.database.port,
            user: config.database.user,
            password: config.database.password,
            database: config.database.name,
            ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
          }
        };

      case 'sqlserver':
        return {
          ...baseConfig,
          client: 'mssql',
          connection: {
            server: config.database.host,
            port: config.database.port,
            user: config.database.user,
            password: config.database.password,
            database: config.database.name,
            options: {
              encrypt: config.database.encrypt,
              trustServerCertificate: config.database.trustServerCertificate,
              enableArithAbort: true
            }
          }
        };

      case 'oracle':
        return {
          ...baseConfig,
          client: 'oracledb',
          connection: {
            host: config.database.host,
            port: config.database.port,
            user: config.database.user,
            password: config.database.password,
            database: config.database.serviceName,
            connectString: `${config.database.host}:${config.database.port}/${config.database.serviceName}`
          }
        };

      default:
        throw new Error(`Unsupported database type: ${this.type}`);
    }
  }

  async initialize() {
    try {
      const knexConfig = this.getKnexConfig();
      this.connection = knex(knexConfig);

      // Test the connection
      await this.testConnection();
      
      // Run migrations if in development
      if (process.env.NODE_ENV === 'development') {
        await this.runMigrations();
      }

      logger.info(`Database connection established (${this.type})`);
      return this.connection;
    } catch (error) {
      logger.error('Database connection failed:', error);
      throw error;
    }
  }

  async testConnection() {
    try {
      await this.connection.raw('SELECT 1');
      logger.info('Database connection test successful');
    } catch (error) {
      logger.error('Database connection test failed:', error);
      throw error;
    }
  }

  async runMigrations() {
    try {
      const [batchNo, log] = await this.connection.migrate.latest();
      if (log.length === 0) {
        logger.info('Database is already up to date');
      } else {
        logger.info(`Batch ${batchNo} run: ${log.length} migrations`);
        log.forEach(migration => logger.info(`Migration: ${migration}`));
      }
    } catch (error) {
      logger.error('Migration failed:', error);
      throw error;
    }
  }

  async rollbackMigration() {
    try {
      const [batchNo, log] = await this.connection.migrate.rollback();
      if (log.length === 0) {
        logger.info('Already at the base migration');
      } else {
        logger.info(`Batch ${batchNo} rolled back: ${log.length} migrations`);
        log.forEach(migration => logger.info(`Rolled back: ${migration}`));
      }
    } catch (error) {
      logger.error('Migration rollback failed:', error);
      throw error;
    }
  }

  async runSeeds() {
    try {
      await this.connection.seed.run();
      logger.info('Database seeds completed');
    } catch (error) {
      logger.error('Database seeding failed:', error);
      throw error;
    }
  }

  getConnection() {
    if (!this.connection) {
      throw new Error('Database not initialized. Call initialize() first.');
    }
    return this.connection;
  }

  async close() {
    if (this.connection) {
      await this.connection.destroy();
      logger.info('Database connection closed');
    }
  }

  // Database-specific query builders
  buildPaginationQuery(query, page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    
    switch (this.type) {
      case 'postgresql':
        return query.limit(limit).offset(offset);
      
      case 'sqlserver':
        return query.offset(offset).limit(limit);
      
      case 'oracle':
        return query.offset(offset).limit(limit);
      
      default:
        return query.limit(limit).offset(offset);
    }
  }

  // Get current timestamp in database format
  getCurrentTimestamp() {
    switch (this.type) {
      case 'postgresql':
        return this.connection.fn.now();
      
      case 'sqlserver':
        return this.connection.fn.now();
      
      case 'oracle':
        return this.connection.raw('CURRENT_TIMESTAMP');
      
      default:
        return this.connection.fn.now();
    }
  }

  // Generate UUID in database format
  generateUUID() {
    switch (this.type) {
      case 'postgresql':
        return this.connection.raw('gen_random_uuid()');
      
      case 'sqlserver':
        return this.connection.raw('NEWID()');
      
      case 'oracle':
        return this.connection.raw('SYS_GUID()');
      
      default:
        return this.connection.raw('gen_random_uuid()');
    }
  }

  // Full-text search query builder
  buildFullTextSearch(query, searchTerm, columns) {
    switch (this.type) {
      case 'postgresql':
        const tsQuery = columns.map(col => `${col}::text`).join(' || \' \' || ');
        return query.whereRaw(`to_tsvector('english', ${tsQuery}) @@ plainto_tsquery('english', ?)`, [searchTerm]);
      
      case 'sqlserver':
        const containsQuery = columns.map(col => `${col}`).join(' OR ');
        return query.whereRaw(`CONTAINS((${containsQuery}), ?)`, [searchTerm]);
      
      case 'oracle':
        const oracleQuery = columns.map(col => `CONTAINS(${col}, ?) > 0`).join(' OR ');
        return query.whereRaw(`(${oracleQuery})`, Array(columns.length).fill(searchTerm));
      
      default:
        // Fallback to LIKE search
        let likeQuery = query;
        columns.forEach((col, index) => {
          if (index === 0) {
            likeQuery = likeQuery.where(col, 'ILIKE', `%${searchTerm}%`);
          } else {
            likeQuery = likeQuery.orWhere(col, 'ILIKE', `%${searchTerm}%`);
          }
        });
        return likeQuery;
    }
  }

  // JSON query builder
  buildJsonQuery(query, column, path, value) {
    switch (this.type) {
      case 'postgresql':
        return query.whereRaw(`${column}->>'${path}' = ?`, [value]);
      
      case 'sqlserver':
        return query.whereRaw(`JSON_VALUE(${column}, '$.${path}') = ?`, [value]);
      
      case 'oracle':
        return query.whereRaw(`JSON_VALUE(${column}, '$.${path}') = ?`, [value]);
      
      default:
        return query.whereRaw(`${column}->>'${path}' = ?`, [value]);
    }
  }

  // Array contains query
  buildArrayContainsQuery(query, column, value) {
    switch (this.type) {
      case 'postgresql':
        return query.whereRaw(`? = ANY(${column})`, [value]);
      
      case 'sqlserver':
        return query.whereRaw(`? IN (SELECT value FROM OPENJSON(${column}))`, [value]);
      
      case 'oracle':
        return query.whereRaw(`JSON_EXISTS(${column}, '$[*]?(@ == "${value}")')`);
      
      default:
        return query.whereRaw(`? = ANY(${column})`, [value]);
    }
  }

  // Upsert operation
  async upsert(tableName, data, conflictColumns) {
    switch (this.type) {
      case 'postgresql':
        const conflictClause = conflictColumns.join(', ');
        const updateClause = Object.keys(data)
          .filter(key => !conflictColumns.includes(key))
          .map(key => `${key} = EXCLUDED.${key}`)
          .join(', ');
        
        return this.connection(tableName)
          .insert(data)
          .onConflict(conflictColumns)
          .merge();
      
      case 'sqlserver':
        // Use MERGE statement for SQL Server
        const mergeQuery = this.buildMergeQuery(tableName, data, conflictColumns);
        return this.connection.raw(mergeQuery);
      
      case 'oracle':
        // Use MERGE statement for Oracle
        const oracleMergeQuery = this.buildOracleMergeQuery(tableName, data, conflictColumns);
        return this.connection.raw(oracleMergeQuery);
      
      default:
        return this.connection(tableName).insert(data).onConflict(conflictColumns).merge();
    }
  }

  buildMergeQuery(tableName, data, conflictColumns) {
    const columns = Object.keys(data);
    const values = Object.values(data);
    const conflictConditions = conflictColumns.map(col => `target.${col} = source.${col}`).join(' AND ');
    const updateSet = columns
      .filter(col => !conflictColumns.includes(col))
      .map(col => `${col} = source.${col}`)
      .join(', ');
    const insertColumns = columns.join(', ');
    const insertValues = columns.map(col => `source.${col}`).join(', ');

    return `
      MERGE ${tableName} AS target
      USING (VALUES (${values.map(() => '?').join(', ')})) AS source (${columns.join(', ')})
      ON ${conflictConditions}
      WHEN MATCHED THEN
        UPDATE SET ${updateSet}
      WHEN NOT MATCHED THEN
        INSERT (${insertColumns}) VALUES (${insertValues});
    `;
  }

  buildOracleMergeQuery(tableName, data, conflictColumns) {
    const columns = Object.keys(data);
    const values = Object.values(data);
    const conflictConditions = conflictColumns.map(col => `target.${col} = source.${col}`).join(' AND ');
    const updateSet = columns
      .filter(col => !conflictColumns.includes(col))
      .map(col => `${col} = source.${col}`)
      .join(', ');
    const insertColumns = columns.join(', ');
    const insertValues = columns.map(col => `source.${col}`).join(', ');

    return `
      MERGE INTO ${tableName} target
      USING (SELECT ${columns.map((col, i) => `? AS ${col}`).join(', ')} FROM DUAL) source
      ON (${conflictConditions})
      WHEN MATCHED THEN
        UPDATE SET ${updateSet}
      WHEN NOT MATCHED THEN
        INSERT (${insertColumns}) VALUES (${insertValues})
    `;
  }
}

// Create singleton instance
const databaseManager = new DatabaseManager();

module.exports = databaseManager;