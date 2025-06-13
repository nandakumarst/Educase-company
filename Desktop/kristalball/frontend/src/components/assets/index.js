import React from 'react';
import { Card, Table, Button, Space, Tag, Tooltip } from 'antd';
import { EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import './index.css';

const Assets = () => {
  const columns = [
    {
      title: 'Asset ID',
      dataIndex: 'id',
      key: 'id',
      sorter: (a, b) => a.id.localeCompare(b.id),
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type) => (
        <Tag color={type === 'Equipment' ? 'blue' : 'green'}>
          {type}
        </Tag>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={
          status === 'Active' ? 'green' :
          status === 'Maintenance' ? 'orange' :
          status === 'Retired' ? 'red' : 'default'
        }>
          {status}
        </Tag>
      ),
    },
    {
      title: 'Location',
      dataIndex: 'location',
      key: 'location',
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
          <Tooltip title="Edit Asset">
            <Button 
              type="text" 
              icon={<EditOutlined />} 
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Tooltip title="Delete Asset">
            <Button 
              type="text" 
              danger 
              icon={<DeleteOutlined />} 
              onClick={() => handleDelete(record)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  const data = [
    {
      id: 'AST001',
      name: 'Tank M1A2',
      type: 'Equipment',
      status: 'Active',
      location: 'Base Alpha',
    },
    {
      id: 'AST002',
      name: 'Helicopter AH-64',
      type: 'Aircraft',
      status: 'Maintenance',
      location: 'Hangar 3',
    },
    // Add more sample data as needed
  ];

  const handleView = (record) => {
    console.log('View asset:', record);
  };

  const handleEdit = (record) => {
    console.log('Edit asset:', record);
  };

  const handleDelete = (record) => {
    console.log('Delete asset:', record);
  };

  return (
    <div className="assets-container">
      <Card 
        title="Military Assets" 
        extra={
          <Button type="primary">
            Add New Asset
          </Button>
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

export default Assets; 