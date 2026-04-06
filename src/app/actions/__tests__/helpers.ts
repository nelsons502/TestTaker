import { vi } from "vitest";

export function createMockSupabaseClient() {
  const tables: Record<string, any> = {};

  const createChain = () => {
    const chain: any = {};
    const methods = [
      "select",
      "insert",
      "update",
      "upsert",
      "delete",
      "eq",
      "in",
      "order",
      "limit",
    ];
    methods.forEach((method) => {
      chain[method] = vi.fn().mockReturnValue(chain);
    });
    // Terminal methods that we explicitly await in the code
    chain.single = vi.fn().mockResolvedValue({ data: null, error: null });
    chain.returns = vi.fn().mockResolvedValue({ data: null, error: null });
    // Default then for chains that are awaited directly (e.g. insert, update.eq)
    chain.then = vi.fn((resolve) => resolve({ data: null, error: null }));
    
    // Custom helper to queue resolutions for .then() calls
    chain._thenResolutions = [];
    chain.resolveNextThen = (value: any) => {
      chain._thenResolutions.push(value);
    };
    chain.then.mockImplementation((resolve: any) => {
      if (chain._thenResolutions.length > 0) {
        return resolve(chain._thenResolutions.shift());
      }
      return resolve({ data: null, error: null });
    });

    return chain;
  };

  const client = {
    from: vi.fn((table: string) => {
      if (!tables[table]) {
        tables[table] = createChain();
      }
      return tables[table];
    }),
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: "test-user" } },
        error: null,
      }),
    },
    getChain: (table: string) => {
      if (!tables[table]) {
        tables[table] = createChain();
      }
      return tables[table];
    },
    _clearAllMocks: () => {
      for (const table in tables) {
        for (const method in tables[table]) {
          if (vi.isMockFunction(tables[table][method])) {
            tables[table][method].mockClear();
          }
        }
        tables[table]._thenResolutions = [];
      }
      client.from.mockClear();
      client.auth.getUser.mockClear();
    },
  };

  return client;
}
