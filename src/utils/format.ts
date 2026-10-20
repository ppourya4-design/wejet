const PERSIAN_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

export function toPersianDigits(input: string | number): string {
  return String(input).replace(/\d/g, (d) => PERSIAN_DIGITS[Number(d)] ?? d);
}

export function fmtNum(input: string | number, usePersian: boolean): string {
  return usePersian ? toPersianDigits(input) : String(input);
}

export function fmtPrice(value: number, usePersian: boolean): string {
  const formatted =
    value >= 100
      ? Math.round(value).toLocaleString('en-US')
      : value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return fmtNum(formatted, usePersian);
}

export function formatRelativeAge(ageSeconds: number, lang: 'fa' | 'en', persianDigits: boolean): string {
  if (ageSeconds < 60) {
    return lang === 'fa' ? 'همین الان بروز شد' : 'Updated just now';
  }
  const mins = Math.max(1, Math.round(ageSeconds / 60));
  if (lang === 'fa') {
    return `آخرین بروزرسانی ${fmtNum(mins, persianDigits)} دقیقه پیش`;
  }
  return `Last updated ${mins} min ago`;
}

/**
 * Safe recursive descent arithmetic evaluator for Command Center & Mini Calculator
 * (Zero `eval` / `Function` usage for strict CSP & security compliance).
 */
export function evaluateSafeMath(expr: string): number | null {
  const cleaned = expr.replace(/,/g, '').replace(/×/g, '*').replace(/÷/g, '/').trim();
  if (!cleaned || !/^[0-9+\-*/().%\s^]+$/.test(cleaned)) {
    return null;
  }
  // Require at least one operator so plain numbers don't trigger calculator banner unnecessarily
  if (!/[+\-*/%^]/.test(cleaned)) {
    return null;
  }

  let pos = 0;
  const peek = () => cleaned[pos] ?? '';
  const skipWs = () => {
    while (pos < cleaned.length && /\s/.test(cleaned[pos])) pos++;
  };

  function parseExpr(): number {
    let val = parseTerm();
    while (true) {
      skipWs();
      const ch = peek();
      if (ch === '+' || ch === '-') {
        pos++;
        const rhs = parseTerm();
        val = ch === '+' ? val + rhs : val - rhs;
      } else {
        break;
      }
    }
    return val;
  }

  function parseTerm(): number {
    let val = parsePower();
    while (true) {
      skipWs();
      const ch = peek();
      if (ch === '*' || ch === '/' || ch === '%') {
        pos++;
        const rhs = parsePower();
        if ((ch === '/' || ch === '%') && rhs === 0) return NaN;
        val = ch === '*' ? val * rhs : ch === '/' ? val / rhs : val % rhs;
      } else {
        break;
      }
    }
    return val;
  }

  function parsePower(): number {
    let base = parseFactor();
    skipWs();
    if (peek() === '^') {
      pos++;
      const exp = parsePower();
      base = Math.pow(base, exp);
    }
    return base;
  }

  function parseFactor(): number {
    skipWs();
    const ch = peek();
    if (ch === '+' || ch === '-') {
      pos++;
      const v = parseFactor();
      return ch === '-' ? -v : v;
    }
    if (ch === '(') {
      pos++;
      const inner = parseExpr();
      skipWs();
      if (peek() !== ')') return NaN;
      pos++;
      return inner;
    }
    const start = pos;
    while (pos < cleaned.length && /[0-9.]/.test(cleaned[pos])) pos++;
    if (pos === start) return NaN;
    return Number(cleaned.slice(start, pos));
  }

  const result = parseExpr();
  skipWs();
  if (pos !== cleaned.length || !Number.isFinite(result)) {
    return null;
  }
  return Math.round(result * 1e6) / 1e6;
}
