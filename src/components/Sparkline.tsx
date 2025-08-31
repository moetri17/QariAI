/**
 * Sparkline Component
 * Renders a small line chart to show a quick visual trend of values.
 * Scales the values to fit the given width and height, with a baseline
 * and a blue line indicating changes over time.
 */

import React from 'react';
import { View } from 'react-native';
import { Svg, Polyline, Line } from 'react-native-svg';

export default function Sparkline({
  values,
  width = 260,
  height = 48,
}: {
  values: number[];
  width?: number;
  height?: number;
}) {
  if (!values?.length) return null;
  const max = Math.max(0.0001, ...values);
  const step = values.length > 1 ? width / (values.length - 1) : width;
  const pts = values
    .map((v, i) => {
      const x = i * step;
      const y = height - (v / max) * height;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <View style={{ width, height }}>
      <Svg width={width} height={height}>
        <Line x1="0" y1={height} x2={width} y2={height} stroke="#E5E7EB" strokeWidth="1" />
        <Polyline points={pts} fill="none" stroke="#1D4ED8" strokeWidth="2.5" />
      </Svg>
    </View>
  );
}
