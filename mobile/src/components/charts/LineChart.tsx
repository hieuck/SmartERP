import React from 'react';
import { View, Dimensions, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import Svg, { Line, Circle, Text as SvgText, Polyline } from 'react-native-svg';

interface LineChartProps {
  data: {
    labels: string[];
    values: number[];
  };
  height?: number;
  color?: string;
}

const LineChart: React.FC<LineChartProps> = ({ data, height = 200, color = '#1890ff' }) => {
  const width = Dimensions.get('window').width - 64;
  const padding = 40;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  if (!data.values.length) {
    return (
      <View style={[styles.container, { height }]}>
        <Text>No data available</Text>
      </View>
    );
  }

  const maxValue = Math.max(...data.values, 1);
  const minValue = Math.min(...data.values, 0);
  const valueRange = maxValue - minValue || 1;

  const points = data.values.map((value, index) => {
    const x = padding + (index * chartWidth) / (data.values.length - 1 || 1);
    const y = padding + chartHeight - ((value - minValue) / valueRange) * chartHeight;
    return { x, y, value };
  });

  const pathData = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x},${p.y}`).join(' ');

  return (
    <View style={[styles.container, { height }]}>
      <Svg width={width} height={height}>
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
          const y = padding + chartHeight * (1 - ratio);
          return (
            <Line
              key={i}
              x1={padding}
              y1={y}
              x2={width - padding}
              y2={y}
              stroke="#e8e8e8"
              strokeWidth="1"
            />
          );
        })}

        {/* Line */}
        <Polyline
          points={pathData.replace(/[ML]/g, '')}
          fill="none"
          stroke={color}
          strokeWidth="2"
        />

        {/* Points */}
        {points.map((point, index) => (
          <Circle key={index} cx={point.x} cy={point.y} r="4" fill={color} />
        ))}

        {/* Labels */}
        {data.labels.map((label, index) => {
          const x = padding + (index * chartWidth) / (data.labels.length - 1 || 1);
          return (
            <SvgText
              key={index}
              x={x}
              y={height - 10}
              fontSize="10"
              fill="#666"
              textAnchor="middle"
            >
              {label}
            </SvgText>
          );
        })}
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default LineChart;
