export type DialogTone = 'info' | 'success' | 'warning' | 'error';

export interface AlertOptions {
  title?: string;
  tone?: DialogTone;
  confirmText?: string;
}

export interface ConfirmOptions {
  title?: string;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
}

export interface PromptOptions {
  title?: string;
  confirmText?: string;
  cancelText?: string;
  readOnlyCopy?: boolean;
}

export type DialogRequest =
  | {
      id: number;
      kind: 'alert';
      message: string;
      title: string;
      tone: DialogTone;
      confirmText: string;
      resolve: () => void;
    }
  | {
      id: number;
      kind: 'confirm';
      message: string;
      title: string;
      confirmText: string;
      cancelText: string;
      destructive: boolean;
      resolve: (accepted: boolean) => void;
    }
  | {
      id: number;
      kind: 'prompt';
      message: string;
      defaultValue: string;
      title: string;
      confirmText: string;
      cancelText: string;
      readOnlyCopy: boolean;
      resolve: (value: string | null) => void;
    };

type Listener = (current: DialogRequest | null) => void;

let nextId = 1;
const queue: DialogRequest[] = [];
const listeners = new Set<Listener>();

const notify = () => {
  const current = queue.length > 0 ? queue[0] : null;
  listeners.forEach((listener) => listener(current));
};

const inferTone = (message: string): DialogTone => {
  const m = message || '';
  if (m.includes('❌') || m.includes('🚨') || m.includes('실패') || m.includes('오류')) return 'error';
  if (m.includes('⚠️') || m.includes('경고') || m.includes('입력해') || m.includes('필요')) return 'warning';
  if (m.includes('✅') || m.includes('🎉') || m.includes('📋') || m.includes('🔗') || m.includes('완료') || m.includes('저장되었습니다') || m.includes('복구되었습니다') || m.includes('복사되었습니다') || m.includes('성공')) return 'success';
  return 'info';
};

const inferAlertTitle = (tone: DialogTone): string => {
  if (tone === 'error') return '오류 안내';
  if (tone === 'warning') return '확인 필요';
  if (tone === 'success') return '처리 완료';
  return '안내';
};

const inferDestructive = (message: string): boolean => {
  const m = message || '';
  return m.includes('삭제') || m.includes('리셋') || m.includes('덮어쓰') || m.includes('줄이시겠습니까');
};

export const subscribeDialog = (listener: Listener): (() => void) => {
  listeners.add(listener);
  listener(queue.length > 0 ? queue[0] : null);
  return () => {
    listeners.delete(listener);
  };
};

export const dismissCurrentDialog = (result?: boolean | string | null) => {
  const current = queue.shift();
  if (!current) return;
  if (current.kind === 'alert') {
    current.resolve();
  } else if (current.kind === 'confirm') {
    current.resolve(Boolean(result));
  } else {
    current.resolve(typeof result === 'string' ? result : null);
  }
  notify();
};

export const appAlert = (message: string, options?: AlertOptions): Promise<void> => {
  const text = String(message ?? '');
  const tone = options?.tone || inferTone(text);
  const title = options?.title || inferAlertTitle(tone);
  const confirmText = options?.confirmText || '확인';

  return new Promise<void>((resolve) => {
    queue.push({
      id: nextId++,
      kind: 'alert',
      message: text,
      title,
      tone,
      confirmText,
      resolve,
    });
    if (queue.length === 1) notify();
  });
};

export const appConfirm = (message: string, options?: ConfirmOptions): Promise<boolean> => {
  const text = String(message ?? '');
  const destructive = options?.destructive ?? inferDestructive(text);
  const title = options?.title || (destructive ? '작업 확인' : '확인');
  const confirmText = options?.confirmText || (text.includes('로그인') ? '로그인하기' : destructive ? '확인' : '확인');
  const cancelText = options?.cancelText || '취소';

  return new Promise<boolean>((resolve) => {
    queue.push({
      id: nextId++,
      kind: 'confirm',
      message: text,
      title,
      confirmText,
      cancelText,
      destructive,
      resolve,
    });
    if (queue.length === 1) notify();
  });
};

export const appPrompt = (
  message: string,
  defaultValue: string = '',
  options?: PromptOptions
): Promise<string | null> => {
  const text = String(message ?? '');
  const title = options?.title || '내용 확인 및 복사';
  const confirmText = options?.confirmText || '확인';
  const cancelText = options?.cancelText || '닫기';
  const readOnlyCopy = options?.readOnlyCopy ?? Boolean(defaultValue);

  return new Promise<string | null>((resolve) => {
    queue.push({
      id: nextId++,
      kind: 'prompt',
      message: text,
      defaultValue,
      title,
      confirmText,
      cancelText,
      readOnlyCopy,
      resolve,
    });
    if (queue.length === 1) notify();
  });
};
