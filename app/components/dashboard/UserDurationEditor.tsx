"use client";

import { useId, useState } from "react";

import type { UserDurationOverride } from "@/lib/engine/schedule";
import { formatProcessingDuration } from "@/lib/format-duration";

const unitLabels: Record<UserDurationOverride["unit"], string> = {
  BUSINESS_DAY: "업무일",
  CALENDAR_DAY: "달력일",
  MONTH: "개월",
};

export function UserDurationEditor({
  procedureId,
  procedureName,
  value,
  completed,
  onChange,
}: {
  procedureId: string;
  procedureName: string;
  value: UserDurationOverride | undefined;
  completed: boolean;
  onChange: (procedureId: string, value: UserDurationOverride | null) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [draftValue, setDraftValue] = useState(value ? String(value.value) : "");
  const [draftUnit, setDraftUnit] = useState<UserDurationOverride["unit"]>(
    value?.unit ?? "CALENDAR_DAY",
  );
  const [error, setError] = useState("");
  const editorId = `user-duration-${useId().replaceAll(":", "")}`;

  if (completed) {
    return (
      <div className="user-duration-compact is-disabled">
        <span>내 예상기간</span><small>완료 이정표 우선</small>
      </div>
    );
  }

  function save() {
    const parsed = Number(draftValue);
    if (!Number.isInteger(parsed) || parsed < 0 || parsed > 3_650) {
      setError("0~3,650 사이의 정수를 입력해 주세요.");
      return;
    }
    onChange(procedureId, { value: parsed, unit: draftUnit });
    setExpanded(false);
    setError("");
  }

  return (
    <div className={`user-duration-editor${value ? " has-value" : ""}`}>
      <button
        type="button"
        className="user-duration-toggle"
        aria-expanded={expanded}
        aria-controls={editorId}
        onClick={() => {
          if (!expanded) {
            setDraftValue(value ? String(value.value) : "");
            setDraftUnit(value?.unit ?? "CALENDAR_DAY");
            setError("");
          }
          setExpanded((current) => !current);
        }}
      >
        <span>내 예상</span>
        <strong>
          {value
            ? `${formatProcessingDuration(value.value, value.unit)} · 수정`
            : "기간 입력 +"}
        </strong>
      </button>
      {expanded ? (
        <div id={editorId} className="user-duration-fields">
          <p>신청 준비·보완·관계기관 협의를 포함한 이 절차의 전체 예상 경과기간을 입력합니다.</p>
          <div>
            <label>
              <span className="sr-only">{procedureName} 사용자 예상 처리기간</span>
              <input
                type="number"
                min="0"
                max="3650"
                step="1"
                inputMode="numeric"
                value={draftValue}
                placeholder="예: 30"
                aria-invalid={Boolean(error)}
                onChange={(event) => setDraftValue(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    save();
                  }
                }}
              />
            </label>
            <label>
              <span className="sr-only">{procedureName} 사용자 예상 처리기간 단위</span>
              <select
                value={draftUnit}
                onChange={(event) => setDraftUnit(event.target.value as UserDurationOverride["unit"])}
              >
                {Object.entries(unitLabels).map(([unit, label]) => (
                  <option key={unit} value={unit}>{label}</option>
                ))}
              </select>
            </label>
            <button type="button" className="user-duration-save" onClick={save}>반영</button>
          </div>
          {error ? <small className="user-duration-error" role="alert">{error}</small> : null}
          {value ? (
            <button
              type="button"
              className="user-duration-clear"
              onClick={() => {
                onChange(procedureId, null);
                setExpanded(false);
              }}
            >
              공식 기준으로 되돌리기
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
