import type { StoreId } from '../data/storeCatalog.ts';
import type { CommerceState } from '../domain/commerce.ts';
import type { BranchId, QueueState } from '../domain/queue.ts';

export type LanRole = 'customer' | 'merchant';
export type LanState = { queue: QueueState; commerce: CommerceState };
export type LanAction =
  | { type: 'join'; branchId: BranchId; acceptedTerms: boolean }
  | { type: 'cancel' }
  | { type: 'setCount'; branchId: BranchId; count: number }
  | { type: 'advance'; branchId: BranchId }
  | { type: 'verifyEntry'; branchId: BranchId; code: string }
  | { type: 'issueCoupon'; storeId: StoreId }
  | { type: 'redeemCoupon'; storeId: StoreId; code: string };
export type LanSession = { baseUrl: string; token: string; role: LanRole };
export type LanResponse = { state: LanState; result?: { couponCode?: string } };
type Fetcher = typeof fetch;

export class LanError extends Error {
  readonly code: 'offline' | 'unauthorized' | 'forbidden' | 'rejected' | 'server' | 'invalid';
  constructor(message: string, code: 'offline' | 'unauthorized' | 'forbidden' | 'rejected' | 'server' | 'invalid') {
    super(message);
    this.name = 'LanError';
    this.code = code;
  }
}

export function normalizeLanUrl(input: string): string {
  try {
    const url = new URL(/^https?:\/\//i.test(input.trim()) ? input.trim() : `http://${input.trim()}`);
    const hostname = url.hostname.toLowerCase();
    const parts = hostname.split('.').map(Number);
    const ipv4 = parts.length === 4 && parts.every((part) => Number.isInteger(part) && part >= 0 && part <= 255);
    const privateIp = ipv4 && (parts[0] === 10 || (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31)
      || (parts[0] === 192 && parts[1] === 168) || parts[0] === 127);
    if (url.protocol !== 'http:' || (!privateIp && hostname !== 'localhost' && !hostname.endsWith('.local'))
      || !url.port || url.username || url.password || (url.pathname !== '/' && url.pathname !== '') || url.search || url.hash) throw new Error();
    return url.origin;
  } catch { throw new LanError('Mac 주소를 확인해 주세요', 'invalid'); }
}

async function send(baseUrl: string, path: string, method: 'GET' | 'POST', fetchImpl: Fetcher, timeoutMs: number, body?: object, token?: string): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  let response: Response;
  try {
    response = await fetchImpl(baseUrl + path, {
      method,
      headers: { ...(body ? { 'content-type': 'application/json' } : {}), ...(token ? { authorization: `Bearer ${token}` } : {}) },
      ...(body ? { body: JSON.stringify(body) } : {}),
      signal: controller.signal,
    });
  } catch {
    throw new LanError('연결 끊김 · Mac과 Wi-Fi를 확인해 주세요', 'offline');
  } finally { clearTimeout(timer); }
  let data: { error?: string };
  try { data = await response.json(); }
  catch { throw new LanError('서버 응답을 확인해 주세요', 'server'); }
  if (!response.ok) {
    const code = response.status === 401 ? 'unauthorized' : response.status === 403 ? 'forbidden'
      : response.status >= 500 ? 'server' : 'rejected';
    throw new LanError(typeof data?.error === 'string' ? data.error : '요청을 처리하지 못했어요', code);
  }
  return data;
}

export async function pairLan(baseUrl: string, code: string, fetchImpl: Fetcher = fetch, timeoutMs = 5000, role?: LanRole): Promise<{ role: LanRole; token: string; state: LanState }> {
  if (!code.trim()) throw new LanError('연결 코드를 입력해 주세요', 'invalid');
  const result = await send(normalizeLanUrl(baseUrl), '/pair', 'POST', fetchImpl, timeoutMs, { code: code.trim(), ...(role ? { role } : {}) }) as { role?: LanRole; token?: string; state?: LanState };
  if ((result.role !== 'customer' && result.role !== 'merchant') || !result.token || !result.state?.queue || !result.state.commerce) {
    throw new LanError('서버 응답을 확인해 주세요', 'server');
  }
  return result as { role: LanRole; token: string; state: LanState };
}

export function createLanClient(baseUrl: string, token: string, fetchImpl: Fetcher = fetch, timeoutMs = 5000) {
  const url = normalizeLanUrl(baseUrl);
  if (!token) throw new LanError('다시 연결해 주세요', 'unauthorized');
  return {
    read: () => send(url, '/state', 'GET', fetchImpl, timeoutMs, undefined, token) as Promise<LanResponse>,
    act: (action: LanAction) => send(url, '/action', 'POST', fetchImpl, timeoutMs, action, token) as Promise<LanResponse>,
  };
}
