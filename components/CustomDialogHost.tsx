import React, { useEffect, useRef, useState } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, Copy, Check } from 'lucide-react';
import { DialogRequest, dismissCurrentDialog, subscribeDialog } from '../services/dialogService';

const CustomDialogHost: React.FC = () => {
  const [dialog, setDialog] = useState<DialogRequest | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [copied, setCopied] = useState(false);
  const confirmBtnRef = useRef<HTMLButtonElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    return subscribeDialog((next) => {
      setDialog(next);
      setCopied(false);
      if (next?.kind === 'prompt') {
        setInputValue(next.defaultValue);
      } else {
        setInputValue('');
      }
    });
  }, []);

  useEffect(() => {
    if (!dialog) return;
    const timer = window.setTimeout(() => {
      if (dialog.kind === 'prompt' && inputRef.current) {
        inputRef.current.focus();
        inputRef.current.select();
      } else {
        confirmBtnRef.current?.focus();
      }
    }, 30);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        if (dialog.kind === 'alert') {
          dismissCurrentDialog();
        } else if (dialog.kind === 'confirm') {
          dismissCurrentDialog(false);
        } else {
          dismissCurrentDialog(null);
        }
      } else if (e.key === 'Enter' && dialog.kind !== 'prompt') {
        e.preventDefault();
        if (dialog.kind === 'alert') {
          dismissCurrentDialog();
        } else {
          dismissCurrentDialog(true);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [dialog]);

  if (!dialog) return null;

  const handleBackdropClick = () => {
    if (dialog.kind === 'alert') {
      dismissCurrentDialog();
    } else if (dialog.kind === 'confirm') {
      dismissCurrentDialog(false);
    } else {
      dismissCurrentDialog(null);
    }
  };

  const handleCopyPromptText = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(inputValue);
      } else if (inputRef.current) {
        inputRef.current.select();
        document.execCommand('copy');
      }
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      if (inputRef.current) {
        inputRef.current.select();
      }
    }
  };

  const renderIcon = () => {
    if (dialog.kind === 'confirm') {
      return dialog.destructive ? (
        <div className="w-11 h-11 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
          <AlertTriangle className="w-6 h-6" />
        </div>
      ) : (
        <div className="w-11 h-11 rounded-2xl bg-[#ECFDF5] text-[#0A7E54] flex items-center justify-center shrink-0">
          <Info className="w-6 h-6" />
        </div>
      );
    }
    if (dialog.kind === 'prompt') {
      return (
        <div className="w-11 h-11 rounded-2xl bg-[#ECFDF5] text-[#0A7E54] flex items-center justify-center shrink-0">
          <Copy className="w-5 h-5" />
        </div>
      );
    }
    if (dialog.tone === 'error') {
      return (
        <div className="w-11 h-11 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
          <XCircle className="w-6 h-6" />
        </div>
      );
    }
    if (dialog.tone === 'warning') {
      return (
        <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
          <AlertTriangle className="w-6 h-6" />
        </div>
      );
    }
    if (dialog.tone === 'success') {
      return (
        <div className="w-11 h-11 rounded-2xl bg-[#ECFDF5] text-[#0A7E54] flex items-center justify-center shrink-0">
          <CheckCircle2 className="w-6 h-6" />
        </div>
      );
    }
    return (
      <div className="w-11 h-11 rounded-2xl bg-[#ECFDF5] text-[#0A7E54] flex items-center justify-center shrink-0">
        <Info className="w-6 h-6" />
      </div>
    );
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="mango-dialog-title"
      className="fixed inset-0 z-[10050] bg-black/50 backdrop-blur-[2px] flex items-center justify-center p-4 animate-fade-in"
      onClick={handleBackdropClick}
    >
      <div
        className="w-full max-w-md bg-white rounded-[22px] shadow-2xl border border-black/[0.06] overflow-hidden animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 sm:p-6">
          <div className="flex items-start gap-3.5">
            {renderIcon()}
            <div className="min-w-0 flex-1">
              <h3
                id="mango-dialog-title"
                className="text-base sm:text-lg font-extrabold text-gray-900 tracking-tight leading-snug"
              >
                {dialog.title}
              </h3>
              <p className="mt-1.5 text-[13px] sm:text-sm text-[#3A3A3C] leading-relaxed whitespace-pre-line break-keep">
                {dialog.message}
              </p>
            </div>
          </div>

          {dialog.kind === 'prompt' && (
            <div className="mt-4 space-y-2">
              <textarea
                ref={inputRef}
                value={inputValue}
                readOnly={dialog.readOnlyCopy}
                onChange={(e) => {
                  if (!dialog.readOnlyCopy) setInputValue(e.target.value);
                }}
                rows={4}
                className="w-full p-3 bg-[#F2F2F7] border border-black/[0.08] rounded-xl text-xs sm:text-sm font-mono text-gray-800 outline-none focus:ring-2 focus:ring-[#0A7E54]/30 focus:bg-white resize-y"
              />
              <button
                type="button"
                onClick={handleCopyPromptText}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#ECFDF5] hover:bg-emerald-100 text-[#0A7E54] text-xs font-bold transition cursor-pointer active:scale-95"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? '복사되었습니다' : '클립보드 복사'}</span>
              </button>
            </div>
          )}
        </div>

        <div className="px-5 pb-5 sm:px-6 sm:pb-6 pt-1 flex items-center justify-end gap-2.5">
          {dialog.kind !== 'alert' && (
            <button
              type="button"
              onClick={() => dismissCurrentDialog(dialog.kind === 'confirm' ? false : null)}
              className="flex-1 sm:flex-initial min-h-[44px] px-5 py-2.5 rounded-xl bg-[#F2F2F7] hover:bg-gray-200 text-[#3A3A3C] text-sm font-bold transition active:scale-95 cursor-pointer"
            >
              {dialog.cancelText}
            </button>
          )}
          <button
            ref={confirmBtnRef}
            type="button"
            onClick={() => {
              if (dialog.kind === 'alert') {
                dismissCurrentDialog();
              } else if (dialog.kind === 'confirm') {
                dismissCurrentDialog(true);
              } else {
                dismissCurrentDialog(inputValue);
              }
            }}
            className={`flex-1 sm:flex-initial min-h-[44px] px-6 py-2.5 rounded-xl text-white text-sm font-bold shadow-sm transition active:scale-95 cursor-pointer ${
              dialog.kind === 'confirm' && dialog.destructive
                ? 'bg-red-600 hover:bg-red-700'
                : dialog.kind === 'alert' && dialog.tone === 'error'
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-[#0A7E54] hover:bg-[#086945]'
            }`}
          >
            {dialog.confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomDialogHost;
