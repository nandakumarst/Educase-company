import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, message, DatePicker, Select, Spin, Tag, List, Button } from 'antd';
import {
  ShoppingCartOutlined,
  SwapOutlined,
  UserOutlined,
  InboxOutlined,
  DollarOutlined,
  BarChartOutlined,
  PlusOutlined
} from '@ant-design/icons';
import AddItemModal from '../common/AddItemModal';
import axios from 'axios';
import NewTransferModal from '../transfers/NewTransferModal';
import NewAssignmentModal from '../assignments/NewAssignmentModal';
import './index.css';

const { RangePicker } = DatePicker;
const { Option } = Select;

const Dashboard = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState('');
  const [loading, setLoading] = useState(false);
  const [metrics, setMetrics] = useState({
    total_assets: 0,
    pending_transfers: 0,
    active_assignments: 0,
    asset_distribution: []
  });
  const [activities, setActivities] = useState([]);
  const [dateRange, setDateRange] = useState(null);
  const [selectedBase, setSelectedBase] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [bases, setBases] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [transferModalVisible, setTransferModalVisible] = useState(false);
  const [assignmentModalVisible, setAssignmentModalVisible] = useState(false);

  useEffect(() => {
    fetchBases();
    fetchDashboardData();
  }, [dateRange, selectedBase, selectedStatus]);

  const fetchBases = async () => {
    try {
      const response = await axios.get('/api/bases');
      setBases(response.data);
    } catch (error) {
      message.error('Failed to fetch bases');
    }
  };

  const fetchDashboardData = async () => {
    setLoadingData(true);
    try {
      const params = {};
      if (dateRange) {
        params.start_date = dateRange[0].format('YYYY-MM-DD');
        params.end_date = dateRange[1].format('YYYY-MM-DD');
      }
      if (selectedBase) {
        params.base_id = selectedBase;
      }
      if (selectedStatus) {
        params.status = selectedStatus;
      }

      const [metricsResponse, activitiesResponse] = await Promise.all([
        axios.get('/api/dashboard/metrics', { params }),
        axios.get('/api/dashboard/activities', { params: { limit: 10, status: selectedStatus } })
      ]);

      setMetrics(metricsResponse.data);
      setActivities(activitiesResponse.data);
    } catch (error) {
      message.error('Failed to fetch dashboard data');
    } finally {
      setLoadingData(false);
    }
  };

  const handleAddItem = (type) => {
    setModalType(type);
    setModalVisible(true);
  };

  const handleModalCancel = () => {
    setModalVisible(false);
    setModalType('');
  };

  const handleModalSubmit = async (values) => {
    setLoading(true);
    try {
      // Here you would typically make an API call to save the data
      console.log('Submitting values:', values);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      message.success(`${modalType === 'asset' ? 'Asset' : 'Transfer'} added successfully!`);
      setModalVisible(false);
      setModalType('');
      fetchDashboardData(); // Refresh dashboard data
    } catch (error) {
      message.error('Failed to add item. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDateRangeChange = (dates) => {
    setDateRange(dates);
  };

  const handleBaseChange = (value) => {
    setSelectedBase(value);
  };

  const handleStatusChange = (value) => {
    setSelectedStatus(value);
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'warning',
      approved: 'success',
      completed: 'processing',
      cancelled: 'error'
    };
    return colors[status] || 'default';
  };

  const handleTransferSuccess = () => {
    setTransferModalVisible(false);
    fetchDashboardData();
    message.success('Transfer request created successfully');
  };

  const handleAssignmentSuccess = () => {
    setAssignmentModalVisible(false);
    fetchDashboardData();
    message.success('Assignment request created successfully');
  };

  if (loadingData) {
    return (
      <div className="dashboard-loading">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <div className="dashboard-actions">
          <Select
            placeholder="Filter by status"
            allowClear
            style={{ width: 200, marginRight: 16 }}
            onChange={setSelectedStatus}
          >
            <Option value="pending">Pending</Option>
            <Option value="approved">Approved</Option>
            <Option value="completed">Completed</Option>
            <Option value="cancelled">Cancelled</Option>
          </Select>
          <Button
            type="primary"
            icon={<SwapOutlined />}
            onClick={() => setTransferModalVisible(true)}
            style={{ marginRight: 8 }}
          >
            New Transfer
          </Button>
          <Button
            type="primary"
            icon={<UserOutlined />}
            onClick={() => setAssignmentModalVisible(true)}
          >
            New Assignment
          </Button>
        </div>
      </div>

      <div className="dashboard-filters">
        <RangePicker onChange={handleDateRangeChange} />
        <Select
          placeholder="Select Base"
          onChange={handleBaseChange}
          style={{ width: 200, marginLeft: 16 }}
          allowClear
        >
          {bases.map(base => (
            <Option key={base.id} value={base.id}>{base.name}</Option>
          ))}
        </Select>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card">
            <Statistic
              title="Total Assets"
              value={metrics.total_assets}
              prefix={<BarChartOutlined />}
              loading={loading}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card">
            <Statistic
              title="Pending Transfers"
              value={metrics.pending_transfers}
              prefix={<SwapOutlined />}
              loading={loading}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card">
            <Statistic
              title="Active Assignments"
              value={metrics.active_assignments}
              prefix={<UserOutlined />}
              loading={loading}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card">
            <Statistic
              title="Total Expenditure"
              value={metrics.total_expenditure}
              prefix={<DollarOutlined />}
              precision={2}
              loading={loading}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: '24px' }}>
        <Col xs={24} lg={12}>
          <Card title="Recent Activities" className="activity-card">
            <List
              className="activity-list"
              dataSource={activities}
              renderItem={item => (
                <List.Item className="activity-item">
                  <div className="activity-content">
                    <div className="activity-title">{item.title}</div>
                    <div className="activity-description">{item.description}</div>
                    <div className="activity-meta">
                      <span className="activity-time">{item.time}</span>
                      <Tag color={getStatusColor(item.status)}>{item.status}</Tag>
                    </div>
                  </div>
                </List.Item>
              )}
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Asset Distribution" className="activity-card">
            <List
              className="activity-list"
              dataSource={metrics.asset_distribution}
              renderItem={item => (
                <List.Item className="activity-item">
                  <div className="activity-content">
                    <div className="activity-title">{item.type}</div>
                    <div className="activity-description">
                      Count: {item.count}
                    </div>
                  </div>
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>

      <AddItemModal
        visible={modalVisible}
        onCancel={handleModalCancel}
        onSubmit={handleModalSubmit}
        title={modalType === 'asset' ? 'Add New Asset' : 'Initiate Transfer'}
        type={modalType}
        loading={loading}
      />

      <NewTransferModal
        visible={transferModalVisible}
        onCancel={() => setTransferModalVisible(false)}
        onSuccess={handleTransferSuccess}
      />

      <NewAssignmentModal
        visible={assignmentModalVisible}
        onCancel={() => setAssignmentModalVisible(false)}
        onSuccess={handleAssignmentSuccess}
      />
    </div>
  );
};

export default Dashboard; 