import React from 'react';
import { Modal, Form, Input, Select, DatePicker, Button } from 'antd';
import './AddItemModal.css';

const { Option } = Select;

const AddItemModal = ({ 
  visible, 
  onCancel, 
  onSubmit, 
  title, 
  type,
  loading 
}) => {
  const [form] = Form.useForm();

  const handleSubmit = () => {
    form.validateFields().then((values) => {
      onSubmit(values);
      form.resetFields();
    });
  };

  const renderFormFields = () => {
    switch (type) {
      case 'asset':
        return (
          <>
            <Form.Item
              name="name"
              label="Asset Name"
              rules={[{ required: true, message: 'Please enter asset name' }]}
            >
              <Input placeholder="Enter asset name" />
            </Form.Item>
            <Form.Item
              name="type"
              label="Asset Type"
              rules={[{ required: true, message: 'Please select asset type' }]}
            >
              <Select placeholder="Select asset type">
                <Option value="equipment">Equipment</Option>
                <Option value="vehicle">Vehicle</Option>
                <Option value="electronics">Electronics</Option>
                <Option value="furniture">Furniture</Option>
              </Select>
            </Form.Item>
            <Form.Item
              name="serialNumber"
              label="Serial Number"
              rules={[{ required: true, message: 'Please enter serial number' }]}
            >
              <Input placeholder="Enter serial number" />
            </Form.Item>
            <Form.Item
              name="location"
              label="Location"
              rules={[{ required: true, message: 'Please enter location' }]}
            >
              <Input placeholder="Enter location" />
            </Form.Item>
          </>
        );

      case 'transfer':
        return (
          <>
            <Form.Item
              name="assetId"
              label="Asset"
              rules={[{ required: true, message: 'Please select an asset' }]}
            >
              <Select placeholder="Select asset">
                <Option value="ASS001">Laptop - Dell XPS 15</Option>
                <Option value="ASS002">Mobile Phone - iPhone 13</Option>
                <Option value="ASS003">Tablet - iPad Pro</Option>
              </Select>
            </Form.Item>
            <Form.Item
              name="fromLocation"
              label="From Location"
              rules={[{ required: true, message: 'Please enter source location' }]}
            >
              <Input placeholder="Enter source location" />
            </Form.Item>
            <Form.Item
              name="toLocation"
              label="To Location"
              rules={[{ required: true, message: 'Please enter destination location' }]}
            >
              <Input placeholder="Enter destination location" />
            </Form.Item>
            <Form.Item
              name="transferDate"
              label="Transfer Date"
              rules={[{ required: true, message: 'Please select transfer date' }]}
            >
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item
              name="reason"
              label="Reason"
              rules={[{ required: true, message: 'Please enter reason for transfer' }]}
            >
              <Input.TextArea placeholder="Enter reason for transfer" />
            </Form.Item>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <Modal
      title={title}
      open={visible}
      onCancel={onCancel}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          Cancel
        </Button>,
        <Button 
          key="submit" 
          type="primary" 
          loading={loading}
          onClick={handleSubmit}
        >
          Submit
        </Button>
      ]}
      width={600}
    >
      <Form
        form={form}
        layout="vertical"
        className="add-item-form"
      >
        {renderFormFields()}
      </Form>
    </Modal>
  );
};

export default AddItemModal; 