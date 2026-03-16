import React from 'react';
import { Card } from 'antd';
import { useTranslation } from 'react-i18next';

export default function TenantManagement() {
  const { t } = useTranslation('tenancy');

  return (
    <Card title={t('title')}>
      <p>{t('underDevelopment')}</p>
    </Card>
  );
}
