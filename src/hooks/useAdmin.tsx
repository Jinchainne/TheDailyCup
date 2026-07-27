import { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from 'react';

export interface FinanceEntry {
  id: string;
  type: 'income' | 'expense';
  category: string;
  description: string;
  amount: number;
  date: string;
  note: string;
}

interface RateLimitState {
  attempts: number;
  cooldownUntil: number; // timestamp when cooldown expires (0 = no cooldown)
}

interface AdminCtx {
  isAdmin: boolean;
  login: (password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
  finances: FinanceEntry[];
  addFinance: (entry: Omit<FinanceEntry, 'id'>) => void;
  removeFinance: (id: string) => void;
  totalIncome: number;
  totalExpense: number;
  profit: number;
  // New security features
  rateLimit: RateLimitState;
  sessionTimeRemaining: number; // seconds until auto-logout
  lastActivity: number; // timestamp of last activity
  resetRateLimit: () => void;
}

const AdminContext = createContext<AdminCtx | null>(null);

const EXPENSE_CATEGORIES = ['Ingredients', 'Staff Salary', 'Rent', 'Utilities', 'Shipping', 'Marketing', 'Equipment', 'Tax', 'Other'];
const INCOME_CATEGORIES = ['Sales', 'Shipping Fee', 'Tips', 'Other'];

export { EXPENSE_CATEGORIES, INCOME_CATEGORIES };

// --- Security constants ---
const SESSION_TIMEOUT_MS = 2 * 60 * 60 * 1000; // 2 hours
const MAX_LOGIN_ATTEMPTS = 5;
const COOLDOWN_DURATION_MS = 5 * 60 * 1000; // 5 minutes
const ACTIVITY_CHECK_INTERVAL_MS = 30_000; // 30 seconds
const RATE_LIMIT_STORAGE_KEY = 'thedailycup_rate_limit';
const LAST_ACTIVITY_STORAGE_KEY = 'thedailycup_last_activity';

// --- SHA-256 hashing utility using Web Crypto API ---
async function sha256(message: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Pre-computed SHA-256 hash of the admin password.
// Change this hash to change the password. To generate a new hash:
//   crypto.subtle.digest('SHA-256', new TextEncoder().encode('your-password'))
//     .then(buf => Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join(''))
const EXPECTED_PASSWORD_HASH = '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8';

// --- Rate limit helpers ---
function loadRateLimit(): RateLimitState {
  try {
    const saved = localStorage.getItem(RATE_LIMIT_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // If cooldown has expired, reset
      if (parsed.cooldownUntil > 0 && Date.now() > parsed.cooldownUntil) {
        return { attempts: 0, cooldownUntil: 0 };
      }
      return parsed;
    }
  } catch { /* ignore */ }
  return { attempts: 0, cooldownUntil: 0 };
}

function saveRateLimit(state: RateLimitState) {
  localStorage.setItem(RATE_LIMIT_STORAGE_KEY, JSON.stringify(state));
}

function loadLastActivity(): number {
  try {
    const saved = localStorage.getItem(LAST_ACTIVITY_STORAGE_KEY);
    if (saved) return parseInt(saved, 10);
  } catch { /* ignore */ }
  return Date.now();
}

function saveLastActivity(ts: number) {
  localStorage.setItem(LAST_ACTIVITY_STORAGE_KEY, String(ts));
}

export function AdminProvider({ children }: { children: ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(() => {
    return sessionStorage.getItem('thedailycup_admin') === 'true';
  });

  const [finances, setFinances] = useState<FinanceEntry[]>(() => {
    try {
      const saved = localStorage.getItem('thedailycup_finances');
      return saved ? JSON.parse(saved) : getDefaultFinances();
    } catch { return getDefaultFinances(); }
  });

  const [rateLimit, setRateLimit] = useState<RateLimitState>(loadRateLimit);
  const [sessionTimeRemaining, setSessionTimeRemaining] = useState<number>(SESSION_TIMEOUT_MS / 1000);
  const [lastActivity, setLastActivity] = useState<number>(loadLastActivity);
  const activityTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const cooldownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Track user activity to keep session alive
  const updateActivity = useCallback(() => {
    if (!isAdmin) return;
    const now = Date.now();
    setLastActivity(now);
    saveLastActivity(now);
    setSessionTimeRemaining(SESSION_TIMEOUT_MS / 1000);
  }, [isAdmin]);

  // Session timeout checker
  useEffect(() => {
    if (!isAdmin) {
      if (activityTimerRef.current) clearInterval(activityTimerRef.current);
      return;
    }

    // Check session validity on mount
    const stored = loadLastActivity();
    const elapsed = Date.now() - stored;
    if (elapsed > SESSION_TIMEOUT_MS) {
      // Session expired while away
      setIsAdmin(false);
      sessionStorage.removeItem('thedailycup_admin');
      sessionStorage.removeItem('thedailycup_admin_token');
      return;
    }

    // Set initial remaining time
    setSessionTimeRemaining(Math.max(0, (SESSION_TIMEOUT_MS - elapsed) / 1000));

    // Activity listeners
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    const throttled = (() => {
      let last = 0;
      return () => {
        const now = Date.now();
        if (now - last > 10_000) { // Throttle to every 10s
          last = now;
          updateActivity();
        }
      };
    })();
    events.forEach(e => window.addEventListener(e, throttled));

    // Periodic check for session timeout
    activityTimerRef.current = setInterval(() => {
      const lastAct = loadLastActivity();
      const timeSince = Date.now() - lastAct;
      const remaining = Math.max(0, (SESSION_TIMEOUT_MS - timeSince) / 1000);
      setSessionTimeRemaining(Math.floor(remaining));

      if (timeSince >= SESSION_TIMEOUT_MS) {
        // Auto-logout
        setIsAdmin(false);
        sessionStorage.removeItem('thedailycup_admin');
        sessionStorage.removeItem('thedailycup_admin_token');
        localStorage.removeItem(LAST_ACTIVITY_STORAGE_KEY);
      }
    }, ACTIVITY_CHECK_INTERVAL_MS);

    return () => {
      events.forEach(e => window.removeEventListener(e, throttled));
      if (activityTimerRef.current) clearInterval(activityTimerRef.current);
    };
  }, [isAdmin, updateActivity]);

  // Cooldown timer countdown
  useEffect(() => {
    if (rateLimit.cooldownUntil > 0 && Date.now() < rateLimit.cooldownUntil) {
      cooldownTimerRef.current = setInterval(() => {
        if (Date.now() >= rateLimit.cooldownUntil) {
          setRateLimit({ attempts: 0, cooldownUntil: 0 });
          saveRateLimit({ attempts: 0, cooldownUntil: 0 });
          if (cooldownTimerRef.current) clearInterval(cooldownTimerRef.current);
        }
      }, 1000);
      return () => {
        if (cooldownTimerRef.current) clearInterval(cooldownTimerRef.current);
      };
    }
  }, [rateLimit.cooldownUntil]);

  const login = useCallback(async (password: string): Promise<{ ok: boolean; error?: string }> => {
    const current = loadRateLimit();

    // Check if in cooldown
    if (current.cooldownUntil > 0 && Date.now() < current.cooldownUntil) {
      const remainingSec = Math.ceil((current.cooldownUntil - Date.now()) / 1000);
      const minutes = Math.floor(remainingSec / 60);
      const seconds = remainingSec % 60;
      return {
        ok: false,
        error: `Too many failed attempts. Please wait ${minutes}m ${seconds}s before trying again.`
      };
    }

    // Hash the input password
    const inputHash = await sha256(password);

    // Compare against stored hash
    // Try fetching from API first, fall back to local hash comparison
    let authenticated = false;

    try {
      const resp = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (resp.ok) {
        const data = await resp.json();
        authenticated = true;
        // Store token if provided
        if (data.token) {
          sessionStorage.setItem('thedailycup_admin_token', data.token);
        }
      }
    } catch {
      // API unavailable — fall back to local hash comparison
      if (inputHash === EXPECTED_PASSWORD_HASH) {
        authenticated = true;
      }
    }

    if (authenticated) {
      // Successful login — reset rate limit
      setRateLimit({ attempts: 0, cooldownUntil: 0 });
      saveRateLimit({ attempts: 0, cooldownUntil: 0 });

      setIsAdmin(true);
      sessionStorage.setItem('thedailycup_admin', 'true');
      if (!sessionStorage.getItem('thedailycup_admin_token')) {
        sessionStorage.setItem('thedailycup_admin_token', 'ok');
      }

      // Record activity
      const now = Date.now();
      setLastActivity(now);
      saveLastActivity(now);
      setSessionTimeRemaining(SESSION_TIMEOUT_MS / 1000);

      return { ok: true };
    }

    // Failed login — increment attempt counter
    const newAttempts = current.attempts + 1;
    let newState: RateLimitState;

    if (newAttempts >= MAX_LOGIN_ATTEMPTS) {
      const cooldownUntil = Date.now() + COOLDOWN_DURATION_MS;
      newState = { attempts: newAttempts, cooldownUntil };
    } else {
      newState = { attempts: newAttempts, cooldownUntil: 0 };
    }

    setRateLimit(newState);
    saveRateLimit(newState);

    const remainingAttempts = MAX_LOGIN_ATTEMPTS - newAttempts;
    if (remainingAttempts > 0) {
      return {
        ok: false,
        error: `Invalid password. ${remainingAttempts} attempt${remainingAttempts !== 1 ? 's' : ''} remaining before cooldown.`
      };
    }
    return {
      ok: false,
      error: `Too many failed attempts. Account locked for 5 minutes.`
    };
  }, []);

  const logout = useCallback(() => {
    setIsAdmin(false);
    sessionStorage.removeItem('thedailycup_admin');
    sessionStorage.removeItem('thedailycup_admin_token');
    localStorage.removeItem(LAST_ACTIVITY_STORAGE_KEY);
  }, []);

  const resetRateLimit = useCallback(() => {
    setRateLimit({ attempts: 0, cooldownUntil: 0 });
    saveRateLimit({ attempts: 0, cooldownUntil: 0 });
  }, []);

  const addFinance = useCallback((entry: Omit<FinanceEntry, 'id'>) => {
    setFinances(prev => {
      const newEntry = { ...entry, id: `FIN-${Date.now().toString(36)}` };
      const updated = [newEntry, ...prev];
      localStorage.setItem('thedailycup_finances', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const removeFinance = useCallback((id: string) => {
    setFinances(prev => {
      const updated = prev.filter(f => f.id !== id);
      localStorage.setItem('thedailycup_finances', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const totalIncome = finances.filter(f => f.type === 'income').reduce((s, f) => s + f.amount, 0);
  const totalExpense = finances.filter(f => f.type === 'expense').reduce((s, f) => s + f.amount, 0);
  const profit = totalIncome - totalExpense;

  return (
    <AdminContext.Provider value={{
      isAdmin, login, logout, finances, addFinance, removeFinance,
      totalIncome, totalExpense, profit,
      rateLimit, sessionTimeRemaining, lastActivity, resetRateLimit
    }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error('useAdmin must be used within AdminProvider');
  return ctx;
}

function getDefaultFinances(): FinanceEntry[] {
  const today = new Date();
  const d = (daysAgo: number) => {
    const dt = new Date(today);
    dt.setDate(dt.getDate() - daysAgo);
    return dt.toISOString().split('T')[0];
  };
  return [
    { id: 'f1', type: 'income', category: 'Sales', description: 'Daily revenue Jul 23', amount: 245.50, date: d(0), note: '15 orders' },
    { id: 'f2', type: 'income', category: 'Sales', description: 'Daily revenue Jul 22', amount: 189.25, date: d(1), note: '12 orders' },
    { id: 'f3', type: 'income', category: 'Sales', description: 'Daily revenue Jul 21', amount: 312.00, date: d(2), note: '20 orders' },
    { id: 'f4', type: 'income', category: 'Shipping Fee', description: 'Weekly shipping income', amount: 87.50, date: d(0), note: 'Total delivery fees' },
    { id: 'f5', type: 'expense', category: 'Ingredients', description: 'Coffee beans purchase', amount: 120.00, date: d(1), note: '5kg robusta + 3kg arabica' },
    { id: 'f6', type: 'expense', category: 'Ingredients', description: 'Fresh produce', amount: 85.00, date: d(1), note: 'Vegetables, meat, seafood' },
    { id: 'f7', type: 'expense', category: 'Staff Salary', description: 'Weekly salary Staff #1', amount: 150.00, date: d(0), note: 'Part-time' },
    { id: 'f8', type: 'expense', category: 'Utilities', description: 'Electricity bill July', amount: 95.00, date: d(5), note: '' },
    { id: 'f9', type: 'expense', category: 'Rent', description: 'Rent payment July', amount: 500.00, date: d(7), note: 'Prepaid' },
    { id: 'f10', type: 'expense', category: 'Marketing', description: 'Facebook ads', amount: 50.00, date: d(3), note: 'Boost post' },
    { id: 'f11', type: 'expense', category: 'Shipping', description: 'Third-party delivery', amount: 35.00, date: d(2), note: 'External orders' },
    { id: 'f12', type: 'income', category: 'Tips', description: 'Customer tips', amount: 15.00, date: d(0), note: 'Tips' },
  ];
}

