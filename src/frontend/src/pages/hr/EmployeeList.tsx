import StandardListPage from '@/components/common/StandardListPage';
import { useQuery } from '@tanstack/react-query';
import { Tag, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import axios from 'axios';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

interface Employee {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  department: string;
  position: string;
  status: string;
  hireDate: string;
}

const STATUS_COLORS: Record<string, string> = {
  active: 'success',
  inactive: 'default',
  on_leave: 'warning',
  terminated: 'error',
};

export default function EmployeeList() {
  const navigate = useNavigate();
  const { t } = useTranslation(['employees', 'commonUi']);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['employees', page, pageSize],
    queryFn: async () => {
      const res = await axios.get('/api/employees', { params: { page, limit: pageSize } });
      return res.data;
    },
  });

  const employees: Employee[] = data?.data ?? data ?? [];
  const total: number = data?.total ?? employees.length;

  const filtered = search
    ? employees.filter(
        (e) =>
          `${e.firstName} ${e.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
          e.email?.toLowerCase().includes(search.toLowerCase()) ||
          e.employeeCode?.toLowerCase().includes(search.toLowerCase()),
      )
    : employees;

  const handleDelete = async (record: Employee) => {
    try {
      await axios.delete(`/api/employees/${record.id}`);
      message.success(t('employees:messages.deleteSuccess'));
      refetch();
    } catch {
      message.error(t('employees:messages.deleteError'));
    }
  };

  const columns: ColumnsType<Employee> = [
    {
      title: t('employees:columns.code'),
      dataIndex: 'employeeCode',
      key: 'employeeCode',
      width: 130,
    },
    {
      title: t('employees:columns.name'),
      key: 'name',
      render: (_, r) => `${r.firstName} ${r.lastName}`,
    },
    { title: t('employees:columns.email'), dataIndex: 'email', key: 'email', ellipsis: true },
    { title: t('employees:columns.phone'), dataIndex: 'phone', key: 'phone', width: 130 },
    { title: t('employees:columns.department'), dataIndex: 'department', key: 'department' },
    { title: t('employees:columns.position'), dataIndex: 'position', key: 'position' },
    {
      title: t('employees:columns.status'),
      dataIndex: 'status',
      key: 'status',
      width: 130,
      render: (status: string) => (
        <Tag color={STATUS_COLORS[status] ?? 'default'}>
          {t(`employees:status.${status}`, { defaultValue: status })}
        </Tag>
      ),
    },
  ];

  return (
    <StandardListPage
      title={t('employees:title')}
      createButtonText={t('employees:createButton')}
      onCreateClick={() => navigate('/dashboard/hr/employees/new')}
      searchPlaceholder={t('employees:searchPlaceholder')}
      searchValue={search}
      onSearchChange={setSearch}
      columns={columns}
      dataSource={filtered}
      loading={isLoading}
      rowKey="id"
      onEdit={(r) => navigate(`/dashboard/hr/employees/${r.id}`)}
      onDelete={handleDelete}
      deleteConfirmTitle={t('employees:messages.deleteConfirm')}
      pagination={{
        current: page,
        pageSize,
        total,
        showTotal: (tot) => t('employees:messages.total', { total: tot }),
        onChange: (p, ps) => {
          setPage(p);
          setPageSize(ps);
        },
      }}
    />
  );
}
