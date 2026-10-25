import { networkInterfaces } from 'node:os';
import { resolve } from 'node:path';
import { createInterface } from 'node:readline';
import { fileURLToPath } from 'node:url';
import { createLanService } from './service.mjs';

export function parseConsoleCommand(line) {
  const input = line.trim();
  if (input === 'reissue customer') return { type: 'reissue', role: 'customer' };
  if (input === 'reissue merchant') return { type: 'reissue', role: 'merchant' };
  if (input === 'reset --confirm-reset') return { type: 'reset' };
  return null;
}

function localAddresses() {
  const interfaces = networkInterfaces();
  return Object.entries(interfaces).flatMap(([name, values]) =>
    (values ?? []).filter((address) => address.family === 'IPv4' && !address.internal)
      .map((address) => ({ name, address: address.address })))
    .sort((a, b) => Number(b.name === 'en0') - Number(a.name === 'en0'));
}

async function main() {
  if (process.argv[2] !== 'start') {
    process.stderr.write('사용법: npm run demo:server\n');
    process.exitCode = 1;
    return;
  }
  const service = createLanService({
    dataPath: resolve(process.cwd(), '.demo-state', 'lan.json'),
    host: '0.0.0.0',
    port: Number(process.env.ONLINE_DEMO_PORT || 8787),
  });
  const { port, codes } = await service.listen();
  const addresses = localAddresses();
  process.stdout.write(`Mac 서버 실행 중 · 포트 ${port}\n`);
  if (!addresses.length) process.stdout.write('Wi-Fi/LAN 주소를 찾지 못했어요. 네트워크 연결을 확인해 주세요.\n');
  for (const item of addresses) process.stdout.write(`폰에서 입력할 주소 (${item.name}): http://${item.address}:${port}\n`);
  for (const role of ['customer', 'merchant']) {
    process.stdout.write(`${role === 'customer' ? '고객' : '매장'} 연결 코드: ${codes[role] ?? '이미 연결됨 (재발급 가능)'}\n`);
  }
  process.stdout.write('명령: reissue customer | reissue merchant | reset --confirm-reset\n');
  const input = createInterface({ input: process.stdin, output: process.stdout });
  input.on('line', async (line) => {
    const command = parseConsoleCommand(line);
    if (!command) { process.stdout.write('명령을 확인해 주세요. 전체 초기화는 reset --confirm-reset만 허용합니다.\n'); return; }
    try {
      if (command.type === 'reissue') {
        const code = await service.reissue(command.role);
        process.stdout.write(`${command.role === 'customer' ? '고객' : '매장'} 코드 재발급 (기록 유지): ${code}\n`);
      } else {
        const resetCodes = await service.reset();
        process.stdout.write(`전체 기록·연결 초기화 완료. 고객 코드: ${resetCodes.customer} · 매장 코드: ${resetCodes.merchant}\n`);
      }
    } catch { process.stderr.write('명령 처리에 실패했어요. 서버 저장 상태를 확인해 주세요.\n'); }
  });
  const stop = async () => { input.close(); await service.close(); process.exit(0); };
  process.once('SIGINT', stop);
  process.once('SIGTERM', stop);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  main().catch(() => { process.stderr.write('서버 시작에 실패했어요. 포트와 저장 파일을 확인해 주세요.\n'); process.exitCode = 1; });
}
