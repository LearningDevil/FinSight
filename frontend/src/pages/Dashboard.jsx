import { useState, useEffect } from 'react';
import { transactionsAPI } from '../services/api';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

const MONTHS = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];

const PIE_COLORS = ['#B7472A', '#3FB950', '#B8860B', '#79C0FF', '#8B949E', '#D97706', '#A371F7', '#F778BA'];

function formatAmount(amount) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
}

function Navbar({ user }) {
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
      <div className="flex items-center gap-4">
        <span className="hidden sm:inline text-xs text-secondary truncate max-w-[160px]">{user?.name}</span>
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

function SummaryCard({ label, value, sub, colorClass }) {
  return (
    <div className="border border-line bg-surface p-4 sm:p-5 shadow-[4px_4px_0_0_var(--color-hover)]">
      <p className="text-[10px] text-secondary tracking-wider mb-1.5">{label}</p>
      <p className={`text-xl sm:text-2xl font-bold tracking-tight ${colorClass}`}>{value}</p>
      {sub && <p className="text-[10px] text-muted mt-1">{sub}</p>}
    </div>
  );
}

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

export default function Dashboard() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year]  = useState(now.getFullYear());
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary]           = useState(null);
  const [loading, setLoading]           = useState(true);
  const [user, setUser]                 = useState(null);

  useEffect(() => {
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
      <Navbar user={user} />

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
          <SummaryCard
            label="TOTAL SPENT"
            value={formatAmount(totalDebit)}
            sub={`${transactions.filter(t => t.type === 'debit').length} transactions`}
            colorClass="text-debit"
          />
          <SummaryCard
            label="TOTAL RECEIVED"
            value={formatAmount(totalCredit)}
            sub={`${transactions.filter(t => t.type === 'credit').length} credits`}
            colorClass="text-credit"
          />
          <SummaryCard
            label="NET"
            value={formatAmount(net)}
            sub="for this month"
            colorClass={net >= 0 ? 'text-credit' : 'text-debit'}
          />
        </div>

        {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">

          {/* Transaction list */}
          <div className="lg:col-span-2 border border-line bg-surface p-4 sm:p-5 shadow-[4px_4px_0_0_var(--color-hover)] min-w-0">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h2 className="text-primary text-sm sm:text-base font-bold tracking-wider">TRANSACTIONS</h2>
              <span className="text-muted text-[10px]">{MONTHS[month-1]} {year}</span>
            </div>
            {transactions.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-secondary text-xs mb-2">No transactions for this month.</p>
                <a href="/statements" className="text-gold text-xs underline">Upload a bank statement →</a>
              </div>
            ) : (
              <div className="overflow-y-auto max-h-96">
                {transactions.map(txn => <TransactionRow key={txn.id} txn={txn} />)}
              </div>
            )}
          </div>

          {/* Category breakdown */}
          <div className="border border-line bg-surface p-4 sm:p-5 shadow-[4px_4px_0_0_var(--color-hover)] min-w-0">
            <h2 className="text-primary text-sm sm:text-base font-bold tracking-wider mb-3 sm:mb-4">BY CATEGORY</h2>
            {summary?.categories?.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie
                      data={summary.categories}
                      dataKey="total"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={75}
                      stroke="#0D1117"
                      strokeWidth={2}
                    >
                      {summary.categories.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(v) => formatAmount(v)}
                      contentStyle={{ background: '#161B22', border: '1px solid #30363D', fontSize: '11px', fontFamily: 'IBM Plex Mono, monospace' }}
                      itemStyle={{ color: '#E6EDF3' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-3 space-y-1.5">
                  {summary.categories.slice(0, 6).map((cat, i) => (
                    <div key={cat.name} className="flex items-center gap-2">
                      <span className="w-2 h-2 shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                      <span className="text-secondary text-[10px] flex-1 truncate">{cat.name}</span>
                      <span className="text-primary text-[10px] font-bold">{formatAmount(cat.total)}</span>
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
