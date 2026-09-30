import { test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DataTable from './DataTable';

const columns = [
  { key: 'name', label: 'Name', sortKey: 'name' },
  { key: 'email', label: 'Email' },
];

test('sorting header calls onSort and exposes aria-sort', async () => {
  const onSort = vi.fn();

  render(
    <DataTable
      columns={columns}
      rows={[{ id: 1, name: 'A', email: 'a@x.com' }]}
      sort={{ sortBy: 'name', order: 'asc' }}
      onSort={onSort}
    />,
  );

  expect(
    screen.getByRole('columnheader', { name: /name/i }),
  ).toHaveAttribute('aria-sort', 'ascending');

  await userEvent.click(screen.getByRole('button', { name: /name/i }));

  expect(onSort).toHaveBeenCalledWith('name');
});

test('shows the empty message when there are no rows', () => {
  render(
    <DataTable
      columns={columns}
      rows={[]}
      emptyMessage="No stores yet."
    />,
  );

  expect(screen.getByText('No stores yet.')).toBeInTheDocument();
});
