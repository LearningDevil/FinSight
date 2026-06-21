import { useEffect, useState } from 'react';
import { authAPI } from '../services/api';

const TERMINAL_LINES = [
  { type: 'cmd',     text: 'parse_statement kotak_june2026.pdf' },
  { type: 'output',  text: 'unlocking PDF...',     ok: true },
  { type: 'output',  text: 'extracting tables...', ok: true },
  { type: 'value',   text: 'found 105 transactions' },
  { type: 'output',  text: 'categorizing...',      ok: true },
  { type: 'debit',   text: 'total debits:   ₹42,380' },
  { type: 'credit',  text: 'total credits:  ₹65,000' },
  { type: 'value',   text: 'duplicates skipped: 0' },
];

const LINE_CLASS = {
  cmd:    'text-info',
  output: 'text-secondary',
  value:  'text-gold',
  debit:  'text-debit',
  credit: 'text-credit',
};

function TerminalPanel() {
  const [visible, setVisible] = useState(0);

  useEffect(() => {
    const timers = TERMINAL_LINES.map((_, i) =>
      setTimeout(() => setVisible(i + 1), i * 420 + 400)
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="bg-surface border border-line shadow-[6px_6px_0_0_var(--color-hover)] p-4 w-full max-w-full">
      <div className="flex items-center gap-1.5 mb-3 pb-2.5 border-b border-hover">
        <span className="w-2 h-2 bg-debit inline-block" />
        <span className="w-2 h-2 bg-gold inline-block" />
        <span className="w-2 h-2 bg-credit inline-block" />
        <span className="text-[10px] text-secondary ml-2 tracking-wider truncate">
          finsight — statement parser
        </span>
      </div>

      <div className="text-[11px] leading-loose overflow-x-auto">
        {TERMINAL_LINES.slice(0, visible).map((line, i) => (
          <div key={i} className="flex gap-2 whitespace-nowrap">
            <span className={line.type === 'cmd' ? 'text-credit' : 'text-transparent select-none'}>$</span>
            <span className={LINE_CLASS[line.type]}>
              {line.type !== 'cmd' ? '▸ ' : ''}{line.text}
            </span>
            {line.ok && <span className="text-credit ml-1">✓</span>}
          </div>
        ))}
        <div className="flex gap-2">
          <span className="text-credit">$</span>
          <span className="inline-block w-2 h-3.5 bg-gold cursor-blink" />
        </div>
      </div>
    </div>
  );
}

function StatCard({ num, unit, label, showBorder }) {
  return (
    <div className={`relative p-5 sm:p-6 hover:bg-gold/5 transition-colors duration-150 cursor-default border-line ${showBorder ? 'border-b sm:border-b-0 sm:border-r' : ''}`}>
      <span className="absolute top-5 right-5 sm:top-6 sm:right-6 text-gold text-base">→</span>
      <div className="text-3xl sm:text-[2rem] font-bold text-primary tracking-tight leading-none">
        {num}
        <sub className="text-xs text-gold font-bold align-baseline ml-0.5">{unit}</sub>
      </div>
      <div className="text-[10px] text-secondary tracking-wider mt-2 leading-relaxed whitespace-pre-line">
        {label}
      </div>
    </div>
  );
}

export default function Login() {
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) window.location.href = '/dashboard';
  }, []);

  const handleLogin = async () => {
    try {
      const { data } = await authAPI.getGoogleUrl();
      window.location.href = data.url;
    } catch (err) {
      console.error('Login error:', err);
    }
  };

  return (
    <div className="min-h-screen w-full bg-base grid-bg">

      {/* Navbar */}
      <nav className="flex items-center justify-between px-4 sm:px-7 py-3.5 border-b border-line bg-base/95 sticky top-0 z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-gold flex items-center justify-center text-[13px] font-bold text-base shadow-[3px_3px_0_0_var(--color-gold-shadow)]">
            F
          </div>
          <span className="text-sm sm:text-base font-bold tracking-wider text-primary">FINSIGHT</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 bg-credit rounded-full animate-pulse" />
          <span className="text-[10px] text-credit tracking-wider hidden sm:inline">SYSTEM ONLINE</span>
        </div>
      </nav>

      {/* Hero */}
      <div className="max-w-6xl mx-auto px-4 sm:px-7 py-10 sm:py-14 lg:py-16 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-[10px] tracking-[0.2em] text-gold mb-5">
            <span className="inline-block w-5 h-px bg-gold" />
            PERSONAL FINANCE INTELLIGENCE
          </div>

          <h1 className="font-serif font-bold text-primary mb-5 text-[clamp(2rem,6vw,3rem)] leading-[1.05] tracking-tight">
            Your bank<br />
            emails you<br />
            <span className="text-debit">everything.</span><br />
            <span className="text-gold">We read it.</span>
          </h1>

          <p className="text-xs text-secondary leading-relaxed mb-8 max-w-sm">
            Connect Gmail once. Upload your monthly statement PDF. FinSight parses every transaction, categorizes it, and builds your dashboard in seconds. No manual entry. Ever.
          </p>

          <button
            onClick={handleLogin}
            className="inline-flex items-center gap-2.5 bg-gold text-base px-5 py-3 text-xs font-bold tracking-wider shadow-[4px_4px_0_0_var(--color-gold-shadow)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0_0_var(--color-gold-shadow)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[2px_2px_0_0_var(--color-gold-shadow)] transition-all duration-100 cursor-pointer"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" className="shrink-0">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            SIGN IN WITH GOOGLE →
          </button>

          <p className="text-[10px] text-muted mt-4 tracking-wide">
            READ-ONLY GMAIL ACCESS — WE NEVER STORE YOUR PASSWORD
          </p>
        </div>

        <div className="min-w-0">
          <TerminalPanel />
        </div>
      </div>

      {/* Stat strip */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-3 border-t border-b border-line">
        <StatCard num="105" unit="TXN"    label={'PARSED FROM ONE\nSTATEMENT'} showBorder />
        <StatCard num="<5"  unit="SEC"    label={'PROCESSING TIME\nPER STATEMENT'} showBorder />
        <StatCard num="0"   unit="MANUAL" label={'ENTRIES NEEDED\nFOR BANK DATA'} />
      </div>

      {/* Ticker */}
      <div className="max-w-6xl mx-auto px-4 sm:px-7 py-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-b border-hover">
        {[
          { bank: 'KOTAK',   status: 'LIVE', live: true },
          { bank: 'AXIS',    status: 'LIVE', live: true },
          { bank: 'FEDERAL', status: 'LIVE', live: true },
          { bank: 'HDFC',    status: 'SOON', live: false },
          { bank: 'SBI',     status: 'SOON', live: false },
        ].map((b, i) => (
          <span key={i} className="text-[10px] tracking-wider whitespace-nowrap">
            <span className="text-secondary">{b.bank} </span>
            <strong className={b.live ? 'text-credit' : 'text-muted'}>{b.status}</strong>
          </span>
        ))}
      </div>

      {/* Fine print */}
      <div className="max-w-6xl mx-auto px-4 sm:px-7 py-2.5 flex flex-col sm:flex-row gap-1 sm:justify-between">
        <span className="text-[9px] text-muted tracking-wider">
          ENCRYPTED AT REST · NO PASSWORD STORED · READ-ONLY ACCESS
        </span>
        <span className="text-[9px] text-muted tracking-wider">
          BUILT BY VIVEK SHARMA · 2026
        </span>
      </div>

    </div>
  );
}
