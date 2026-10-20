import React, { useId } from 'react';

interface SparklineChartProps {
  data: number[];
  min?: number;
  max?: number;
  height?: number;
  strokeColor?: string;
}

/**
 * Pure zero-dependency lightweight SVG 60s history chart (Section 21).
 */
export const SparklineChart: React.FC<SparklineChartProps> = React.memo(
  ({ data, min = 0, max = 100, height = 54, strokeColor = 'var(--wejet-accent)' }) => {
    const gradId = useId();
    const width = 280;
    const padY = 4;
    const usableH = height - padY * 2;
    const span = Math.max(1, max - min);

    const points =
      data.length >= 2
        ? data.map((val, idx) => {
            const x = (idx / (data.length - 1)) * width;
            const clamped = Math.min(max, Math.max(min, val));
            const y = padY + usableH - ((clamped - min) / span) * usableH;
            return { x, y };
          })
        : [
            { x: 0, y: height / 2 },
            { x: width, y: height / 2 },
          ];

    const linePath = points
      .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
      .join(' ');
    const areaPath = `${linePath} L${width},${height} L0,${height} Z`;

    return (
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
        height={height}
        preserveAspectRatio="none"
        style={{ display: 'block', overflow: 'visible' }}
        aria-hidden
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={strokeColor} stopOpacity="0.34" />
            <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill={`url(#${gradId})`} />
        <path
          d={linePath}
          fill="none"
          stroke={strokeColor}
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
);

SparklineChart.displayName = 'SparklineChart';
