/**
 * Mock for expo-sqlite
 */

interface MockDatabase {
  execAsync: jest.Mock;
  runAsync: jest.Mock;
  getFirstAsync: jest.Mock;
  getAllAsync: jest.Mock;
}

const mockTables: { [tableName: string]: any[] } = {};

const createMockDatabase = (): MockDatabase => ({
  execAsync: jest.fn(async (sql: string) => {
    // Mock table creation
    if (sql.includes('CREATE TABLE')) {
      const match = sql.match(/CREATE TABLE (?:IF NOT EXISTS )?(\w+)/);
      if (match) {
        const tableName = match[1];
        if (!mockTables[tableName]) {
          mockTables[tableName] = [];
        }
      }
    }
    return Promise.resolve();
  }),

  runAsync: jest.fn(async (sql: string, params?: any[]) => {
    // Mock INSERT
    if (sql.includes('INSERT INTO')) {
      const match = sql.match(/INSERT INTO (\w+)/);
      if (match) {
        const tableName = match[1];
        if (!mockTables[tableName]) {
          mockTables[tableName] = [];
        }
        mockTables[tableName].push({ id: Date.now(), ...params });
      }
    }
    // Mock UPDATE
    if (sql.includes('UPDATE')) {
      // Simple mock - just return success
    }
    // Mock DELETE
    if (sql.includes('DELETE FROM')) {
      const match = sql.match(/DELETE FROM (\w+)/);
      if (match) {
        const tableName = match[1];
        if (mockTables[tableName]) {
          mockTables[tableName] = [];
        }
      }
    }
    return Promise.resolve({ changes: 1, lastInsertRowId: Date.now() });
  }),

  getFirstAsync: jest.fn(async (sql: string, params?: any[]) => {
    const match = sql.match(/FROM (\w+)/);
    if (match) {
      const tableName = match[1];
      return mockTables[tableName]?.[0] || null;
    }
    return null;
  }),

  getAllAsync: jest.fn(async (sql: string, params?: any[]) => {
    const match = sql.match(/FROM (\w+)/);
    if (match) {
      const tableName = match[1];
      return mockTables[tableName] || [];
    }
    return [];
  }),
});

let mockDb: MockDatabase | null = null;

export const openDatabaseAsync = jest.fn(async (dbName: string) => {
  if (!mockDb) {
    mockDb = createMockDatabase();
  }
  return mockDb;
});

// Test helpers
export const __clearDatabase = () => {
  Object.keys(mockTables).forEach((key) => delete mockTables[key]);
  mockDb = null;
};

export const __getTable = (tableName: string) => mockTables[tableName] || [];

export const __setTable = (tableName: string, data: any[]) => {
  mockTables[tableName] = data;
};
