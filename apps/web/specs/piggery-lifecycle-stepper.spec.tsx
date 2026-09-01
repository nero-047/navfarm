import React from 'react';
import { render, screen } from '@testing-library/react';
import PiggeryLifecycleStepper, { type PiggeryStage } from '../src/components/console/piggery/piggery-lifecycle-stepper';

// A sow batch that started at Flush/AI. It never went through Quarantine or
// Gilt Grower, even though both sit earlier in the master stage sequence.
const STAGES: PiggeryStage[] = [
  { id: 1, code: 'QUARANTINE', name: 'Quarantine', type: 'PRE_PRODUCTIVE', daysRange: '30 days (standard)', status: 'UPCOMING', standardDays: 30 },
  { id: 2, code: 'GILT_GROWER', name: 'Gilt Grower Phase', type: 'PRE_PRODUCTIVE', daysRange: '77 days (standard)', status: 'UPCOMING', standardDays: 77 },
  { id: 3, code: 'FLUSH_SERVICE', name: 'Flush and Service / AI', type: 'PRE_PRODUCTIVE', daysRange: 'Day 1 – 10', status: 'COMPLETED', standardDays: 10 },
  { id: 4, code: 'DRY_SOW_GESTATION', name: 'Dry Sow / Gestation', type: 'PRODUCTIVE', daysRange: 'Day 11 – 63', status: 'CURRENT', standardDays: 114 },
  { id: 5, code: 'FARROWING', name: 'Farrowing', type: 'OUTPUT', daysRange: '3 days (standard)', status: 'UPCOMING', standardDays: 3 },
];

const labelFor = (name: string) => {
  const heading = screen.getByText(name);
  return heading.closest('div')?.parentElement?.textContent || '';
};

describe('PiggeryLifecycleStepper', () => {
  it('honours each stage status instead of inferring completion from position', () => {
    render(<PiggeryLifecycleStepper stages={STAGES} currentStageId={4} />);

    // Earlier in the sequence, but never entered — must not read as done.
    expect(labelFor('Quarantine')).not.toContain('Done');
    expect(labelFor('Gilt Grower Phase')).not.toContain('Done');
  });

  it('still marks the stages the batch really completed', () => {
    render(<PiggeryLifecycleStepper stages={STAGES} currentStageId={4} />);
    expect(labelFor('Flush and Service / AI')).toContain('Done');
  });

  it('starts the completed progress line at the first stage actually entered', () => {
    // Quarantine and Gilt Grower were skipped. Painting the line from the very
    // first stage claims the batch walked through them.
    const { container } = render(<PiggeryLifecycleStepper stages={STAGES} currentStageId={4} />);
    const bar = container.querySelector('[data-testid="stepper-progress"]') as HTMLElement;

    expect(bar).toBeTruthy();
    // Flush/AI is index 2 of 5 -> the green run must begin at 50%, not 0%.
    expect(bar.style.left).toBe('50%');
    expect(bar.style.width).toBe('25%');
  });

  it('paints no completed line at all when nothing is completed', () => {
    const none: PiggeryStage[] = STAGES.map((s) => ({ ...s, status: s.status === 'CURRENT' ? 'CURRENT' : 'UPCOMING' }));
    const { container } = render(<PiggeryLifecycleStepper stages={none} currentStageId={4} />);
    const bar = container.querySelector('[data-testid="stepper-progress"]') as HTMLElement;

    expect(bar.style.width).toBe('0%');
  });

  it('marks the current stage', () => {
    render(<PiggeryLifecycleStepper stages={STAGES} currentStageId={4} />);
    expect(labelFor('Dry Sow / Gestation')).toMatch(/CURRENT/i);
  });
});
