import { randomBytes, randomUUID } from 'node:crypto';
import { createServer } from 'node:http';
import { mkdir, readFile, rename, unlink, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { applyAction, createSharedState } from './sharedState.mjs';

const ROLES = ['customer', 'merchant'];
const PAIR_LIFETIME_MS = 10 * 60 * 1000;
const BODY_LIMIT = 32 * 1024;

function newCode(now) {
  return { code: randomBytes(12).toString('base64url'), expiresAt: now + PAIR_LIFETIME_MS };
}

function freshRecord(now) {
  return {
    version: 1,
    shared: createSharedState(),
    sessions: { customer: null, merchant: null },
    pairing: { customer: newCode(now), merchant: newCode(now) },
  };
}

function project(shared, role) {
  if (role === 'customer') return shared;
  return {
    queue: { ...shared.queue, wait: null, usedEntryCodes: [] },
    commerce: { stops: [], visited: [], coupons: [] },
  };
}

function reply(response, status, value) {
  const body = JSON.stringify(value);
  response.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'content-length': Buffer.byteLength(body) });
  response.end(body);
}

async function bodyOf(request) {
  let size = 0;
  const chunks = [];
  for await (const chunk of request) {
    size += chunk.length;
    if (size > BODY_LIMIT) throw new Error('요청이 너무 커요');
    chunks.push(chunk);
  }
  try {
    const body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error();
    return body;
  } catch { throw new Error('요청 내용을 확인해 주세요'); }
}

export function createLanService({ dataPath, host = '0.0.0.0', port = 8787, now = Date.now }) {
  let record;
  let operations = Promise.resolve();
  const enqueue = (operation) => {
    const next = operations.then(operation);
    operations = next.catch(() => {});
    return next;
  };
  const save = async (value) => {
    await mkdir(dirname(dataPath), { recursive: true });
    const temp = `${dataPath}.${randomUUID()}.tmp`;
    try {
      await writeFile(temp, JSON.stringify(value), { mode: 0o600 });
      await rename(temp, dataPath);
    } catch (error) {
      await unlink(temp).catch(() => {});
      throw error;
    }
  };
  const load = async () => {
    try {
      const parsed = JSON.parse(await readFile(dataPath, 'utf8'));
      if (parsed?.version !== 1 || !parsed.shared?.queue || !parsed.shared?.commerce || !parsed.sessions || !parsed.pairing) {
        throw new Error('서버 저장 파일을 확인해 주세요');
      }
      const blockedUntil = createSharedState().queue.blockedUntil;
      for (const branchId of Object.keys(blockedUntil)) {
        const value = parsed.shared.queue.blockedUntil?.[branchId];
        blockedUntil[branchId] = Number.isSafeInteger(value) && value >= 0 ? value : 0;
      }
      return { ...parsed, shared: { ...parsed.shared, queue: { ...parsed.shared.queue, blockedUntil } } };
    } catch (error) {
      if (error?.code !== 'ENOENT') throw error;
      const initial = freshRecord(now());
      await save(initial);
      return initial;
    }
  };
  const authRole = (request) => {
    const match = /^Bearer ([A-Za-z0-9_-]+)$/.exec(request.headers.authorization ?? '');
    if (!match) return null;
    return ROLES.find((role) => record.sessions[role] === match[1]) ?? null;
  };
  const server = createServer(async (request, response) => {
    try {
      const path = new URL(request.url ?? '/', `http://${request.headers.host ?? 'localhost'}`).pathname;
      if (request.method === 'POST' && path === '/pair') {
        const input = await bodyOf(request);
        const answer = await enqueue(async () => {
          const role = ROLES.find((candidate) => (!input.role || input.role === candidate) && record.pairing[candidate]?.code === input.code
            && now() < record.pairing[candidate].expiresAt);
          if (!role) return null;
          const token = randomBytes(32).toString('base64url');
          const next = {
            ...record,
            sessions: { ...record.sessions, [role]: token },
            pairing: { ...record.pairing, [role]: null },
          };
          await save(next);
          record = next;
          return { role, token, state: project(record.shared, role) };
        });
        return reply(response, answer ? 200 : 401, answer ?? { error: '연결 코드를 확인해 주세요' });
      }
      if ((request.method === 'GET' && path === '/state') || (request.method === 'POST' && path === '/action')) {
        const role = authRole(request);
        if (!role) return reply(response, 401, { error: '다시 연결해 주세요' });
        if (path === '/state') return reply(response, 200, { state: project(record.shared, role) });
        const action = await bodyOf(request);
        const result = await enqueue(async () => {
          // Recheck after queued operations: a reissue/reset may have revoked this token.
          if (authRole(request) !== role) return { status: 401, body: { error: '다시 연결해 주세요' } };
          const changed = applyAction(record.shared, role, action, now());
          if (changed.reason) return { status: changed.reason.includes('권한') ? 403 : changed.reason.includes('이미') ? 409 : 400, body: { error: changed.reason } };
          const next = { ...record, shared: changed.state };
          await save(next);
          record = next;
          return { status: 200, body: { state: project(record.shared, role), ...(changed.result ? { result: changed.result } : {}) } };
        });
        return reply(response, result.status, result.body);
      }
      reply(response, 404, { error: '주소를 찾을 수 없어요' });
    } catch (error) {
      reply(response, error instanceof SyntaxError || error?.message?.startsWith('요청') ? 400 : 500,
        { error: error?.message?.startsWith('요청') ? error.message : '서버에서 처리하지 못했어요' });
    }
  });
  return {
    async listen() {
      record = await load();
      await new Promise((resolve, reject) => { server.once('error', reject); server.listen(port, host, resolve); });
      return { port: server.address().port, codes: Object.fromEntries(ROLES.map((role) => [role, record.pairing[role]?.code ?? null])) };
    },
    close() {
      if (!server.listening) return Promise.resolve();
      return new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    },
    reissue(role) {
      if (!ROLES.includes(role)) throw new Error('역할을 확인해 주세요');
      return enqueue(async () => {
        const pair = newCode(now());
        const next = {
          ...record,
          sessions: { ...record.sessions, [role]: null },
          pairing: { ...record.pairing, [role]: pair },
        };
        await save(next);
        record = next;
        return pair.code;
      });
    },
    reset() {
      return enqueue(async () => {
        const next = freshRecord(now());
        await save(next);
        record = next;
        return Object.fromEntries(ROLES.map((role) => [role, next.pairing[role].code]));
      });
    },
  };
}
