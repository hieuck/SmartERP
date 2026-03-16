import type { Preview } from '@storybook/react-vite';
import { ConfigProvider } from 'antd';
import React from 'react';
import theme from '../src/theme';
import '../src/index.css';

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      default: 'light',
      values: [
        {
          name: 'light',
          value: '#f0f2f5',
        },
        {
          name: 'white',
          value: '#ffffff',
        },
        {
          name: 'dark',
          value: '#141414',
        },
      ],
    },
  },
  decorators: [
    (Story) => (
      <ConfigProvider theme={theme}>
        <div style={{ padding: '20px' }}>
          <Story />
        </div>
      </ConfigProvider>
    ),
  ],
};

export default preview;