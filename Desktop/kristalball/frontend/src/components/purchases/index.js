import React from 'react';
import { Card, Table, Button, Space, Tag, Tooltip, Input, Select } from 'antd';
import { 
  SearchOutlined,
  ShoppingCartOutlined,
  CheckOutlined,
  CloseOutlined,
  EyeOutlined 
} from '@ant-design/icons';
import './index.css';

const { Option } = Select;

const Purchases = () => {
  const columns = [
    {
      title: 'Purchase ID',
      dataIndex: 'id',
      key: 'id',
      sorter: (a, b) => a.id.localeCompare(b.id),
    },
    {
      title: 'Item',
      dataIndex: 'item',
      key: 'item',
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
    },
    {
      title: 'Vendor',
      dataIndex: 'vendor',
      key: 'vendor',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={
          status === 'Approved' ? 'green' :
          status === 'Pending' ? 'orange' :
          status === 'Rejected' ? 'red' :
          'blue'
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
              <Tooltip title="Approve Purchase">
                <Button 
                  type="text" 
                  icon={<CheckOutlined />} 
                  onClick={() => handleApprove(record)}
                />
              </Tooltip>
              <Tooltip title="Reject Purchase">
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
      id: 'PUR001',
      item: 'Spare Parts Kit',
      quantity: 5,
      vendor: 'Military Supplies Inc.',
      status: 'Approved',
      date: '2024-03-15',
    },
    {
      id: 'PUR002',
      item: 'Communication Equipment',
      quantity: 10,
      vendor: 'Tech Solutions Ltd.',
      status: 'Pending',
      date: '2024-03-16',
    },
    {
      id: 'PUR003',
      item: 'Maintenance Tools',
      quantity: 15,
      vendor: 'Engineering Supplies Co.',
      status: 'Rejected',
      date: '2024-03-17',
    },
  ];

  const handleView = (record) => {
    console.log('View purchase:', record);
  };

  const handleApprove = (record) => {
    console.log('Approve purchase:', record);
  };

  const handleReject = (record) => {
    console.log('Reject purchase:', record);
  };

  return (
    <div className="purchases-container">
      <Card 
        title="Purchase Orders" 
        extra={
          <Button 
            type="primary" 
            icon={<ShoppingCartOutlined />}
          >
            New Purchase
          </Button>
        }
      >
        <div className="purchases-filters">
          <Space size="middle">
            <Input
              placeholder="Search purchases..."
              prefix={<SearchOutlined />}
              className="search-input"
            />
            <Select 
              defaultValue="all" 
              style={{ width: 120 }}
              className="status-filter"
            >
              <Option value="all">All Status</Option>
              <Option value="pending">Pending</Option>
              <Option value="approved">Approved</Option>
              <Option value="rejected">Rejected</Option>
            </Select>
          </Space>
        </div>
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

export default Purchases; 