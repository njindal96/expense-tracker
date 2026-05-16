// components.jsx — shared UI: icons, hero, summary cards, ledger rows, sheets

// ─────────────────────────────────────────────────────────
// Tiny icon set (Lucide-style, inline SVG)
// ─────────────────────────────────────────────────────────
const Icon = ({ name, size = 16, stroke = 1.4, color = 'currentColor', style = {} }) => {
  const paths = {
    search: <><circle cx="11" cy="11" r="6"/><path d="m20 20-3.5-3.5"/></>,
    plus: <><path d="M12 5v14M5 12h14"/></>,
    close: <><path d="M6 6l12 12M18 6L6 18"/></>,
    chevron: <><path d="M9 6l6 6-6 6"/></>,
    chevronDown: <><path d="M6 9l6 6 6-6"/></>,
    repeat: <><path d="M17 2l4 4-4 4"/><path d="M3 11V9a4 4 0 014-4h14"/><path d="M7 22l-4-4 4-4"/><path d="M21 13v2a4 4 0 01-4 4H3"/></>,
    lock: <><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 018 0v4"/></>,
    sparkle: <><path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8"/></>,
    upRight: <><path d="M7 17L17 7"/><path d="M8 7h9v9"/></>,
    downLeft: <><path d="M17 7L7 17"/><path d="M16 17H7V8"/></>,
    filter: <><path d="M3 6h18M6 12h12M10 18h4"/></>,
    check: <><path d="M5 12l5 5 9-10"/></>,
    settings: <><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/></>,
    clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
    bolt: <><path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z"/></>,
    bank: <><path d="M3 10L12 4l9 6"/><path d="M5 10v9M19 10v9M9 10v9M15 10v9"/><path d="M3 21h18"/></>,
    sun: <><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></>,
    moon: <><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></>,
    arrowLeft: <><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round"
      style={style}>{paths[name]}</svg>
  );
};

// ─────────────────────────────────────────────────────────
// Currency display — switchable serif/mono numerals
// ─────────────────────────────────────────────────────────
function Money({ value, sign = false, size = 16, weight = 500, numerals = 'mono', color, italic = false }) {
  const fam = numerals === 'serif'
    ? '"Instrument Serif", "Iowan Old Style", Georgia, serif'
    : '"Geist Mono", "JetBrains Mono", ui-monospace, monospace';
  const v = window.fmtINR(value, { sign });
  return (
    <span style={{
      fontFamily: fam,
      fontSize: size,
      fontWeight: numerals === 'serif' ? 400 : weight,
      fontStyle: italic && numerals === 'serif' ? 'italic' : 'normal',
      letterSpacing: numerals === 'mono' ? '-0.01em' : '-0.005em',
      color,
      fontVariantNumeric: 'tabular-nums',
      whiteSpace: 'nowrap',
    }}>{v}</span>
  );
}

// ─────────────────────────────────────────────────────────
// Sparkline — daily aggregate for the month so far
// ─────────────────────────────────────────────────────────
function Sparkline({ values, color = '#444', height = 28, width = 88, fill = true }) {
  if (!values.length) return null;
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  const n = values.length;
  const stepX = width / (n - 1 || 1);
  const points = values.map((v, i) => {
    const x = i * stepX;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return [x, y];
  });
  const path = points.map(([x, y], i) => (i === 0 ? `M${x} ${y}` : `L${x} ${y}`)).join(' ');
  const area = path + ` L${width} ${height} L0 ${height} Z`;
  return (
    <svg width={width} height={height} style={{ overflow: 'visible' }}>
      {fill && <path d={area} fill={color} fillOpacity="0.10"/>}
      <path d={path} stroke={color} strokeWidth="1.25" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx={points[points.length - 1][0]} cy={points[points.length - 1][1]} r="2" fill={color}/>
    </svg>
  );
}

// ─────────────────────────────────────────────────────────
// Category color helper — deterministic warm hue per cat
// ─────────────────────────────────────────────────────────
function hueForCat(id) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return (h % 70) + 15;
}

// ─────────────────────────────────────────────────────────
// Category glyph (tinted tile w/ emoji) — used in rows
// ─────────────────────────────────────────────────────────
function CategoryGlyph({ catId, emoji, size = 40, theme, onClick, dim = false }) {
  const hue = hueForCat(catId);
  const bg = theme?.dark
    ? `oklch(0.24 0.04 ${hue})`
    : `oklch(0.93 0.045 ${hue})`;
  const fg = theme?.dark
    ? `oklch(0.82 0.08 ${hue})`
    : `oklch(0.42 0.10 ${hue})`;
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag
      onClick={onClick}
      className={'cat-glyph' + (onClick ? ' cat-glyph-btn' : '')}
      aria-label={onClick ? 'Change category' : undefined}
      style={{
        width: size, height: size, borderRadius: 12,
        background: bg, color: fg,
        opacity: dim ? 0.7 : 1,
        flexShrink: 0,
      }}
    >
      <span style={{ fontSize: size * 0.5, lineHeight: 1 }}>{emoji}</span>
    </Tag>
  );
}

// ─────────────────────────────────────────────────────────
// Merchant glyph (initials chip) — used in sheets
// ─────────────────────────────────────────────────────────
function MerchantGlyph({ name, size = 36, theme }) {
  const initials = name.replace(/[^A-Za-z ]/g, '').split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase() || '·';
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  const hue = (h % 60) + 20;
  return (
    <div style={{
      width: size, height: size, borderRadius: 10,
      background: theme?.dark ? `oklch(0.22 0.025 ${hue})` : `oklch(0.94 0.03 ${hue})`,
      color: theme?.dark ? `oklch(0.78 0.06 ${hue})` : `oklch(0.36 0.08 ${hue})`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.32, fontWeight: 600, letterSpacing: '-0.01em',
      fontFamily: '"Geist", system-ui, sans-serif',
      flexShrink: 0,
    }}>{initials}</div>
  );
}

// ─────────────────────────────────────────────────────────
// HERO — month-to-date pulse
// ─────────────────────────────────────────────────────────
function MonthHero({ txns, theme, numerals }) {
  const outflow = txns.filter(t => t.type === 'debit').reduce((s, t) => s + t.amount, 0);
  const inflow  = txns.filter(t => t.type === 'credit').reduce((s, t) => s + t.amount, 0);
  const net = inflow - outflow;
  const ratio = inflow > 0 ? Math.min(1, outflow / inflow) : 1;

  return (
    <div className="hero" style={{ color: theme.text }}>
      <div className="hero-label" style={{ color: theme.muted }}>
        <span style={{ width: 6, height: 6, borderRadius: 99, background: theme.credit, display: 'inline-block' }}/>
        May, so far
      </div>

      <div className="hero-net">
        <Money value={net} sign size={56} numerals={numerals} italic
          color={net >= 0 ? theme.credit : theme.text}
        />
      </div>
      <div className="hero-sub" style={{ color: theme.muted }}>
        net cash flow this month
      </div>

      {/* Bar split */}
      <div className="hero-bar" style={{ background: theme.borderSoft }}>
        <div className="hero-bar-fill" style={{
          width: `${ratio * 100}%`,
          background: `linear-gradient(90deg, ${theme.debit}66, ${theme.debit})`,
        }} />
      </div>

      <div className="hero-foot">
        <div className="hero-foot-cell">
          <div className="hero-foot-label" style={{ color: theme.muted }}>
            <Icon name="downLeft" size={11} stroke={1.6}/> Outflow
          </div>
          <Money value={outflow} size={18} weight={500} numerals={numerals} color={theme.debit}/>
        </div>
        <div className="hero-foot-divider" style={{ background: theme.borderSoft }}/>
        <div className="hero-foot-cell">
          <div className="hero-foot-label" style={{ color: theme.muted }}>
            <Icon name="upRight" size={11} stroke={1.6}/> Inflow
          </div>
          <Money value={inflow} size={18} weight={500} numerals={numerals} color={theme.credit}/>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Stat strip — top category + spend by day sparkline
// ─────────────────────────────────────────────────────────
function StatStrip({ txns, theme, numerals, onPickCategory }) {
  // Top category by outflow
  const byCat = {};
  let totalDebit = 0;
  txns.filter(t => t.type === 'debit').forEach(t => {
    byCat[t.category] = (byCat[t.category] || 0) + t.amount;
    totalDebit += t.amount;
  });
  const sorted = Object.entries(byCat).sort((a, b) => b[1] - a[1]);
  const top = sorted[0] || ['other', 0];
  const topCat = window.catById(top[0]);
  const topPct = totalDebit ? Math.round((top[1] / totalDebit) * 100) : 0;

  // Daily spend for sparkline
  const days = {};
  txns.filter(t => t.type === 'debit').forEach(t => {
    const d = new Date(t.transaction_date).getDate();
    days[d] = (days[d] || 0) + t.amount;
  });
  const values = [];
  for (let d = 2; d <= 16; d++) values.push(days[d] || 0);

  return (
    <div className="stat-strip">
      {/* Top category card */}
      <div className="stat-card" style={{ background: theme.surface, borderColor: theme.borderSoft }}>
        <div className="stat-card-h" style={{ color: theme.muted }}>Top category</div>
        <div className="stat-card-body">
          <div className="stat-cat-row">
            <span className="stat-cat-emoji">{topCat.emoji}</span>
            <span className="stat-cat-name" style={{ color: theme.text }}>{topCat.label}</span>
          </div>
          <div className="stat-cat-meta">
            <Money value={top[1]} size={15} weight={500} numerals={numerals} color={theme.text}/>
            <span style={{ color: theme.muted, fontSize: 11.5 }}>{topPct}% of outflow</span>
          </div>
        </div>
      </div>

      {/* Daily spend card */}
      <div className="stat-card" style={{ background: theme.surface, borderColor: theme.borderSoft }}>
        <div className="stat-card-h" style={{ color: theme.muted }}>Daily spend</div>
        <div className="stat-card-body" style={{ gap: 4 }}>
          <Sparkline values={values} color={theme.debit} width={132} height={32}/>
          <div style={{ color: theme.soft, fontSize: 10.5, fontFamily: '"Geist Mono", monospace', display: 'flex', justifyContent: 'space-between', whiteSpace: 'nowrap' }}>
            <span>May 2</span><span>May 16</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// LEDGER ROW — category-forward
// ─────────────────────────────────────────────────────────
function LedgerRow({ txn, theme, numerals, density, onCategoryClick, onRowClick }) {
  const cat = window.catById(txn.category);
  const isCredit = txn.type === 'credit';
  const isUnsure = txn.confidence < 0.85;
  const amtColor = isCredit ? theme.credit : theme.text;

  const tintBg = isUnsure
    ? (theme.dark ? 'rgba(216, 130, 96, 0.10)' : 'rgba(168, 72, 44, 0.05)')
    : 'transparent';

  return (
    <div
      className={'row ' + (density === 'compact' ? 'row-compact' : '') + (onRowClick ? ' row-tappable' : '') + (isUnsure ? ' row-unsure' : '')}
      style={{
        borderColor: theme.borderSoft,
        background: tintBg,
      }}
      onClick={(e) => {
        if (e.target.closest('.cat-glyph-btn') || e.target.closest('.row-cat')) return;
        onRowClick && onRowClick(txn);
      }}
    >
      {isUnsure && (
        <span className="row-unsure-strip" style={{ background: theme.debit }} aria-hidden="true"/>
      )}

      <CategoryGlyph
        catId={cat.id}
        emoji={cat.emoji}
        size={density === 'compact' ? 36 : 42}
        theme={theme}
        onClick={() => onCategoryClick(txn)}
      />

      <div className="row-mid">
        <div className="row-top">
          <div className="row-merchant">
            <span className="row-merchant-name" style={{ color: theme.text }}>{txn.merchant}</span>
            {txn.is_recurring && (
              <Icon name="repeat" size={11} color={theme.soft} stroke={1.6} style={{ flexShrink: 0 }}/>
            )}
            {txn.status === 'pending' && (
              <span className="row-pending" style={{ background: theme.warnBg, color: theme.warn }}>pending</span>
            )}
          </div>
          <Money value={txn.amount} sign={isCredit} size={density === 'compact' ? 14 : 15}
            numerals={numerals} weight={500} color={amtColor}
          />
        </div>

        <div className="row-bottom">
          <button
            className="row-cat"
            onClick={(e) => { e.stopPropagation(); onCategoryClick(txn); }}
            style={{
              color: isUnsure ? theme.debit : theme.text,
              background: 'transparent',
              borderColor: 'transparent',
            }}
          >
            <span className="row-cat-label">{cat.label}</span>
            <Icon name="chevronDown" size={9} stroke={1.8}/>
          </button>
          <div className="row-meta" style={{ color: theme.muted }}>
            <span className="row-dot" style={{ background: theme.soft }}/>
            <span>{window.fmtTime(txn.transaction_date)}</span>
            <span className="row-dot" style={{ background: theme.soft }}/>
            <span>{txn.payment_method}</span>
            <span className="row-dot" style={{ background: theme.soft }}/>
            <span>{txn.bank_name}</span>
          </div>
        </div>

        {isUnsure && (
          <div className="row-aiconf" style={{ color: theme.debit }} title={`AI confidence ${Math.round(txn.confidence * 100)}%`}>
            <span style={{ width: 4, height: 4, borderRadius: 99, background: theme.debit, display: 'inline-block' }}/>
            <em>Looks unsure — tap to confirm</em>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// CATEGORY PICKER — bottom sheet with inline "add new"
// ─────────────────────────────────────────────────────────
const NEW_CAT_EMOJIS = ['🍜', '🛒', '🚕', '🛍️', '🎬', '💡', '🩺', '🏠', '💼', '📈', '✈️', '🎁', '🐶', '📚', '⚽️', '🎵', '🌿', '🔧', '✂️', '☕', '💸', '🎓', '👶', '·'];

function CategorySheet({ txn, categories, onAddCategory, onClose, onPick, theme }) {
  const [adding, setAdding] = React.useState(false);
  const [label, setLabel] = React.useState('');
  const [emoji, setEmoji] = React.useState('·');
  const inputRef = React.useRef(null);

  React.useEffect(() => {
    if (adding) setTimeout(() => inputRef.current?.focus(), 60);
  }, [adding]);

  if (!txn) return null;
  const current = txn.category;

  const saveNew = () => {
    const trimmed = label.trim();
    if (!trimmed) return;
    const created = onAddCategory(trimmed, emoji);
    onPick(created.id); // immediately apply to the active txn
  };

  return (
    <SheetShell onClose={onClose} theme={theme} title={adding ? 'New category' : 'Recategorize'}>
      <div className="sheet-merchant">
        <MerchantGlyph name={txn.merchant} size={44} theme={theme}/>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ color: theme.text, fontSize: 15, fontWeight: 500 }}>{txn.merchant}</span>
          <span style={{ color: theme.muted, fontSize: 12 }}>
            <Money value={txn.amount} size={12} numerals="mono" color={theme.muted}/>
            {' · '}{window.fmtDateShort(txn.transaction_date)}
          </span>
        </div>
      </div>

      {!adding ? (
        <>
          <div className="cat-grid">
            {categories.map(c => (
              <button
                key={c.id}
                className={'cat-tile ' + (c.id === current ? 'active' : '')}
                onClick={() => onPick(c.id)}
                style={{
                  background: c.id === current ? theme.text : theme.surfaceAlt,
                  color: c.id === current ? theme.bg : theme.text,
                  borderColor: c.id === current ? theme.text : theme.borderSoft,
                }}
              >
                <span className="cat-tile-emoji">{c.emoji}</span>
                <span className="cat-tile-label">{c.label}</span>
                {c.id === current && (
                  <Icon name="check" size={12} stroke={2}
                    color={theme.bg}
                    style={{ position: 'absolute', top: 8, right: 8 }}
                  />
                )}
                {c.custom && c.id !== current && (
                  <span className="cat-tile-mark" style={{ color: theme.soft }}>·</span>
                )}
              </button>
            ))}
            <button
              className="cat-tile cat-tile-add"
              onClick={() => setAdding(true)}
              style={{
                background: 'transparent',
                color: theme.muted,
                borderColor: theme.borderSoft,
                borderStyle: 'dashed',
              }}
            >
              <Icon name="plus" size={18} stroke={1.6} color={theme.muted}/>
              <span className="cat-tile-label">Add new</span>
            </button>
          </div>

          <div className="sheet-hint" style={{ color: theme.muted }}>
            We'll remember this for similar merchants.
          </div>
        </>
      ) : (
        <div className="newcat-form">
          <div className="newcat-preview" style={{ background: theme.surfaceAlt, borderColor: theme.borderSoft }}>
            <span className="newcat-preview-emoji">{emoji}</span>
            <input
              ref={inputRef}
              className="newcat-input"
              value={label}
              onChange={e => setLabel(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') saveNew(); }}
              placeholder="Category name (e.g. Travel, Pets, Gifts…)"
              maxLength={24}
              style={{ color: theme.text }}
            />
          </div>

          <div className="newcat-emojis-label" style={{ color: theme.muted }}>Pick a glyph</div>
          <div className="newcat-emojis">
            {NEW_CAT_EMOJIS.map(e => (
              <button
                key={e}
                onClick={() => setEmoji(e)}
                className={'newcat-emoji-btn ' + (emoji === e ? 'active' : '')}
                style={{
                  background: emoji === e ? theme.text : 'transparent',
                  borderColor: emoji === e ? theme.text : theme.borderSoft,
                }}
              >
                <span>{e}</span>
              </button>
            ))}
          </div>

          <div className="newcat-actions">
            <button
              className="newcat-back"
              onClick={() => { setAdding(false); setLabel(''); setEmoji('·'); }}
              style={{ color: theme.muted, borderColor: theme.borderSoft }}
            >
              Back
            </button>
            <button
              className="newcat-save"
              disabled={!label.trim()}
              onClick={saveNew}
              style={{
                background: label.trim() ? theme.text : theme.borderSoft,
                color: label.trim() ? theme.bg : theme.muted,
              }}
            >
              Add &amp; apply
            </button>
          </div>
        </div>
      )}
    </SheetShell>
  );
}

// ─────────────────────────────────────────────────────────
// TRANSACTION SHEET — used for both 'new' and 'edit' modes
// ─────────────────────────────────────────────────────────
function TransactionSheet({ mode = 'new', existing, categories, onAddCategory, onClose, onSave, onDelete, theme }) {
  const initial = existing || {
    type: 'debit',
    amount: '',
    merchant: '',
    category: 'food',
    payment_method: 'UPI',
    bank_name: 'HDFC',
    is_recurring: false,
  };

  const [type, setType]           = React.useState(initial.type);
  const [amount, setAmount]       = React.useState(initial.amount === '' ? '' : String(initial.amount));
  const [merchant, setMerchant]   = React.useState(initial.merchant);
  const [category, setCategory]   = React.useState(initial.category);
  const [method, setMethod]       = React.useState(initial.payment_method);
  const [bank, setBank]           = React.useState(initial.bank_name);
  const [recurring, setRecurring] = React.useState(initial.is_recurring);
  const [showDelConfirm, setShowDelConfirm] = React.useState(false);

  const canSave = String(amount).trim() && merchant.trim();
  const isEdit = mode === 'edit';

  const save = () => {
    if (!canSave) return;
    if (isEdit) {
      onSave({
        ...existing,
        type,
        amount: parseFloat(amount),
        merchant: merchant.trim(),
        category,
        payment_method: method,
        bank_name: bank,
        is_recurring: recurring,
        confidence: 1.0, // user-confirmed
      });
    } else {
      onSave({
        id: 'new-' + Date.now(),
        transaction_date: new Date().toISOString(),
        type,
        amount: parseFloat(amount),
        currency: 'INR',
        merchant: merchant.trim(),
        bank_name: bank,
        payment_method: method,
        category,
        tags: ['manual'],
        is_recurring: recurring,
        status: 'cleared',
        confidence: 1.00,
      });
    }
  };

  return (
    <SheetShell onClose={onClose} theme={theme} title={isEdit ? 'Edit transaction' : 'New transaction'}>
      {/* Existing-txn meta strip */}
      {isEdit && (
        <div className="edit-meta" style={{ color: theme.muted, background: theme.surfaceAlt, borderColor: theme.borderSoft }}>
          <span className="edit-meta-label">Recorded</span>
          <span>{window.fmtDateShort(existing.transaction_date)} · {window.fmtTime(existing.transaction_date)}</span>
        </div>
      )}

      {/* Type toggle */}
      <div className="seg" style={{ background: theme.surfaceAlt, borderColor: theme.borderSoft }}>
        {['debit', 'credit', 'transfer'].map(tp => (
          <button
            key={tp}
            className={'seg-btn ' + (type === tp ? 'active' : '')}
            onClick={() => setType(tp)}
            style={{
              background: type === tp ? theme.surface : 'transparent',
              color: type === tp ? theme.text : theme.muted,
              boxShadow: type === tp ? `0 1px 2px ${theme.shadowSoft}` : 'none',
            }}
          >
            {tp === 'debit' ? 'Spent' : tp === 'credit' ? 'Received' : 'Transfer'}
          </button>
        ))}
      </div>

      {/* Big amount */}
      <div className="nt-amount-wrap" style={{ borderColor: theme.borderSoft }}>
        <span style={{
          fontFamily: '"Instrument Serif", serif',
          fontSize: 42, color: theme.muted,
        }}>₹</span>
        <input
          className="nt-amount"
          type="number"
          inputMode="decimal"
          placeholder="0"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          autoFocus={!isEdit}
          style={{ color: theme.text }}
        />
      </div>

      {/* Merchant */}
      <Field theme={theme} label="Merchant">
        <input
          className="nt-input"
          placeholder="e.g. Blue Tokai"
          value={merchant}
          onChange={e => setMerchant(e.target.value)}
          style={{ color: theme.text, background: 'transparent' }}
        />
      </Field>

      {/* Category */}
      <Field theme={theme} label="Category">
        <div className="nt-chips">
          {categories.filter(c => c.id !== 'other').map(c => (
            <button
              key={c.id}
              onClick={() => setCategory(c.id)}
              className="nt-chip"
              style={{
                background: category === c.id ? theme.text : theme.surfaceAlt,
                color: category === c.id ? theme.bg : theme.text,
                borderColor: category === c.id ? theme.text : theme.borderSoft,
              }}
            >
              <span>{c.emoji}</span> {c.label}
            </button>
          ))}
        </div>
      </Field>

      {/* Method */}
      <Field theme={theme} label="Payment method">
        <div className="nt-chips">
          {['UPI', 'Credit Card', 'Debit Card', 'Cash', 'NEFT', 'Net Banking'].map(m => (
            <button
              key={m}
              onClick={() => setMethod(m)}
              className="nt-chip"
              style={{
                background: method === m ? theme.text : theme.surfaceAlt,
                color: method === m ? theme.bg : theme.text,
                borderColor: method === m ? theme.text : theme.borderSoft,
              }}
            >
              {m}
            </button>
          ))}
        </div>
      </Field>

      {/* Bank */}
      <Field theme={theme} label="Bank">
        <div className="nt-chips">
          {['HDFC', 'ICICI', 'Axis', 'SBI', 'Kotak'].map(b => (
            <button
              key={b}
              onClick={() => setBank(b)}
              className="nt-chip"
              style={{
                background: bank === b ? theme.text : theme.surfaceAlt,
                color: bank === b ? theme.bg : theme.text,
                borderColor: bank === b ? theme.text : theme.borderSoft,
              }}
            >
              {b}
            </button>
          ))}
        </div>
      </Field>

      {/* Recurring toggle */}
      <button
        className="nt-toggle-row"
        onClick={() => setRecurring(r => !r)}
        style={{ borderColor: theme.borderSoft, color: theme.text }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'flex-start' }}>
          <span style={{ fontSize: 13.5, fontWeight: 500 }}>Recurring</span>
          <span style={{ fontSize: 11.5, color: theme.muted }}>Mark as a subscription or repeat charge</span>
        </div>
        <span
          className={'nt-switch ' + (recurring ? 'on' : '')}
          style={{
            background: recurring ? theme.text : theme.borderSoft,
          }}
        >
          <span className="nt-switch-knob" style={{
            background: recurring ? theme.bg : theme.surface,
            transform: recurring ? 'translateX(16px)' : 'translateX(0)',
          }}/>
        </span>
      </button>

      {/* Save / Delete */}
      {!showDelConfirm ? (
        <div className="nt-actions">
          {isEdit && (
            <button
              className="nt-delete"
              onClick={() => setShowDelConfirm(true)}
              style={{ color: theme.debit, borderColor: theme.borderSoft }}
              aria-label="Delete transaction"
            >
              <Icon name="close" size={14} stroke={1.8}/>
            </button>
          )}
          <button
            className="nt-save"
            disabled={!canSave}
            onClick={save}
            style={{
              background: canSave ? theme.text : theme.borderSoft,
              color: canSave ? theme.bg : theme.muted,
              flex: 1,
            }}
          >
            {isEdit ? 'Save changes' : 'Save transaction'}
          </button>
        </div>
      ) : (
        <div className="nt-confirm" style={{ background: theme.surfaceAlt, borderColor: theme.borderSoft }}>
          <div className="nt-confirm-text">
            <div style={{ fontWeight: 500, fontSize: 13.5, color: theme.text }}>
              Delete this transaction?
            </div>
            <div style={{ fontSize: 11.5, color: theme.muted, marginTop: 2 }}>
              <em style={{ fontFamily: '"Instrument Serif", Georgia, serif', fontSize: 13 }}>This can't be undone.</em>
            </div>
          </div>
          <div className="nt-confirm-actions">
            <button
              className="nt-confirm-cancel"
              onClick={() => setShowDelConfirm(false)}
              style={{ color: theme.muted, borderColor: theme.borderSoft }}
            >
              Cancel
            </button>
            <button
              className="nt-confirm-yes"
              onClick={() => onDelete(existing.id)}
              style={{ background: theme.debit, color: theme.bg }}
            >
              Delete
            </button>
          </div>
        </div>
      )}
    </SheetShell>
  );
}

// Backwards-compatible alias
const NewTransactionSheet = (props) => <TransactionSheet mode="new" {...props}/>;

function Field({ label, children, theme }) {
  return (
    <div className="nt-field" style={{ borderColor: theme.borderSoft }}>
      <div className="nt-field-label" style={{ color: theme.muted }}>{label}</div>
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Generic sheet shell — backdrop + slide-up panel + drag handle
// ─────────────────────────────────────────────────────────
function SheetShell({ children, onClose, theme, title }) {
  React.useEffect(() => {
    const onKey = e => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="sheet-root" onClick={onClose}>
      <div className="sheet-backdrop"/>
      <div className="sheet" onClick={e => e.stopPropagation()}
        style={{ background: theme.surface, color: theme.text }}
      >
        <div className="sheet-handle" style={{ background: theme.borderSoft }}/>
        <div className="sheet-head">
          <div className="sheet-title" style={{ color: theme.text }}>{title}</div>
          <button className="sheet-close" onClick={onClose} style={{ color: theme.muted, background: theme.surfaceAlt }}>
            <Icon name="close" size={14} stroke={1.6}/>
          </button>
        </div>
        <div className="sheet-body">{children}</div>
      </div>
    </div>
  );
}

// Make available globally
Object.assign(window, {
  Icon, Money, Sparkline, MerchantGlyph, CategoryGlyph, hueForCat,
  MonthHero, StatStrip, LedgerRow,
  CategorySheet, TransactionSheet, NewTransactionSheet, SheetShell, Field,
});
