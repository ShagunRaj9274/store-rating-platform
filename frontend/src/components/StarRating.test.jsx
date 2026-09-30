import { test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StarPicker, StarMeter } from './StarRating';

test('submits the clicked star value', async () => {
  const onChange = vi.fn();

  render(<StarPicker value={null} onChange={onChange} />);

  await userEvent.click(screen.getByRole('radio', { name: '3 stars' }));

  expect(onChange).toHaveBeenCalledWith(3);
});

test('marks the current rating as checked and does not resubmit it', async () => {
  const onChange = vi.fn();

  render(<StarPicker value={4} onChange={onChange} />);

  expect(screen.getByRole('radio', { name: '4 stars' }))
    .toHaveAttribute('aria-checked', 'true');

  await userEvent.click(screen.getByRole('radio', { name: '4 stars' }));

  expect(onChange).not.toHaveBeenCalled();
});

test('announces an average rating to screen readers', () => {
  render(<StarMeter value={4.33} />);

  expect(
    screen.getByRole('img', { name: '4.3 out of 5 stars' }),
  ).toBeInTheDocument();
});
