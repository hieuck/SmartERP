/**
 * Mock for axios
 */

interface MockResponse {
  data: any;
  status: number;
  statusText: string;
  headers: any;
  config: any;
}

let mockResponses: { [key: string]: MockResponse } = {};
let mockError: any = null;

const createMockAxios = () => {
  const mockAxios: any = jest.fn((config: any) => {
    if (mockError) {
      return Promise.reject(mockError);
    }

    const key = `${config.method}:${config.url}`;
    const response = mockResponses[key] || {
      data: { success: true, data: [] },
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    };

    return Promise.resolve(response);
  });

  mockAxios.get = jest.fn((url: string, config?: any) => {
    if (mockError) {
      return Promise.reject(mockError);
    }

    const key = `get:${url}`;
    const response = mockResponses[key] || {
      data: { success: true, data: [] },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: { ...config, url, method: 'get' },
    };

    return Promise.resolve(response);
  });

  mockAxios.post = jest.fn((url: string, data?: any, config?: any) => {
    if (mockError) {
      return Promise.reject(mockError);
    }

    const key = `post:${url}`;
    const response = mockResponses[key] || {
      data: { success: true, data: { id: '1', ...data } },
      status: 201,
      statusText: 'Created',
      headers: {},
      config: { ...config, url, method: 'post', data },
    };

    return Promise.resolve(response);
  });

  mockAxios.put = jest.fn((url: string, data?: any, config?: any) => {
    if (mockError) {
      return Promise.reject(mockError);
    }

    const key = `put:${url}`;
    const response = mockResponses[key] || {
      data: { success: true, data: { ...data } },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: { ...config, url, method: 'put', data },
    };

    return Promise.resolve(response);
  });

  mockAxios.delete = jest.fn((url: string, config?: any) => {
    if (mockError) {
      return Promise.reject(mockError);
    }

    const key = `delete:${url}`;
    const response = mockResponses[key] || {
      data: { success: true },
      status: 204,
      statusText: 'No Content',
      headers: {},
      config: { ...config, url, method: 'delete' },
    };

    return Promise.resolve(response);
  });

  mockAxios.create = jest.fn(() => mockAxios);

  mockAxios.interceptors = {
    request: {
      use: jest.fn(),
      eject: jest.fn(),
    },
    response: {
      use: jest.fn(),
      eject: jest.fn(),
    },
  };

  return mockAxios;
};

const mockAxios = createMockAxios();

// Test helpers
mockAxios.__setMockResponse = (method: string, url: string, response: Partial<MockResponse>) => {
  const key = `${method}:${url}`;
  mockResponses[key] = {
    data: response.data || {},
    status: response.status || 200,
    statusText: response.statusText || 'OK',
    headers: response.headers || {},
    config: response.config || {},
  };
};

mockAxios.__setMockError = (error: any) => {
  mockError = error;
};

mockAxios.__clearMocks = () => {
  mockResponses = {};
  mockError = null;
  mockAxios.get.mockClear();
  mockAxios.post.mockClear();
  mockAxios.put.mockClear();
  mockAxios.delete.mockClear();
};

export default mockAxios;
