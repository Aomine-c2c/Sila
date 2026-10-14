'use client';

import React, { useEffect, useRef, useState } from 'react';
import { X, Maximize2, Minimize2, ExternalLink } from 'lucide-react';
import Link from 'next/link';

interface CockpitDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  categoryTag?: string;
  categoryColor?: string;
  fullPageHref?: string;
  children: React.ReactNode;
  widthClass?: string;
}

export function CockpitDrawer({
  isOpen,
  onClose,
  title,
  subtitle,
  categoryTag,
  categoryColor = 'text-foreground',
  fullPageHref,
  children,
  widthClass = 'max-w-3xl',
}: CockpitDrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null);
  const [isMaximized, setIsMaximized] = useState(false);

  // Accessible Escape key handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      setIsMaximized(false);
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-background/80 backdrop-blur-md transition-opacity duration-300 select-none"
      aria-modal="true"
      role="dialog"
      aria-label={title}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={drawerRef}
        className={`relative flex h-full w-full ${
          isMaximized ? 'max-w-full' : widthClass
        } flex-col border-l border-border/80 bg-card/95 shadow-2xl backdrop-blur-2xl transition-all duration-300 ease-out animate-in slide-in-from-right`}
      >
        {/* Drawer Header with Nothing OS Dot Matrix */}
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-border/80 px-6 font-mono">
          <div className="flex items-center gap-3">
            <span className="h-2 w-2 rounded-full bg-[#D71921] shadow-[0_0_8px_#D71921]" />
            <div>
              <div className="flex items-center gap-2">
                {categoryTag && (
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${categoryColor}`}>
                    [{categoryTag}]
                  </span>
                )}
                <h2 className="text-sm font-bold tracking-tight text-foreground uppercase">
                  {title}
                </h2>
              </div>
              {subtitle && (
                <p className="text-[11px] text-muted-foreground truncate max-w-md">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Direct Full-Page Standalone Link */}
            {fullPageHref && (
              <Link
                href={fullPageHref}
                className="rounded-full p-2 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                title="Open as Standalone Page"
                onClick={onClose}
              >
                <ExternalLink className="h-4 w-4" />
              </Link>
            )}

            {/* Maximize / Half-Screen Toggle */}
            <button
              type="button"
              onClick={() => setIsMaximized((prev) => !prev)}
              className="rounded-full p-2 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
              title={isMaximized ? 'Restore Width' : 'Maximize Width'}
              aria-label="Toggle drawer expansion"
            >
              {isMaximized ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-2 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
              aria-label="Close drawer (Escape)"
              title="Close (Esc)"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Drawer Content Area */}
        <div className="flex-1 overflow-y-auto p-6 select-text font-mono">
          {children}
        </div>
      </div>
    </div>
  );
}
