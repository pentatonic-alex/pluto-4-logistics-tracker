import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusBadge } from '../StatusBadge';
import type { CampaignStatus } from '@/types';

describe('StatusBadge', () => {
  const allStatuses: CampaignStatus[] = [
    'created',
    'inbound_shipment_recorded',
    'granulation_complete',
    'metal_removal_complete',
    'polymer_purification_complete',
    'extrusion_complete',
    'echa_approved',
    'transferred_to_rge',
    'manufacturing_started',
    'manufacturing_complete',
    'returned_to_lego',
    'completed',
  ];

  describe('rendering', () => {
    it('renders without crashing for all status types', () => {
      for (const status of allStatuses) {
        const { unmount } = render(<StatusBadge status={status} />);
        unmount();
      }
    });

    it('displays the correct label for created status', () => {
      render(<StatusBadge status="created" />);
      expect(screen.getByText('Created')).toBeInTheDocument();
    });

    it('displays the correct label for completed status', () => {
      render(<StatusBadge status="completed" />);
      expect(screen.getByText('Completed')).toBeInTheDocument();
    });

    it('displays the correct label for inbound_shipment_recorded', () => {
      render(<StatusBadge status="inbound_shipment_recorded" />);
      expect(screen.getByText('Inbound Shipment')).toBeInTheDocument();
    });

    it('displays the correct label for manufacturing states', () => {
      const { rerender } = render(<StatusBadge status="manufacturing_started" />);
      expect(screen.getByText('Manufacturing')).toBeInTheDocument();

      rerender(<StatusBadge status="manufacturing_complete" />);
      expect(screen.getByText('Mfg Complete')).toBeInTheDocument();
    });
  });

  describe('size variants', () => {
    it('renders with default md size', () => {
      const { container } = render(<StatusBadge status="created" />);
      const badge = container.firstChild as HTMLElement;
      expect(badge.className).toContain('px-2.5');
      expect(badge.className).toContain('py-1');
    });

    it('renders with sm size when specified', () => {
      const { container } = render(<StatusBadge status="created" size="sm" />);
      const badge = container.firstChild as HTMLElement;
      expect(badge.className).toContain('px-2');
      expect(badge.className).toContain('py-0.5');
    });
  });

  describe('styling', () => {
    it('includes the status indicator dot', () => {
      const { container } = render(<StatusBadge status="created" />);
      const dot = container.querySelector('.w-1\\.5.h-1\\.5.rounded-full');
      expect(dot).toBeInTheDocument();
    });

    it('applies correct color classes for completed status', () => {
      const { container } = render(<StatusBadge status="completed" />);
      const badge = container.firstChild as HTMLElement;
      expect(badge.className).toContain('bg-green-100');
      expect(badge.className).toContain('text-green-700');
    });

    it('applies correct color classes for created status', () => {
      const { container } = render(<StatusBadge status="created" />);
      const badge = container.firstChild as HTMLElement;
      expect(badge.className).toContain('bg-slate-100');
      expect(badge.className).toContain('text-slate-700');
    });

    it('applies rounded-full class for pill shape', () => {
      const { container } = render(<StatusBadge status="created" />);
      const badge = container.firstChild as HTMLElement;
      expect(badge.className).toContain('rounded-full');
    });
  });

  describe('accessibility', () => {
    it('renders as a span element', () => {
      const { container } = render(<StatusBadge status="created" />);
      expect(container.firstChild?.nodeName).toBe('SPAN');
    });
  });
});
