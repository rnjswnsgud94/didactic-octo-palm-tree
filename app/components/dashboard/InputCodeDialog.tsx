"use client";

import { useEffect, useRef, useState } from "react";

import { MAX_INPUT_CODE_LENGTH } from "@/lib/share-state";

export function InputCodeDialog({
  initialCode,
  initialError = "",
  includedUserDurationCount = 0,
  onClose,
  onImport,
}: {
  initialCode: string;
  initialError?: string;
  includedUserDurationCount?: number;
  onClose: () => void;
  onImport: (code: string) => string | null;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [code, setCode] = useState(initialCode);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(initialError);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (typeof dialog.showModal === "function" && !dialog.open) dialog.showModal();
    headingRef.current?.focus();
    return () => {
      if (typeof dialog.close === "function" && dialog.open) dialog.close();
    };
  }, []);

  async function copyCode() {
    setError("");
    const normalizedCode = code.trim();
    if (!normalizedCode) {
      setMessage("");
      setError("복사할 입력 코드를 입력해 주세요.");
      return;
    }
    if (normalizedCode.length > MAX_INPUT_CODE_LENGTH) {
      setMessage("");
      setError("입력 코드가 허용 길이를 초과했습니다.");
      return;
    }
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard API unavailable");
      await navigator.clipboard.writeText(normalizedCode);
      setMessage("입력 코드를 클립보드에 복사했습니다.");
    } catch {
      textareaRef.current?.focus();
      textareaRef.current?.select();
      try {
        if (typeof document.execCommand === "function" && document.execCommand("copy")) {
          setMessage("입력 코드를 클립보드에 복사했습니다.");
          return;
        }
      } catch {
        // Selection remains available for the user's platform copy shortcut.
      }
      setMessage("코드를 선택했습니다. 복사 단축키를 눌러 주세요.");
    }
  }

  function importCode() {
    setMessage("");
    setError("");
    if (!code.trim()) {
      setError("불러올 입력 코드를 붙여 넣어 주세요.");
      textareaRef.current?.focus();
      return;
    }
    const importError = onImport(code);
    if (importError) setError(importError);
  }

  return (
    <dialog
      ref={dialogRef}
      id="input-code-dialog"
      className="status-summary-dialog input-code-dialog"
      aria-modal="true"
      aria-labelledby="input-code-dialog-title"
      aria-describedby="input-code-dialog-description"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="status-dialog-panel input-code-panel">
        <header>
          <div>
            <span>INPUT BACKUP</span>
            <h2 id="input-code-dialog-title" ref={headingRef} tabIndex={-1}>입력 코드 가져오기·내보내기</h2>
            <p id="input-code-dialog-description">현재 사업조건과 카드별 실무 예상기간을 문자열로 보관하거나, 다른 기기에서 만든 코드를 붙여 넣어 그대로 복원할 수 있습니다.</p>
          </div>
          <button type="button" className="dialog-close" onClick={onClose} aria-label="입력 코드 창 닫기">×</button>
        </header>
        <div className="input-code-body">
          <label htmlFor="portable-input-code">입력 코드</label>
          <textarea
            ref={textareaRef}
            id="portable-input-code"
            value={code}
            rows={9}
            aria-invalid={Boolean(error)}
            aria-describedby="input-code-help input-code-count"
            aria-errormessage={error ? "input-code-error" : undefined}
            spellCheck={false}
            autoCapitalize="none"
            autoCorrect="off"
            onChange={(event) => {
              const nextCode = event.target.value.slice(0, MAX_INPUT_CODE_LENGTH + 1);
              setCode(nextCode);
              setError(
                nextCode.length > MAX_INPUT_CODE_LENGTH
                  ? "입력 코드가 허용 길이를 초과했습니다."
                  : "",
              );
              setMessage("");
            }}
          />
          <div className="input-code-meta">
            <p id="input-code-help" className="input-code-help">코드에는 사업지역·규모·시설 조건과 카드별 실무 예상기간{includedUserDurationCount ? ` ${includedUserDurationCount}건` : ""}이 포함됩니다. 공유 링크를 열거나 이 코드를 불러오면 ‘내 예상’ 총기간도 함께 복원됩니다. 외부 공유 전 내용을 취급할 대상을 확인해 주세요.</p>
            <span id="input-code-count" className="input-code-count" aria-live="polite">{code.length.toLocaleString("ko-KR")} / {MAX_INPUT_CODE_LENGTH.toLocaleString("ko-KR")}자</span>
          </div>
          {error ? <p id="input-code-error" className="input-code-message is-error" role="alert">{error}</p> : null}
          {message ? <p className="input-code-message" role="status">{message}</p> : null}
          <div className="input-code-actions">
            <button type="button" className="secondary-button" onClick={copyCode}>코드 복사</button>
            <button type="button" className="primary-button" onClick={importCode}>입력값 불러오기</button>
          </div>
        </div>
      </div>
    </dialog>
  );
}
