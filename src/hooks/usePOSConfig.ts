import { useState, useCallback } from 'react';

export interface POSConfig {
  terminalUrl: string;
  merchantId: string;
  apiKey: string;
  webhookUrl: string;
  autoConfirm: boolean;
  pollIntervalSec: number;
  enabled: boolean;
}

export interface POSLog {
  id: string;
  timestamp: number;
  type: 'payment_received' | 'connection' | 'error';
  message: string;
  amount?: number;
  txHash?: string;
}

const CONFIG_KEY = 'thedailycup_pos_config';
const LEGACY_CONFIG_KEY = 'coffeehouse_pos_config';
const LOGS_KEY = 'thedailycup_pos_logs';
const LEGACY_LOGS_KEY = 'coffeehouse_pos_logs';
const MAX_LOGS = 200;

const defaultConfig: POSConfig = {
  terminalUrl: '',
  merchantId: '',
  apiKey: '',
  webhookUrl: '',
  autoConfirm: true,
  pollIntervalSec: 10,
  enabled: false,
};

export function getPOSConfig(): POSConfig {
  try {
    const raw = localStorage.getItem(CONFIG_KEY) || localStorage.getItem(LEGACY_CONFIG_KEY);
    if (raw) {
      return { ...defaultConfig, ...JSON.parse(raw) };
    }
  } catch {
    // corrupt data → return defaults
  }
  return { ...defaultConfig };
}

export function savePOSConfig(config: POSConfig): void {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
}

export async function testConnection(
  terminalUrl: string
): Promise<{ success: boolean; message: string }> {
  if (!terminalUrl || !terminalUrl.trim()) {
    return { success: false, message: 'Terminal URL is empty.' };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    await fetch(terminalUrl, {
      method: 'HEAD',
      mode: 'no-cors',
      signal: controller.signal,
    });

    clearTimeout(timeout);
    // no-cors always returns opaque response (status 0), so reaching here means the server responded
    return { success: true, message: 'Terminal is reachable.' };
  } catch (err: unknown) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      return { success: false, message: 'Connection timed out (8 s).' };
    }
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, message: `Connection failed: ${msg}` };
  }
}

export function getPOSLogs(): POSLog[] {
  try {
    const raw = localStorage.getItem(LOGS_KEY) || localStorage.getItem(LEGACY_LOGS_KEY);
    if (raw) {
      return JSON.parse(raw) as POSLog[];
    }
  } catch {
    // corrupt → empty
  }
  return [];
}

export function addPOSLog(
  entry: Omit<POSLog, 'id' | 'timestamp'> & { timestamp?: number }
): POSLog {
  const logs = getPOSLogs();
  const log: POSLog = {
    id: crypto.randomUUID?.() ?? Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
    timestamp: entry.timestamp ?? Date.now(),
    type: entry.type,
    message: entry.message,
    amount: entry.amount,
    txHash: entry.txHash,
  };
  logs.unshift(log);
  if (logs.length > MAX_LOGS) logs.length = MAX_LOGS;
  localStorage.setItem(LOGS_KEY, JSON.stringify(logs));
  return log;
}

export function clearPOSLogs(): void {
  localStorage.setItem(LOGS_KEY, '[]');
}

/**
 * React hook that wraps the raw helpers with reactive state.
 * Components can use this to get/set config and logs with automatic re-renders.
 */
export function usePOSConfig() {
  const [config, setConfigState] = useState<POSConfig>(getPOSConfig);
  const [logs, setLogs] = useState<POSLog[]>(getPOSLogs);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const updateConfig = useCallback((patch: Partial<POSConfig>) => {
    setConfigState((prev) => {
      const next = { ...prev, ...patch };
      savePOSConfig(next);
      return next;
    });
  }, []);

  const reloadLogs = useCallback(() => {
    setLogs(getPOSLogs());
  }, []);

  const log = useCallback(
    (entry: Omit<POSLog, 'id' | 'timestamp'> & { timestamp?: number }) => {
      const newLog = addPOSLog(entry);
      setLogs((prev) => [newLog, ...prev].slice(0, MAX_LOGS));
      return newLog;
    },
    []
  );

  const clearLogs = useCallback(() => {
    clearPOSLogs();
    setLogs([]);
  }, []);

  const runTest = useCallback(async () => {
    setTesting(true);
    setTestResult(null);
    const result = await testConnection(config.terminalUrl);
    setTestResult(result);
    log({
      type: result.success ? 'connection' : 'error',
      message: result.success
        ? `Connection test passed: ${result.message}`
        : `Connection test failed: ${result.message}`,
    });
    setTesting(false);
    return result;
  }, [config.terminalUrl, log]);

  return {
    config,
    updateConfig,
    logs,
    reloadLogs,
    log,
    clearLogs,
    testing,
    testResult,
    runTest,
  };
}

