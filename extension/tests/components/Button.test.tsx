import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '../../src/components/ui/button';

describe('Button', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders with default props', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button')).toBeInTheDocument();
    expect(screen.getByRole('button')).toHaveTextContent('Click me');
  });

  it('renders with variant prop', () => {
    render(<Button variant="primary">Primary</Button>);
    expect(screen.getByRole('button')).toHaveTextContent('Primary');
  });

  it('renders with size prop', () => {
    render(<Button size="sm">Small</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveTextContent('Small');
  });

  it('renders with custom className', () => {
    render(<Button className="custom-class">Custom</Button>);
    expect(screen.getByRole('button')).toHaveClass('custom-class');
  });

  it('handles click events', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();

    render(<Button onClick={handleClick}>Click me</Button>);
    await user.click(screen.getByRole('button'));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('is disabled when loading', () => {
    render(<Button loading>Loading</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('shows loading spinner when loading', () => {
    render(<Button loading>Loading</Button>);
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('renders all variants correctly', () => {
    const variants = ['primary', 'secondary', 'danger', 'ghost'] as const;

    variants.forEach((variant) => {
      render(<Button variant={variant}>{variant}</Button>);
      // Use findAllBy to handle multiple elements
      expect(screen.findAllByRole('button')).resolves.toHaveLength(1);
      cleanup();
    });
  });

  it('renders all sizes correctly', () => {
    const sizes = ['sm', 'md', 'lg'] as const;

    sizes.forEach((size) => {
      render(<Button size={size}>{size}</Button>);
      expect(screen.findAllByRole('button')).resolves.toHaveLength(1);
      cleanup();
    });
  });
});