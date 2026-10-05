import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { CommandPalette } from './CommandPalette';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

describe('CommandPalette', () => {
  it('does not render when closed', () => {
    const { container } = render(<CommandPalette isOpen={false} onClose={jest.fn()} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders and lists command items when open', () => {
    render(<CommandPalette isOpen={true} onClose={jest.fn()} />);
    expect(screen.getByRole('dialog', { name: /Command Palette/i })).toBeInTheDocument();
    expect(screen.getByText('Control Room')).toBeInTheDocument();
    expect(screen.getByText('Departments')).toBeInTheDocument();
    expect(screen.getByText('Simulation Lab')).toBeInTheDocument();
  });

  it('filters command items based on user search query', () => {
    render(<CommandPalette isOpen={true} onClose={jest.fn()} />);
    const input = screen.getByPlaceholderText(/Type a command or query/i);

    fireEvent.change(input, { target: { value: 'Simulation' } });

    expect(screen.getByText('Simulation Lab')).toBeInTheDocument();
    expect(screen.queryByText('Control Room')).not.toBeInTheDocument();
  });

  it('triggers onClose when ESC key is pressed', () => {
    const onCloseMock = jest.fn();
    render(<CommandPalette isOpen={true} onClose={onCloseMock} />);

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onCloseMock).toHaveBeenCalledTimes(1);
  });
});
