import React from 'react';
import { View, Dimensions, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import Svg, { Rect, Text as SvgText } from 'react-native-svg';

interface BarChartProps {
  data: {
    labels: string[];
    values: number[];
  };
  height?: number;
  color?: string;
}

const BarChart: React.FC<BarChartProps> = ({ data, height = 200, color = '#52c41a' }) => {
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
  const barWidth = chartWidth / data.values.length - 10;

  return (
    <View style={[styles.container, { height }]}>
      <Svg width={width} height={height}>
        {data.values.map((value, index) => {
          const barHeight = (value / maxValue) * chartHeight;
          const x = padding + index * (chartWidth / data.values.length) + 5;
          const y = padding + chartHeight - barHeight;

          return (
            <React.Fragment key={index}>
              <Rect x={x} y={y} width={barWidth} height={barHeight} fill={color} rx="4" />
              <SvgText
                x={x + barWidth / 2}
                y={height - 10}
                fontSize="10"
                fill="#666"
                textAnchor="middle"
              >
                {data.labels[index]}
              </SvgText>
            </React.Fragment>
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

export default BarChart;
