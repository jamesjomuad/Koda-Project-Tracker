import { describe, expect, it } from 'vitest';
import { parseProjectPayload, parseListQuery, parseWorkspacePayload, parseCommentPayload } from '../server/utils/validation';

const validPayload = {
  clientName: 'Acme',
  projectName: 'Website',
  description: 'A project',
  status: 'Planning',
  priority: 'Medium',
  startDate: '2026-01-01',
  dueDate: '2026-02-01',
  workspaceId: 1,
};

/** Asserts that calling fn() throws with specific field-level issue messages. */
function expectValidationIssues(
  fn: () => unknown,
  expected: { field: string; message?: string | RegExp }[],
): void {
  let thrown: unknown;
  try {
    fn();
  } catch (error) {
    thrown = error;
  }
  expect(thrown).toBeDefined();
  const issues = (thrown as { data?: { issues?: { field: string; message: string }[] } }).data?.issues ?? [];

  for (const { field, message } of expected) {
    const match = issues.find((issue) => issue.field === field);
    expect(match, `expected an issue for field "${field}"`).toBeDefined();
    if (message !== undefined) {
      if (message instanceof RegExp) {
        expect(match!.message).toMatch(message);
      } else {
        expect(match!.message).toBe(message);
      }
    }
  }
}

describe('parseProjectPayload', () => {
  it('accepts a valid payload and returns normalized data', () => {
    const result = parseProjectPayload(validPayload);
    expect(result).toMatchObject({
      clientName: 'Acme',
      projectName: 'Website',
      status: 'Planning',
      priority: 'Medium',
    });
  });

  it('defaults description to empty string', () => {
    const { description, ...rest } = validPayload;
    expect(parseProjectPayload(rest).description).toBe('');
  });

  it('trims whitespace from required names', () => {
    const result = parseProjectPayload({ ...validPayload, clientName: '  Acme  ' });
    expect(result.clientName).toBe('Acme');
  });

  it('rejects missing clientName', () => {
    const { clientName, ...rest } = validPayload;
    expectValidationIssues(() => parseProjectPayload(rest), [
      { field: 'clientName', message: 'Client name is required' },
    ]);
  });

  it('rejects missing projectName', () => {
    const { projectName, ...rest } = validPayload;
    expectValidationIssues(() => parseProjectPayload(rest), [
      { field: 'projectName', message: 'Project name is required' },
    ]);
  });

  it('rejects missing workspaceId', () => {
    const { workspaceId, ...rest } = validPayload;
    expectValidationIssues(() => parseProjectPayload(rest), [
      { field: 'workspaceId', message: 'Workspace is required' },
    ]);
  });

  it('rejects non-positive workspaceId', () => {
    expectValidationIssues(() => parseProjectPayload({ ...validPayload, workspaceId: -3 }), [
      { field: 'workspaceId', message: 'Workspace is required' },
    ]);
  });

  it('rejects invalid status values', () => {
    expectValidationIssues(() => parseProjectPayload({ ...validPayload, status: 'Done' }), [
      { field: 'status', message: 'Status must be one of: Planning, In Progress, On Hold, Completed' },
    ]);
  });

  it('rejects invalid priority values', () => {
    expectValidationIssues(() => parseProjectPayload({ ...validPayload, priority: 'Urgent' }), [
      { field: 'priority', message: 'Priority must be one of: Low, Medium, High' },
    ]);
  });

  it('rejects malformed dates', () => {
    expectValidationIssues(() => parseProjectPayload({ ...validPayload, startDate: '2026-02-30' }), [
      { field: 'startDate', message: 'Start date must be a valid date (YYYY-MM-DD)' },
    ]);
  });

  it('rejects non-ISO date format', () => {
    expectValidationIssues(() => parseProjectPayload({ ...validPayload, dueDate: '01-02-2026' }), [
      { field: 'dueDate', message: 'Due date must be a valid date (YYYY-MM-DD)' },
    ]);
  });

  it('rejects dueDate earlier than startDate', () => {
    expectValidationIssues(
      () => parseProjectPayload({ ...validPayload, startDate: '2026-05-01', dueDate: '2026-04-01' }),
      [{ field: 'dueDate', message: 'Due date cannot be earlier than start date' }],
    );
  });

  it('collects multiple field issues in one error', () => {
    expectValidationIssues(() => parseProjectPayload({ ...validPayload, clientName: '', priority: 'Nope' }), [
      { field: 'clientName', message: 'Client name is required' },
      { field: 'priority', message: 'Priority must be one of: Low, Medium, High' },
    ]);
  });
});

describe('parseListQuery', () => {
  it('applies defaults when no params are provided', () => {
    const result = parseListQuery({});
    expect(result).toEqual({ sortBy: 'dueDate', order: 'asc' });
  });

  it('parses valid filters', () => {
    const result = parseListQuery({ status: 'Completed', priority: 'High', search: 'acme' });
    expect(result).toMatchObject({ status: 'Completed', priority: 'High', search: 'acme' });
  });

  it('parses a workspaceId filter', () => {
    const result = parseListQuery({ workspaceId: '3' });
    expect(result.workspaceId).toBe(3);
  });

  it('rejects an invalid workspaceId', () => {
    expectValidationIssues(() => parseListQuery({ workspaceId: 'abc' }), [{ field: 'workspaceId' }]);
  });

  it('rejects an invalid status', () => {
    expectValidationIssues(() => parseListQuery({ status: 'Bogus' }), [{ field: 'status' }]);
  });

  it('rejects an unsupported sort field', () => {
    expectValidationIssues(() => parseListQuery({ sortBy: 'description' }), [{ field: 'sortBy' }]);
  });

  it('rejects an invalid order', () => {
    expectValidationIssues(() => parseListQuery({ order: 'sideways' }), [{ field: 'order' }]);
  });
});

describe('parseCommentPayload', () => {
  it('accepts a valid comment and trims the body', () => {
    const result = parseCommentPayload({ body: '  Great work  ' });
    expect(result.body).toBe('Great work');
  });

  it('rejects a missing body', () => {
    expectValidationIssues(() => parseCommentPayload({}), [{ field: 'body', message: 'Comment is required' }]);
  });

  it('rejects a blank body', () => {
    expectValidationIssues(() => parseCommentPayload({ body: '   ' }), [
      { field: 'body', message: 'Comment is required' },
    ]);
  });

  it('rejects an over-long body', () => {
    expectValidationIssues(() => parseCommentPayload({ body: 'x'.repeat(2001) }), [
      { field: 'body', message: 'Comment must be 2000 characters or fewer' },
    ]);
  });
});

describe('parseWorkspacePayload', () => {
  it('accepts a valid payload and defaults description', () => {
    const result = parseWorkspacePayload({ name: 'Design Studio', slug: 'design-studio' });
    expect(result).toMatchObject({ name: 'Design Studio', slug: 'design-studio', description: '' });
  });

  it('trims whitespace from the name and slug', () => {
    const result = parseWorkspacePayload({ name: '  Ops  ', slug: '  ops  ' });
    expect(result.name).toBe('Ops');
    expect(result.slug).toBe('ops');
  });

  it('lowercases and trims the slug', () => {
    const result = parseWorkspacePayload({ name: 'Ops', slug: '  OPS-Team  ' });
    expect(result.slug).toBe('ops-team');
  });

  it('rejects missing name', () => {
    expectValidationIssues(() => parseWorkspacePayload({ slug: 'ops' }), [
      { field: 'name', message: 'Workspace name is required' },
    ]);
  });

  it('rejects missing slug', () => {
    expectValidationIssues(() => parseWorkspacePayload({ name: 'Ops' }), [
      { field: 'slug', message: 'Workspace slug is required' },
    ]);
  });

  it('rejects an invalid slug format', () => {
    expectValidationIssues(() => parseWorkspacePayload({ name: 'Ops', slug: 'Ops_Studio!' }), [
      { field: 'slug', message: 'Slug must use lowercase letters, numbers, and hyphens (e.g. design-studio)' },
    ]);
  });

  it('rejects an over-long name', () => {
    expectValidationIssues(() => parseWorkspacePayload({ name: 'x'.repeat(121), slug: 'ops' }), [
      { field: 'name', message: 'Workspace name must be 120 characters or fewer' },
    ]);
  });

  it('rejects an over-long slug', () => {
    expectValidationIssues(() => parseWorkspacePayload({ name: 'Ops', slug: 'a'.repeat(81) }), [
      { field: 'slug', message: 'Slug must be 80 characters or fewer' },
    ]);
  });

  it('rejects an over-long description', () => {
    expectValidationIssues(() => parseWorkspacePayload({ name: 'A', slug: 'ops', description: 'x'.repeat(2001) }), [
      { field: 'description', message: 'Description must be 2000 characters or fewer' },
    ]);
  });
});