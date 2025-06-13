import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Select, DatePicker, message } from 'antd';
import axios from 'axios';
import './NewAssignmentModal.css';

const { Option } = Select;
const { TextArea } = Input;

const NewAssignmentModal = ({ visible, onCancel, onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [assets, setAssets] = useState([]);
  const [personnel, setPersonnel] = useState([]);
  const [selectedAsset, setSelectedAsset] = useState(null);

  useEffect(() => {
    if (visible) {
      fetchAssets();
      fetchPersonnel();
    }
  }, [visible]);

  const fetchAssets = async () => {
    try {
      const response = await axios.get('/api/assets?status=available');
      setAssets(response.data);
    } catch (error) {
      message.error('Failed to fetch assets');
    }
  };

  const fetchPersonnel = async () => {
    try {
      const response = await axios.get('/api/personnel');
      setPersonnel(response.data);
    } catch (error) {
      message.error('Failed to fetch personnel');
    }
  };

  const handleAssetChange = (value) => {
    const asset = assets.find(a => a.id === value);
    setSelectedAsset(asset);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const assignmentData = {
        ...values,
        assignment_date: values.assignment_date.format('YYYY-MM-DD'),
        status: 'pending'
      };

      await axios.post('/api/assignments', assignmentData);
      message.success('Assignment request created successfully');
      form.resetFields();
      onSuccess();
    } catch (error) {
      if (error.response) {
        message.error(error.response.data.error || 'Failed to create assignment');
      } else {
        message.error('Failed to create assignment');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Create New Assignment"
      open={visible}
      onCancel={onCancel}
      onOk={handleSubmit}
      confirmLoading={loading}
      width={600}
    >
      <Form
        form={form}
        layout="vertical"
        className="assignment-form"
      >
        <Form.Item
          name="asset_id"
          label="Select Asset"
          rules={[{ required: true, message: 'Please select an asset' }]}
        >
          <Select
            placeholder="Select an asset"
            onChange={handleAssetChange}
            showSearch
            optionFilterProp="children"
          >
            {assets.map(asset => (
              <Option key={asset.id} value={asset.id}>
                {asset.serial_number} - {asset.asset_type_name}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="personnel_id"
          label="Assign To"
          rules={[{ required: true, message: 'Please select personnel' }]}
        >
          <Select
            placeholder="Select personnel"
            showSearch
            optionFilterProp="children"
          >
            {personnel.map(person => (
              <Option key={person.id} value={person.id}>
                {person.rank} {person.name} - {person.unit}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="assignment_date"
          label="Assignment Date"
          rules={[{ required: true, message: 'Please select assignment date' }]}
        >
          <DatePicker
            style={{ width: '100%' }}
            disabledDate={current => current && current < new Date().setHours(0, 0, 0, 0)}
          />
        </Form.Item>

        <Form.Item
          name="purpose"
          label="Purpose of Assignment"
          rules={[{ required: true, message: 'Please provide purpose of assignment' }]}
        >
          <TextArea
            rows={4}
            placeholder="Enter the purpose of this assignment"
          />
        </Form.Item>

        <Form.Item
          name="expected_return_date"
          label="Expected Return Date"
          rules={[{ required: true, message: 'Please select expected return date' }]}
        >
          <DatePicker
            style={{ width: '100%' }}
            disabledDate={current => current && current < new Date().setHours(0, 0, 0, 0)}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default NewAssignmentModal; 