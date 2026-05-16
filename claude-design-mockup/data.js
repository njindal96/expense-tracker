// Sample transactions — Indian merchants, INR, last ~3 weeks. May 2026.
// Mirrors the Supabase schema described in the PRD.

window.CATEGORIES = [
  { id: 'food',          label: 'Food & Drink',  emoji: '🍜' },
  { id: 'groceries',     label: 'Groceries',     emoji: '🛒' },
  { id: 'transport',     label: 'Transport',     emoji: '🚕' },
  { id: 'shopping',      label: 'Shopping',      emoji: '🛍️' },
  { id: 'entertainment', label: 'Entertainment', emoji: '🎬' },
  { id: 'bills',         label: 'Bills & Utilities', emoji: '💡' },
  { id: 'health',        label: 'Health',        emoji: '🩺' },
  { id: 'rent',          label: 'Rent & Home',   emoji: '🏠' },
  { id: 'salary',        label: 'Salary',        emoji: '💼' },
  { id: 'investment',    label: 'Investment',    emoji: '📈' },
  { id: 'transfer',      label: 'Transfer',      emoji: '↔︎' },
  { id: 'other',         label: 'Uncategorised', emoji: '·' },
];

// Slim helper — pick category by id
window.catById = (id) => window.CATEGORIES.find(c => c.id === id) || window.CATEGORIES[window.CATEGORIES.length - 1];

// Today is May 16, 2026 (per project). Build a realistic ledger.
const D = (d, h = 12, m = 0) => new Date(2026, 4, d, h, m).toISOString(); // May = month index 4

window.SEED_TRANSACTIONS = [
  // Today — May 16
  { id: 't01', transaction_date: D(16, 21, 14), type: 'debit',  amount:   428, currency: 'INR', merchant: 'Swiggy',           bank_name: 'HDFC',  payment_method: 'UPI',         category: 'food',          tags: ['dinner'],         is_recurring: false, status: 'cleared', confidence: 0.96 },
  { id: 't02', transaction_date: D(16, 18,  2), type: 'debit',  amount:   189, currency: 'INR', merchant: 'BluSmart',         bank_name: 'HDFC',  payment_method: 'UPI',         category: 'transport',     tags: ['cab'],            is_recurring: false, status: 'cleared', confidence: 0.98 },
  { id: 't03', transaction_date: D(16,  9, 47), type: 'debit',  amount:   312, currency: 'INR', merchant: 'Blue Tokai Coffee',bank_name: 'HDFC',  payment_method: 'Credit Card', category: 'food',          tags: ['coffee'],         is_recurring: false, status: 'cleared', confidence: 0.74 },
  // May 15
  { id: 't04', transaction_date: D(15, 22, 31), type: 'debit',  amount:  1840, currency: 'INR', merchant: 'BookMyShow',       bank_name: 'HDFC',  payment_method: 'Credit Card', category: 'entertainment', tags: ['imax'],           is_recurring: false, status: 'cleared', confidence: 0.99 },
  { id: 't05', transaction_date: D(15, 19, 22), type: 'debit',  amount:   624, currency: 'INR', merchant: 'Blinkit',          bank_name: 'ICICI', payment_method: 'UPI',         category: 'groceries',     tags: [],                 is_recurring: false, status: 'cleared', confidence: 0.93 },
  { id: 't06', transaction_date: D(15, 11,  3), type: 'debit',  amount:   899, currency: 'INR', merchant: 'Amazon.in',        bank_name: 'HDFC',  payment_method: 'Credit Card', category: 'shopping',      tags: ['books'],          is_recurring: false, status: 'cleared', confidence: 0.85 },
  // May 14
  { id: 't07', transaction_date: D(14, 20, 11), type: 'debit',  amount:   349, currency: 'INR', merchant: 'Zomato',           bank_name: 'HDFC',  payment_method: 'UPI',         category: 'food',          tags: ['lunch'],          is_recurring: false, status: 'cleared', confidence: 0.97 },
  { id: 't08', transaction_date: D(14, 15, 40), type: 'credit', amount:  3200, currency: 'INR', merchant: 'Aarav Mehta',       bank_name: 'ICICI', payment_method: 'UPI',         category: 'transfer',      tags: ['split'],          is_recurring: false, status: 'cleared', confidence: 0.42 },
  { id: 't09', transaction_date: D(14,  8, 30), type: 'debit',  amount:   199, currency: 'INR', merchant: 'Spotify',          bank_name: 'HDFC',  payment_method: 'Credit Card', category: 'entertainment', tags: ['subscription'],   is_recurring: true,  status: 'cleared', confidence: 1.00 },
  // May 13
  { id: 't10', transaction_date: D(13, 18, 14), type: 'debit',  amount:  4200, currency: 'INR', merchant: 'Apollo Pharmacy',  bank_name: 'HDFC',  payment_method: 'Debit Card',  category: 'health',        tags: ['rx'],             is_recurring: false, status: 'cleared', confidence: 0.91 },
  { id: 't11', transaction_date: D(13, 12,  9), type: 'debit',  amount:   239, currency: 'INR', merchant: 'Uber',             bank_name: 'ICICI', payment_method: 'UPI',         category: 'transport',     tags: [],                 is_recurring: false, status: 'cleared', confidence: 0.99 },
  // May 12
  { id: 't12', transaction_date: D(12, 21,  8), type: 'debit',  amount:   549, currency: 'INR', merchant: 'Third Wave Coffee',bank_name: 'HDFC',  payment_method: 'UPI',         category: 'food',          tags: [],                 is_recurring: false, status: 'cleared', confidence: 0.88 },
  { id: 't13', transaction_date: D(12, 10, 22), type: 'debit',  amount:   799, currency: 'INR', merchant: 'Cult.fit',         bank_name: 'HDFC',  payment_method: 'Credit Card', category: 'health',        tags: ['membership'],     is_recurring: true,  status: 'cleared', confidence: 1.00 },
  // May 11
  { id: 't14', transaction_date: D(11, 17, 32), type: 'debit',  amount:  1299, currency: 'INR', merchant: 'Myntra',           bank_name: 'HDFC',  payment_method: 'Credit Card', category: 'shopping',      tags: ['clothes'],        is_recurring: false, status: 'cleared', confidence: 0.94 },
  { id: 't15', transaction_date: D(11, 13,  1), type: 'debit',  amount:   189, currency: 'INR', merchant: 'BigBasket',        bank_name: 'ICICI', payment_method: 'UPI',         category: 'groceries',     tags: [],                 is_recurring: false, status: 'cleared', confidence: 0.96 },
  // May 10
  { id: 't16', transaction_date: D(10, 19, 55), type: 'debit',  amount:   649, currency: 'INR', merchant: 'Zomato',           bank_name: 'HDFC',  payment_method: 'UPI',         category: 'food',          tags: ['dinner'],         is_recurring: false, status: 'cleared', confidence: 0.97 },
  { id: 't17', transaction_date: D(10,  9, 12), type: 'debit',  amount:   149, currency: 'INR', merchant: 'Netflix',          bank_name: 'HDFC',  payment_method: 'Credit Card', category: 'entertainment', tags: ['subscription'],   is_recurring: true,  status: 'cleared', confidence: 1.00 },
  // May 9
  { id: 't18', transaction_date: D( 9, 14, 25), type: 'debit',  amount:  2100, currency: 'INR', merchant: 'Airtel Postpaid',  bank_name: 'HDFC',  payment_method: 'Net Banking', category: 'bills',         tags: ['postpaid'],       is_recurring: true,  status: 'cleared', confidence: 1.00 },
  { id: 't19', transaction_date: D( 9, 11,  4), type: 'debit',  amount:   429, currency: 'INR', merchant: 'IndiGo',           bank_name: 'HDFC',  payment_method: 'Credit Card', category: 'transport',     tags: ['seat'],           is_recurring: false, status: 'pending', confidence: 0.81 },
  // May 8
  { id: 't20', transaction_date: D( 8, 23, 18), type: 'debit',  amount:   389, currency: 'INR', merchant: 'Swiggy Instamart', bank_name: 'ICICI', payment_method: 'UPI',         category: 'groceries',     tags: ['late-night'],     is_recurring: false, status: 'cleared', confidence: 0.71 },
  { id: 't21', transaction_date: D( 8, 16,  9), type: 'debit',  amount:  6500, currency: 'INR', merchant: 'Zerodha',          bank_name: 'HDFC',  payment_method: 'Net Banking', category: 'investment',    tags: ['sip'],            is_recurring: true,  status: 'cleared', confidence: 0.99 },
  // May 7
  { id: 't22', transaction_date: D( 7, 13, 51), type: 'debit',  amount:   229, currency: 'INR', merchant: 'Rapido',           bank_name: 'ICICI', payment_method: 'UPI',         category: 'transport',     tags: [],                 is_recurring: false, status: 'cleared', confidence: 0.95 },
  // May 5 — payday
  { id: 't23', transaction_date: D( 5,  9,  0), type: 'credit', amount: 184500, currency: 'INR', merchant: 'Acme Corp Payroll',bank_name: 'HDFC', payment_method: 'NEFT',        category: 'salary',        tags: ['payroll'],        is_recurring: true,  status: 'cleared', confidence: 1.00 },
  { id: 't24', transaction_date: D( 5, 11, 25), type: 'debit',  amount: 38000, currency: 'INR', merchant: 'BBMP Rent — Indiranagar', bank_name: 'HDFC', payment_method: 'NEFT', category: 'rent',          tags: ['monthly'],        is_recurring: true,  status: 'cleared', confidence: 1.00 },
  { id: 't25', transaction_date: D( 5, 14, 47), type: 'debit',  amount:  1840, currency: 'INR', merchant: 'BESCOM',           bank_name: 'HDFC',  payment_method: 'UPI',         category: 'bills',         tags: ['electricity'],    is_recurring: true,  status: 'cleared', confidence: 0.99 },
  // May 4
  { id: 't26', transaction_date: D( 4, 20,  7), type: 'debit',  amount:   599, currency: 'INR', merchant: 'Paper Boat Café',  bank_name: 'HDFC',  payment_method: 'Credit Card', category: 'food',          tags: [],                 is_recurring: false, status: 'cleared', confidence: 0.83 },
  { id: 't27', transaction_date: D( 4, 12, 18), type: 'debit',  amount:  2299, currency: 'INR', merchant: 'Decathlon',        bank_name: 'HDFC',  payment_method: 'Credit Card', category: 'shopping',      tags: ['running'],        is_recurring: false, status: 'cleared', confidence: 0.92 },
  // May 3
  { id: 't28', transaction_date: D( 3, 22,  3), type: 'debit',  amount:   299, currency: 'INR', merchant: 'YouTube Premium',  bank_name: 'HDFC',  payment_method: 'Credit Card', category: 'entertainment', tags: ['subscription'],   is_recurring: true,  status: 'cleared', confidence: 1.00 },
  { id: 't29', transaction_date: D( 3, 15, 41), type: 'credit', amount:   840, currency: 'INR', merchant: 'Cashback — HDFC',  bank_name: 'HDFC',  payment_method: 'Credit Card', category: 'other',         tags: ['cashback'],       is_recurring: false, status: 'cleared', confidence: 0.38 },
  // May 2
  { id: 't30', transaction_date: D( 2, 18, 12), type: 'debit',  amount:   459, currency: 'INR', merchant: 'Zomato',           bank_name: 'HDFC',  payment_method: 'UPI',         category: 'food',          tags: [],                 is_recurring: false, status: 'cleared', confidence: 0.94 },
];

// ─────────────────────────────────────────────
// Formatters
// ─────────────────────────────────────────────

window.fmtINR = (n, opts = {}) => {
  const { compact = false, sign = false } = opts;
  const abs = Math.abs(n);
  let body;
  if (compact && abs >= 100000) {
    body = '₹' + (abs / 100000).toFixed(abs >= 1000000 ? 1 : 2) + 'L';
  } else if (compact && abs >= 1000) {
    body = '₹' + (abs / 1000).toFixed(1) + 'k';
  } else {
    body = '₹' + abs.toLocaleString('en-IN', { maximumFractionDigits: 0 });
  }
  if (sign) return (n < 0 ? '−' : '+') + body;
  return body;
};

window.fmtDateShort = (iso) => {
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

window.fmtTime = (iso) => {
  const d = new Date(iso);
  return d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase().replace(' ', '');
};

window.fmtDayHeader = (iso) => {
  const d = new Date(iso);
  const now = new Date(2026, 4, 16); // pinned "today"
  const yest = new Date(2026, 4, 15);
  if (d.toDateString() === now.toDateString()) return 'Today';
  if (d.toDateString() === yest.toDateString()) return 'Yesterday';
  return d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });
};
