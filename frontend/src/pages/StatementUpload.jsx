import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { statementsAPI } from '../services/api';

const BANKS = [
  { id: 'kotak',   label: 'KOTAK',   live: true },
  { id: 'axis',    label: 'AXIS',    live: true },
  { id: 'federal', label: 'FEDERAL', live: true },
  { id: 'hdfc',    label: 'HDFC',    live: false },
  { id: 'sbi',     label: 'SBI',     live: false },
];

function Navbar() {
  return (
    <nav className="flex items-center justify-between px-4 sm:px-7 py-3.5 border-b border-line bg-base/95 sticky top-0 z-10">
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 bg-gold flex items-center justify-center text-[13px] font-bold text-base shadow-[3px_3px_0_0_var(--color-gold-shadow)]">
          F
        </div>
        <span className="text-sm sm:text-base font-bold tracking-wider text-primary">FINSIGHT</span>
        <span className="hidden sm:inline w-px h-4 bg-line mx-1" />
        <span className="hidden sm:inline text-[10px] text-secondary tracking-wider">UPLOAD STATEMENT</span>
      </div>
      <a href="/dashboard" className="text-[10px] text-muted hover:text-gold tracking-wider transition-colors">
        ← BACK TO DASHBOARD
      </a>
    </nav>
  );
}

export default function StatementUpload() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [bank, setBank]         = useState('kotak');
  const [file, setFile]         = useState(null);
  const [password, setPassword] = useState('');
  const [dragOver, setDragOver] = useState(false);

  const [status, setStatus]     = useState('idle'); // idle | uploading | success | error
  const [logLines, setLogLines] = useState([]);
  const [result, setResult]     = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const pushLog = (text, type = 'output') => {
    setLogLines(prev => [...prev, { text, type }]);
  };

  const handleFileSelect = (f) => {
    if (f && f.type === 'application/pdf') {
      setFile(f);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFileSelect(e.dataTransfer.files[0]);
  };

  const handleUpload = async () => {
    if (!file || !password) return;

    setStatus('uploading');
    setLogLines([]);
    setErrorMsg('');

    pushLog(`upload_statement ${file.name}`, 'cmd');
    await new Promise(r => setTimeout(r, 300));
    pushLog('connecting to parser service...', 'output');
    await new Promise(r => setTimeout(r, 400));
    pushLog('unlocking PDF with provided password...', 'output');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('password', password);
    formData.append('bank', bank);

    try {
      const { data } = await statementsAPI.upload(formData);

      pushLog('PDF unlocked successfully', 'good');
      await new Promise(r => setTimeout(r, 300));
      pushLog('extracting transaction table...', 'output');
      await new Promise(r => setTimeout(r, 400));
      pushLog(`found ${data.total} transactions`, 'value');
      await new Promise(r => setTimeout(r, 300));
      pushLog(`imported: ${data.imported}`, 'credit');
      pushLog(`duplicates skipped: ${data.skipped}`, 'value');

      setResult(data);
      setStatus('success');
    } catch (err) {
      const msg = err.response?.data?.error || 'Upload failed — please try again';
      pushLog(`error: ${msg}`, 'debit');
      setErrorMsg(msg);
      setStatus('error');
    }
  };

  const LINE_CLASS = {
    cmd:    'text-info',
    output: 'text-secondary',
    value:  'text-gold',
    good:   'text-credit',
    credit: 'text-credit',
    debit:  'text-debit',
  };

  return (
    <div className="min-h-screen w-full bg-base grid-bg">
      <Navbar />

      <div className="max-w-3xl mx-auto px-4 sm:px-7 py-8 sm:py-12">

        <div className="mb-8">
          <div className="flex items-center gap-2 text-[10px] tracking-[0.2em] text-gold mb-3">
            <span className="inline-block w-5 h-px bg-gold" />
            STATEMENT IMPORT
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-primary tracking-tight">
            Upload your bank statement
          </h1>
          <p className="text-xs text-secondary mt-2 max-w-md">
            We unlock your PDF, extract every transaction, and auto-categorize them — your password is used once and never stored.
          </p>
        </div>

        {/* Bank selector */}
        <div className="mb-5">
          <p className="text-[10px] text-secondary tracking-wider mb-2">SELECT BANK</p>
          <div className="flex flex-wrap gap-2">
            {BANKS.map(b => (
              <button
                key={b.id}
                disabled={!b.live}
                onClick={() => setBank(b.id)}
                className={`px-3 py-2 text-[11px] font-bold tracking-wider transition-colors border ${
                  bank === b.id
                    ? 'bg-gold text-base border-gold'
                    : b.live
                      ? 'text-secondary border-line hover:text-primary hover:border-line-active cursor-pointer'
                      : 'text-muted border-line opacity-40 cursor-not-allowed'
                }`}
              >
                {b.label}{!b.live && ' (SOON)'}
              </button>
            ))}
          </div>
        </div>

        {/* File drop zone */}
        <div className="mb-5">
          <p className="text-[10px] text-secondary tracking-wider mb-2">STATEMENT PDF</p>
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={`border-2 border-dashed p-8 text-center cursor-pointer transition-colors ${
              dragOver ? 'border-gold bg-gold/5' : 'border-line hover:border-line-active'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={(e) => handleFileSelect(e.target.files[0])}
            />
            {file ? (
              <div>
                <p className="text-primary text-sm font-bold">{file.name}</p>
                <p className="text-muted text-[10px] mt-1">{(file.size / 1024).toFixed(0)} KB — click to change</p>
              </div>
            ) : (
              <div>
                <p className="text-secondary text-xs">Drag and drop your statement PDF here</p>
                <p className="text-muted text-[10px] mt-1">or click to browse</p>
              </div>
            )}
          </div>
        </div>

        {/* Password */}
        <div className="mb-6">
          <p className="text-[10px] text-secondary tracking-wider mb-2">PDF PASSWORD</p>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your statement's PDF password"
            className="w-full bg-surface border border-line focus:border-line-active px-3 py-2.5 text-xs text-primary placeholder:text-muted outline-none shadow-[2px_2px_0_0_var(--color-hover)]"
          />
        </div>

        {/* Upload button */}
        <button
          onClick={handleUpload}
          disabled={!file || !password || status === 'uploading'}
          className="inline-flex items-center gap-2.5 bg-gold text-base px-5 py-3 text-xs font-bold tracking-wider shadow-[4px_4px_0_0_var(--color-gold-shadow)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0_0_var(--color-gold-shadow)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[2px_2px_0_0_var(--color-gold-shadow)] transition-all duration-100 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:translate-x-0 disabled:hover:translate-y-0 cursor-pointer"
        >
          {status === 'uploading' ? 'PROCESSING...' : 'PARSE STATEMENT →'}
        </button>

        {/* Terminal log */}
        {logLines.length > 0 && (
          <div className="mt-8 bg-surface border border-line shadow-[6px_6px_0_0_var(--color-hover)] p-4">
            <div className="flex items-center gap-1.5 mb-3 pb-2.5 border-b border-hover">
              <span className="w-2 h-2 bg-debit inline-block" />
              <span className="w-2 h-2 bg-gold inline-block" />
              <span className="w-2 h-2 bg-credit inline-block" />
              <span className="text-[10px] text-secondary ml-2 tracking-wider">finsight — statement parser</span>
            </div>
            <div className="text-[11px] leading-loose">
              {logLines.map((line, i) => (
                <div key={i} className="flex gap-2">
                  <span className={line.type === 'cmd' ? 'text-credit' : 'text-transparent select-none'}>$</span>
                  <span className={LINE_CLASS[line.type]}>
                    {line.type !== 'cmd' ? '▸ ' : ''}{line.text}
                  </span>
                  {line.type === 'good' && <span className="text-credit ml-1">✓</span>}
                </div>
              ))}
              {status === 'uploading' && (
                <div className="flex gap-2">
                  <span className="text-credit">$</span>
                  <span className="inline-block w-2 h-3.5 bg-gold cursor-blink" />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Success result */}
        {status === 'success' && result && (
          <div className="mt-6 border border-credit/30 bg-credit/5 p-5">
            <p className="text-credit text-sm font-bold mb-1">Import complete</p>
            <p className="text-secondary text-xs mb-4">{result.message}</p>
            <button
              onClick={() => navigate('/dashboard')}
              className="text-gold text-xs underline cursor-pointer"
            >
              View on dashboard →
            </button>
          </div>
        )}

        {/* Error */}
        {status === 'error' && (
          <div className="mt-6 border border-debit/30 bg-debit/5 p-5">
            <p className="text-debit text-sm font-bold mb-1">Import failed</p>
            <p className="text-secondary text-xs">{errorMsg}</p>
          </div>
        )}

      </div>
    </div>
  );
}
