/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { JournalEntry } from '../types';

interface BandwidthMapProps {
  entries: JournalEntry[];
  onSelectEntries: (entries: JournalEntry[]) => void;
}

interface ClusteredPoint {
  id: string;
  x: number;
  y: number;
  entries: JournalEntry[];
  isToday: boolean;
}

export const BandwidthMap: React.FC<BandwidthMapProps> = ({ entries, onSelectEntries }) => {
  const todayDateStr = new Date().toDateString();

  // Cluster dots that fall on or very near the same coordinates
  const clusteredPoints: ClusteredPoint[] = useMemo(() => {
    const points: ClusteredPoint[] = [];
    const CLUSTER_RADIUS = 7; // Distance on 0-100 scale

    entries.forEach((entry) => {
      const x = typeof entry.cognitiveLoad === 'number' ? entry.cognitiveLoad : 50;
      const y = typeof entry.emotionalCapacity === 'number' ? entry.emotionalCapacity : 50;
      const isToday = new Date(entry.createdAt).toDateString() === todayDateStr;

      // Check for existing cluster
      const existing = points.find((p) => {
        const dx = p.x - x;
        const dy = p.y - y;
        return Math.sqrt(dx * dx + dy * dy) < CLUSTER_RADIUS;
      });

      if (existing) {
        existing.entries.push(entry);
        if (isToday) existing.isToday = true;
      } else {
        points.push({
          id: entry.id,
          x,
          y,
          entries: [entry],
          isToday,
        });
      }
    });

    return points;
  }, [entries, todayDateStr]);

  return (
    <div
      id="bandwidth-map-card"
      className="rounded-2xl border p-5 sm:p-7 space-y-4 shadow-sm transition-all"
      style={{
        backgroundColor: 'var(--bg-card)',
        borderColor: 'var(--border-card)',
      }}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-[var(--accent-gold)]">
            Lead Insight
          </span>
          <h3 className="font-serif-journal text-2xl font-medium text-[var(--ink-primary)]">
            Bandwidth Map
          </h3>
        </div>
        <p className="font-serif-journal italic text-xs text-[var(--ink-muted)]">
          “Some days you're not low — you're just full.”
        </p>
      </div>

      {/* 2-Axis Plot SVG Canvas */}
      <div
        className="relative w-full aspect-4/3 max-h-[360px] rounded-xl border p-2 select-none overflow-hidden"
        style={{
          backgroundColor: 'var(--bg-journal)',
          borderColor: 'var(--border-card)',
        }}
      >
        {/* Quadrant Background Labels */}
        <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 pointer-events-none p-3 text-[11px] font-sans-journal opacity-60">
          {/* Top-Left: Calm & open */}
          <div className="flex items-start justify-start p-2">
            <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 font-medium">
              Calm &amp; open
            </span>
          </div>
          {/* Top-Right: Busy but coping */}
          <div className="flex items-start justify-end p-2">
            <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-800 dark:text-amber-300 font-medium">
              Busy but coping
            </span>
          </div>
          {/* Bottom-Left: Running on reserves */}
          <div className="flex items-end justify-start p-2">
            <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-800 dark:text-blue-300 font-medium">
              Running on reserves
            </span>
          </div>
          {/* Bottom-Right: Overloaded */}
          <div className="flex items-end justify-end p-2">
            <span className="px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-800 dark:text-rose-300 font-medium">
              Overloaded
            </span>
          </div>
        </div>

        {/* Coordinate Center Crosshairs */}
        <div
          className="absolute left-1/2 top-0 bottom-0 w-px dashed-border opacity-40 pointer-events-none"
          style={{ backgroundColor: 'var(--border-journal)' }}
        />
        <div
          className="absolute top-1/2 left-0 right-0 h-px dashed-border opacity-40 pointer-events-none"
          style={{ backgroundColor: 'var(--border-journal)' }}
        />

        {/* Axis Labels */}
        <div className="absolute left-3 top-1/2 -translate-y-1/2 -rotate-90 origin-left text-[10px] tracking-wider uppercase text-[var(--ink-muted)] pointer-events-none">
          Emotional Capacity &rarr;
        </div>
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] tracking-wider uppercase text-[var(--ink-muted)] pointer-events-none">
          Cognitive Load &rarr;
        </div>

        {/* Render Points */}
        {clusteredPoints.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center text-xs text-[var(--ink-muted)]">
            Write your first entry to map your capacity.
          </div>
        ) : (
          clusteredPoints.map((point) => {
            // Convert 0-100 coordinates to percentages
            // X: cognitive load (0% = left, 100% = right)
            // Y: emotional capacity (0% = bottom, 100% = top -> invert for CSS top)
            const leftPercent = Math.max(10, Math.min(90, point.x));
            const topPercent = Math.max(10, Math.min(90, 100 - point.y));
            const count = point.entries.length;
            const primaryEntry = point.entries[0];

            return (
              <div
                key={point.id}
                className="absolute -translate-x-1/2 -translate-y-1/2"
                style={{
                  left: `${leftPercent}%`,
                  top: `${topPercent}%`,
                }}
              >
                {/* Generous touch target wrapper for mobile (44x44px minimum) */}
                <button
                  id={`bandwidth-dot-${point.id}`}
                  type="button"
                  onClick={() => onSelectEntries(point.entries)}
                  className="w-11 h-11 flex items-center justify-center group cursor-pointer focus:outline-hidden"
                  title={`${count} entry${count > 1 ? 'ies' : ''} on ${new Date(primaryEntry.createdAt).toLocaleDateString()}`}
                  aria-label={`View entry details for ${new Date(primaryEntry.createdAt).toLocaleDateString()}`}
                >
                  {/* Today Highlight Ring */}
                  {point.isToday && (
                    <span className="absolute w-7 h-7 rounded-full border-2 border-[var(--accent-gold)] animate-ping opacity-60 pointer-events-none" />
                  )}

                  {/* Core Dot */}
                  <div
                    className={`relative rounded-full flex items-center justify-center transition-transform group-hover:scale-125 shadow-xs border ${
                      point.isToday
                        ? 'w-5 h-5 bg-[var(--accent-gold)] border-white dark:border-neutral-900 text-white'
                        : count > 1
                        ? 'w-5 h-5 bg-[var(--accent-teal)] border-white dark:border-neutral-900 text-white'
                        : 'w-3.5 h-3.5 bg-[var(--accent-teal)] border-white dark:border-neutral-900'
                    }`}
                  >
                    {/* Count Badge for Clustered Dates */}
                    {count > 1 && (
                      <span className="text-[9px] font-bold leading-none select-none">
                        {count}
                      </span>
                    )}
                  </div>
                </button>
              </div>
            );
          })
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between text-[11px] text-[var(--ink-muted)] pt-1">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--accent-gold)]" />
            <span>Today's reflection</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--accent-teal)]" />
            <span>Past entries</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[var(--accent-teal)] text-[8px] text-white flex items-center justify-center font-bold">2</span>
            <span>Clustered days</span>
          </span>
        </div>
        <span>Tap any dot to read that day</span>
      </div>
    </div>
  );
};
