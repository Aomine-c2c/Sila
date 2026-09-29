import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

describe('UI Components', () => {
  describe('Card', () => {
    it('renders card with title and content', () => {
      render(
        <Card>
          <div className="p-6">
            <h3 className="text-xl font-semibold">Test Card</h3>
            <p className="text-muted-foreground">Card content</p>
          </div>
        </Card>
      );
      expect(screen.getByText('Test Card')).toBeInTheDocument();
      expect(screen.getByText('Card content')).toBeInTheDocument();
    });
  });

  describe('Badge', () => {
    it('renders default badge', () => {
      render(<Badge>Default</Badge>);
      expect(screen.getByText('Default')).toBeInTheDocument();
    });

    it('renders success variant', () => {
      render(<Badge variant="success">Success</Badge>);
      expect(screen.getByText('Success')).toBeInTheDocument();
    });

    it('renders warning variant', () => {
      render(<Badge variant="warning">Warning</Badge>);
      expect(screen.getByText('Warning')).toBeInTheDocument();
    });

    it('renders destructive variant', () => {
      render(<Badge variant="destructive">Error</Badge>);
      expect(screen.getByText('Error')).toBeInTheDocument();
    });
  });
});

describe('Utility Functions', () => {
  it('formats dates correctly', () => {
    const { formatDate } = require('@/lib/utils');
    expect(formatDate('2024-01-15')).toBe('Jan 15, 2024');
  });

  it('truncates long strings', () => {
    const { truncate } = require('@/lib/utils');
    // truncate takes first N chars + '...'
    expect(truncate('hello world', 5)).toBe('hello...');
    expect(truncate('hi', 10)).toBe('hi');
  });
});