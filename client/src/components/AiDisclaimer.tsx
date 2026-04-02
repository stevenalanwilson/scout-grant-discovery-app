import { useState } from 'react';

const STORAGE_KEY = 'scout-grants-disclaimer-seen';

export function AiDisclaimer(): React.ReactElement {
  const [expanded, setExpanded] = useState(() => {
    try {
      return !sessionStorage.getItem(STORAGE_KEY);
    } catch {
      return true;
    }
  });

  function dismiss(): void {
    try {
      sessionStorage.setItem(STORAGE_KEY, '1');
    } catch {
      // sessionStorage unavailable — just collapse visually
    }
    setExpanded(false);
  }

  if (expanded) {
    return (
      <div
        className="ai-disclaimer ai-disclaimer--expanded"
        role="note"
        aria-label="Important notice about AI-gathered information"
      >
        <div className="ai-disclaimer__content">
          <strong className="ai-disclaimer__heading">
            AI-gathered information — please verify before applying
          </strong>
          <p className="ai-disclaimer__body">
            Grant details on this app are gathered automatically by an AI agent. The deadline,
            eligibility criteria, and award amounts may be incomplete or out of date. Before
            spending time on an application, always check the original source link to confirm the
            details are still accurate.
          </p>
          <button className="btn ai-disclaimer__btn" onClick={dismiss}>
            Got it
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="ai-disclaimer ai-disclaimer--compact" role="note">
      <span className="ai-disclaimer__compact-text">
        AI-gathered — verify at source before applying.
      </span>
    </div>
  );
}
