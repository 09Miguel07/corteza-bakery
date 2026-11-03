import { CopPipe, DocumentPipe, InitialsPipe, PhonePipe, QtyPipe } from './format.pipes';

const nbsp = (s: string) => s.replace(/\s/g, ' ');

describe('format pipes', () => {
  it('formats Colombian pesos without decimals', () => {
    expect(nbsp(new CopPipe().transform(1_250_000))).toBe('$ 1.250.000');
    expect(new CopPipe().transform(null)).toBe('—');
  });

  it('formats quantities with up to two decimals', () => {
    expect(new QtyPipe().transform(1250.5)).toBe('1.250,5');
  });

  it('groups a NIT and keeps the check digit', () => {
    expect(new DocumentPipe().transform('900123456-7')).toBe('900.123.456-7');
    expect(new DocumentPipe().transform('CE-AB12')).toBe('CE-AB12');
  });

  it('splits a Colombian mobile number', () => {
    expect(new PhonePipe().transform('+573124589012')).toBe('+57 312 458 9012');
  });

  it('takes the first letter of name and surname', () => {
    expect(new InitialsPipe().transform('María Fernanda', 'López')).toBe('ML');
    expect(new InitialsPipe().transform('')).toBe('?');
  });
});
