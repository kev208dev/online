export type PinCredential = { salt: string; digest: string };
export type CredentialRepository = {
  load: () => Promise<PinCredential | null>;
  save: (credential: PinCredential) => Promise<void>;
};
export type Hash = (value: string) => Promise<string>;

export function createAdminGate(
  repository: CredentialRepository,
  hash: Hash,
  setupVerifier: string | undefined,
  createSalt: () => string = () => crypto.randomUUID(),
) {
  let credential: PinCredential | null = null;
  let unlocked = false;
  let initialized = false;
  return {
    get hasPin() { return credential !== null; },
    get unlocked() { return unlocked; },
    async initialize() {
      initialized = false;
      credential = await repository.load();
      unlocked = false;
      initialized = true;
    },
    async setup(code: string, pin: string): Promise<string | undefined> {
      if (!initialized) return '관리자 보관함을 확인할 수 없어요';
      if (credential) return '이미 PIN이 설정됐어요';
      if (!setupVerifier || !code.trim() || await hash(`online-setup-v1:${code.trim()}`) !== setupVerifier) return '설정 코드를 확인해 주세요';
      if (!/^(?!([0-9])\1{3,7}$)[0-9]{4,8}$/.test(pin)) return 'PIN은 반복되지 않는 숫자 4~8자리로 입력해 주세요';
      const salt = createSalt();
      if (!salt) return 'PIN 저장을 다시 시도해 주세요';
      const next = { salt, digest: await hash(`${salt}:${pin}`) };
      await repository.save(next);
      credential = next;
      unlocked = false;
    },
    async unlock(pin: string): Promise<string | undefined> {
      if (!initialized) return '관리자 보관함을 확인할 수 없어요';
      if (!credential) return '관리자 PIN을 먼저 설정해 주세요';
      if (await hash(`${credential.salt}:${pin}`) !== credential.digest) {
        unlocked = false;
        return 'PIN이 일치하지 않아요';
      }
      unlocked = true;
    },
    lock() { unlocked = false; },
  };
}
