import React from 'react';
import { Card, Table, Button, Space, Tag, Tooltip, Input, Select } from 'antd';
import { 
  SearchOutlined,
  UserAddOutlined,
  CheckOutlined,
  CloseOutlined,
  EyeOutlined 
} from '@ant-design/icons';
import './index.css';

const { Option } = Select;

const Assignments = () => {
  const columns = [
    {
      title: 'Assignment ID',
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
      title: 'Assigned To',
      dataIndex: 'assignedTo',
      key: 'assignedTo',
    },
    {
      title: 'Department',
      dataIndex: 'department',
      key: 'department',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={
          status === 'Active' ? 'green' :
          status === 'Pending' ? 'orange' :
          status === 'Returned' ? 'blue' :
          'red'
        }>
          {status}
        </Tag>
      ),
    },
    {
      title: 'Assigned Date',
      dataIndex: 'assignedDate',
      key: 'assignedDate',
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
              <Tooltip title="Approve Assignment">
                <Button 
                  type="text" 
                  icon={<CheckOutlined />} 
                  onClick={() => handleApprove(record)}
                />
              </Tooltip>
              <Tooltip title="Reject Assignment">
                <Button 
                  type="text" 
                  danger 
                  icon={<CloseOutlined />} 
                  onClick={() => handleReject(record)}
                />
              </Tooltip>
            </>
          )}
          {record.status === 'Active' && (
            <Tooltip title="Return Asset">
              <Button 
                type="text" 
                icon={<CloseOutlined />} 
                onClick={() => handleReturn(record)}
              />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  const data = [
    {
      id: 'ASS001',
      asset: 'Laptop - Dell XPS 15',
      assignedTo: 'John Smith',
      department: 'IT',
      status: 'Active',
      assignedDate: '2024-03-10',
    },
    {
      id: 'ASS002',
      asset: 'Mobile Phone - iPhone 13',
      assignedTo: 'Sarah Johnson',
      department: 'Sales',
      status: 'Pending',
      assignedDate: '2024-03-15',
    },
    {
      id: 'ASS003',
      asset: 'Tablet - iPad Pro',
      assignedTo: 'Mike Brown',
      department: 'Marketing',
      status: 'Returned',
      assignedDate: '2024-03-01',
    },
  ];

  const handleView = (record) => {
    console.log('View assignment:', record);
  };

  const handleApprove = (record) => {
    console.log('Approve assignment:', record);
  };

  const handleReject = (record) => {
    console.log('Reject assignment:', record);
  };

  const handleReturn = (record) => {
    console.log('Return asset:', record);
  };

  return (
    <div className="assignments-container">
      <Card 
        title="Asset Assignments" 
        extra={
          <Button 
            type="primary" 
            icon={<UserAddOutlined />}
          >
            New Assignment
          </Button>
        }
      >
        <div className="assignments-filters">
          <Space size="middle">
            <Input
              placeholder="Search assignments..."
              prefix={<SearchOutlined />}
              className="search-input"
            />
            <Select 
              defaultValue="all" 
              style={{ width: 120 }}
              className="status-filter"
            >
              <Option value="all">All Status</Option>
              <Option value="active">Active</Option>
              <Option value="pending">Pending</Option>
              <Option value="returned">Returned</Option>
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

export default Assignments; 