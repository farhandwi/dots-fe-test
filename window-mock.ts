const mockLocation = {
    assign: jest.fn(),
    replace: jest.fn(),
    reload: jest.fn(),
    href: 'http://localhost:3000',
    origin: 'http://localhost:3000',
    protocol: 'http:',
    host: 'localhost:3000',
    hostname: 'localhost',
    port: '3000',
    pathname: '/',
    search: '',
    hash: '',
  };
  
  Object.defineProperty(global.window, 'location', {
    value: mockLocation,
    writable: true,
    configurable: true,
  });
  
  // Export untuk bisa digunakan di test
  export { mockLocation };