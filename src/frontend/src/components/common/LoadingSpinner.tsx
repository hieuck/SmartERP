import { Spin } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';

interface LoadingSpinnerProps {
  size?: 'small' | 'default' | 'large';
  tip?: string;
  fullScreen?: boolean;
}

/**
 * LoadingSpinner Component
 *
 * Standardized loading indicator following Ant Design guidelines
 * Can be used inline or as full-screen overlay
 *
 * @example
 * // Inline loading
 * <LoadingSpinner tip="Loading data..." />
 *
 * // Full screen loading
 * <LoadingSpinner fullScreen tip="Processing..." />
 */
export default function LoadingSpinner({
  size = 'default',
  tip,
  fullScreen = false,
}: LoadingSpinnerProps) {
  const antIcon = (
    <LoadingOutlined
      style={{ fontSize: size === 'large' ? 48 : size === 'small' ? 16 : 24 }}
      spin
    />
  );

  if (fullScreen) {
    return (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(255, 255, 255, 0.9)',
          zIndex: 9999,
        }}
      >
        <Spin indicator={antIcon} size={size} tip={tip} />
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 0',
      }}
    >
      <Spin indicator={antIcon} size={size} tip={tip} />
    </div>
  );
}
