import { useState, useEffect, useCallback } from 'react';
import { transactionsAPI } from '../services/api';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../services/api';

const MONTHS = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
const PIE_COLORS = ['#B7472A', '#3FB950', '#B8860B', '#79C0FF', '#8B949E', '#D97706', '#A371F7', '#F778BA'];
const BANKS = ['kotak', 'axis', 'federal'];

function formatAmount(amount) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
}

// ── Sync Gmail Modal ────────────────────────────────────────────────────────
function SyncModal({ onClose, onSyncComplete }) {
  const [bank, setBank]               = useState('kotak');
  const [password, setPassword]       = useState('');
  const [remember, setRemember]       = useState(false);
  const [hasSaved, setHasSaved]       = useState(false);
  const [status, setStatus]           = useState('idle'); // idle | syncing | success | error
  const [logLines, setLogLines]       = useState([]);
  const [result, setResult]           = useState(null);

  // Check if a password is already saved for the selected bank
  useEffect(() => {
    api.get(`/sync/password-status?bank=${bank}`)
      .then(r => setHasSaved(r.data.hasSavedPassword))
      .catch(() => setHasSaved(false));
  }, [bank]);

  const pushLog = (text, type = 'output') =>
    setLogLines(prev => [...prev, { text, type }]);

  const handleSync = async () => {
    if (!hasSaved && !password) return;
    setStatus('syncing');
    setLogLines([]);
    setResult(null);

    pushLog(`sync_gmail --bank=${bank}`, 'cmd');
    await new Promise(r => setTimeout(r, 300));
    pushLog('searching inbox for statement emails...', 'output');

    try {
      const payload = { bank, rememberPassword: remember };
      if (password) payload.password = password;

      const { data } = await api.post('/sync/gmail', payload);

      await new Promise(r => setTimeout(r, 400));
      pushLog(`found ${data.emailsFound} statement emails`, 'value');
      pushLog(`already processed: ${data.emailsSkipped}`, 'output');
      pushLog(`new emails processed: ${data.emailsProcessed}`, 'output');
      await new Promise(r => setTimeout(r, 300));
      pushLog(`transactions imported: ${data.transactionsImported}`, 'credit');
      if (data.passwordSaved) pushLog('password saved for future syncs', 'value');

      setResult(data);
      setStatus('success');
      onSyncComplete();
    } catch (err) {
      const msg = err.response?.data?.error || 'Sync failed';
      pushLog(`error: ${msg}`, 'debit');
      setStatus('error');
    }
  };

  const LINE_CLASS = {
    cmd: 'text-info', output: 'text-secondary',
    value: 'text-gold', credit: 'text-credit', debit: 'text-debit',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: 'rgba(13,17,23,0.85)' }}>
      <div className="bg-surface border border-line shadow-[8px_8px_0_0_var(--color-hover)] w-full max-w-lg p-5">

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-primary text-sm font-bold tracking-wider">SYNC GMAIL</h2>
            <p className="text-secondary text-[10px] mt-0.5">Auto-import statements from your inbox</p>
          </div>
          <button onClick={onClose} className="text-muted hover:text-primary text-lg cursor-pointer transition-colors">✕</button>
        </div>

        {/* Bank selector */}
        <div className="mb-4">
          <p className="text-[10px] text-secondary tracking-wider mb-2">SELECT BANK</p>
          <div className="flex gap-2 flex-wrap">
            {BANKS.map(b => (
              <button
                key={b}
                onClick={() => setBank(b)}
                className={`px-3 py-1.5 text-[11px] font-bold tracking-wider border transition-colors cursor-pointer ${
                  bank === b ? 'bg-gold text-base border-gold' : 'text-secondary border-line hover:border-line-active'
                }`}
              >
                {b.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Password — only show if none saved */}
        {!hasSaved ? (
          <div className="mb-4">
            <p className="text-[10px] text-secondary tracking-wider mb-2">PDF PASSWORD</p>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Your statement PDF password"
              className="w-full bg-base border border-line focus:border-line-active px-3 py-2 text-xs text-primary placeholder:text-muted outline-none shadow-[2px_2px_0_0_var(--color-hover)]"
            />
            <label className="flex items-center gap-2 mt-2 cursor-pointer">
              <input
                type="checkbox"
                checked={remember}
                onChange={e => setRemember(e.target.checked)}
                className="accent-gold"
              />
              <span className="text-[10px] text-secondary">Remember this password for future syncs</span>
            </label>
          </div>
        ) : (
          <div className="mb-4 flex items-center gap-2 text-[10px] text-credit">
            <span>✓</span>
            <span>Using saved password for {bank.toUpperCase()}</span>
          </div>
        )}

        {/* Sync button */}
        {status === 'idle' && (
          <button
            onClick={handleSync}
            disabled={!hasSaved && !password}
            className="w-full bg-gold text-base py-3 text-xs font-bold tracking-wider shadow-[4px_4px_0_0_var(--color-gold-shadow)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0_0_var(--color-gold-shadow)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[2px_2px_0_0_var(--color-gold-shadow)] transition-all duration-100 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:translate-x-0 disabled:hover:translate-y-0 cursor-pointer"
          >
            SYNC NOW →
          </button>
        )}

        {/* Terminal log */}
        {logLines.length > 0 && (
          <div className="mt-4 bg-base border border-line p-3">
            <div className="flex items-center gap-1.5 mb-2 pb-2 border-b border-hover">
              <span className="w-1.5 h-1.5 bg-debit inline-block" />
              <span className="w-1.5 h-1.5 bg-gold inline-block" />
              <span className="w-1.5 h-1.5 bg-credit inline-block" />
              <span className="text-[10px] text-secondary ml-2 tracking-wider">finsight — gmail sync</span>
            </div>
            <div className="text-[11px] leading-loose">
              {logLines.map((line, i) => (
                <div key={i} className="flex gap-2">
                  <span className={line.type === 'cmd' ? 'text-credit' : 'text-transparent select-none'}>$</span>
                  <span className={LINE_CLASS[line.type]}>{line.type !== 'cmd' ? '▸ ' : ''}{line.text}</span>
                </div>
              ))}
              {status === 'syncing' && (
                <div className="flex gap-2">
                  <span className="text-credit">$</span>
                  <span className="inline-block w-2 h-3.5 bg-gold cursor-blink" />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Success */}
        {status === 'success' && result && (
          <div className="mt-4 flex items-center justify-between">
            <span className="text-credit text-xs">
              ✓ {result.transactionsImported} new transactions imported
            </span>
            <button onClick={onClose} className="text-gold text-xs underline cursor-pointer">
              View dashboard →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Navbar ──────────────────────────────────────────────────────────────────
function Navbar({ user, onSyncClick }) {
  return (
    <nav className="flex items-center justify-between px-4 sm:px-7 py-3.5 border-b border-line bg-base/95 sticky top-0 z-10">
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 bg-gold flex items-center justify-center text-[13px] font-bold text-base shadow-[3px_3px_0_0_var(--color-gold-shadow)]">
          F
        </div>
        <span className="text-sm sm:text-base font-bold tracking-wider text-primary">FINSIGHT</span>
        <span className="hidden sm:inline w-px h-4 bg-line mx-1" />
        <span className="hidden sm:inline text-[10px] text-secondary tracking-wider">DASHBOARD</span>
      </div>
      <div className="flex items-center gap-3 sm:gap-4">
        <button
          onClick={onSyncClick}
          className="flex items-center gap-1.5 text-[10px] text-gold border border-gold px-2.5 py-1.5 hover:bg-gold hover:text-base transition-colors duration-150 cursor-pointer tracking-wider"
        >
          ↻ SYNC GMAIL
        </button>
        <a href="/statements" className="hidden sm:inline text-[10px] text-secondary hover:text-gold tracking-wider transition-colors">
          UPLOAD PDF
        </a>
        <span className="hidden sm:inline text-xs text-secondary truncate max-w-[140px]">{user?.name}</span>
        <button
          onClick={() => { localStorage.removeItem('token'); window.location.href = '/login'; }}
          className="text-[10px] text-muted hover:text-gold tracking-wider transition-colors cursor-pointer"
        >
          SIGN OUT
        </button>
      </div>
    </nav>
  );
}

// ── Summary Card ────────────────────────────────────────────────────────────
function SummaryCard({ label, value, sub, colorClass }) {
  return (
    <div className="border border-line bg-surface p-4 sm:p-5 shadow-[4px_4px_0_0_var(--color-hover)]">
      <p className="text-[10px] text-secondary tracking-wider mb-1.5">{label}</p>
      <p className={`text-xl sm:text-2xl font-bold tracking-tight ${colorClass}`}>{value}</p>
      {sub && <p className="text-[10px] text-muted mt-1">{sub}</p>}
    </div>
  );
}

// ── Transaction Row ─────────────────────────────────────────────────────────
function TransactionRow({ txn }) {
  const isDebit = txn.type === 'debit';
  const date = new Date(txn.transaction_date);
  const dateStr = `${date.getDate()} ${MONTHS[date.getMonth()]}`;

  return (
    <div className="flex items-center gap-3 sm:gap-4 py-2.5 sm:py-3 border-b border-line last:border-0 hover:bg-gold/[0.04] transition-colors duration-150 px-1">
      <span className="text-muted text-[10px] sm:text-xs w-10 sm:w-12 shrink-0">{dateStr}</span>
      <div className="flex-1 min-w-0">
        <p className="text-primary text-xs sm:text-sm truncate">{txn.merchant || 'Unknown'}</p>
        <p className="text-muted text-[10px] truncate">{txn.category_name || 'Uncategorized'}</p>
      </div>
      <span className={`text-xs sm:text-sm font-bold shrink-0 ${isDebit ? 'text-debit' : 'text-credit'}`}>
        {isDebit ? '−' : '+'}{formatAmount(txn.amount)}
      </span>
    </div>
  );
}

// ── Dashboard ───────────────────────────────────────────────────────────────
export default function Dashboard() {
  const now = new Date();
  const [month, setMonth]           = useState(now.getMonth() + 1);
  const [year]                      = useState(now.getFullYear());
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary]       = useState(null);
  const [loading, setLoading]       = useState(true);
  const [user, setUser]             = useState(null);
  const [showSync, setShowSync]     = useState(false);

  const loadData = useCallback(() => {
    setLoading(true);
    Promise.all([
      transactionsAPI.getAll({ month, year, limit: 50 }),
      transactionsAPI.getSummary({ month, year }),
      fetch('http://localhost/api/auth/me', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      }).then(r => r.json()),
    ]).then(([txnRes, sumRes, userRes]) => {
      setTransactions(txnRes.data.transactions || []);
      setSummary(sumRes.data);
      setUser(userRes.user);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, [month, year]);

  useEffect(() => { loadData(); }, [loadData]);

  const totalDebit  = transactions.filter(t => t.type === 'debit').reduce((s, t) => s + parseFloat(t.amount), 0);
  const totalCredit = transactions.filter(t => t.type === 'credit').reduce((s, t) => s + parseFloat(t.amount), 0);
  const net = totalCredit - totalDebit;

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-base grid-bg flex items-center justify-center">
        <div className="flex items-center gap-2 text-secondary text-xs">
          <span className="text-credit">$</span>
          loading ledger
          <span className="inline-block w-2 h-3.5 bg-gold cursor-blink" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-base grid-bg">
      <Navbar user={user} onSyncClick={() => setShowSync(true)} />

      {showSync && (
        <SyncModal
          onClose={() => setShowSync(false)}
          onSyncComplete={() => { setShowSync(false); loadData(); }}
        />
      )}

      <div className="max-w-6xl mx-auto px-4 sm:px-7 py-6 sm:py-8">

        {/* Month selector */}
        <div className="flex items-center gap-1 mb-6 overflow-x-auto pb-1">
          {MONTHS.map((m, i) => (
            <button
              key={m}
              onClick={() => setMonth(i + 1)}
              className={`px-2.5 sm:px-3 py-1.5 text-[10px] sm:text-xs tracking-wider whitespace-nowrap transition-colors cursor-pointer ${
                month === i + 1
                  ? 'bg-gold text-base font-bold'
                  : 'text-secondary hover:text-primary'
              }`}
            >
              {m}
            </button>
          ))}
          <span className="ml-auto text-secondary text-xs shrink-0 pl-2">{year}</span>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <SummaryCard label="TOTAL SPENT"    value={formatAmount(totalDebit)}  sub={`${transactions.filter(t => t.type === 'debit').length} transactions`}  colorClass="text-debit" />
          <SummaryCard label="TOTAL RECEIVED" value={formatAmount(totalCredit)} sub={`${transactions.filter(t => t.type === 'credit').length} credits`}        colorClass="text-credit" />
          <SummaryCard label="NET"            value={formatAmount(net)}         sub="for this month"                                                            colorClass={net >= 0 ? 'text-credit' : 'text-debit'} />
        </div>

        {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">

          {/* Transaction list */}
          <div className="lg:col-span-2 border border-line bg-surface p-4 sm:p-5 shadow-[4px_4px_0_0_var(--color-hover)] min-w-0">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h2 style={{ color: '#E6EDF3' }} className="text-sm sm:text-base font-bold tracking-wider">TRANSACTIONS</h2>
              <span className="text-muted text-[10px]">{MONTHS[month-1]} {year}</span>
            </div>
            {transactions.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-secondary text-xs mb-3">No transactions for this month.</p>
                <button onClick={() => setShowSync(true)} className="text-gold text-xs underline cursor-pointer mr-4">↻ Sync Gmail</button>
                <a href="/statements" className="text-gold text-xs underline">Upload PDF →</a>
              </div>
            ) : (
              <div className="overflow-y-auto max-h-96">
                {transactions.map(txn => <TransactionRow key={txn.id} txn={txn} />)}
              </div>
            )}
          </div>

          {/* Category breakdown */}
          <div className="border border-line bg-surface p-4 sm:p-5 shadow-[4px_4px_0_0_var(--color-hover)] min-w-0">
            <h2 style={{ color: '#E6EDF3' }} className="text-sm sm:text-base font-bold tracking-wider mb-3 sm:mb-4">BY CATEGORY</h2>
            {summary?.categories?.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={summary.categories} dataKey="total" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={75} stroke="#0D1117" strokeWidth={2}>
                      {summary.categories.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v) => formatAmount(v)} contentStyle={{ background: '#161B22', border: '1px solid #30363D', fontSize: '11px', fontFamily: 'IBM Plex Mono, monospace' }} itemStyle={{ color: '#E6EDF3' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-3 space-y-1.5">
                  {summary.categories.slice(0, 6).map((cat, i) => (
                    <div key={cat.name} className="flex items-center gap-2">
                      <span className="w-2 h-2 shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                      <span className="text-secondary text-[10px] flex-1 truncate">{cat.name}</span>
                      <span className="text-[10px] font-bold" style={{ color: '#E6EDF3' }}>{formatAmount(cat.total)}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-secondary text-xs text-center py-10">No spending data for this month</p>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
