import { base64Encode } from "@/lib/base64";

describe('base64Encode', () => {
  it('encodes a simple string', () => {
    expect(base64Encode('hello')).toBe('aGVsbG8=');
  });

  it('encodes a URL with special characters', () => {
    const url = 'http://localhost:3000/login?redirect=/home';
    const expected = 'aHR0cDovL2xvY2FsaG9zdDozMDAwL2xvZ2luP3JlZGlyZWN0PS9ob21l';
    expect(base64Encode(url)).toBe(expected);
  });

  it('encodes an empty string', () => {
    expect(base64Encode('')).toBe('');
  });
});