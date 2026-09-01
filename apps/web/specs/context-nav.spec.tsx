import React from 'react';
import { render } from '@testing-library/react';
import { ContextNavProvider, useContextNav, type ContextNavModel } from '../src/components/shell/ContextNav';

const makeModel = (activeKey: string): ContextNavModel => ({
  label: 'Master Data sections',
  groups: [{ label: 'Farm Operations', items: [{ key: 'farm', label: 'Farms' }, { key: 'shed', label: 'Sheds' }] }],
  activeKey,
  onSelect: () => undefined,
});

const MODEL_A = makeModel('farm');
const MODEL_B = makeModel('shed');

function Registrar({ model }: { model: ContextNavModel | null }) {
  useContextNav(model);
  return null;
}

describe('ContextNav registration', () => {
  it('keeps the module index mounted when the page registers an updated model', () => {
    // Selecting a different section produces a new model object. Tearing the
    // index down and rebuilding it is what made the sub-sidebar visibly
    // refresh on every navigation.
    const present: boolean[] = [];
    const tree = (model: ContextNavModel) => (
      <ContextNavProvider>
        {(nav) => {
          present.push(Boolean(nav));
          return <Registrar model={model} />;
        }}
      </ContextNavProvider>
    );

    const { rerender } = render(tree(MODEL_A));
    expect(present).toContain(true);

    const before = present.length;
    rerender(tree(MODEL_B));

    expect(present.slice(before)).not.toContain(false);
  });

  it('hands the index over between routes without blanking it', () => {
    // Navigating from one module page to another unmounts the first page and
    // mounts the second. The old page's cleanup must not clear an index the
    // new page is about to claim, or the column visibly empties and refills on
    // every navigation.
    const present: boolean[] = [];
    const PageA = () => {
      useContextNav(MODEL_A);
      return null;
    };
    const PageB = () => {
      useContextNav(MODEL_B);
      return null;
    };
    const tree = (Page: React.ComponentType) => (
      <ContextNavProvider>
        {(nav) => {
          present.push(Boolean(nav));
          return <Page />;
        }}
      </ContextNavProvider>
    );

    const { rerender } = render(tree(PageA));
    expect(present).toContain(true);

    const before = present.length;
    rerender(tree(PageB));

    expect(present.slice(before)).not.toContain(false);
  });

  it('clears the index when the last route leaves without a successor', () => {
    const present: boolean[] = [];
    const Page = () => {
      useContextNav(MODEL_A);
      return null;
    };
    const tree = (withPage: boolean) => (
      <ContextNavProvider>
        {(nav) => {
          present.push(Boolean(nav));
          return withPage ? <Page /> : null;
        }}
      </ContextNavProvider>
    );

    const { rerender } = render(tree(true));
    expect(present).toContain(true);
    rerender(tree(false));

    return Promise.resolve().then(() => {
      expect(present[present.length - 1]).toBe(false);
    });
  });

  it('does not re-register forever when the caller rebuilds its model each render', () => {
    // A page that builds its model inline — or whose useMemo deps are unstable,
    // which is the case wherever t()/tLabel() are in the dep list — must not
    // drive the provider into an update loop.
    const renders: number[] = [];
    function Unmemoized() {
      // A fresh object identity on every single render.
      useContextNav({ ...makeModel('farm') });
      return null;
    }

    expect(() =>
      render(
        <ContextNavProvider>
          {(nav) => {
            renders.push(nav ? 1 : 0);
            return <Unmemoized />;
          }}
        </ContextNavProvider>
      )
    ).not.toThrow();

    expect(renders.length).toBeLessThan(25);
  });
});
