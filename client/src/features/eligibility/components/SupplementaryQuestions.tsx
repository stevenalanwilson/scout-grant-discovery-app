import { useState } from 'react';
import type { SupplementaryQuestion } from '@scout-grants/shared';

interface SupplementaryQuestionsProps {
  questions: SupplementaryQuestion[];
  onSubmit: (answers: Record<string, string>) => Promise<void>;
}

export function SupplementaryQuestions({
  questions,
  onSubmit,
}: SupplementaryQuestionsProps): React.ReactElement {
  const [answers, setAnswers] = useState<Record<string, string>>(
    Object.fromEntries(questions.map((q) => [q.id, ''])),
  );
  const [submitting, setSubmitting] = useState(false);

  function setAnswer(id: string, value: string): void {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  }

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit(answers);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="supplementary-questions" aria-label="Additional eligibility questions">
      <h3 className="supplementary-questions__title">A few more questions</h3>
      <p className="supplementary-questions__intro">
        To complete your eligibility check, please answer the following (maximum {questions.length}{' '}
        question{questions.length !== 1 ? 's' : ''}).
      </p>

      <form onSubmit={handleSubmit}>
        {questions.map((question) => (
          <div key={question.id} className="field">
            <label htmlFor={`sq-${question.id}`} className="field-label">
              {question.question}
            </label>
            {question.hint && <p className="field-hint">{question.hint}</p>}
            <textarea
              id={`sq-${question.id}`}
              className="input textarea"
              rows={3}
              value={answers[question.id] ?? ''}
              onChange={(e) => setAnswer(question.id, e.target.value)}
            />
          </div>
        ))}

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Checking…' : 'Check eligibility'}
          </button>
        </div>
      </form>
    </section>
  );
}
