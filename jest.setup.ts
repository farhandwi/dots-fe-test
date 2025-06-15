// Import Jest DOM untuk extended matchers
import '@testing-library/jest-dom';

// Mock untuk window.matchMedia yang sering dibutuhkan untuk testing komponen UI
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock untuk IntersectionObserver yang sesuai dengan tipe yang diharapkan
class MockIntersectionObserver implements IntersectionObserver {
  readonly root: Element | null = null;
  readonly rootMargin: string = '';
  readonly thresholds: ReadonlyArray<number> = [];
  
  constructor(
    private callback: IntersectionObserverCallback,
    private options?: IntersectionObserverInit
  ) {}
  
  disconnect(): void {}
  observe(): void {}
  takeRecords(): IntersectionObserverEntry[] { return []; }
  unobserve(): void {}
}

// Assign mock implementation ke global
Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  configurable: true,
  value: MockIntersectionObserver
});

// Menekan pesan warning konsol selama test
jest.spyOn(console, 'warn').mockImplementation(() => jest.fn());

// Anda dapat menambahkan mock global lainnya yang dibutuhkan di sini