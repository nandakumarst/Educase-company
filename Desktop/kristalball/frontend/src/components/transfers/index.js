import React from 'react';
import { Card, Table, Button, Space, Tag, Tooltip, Select } from 'antd';
import { 
  CheckOutlined, 
  CloseOutlined, 
  EyeOutlined,
  SwapOutlined 
} from '@ant-design/icons';
import './index.css';

const { Option } = Select;

const Transfers = () => {
  const columns = [
    {
      title: 'Transfer ID',
      dataIndex: 'id',
      key: 'id',
      sorter: (a, b) => a.id.localeCompare(b.id),
    },
    {
      title: 'Asset',
      dataIndex: 'asset',
      key: 'asset',
    },
    {
      title: 'From',
      dataIndex: 'from',
      key: 'from',
    },
    {
      title: 'To',
      dataIndex: 'to',
      key: 'to',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={
          status === 'Completed' ? 'green' :
          status === 'In Progress' ? 'blue' :
          status === 'Pending' ? 'orange' :
          'red'
        }>
          {status}
        </Tag>
      ),
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="middle">
          <Tooltip title="View Details">
            <Button 
              type="text" 
              icon={<EyeOutlined />} 
              onClick={() => handleView(record)}
            />
          </Tooltip>
          {record.status === 'Pending' && (
            <>
              <Tooltip title="Approve Transfer">
                <Button 
                  type="text" 
                  icon={<CheckOutlined />} 
                  onClick={() => handleApprove(record)}
                />
              </Tooltip>
              <Tooltip title="Reject Transfer">
                <Button 
                  type="text" 
                  danger 
                  icon={<CloseOutlined />} 
                  onClick={() => handleReject(record)}
                />
              </Tooltip>
            </>
          )}
        </Space>
      ),
    },
  ];

  const data = [
    {
      id: 'TRF001',
      asset: 'Tank M1A2',
      from: 'Base Alpha',
      to: 'Base Beta',
      status: 'Completed',
      date: '2024-03-15',
    },
    {
      id: 'TRF002',
      asset: 'Helicopter AH-64',
      from: 'Hangar 3',
      to: 'Hangar 5',
      status: 'In Progress',
      date: '2024-03-16',
    },
    {
      id: 'TRF003',
      asset: 'Armored Vehicle',
      from: 'Base Gamma',
      to: 'Base Delta',
      status: 'Pending',
      date: '2024-03-17',
    },
  ];

  const handleView = (record) => {
    console.log('View transfer:', record);
  };

  const handleApprove = (record) => {
    console.log('Approve transfer:', record);
  };

  const handleReject = (record) => {
    console.log('Reject transfer:', record);
  };

  return (
    <div className="transfers-container">
      <Card 
        title="Asset Transfers" 
        extra={
          <Space>
            <Select 
              defaultValue="all" 
              style={{ width: 120 }}
              className="status-filter"
            >
              <Option value="all">All Status</Option>
              <Option value="pending">Pending</Option>
              <Option value="in-progress">In Progress</Option>
              <Option value="completed">Completed</Option>
            </Select>
            <Button 
              type="primary" 
              icon={<SwapOutlined />}
            >
              New Transfer
            </Button>
          </Space>
        }
      >
        <Table 
          columns={columns} 
          dataSource={data}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} items`,
          }}
        />
      </Card>
    </div>
  );
};

export default Transfers; 