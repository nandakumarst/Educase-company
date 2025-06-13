import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Select, DatePicker, message } from 'antd';
import axios from 'axios';
import './NewTransferModal.css';

const { Option } = Select;
const { TextArea } = Input;

const NewTransferModal = ({ visible, onCancel, onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [assets, setAssets] = useState([]);
  const [bases, setBases] = useState([]);
  const [selectedAsset, setSelectedAsset] = useState(null);

  useEffect(() => {
    if (visible) {
      fetchAssets();
      fetchBases();
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

  const fetchBases = async () => {
    try {
      const response = await axios.get('/api/bases');
      setBases(response.data);
    } catch (error) {
      message.error('Failed to fetch bases');
    }
  };

  const handleAssetChange = (value) => {
    const asset = assets.find(a => a.id === value);
    setSelectedAsset(asset);
    form.setFieldsValue({
      from_base_id: asset?.base_id
    });
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const transferData = {
        ...values,
        transfer_date: values.transfer_date.format('YYYY-MM-DD'),
        status: 'pending'
      };

      await axios.post('/api/transfers', transferData);
      message.success('Transfer request created successfully');
      form.resetFields();
      onSuccess();
    } catch (error) {
      if (error.response) {
        message.error(error.response.data.error || 'Failed to create transfer');
      } else {
        message.error('Failed to create transfer');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Initiate New Transfer"
      open={visible}
      onCancel={onCancel}
      onOk={handleSubmit}
      confirmLoading={loading}
      width={600}
    >
      <Form
        form={form}
        layout="vertical"
        className="transfer-form"
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
          name="from_base_id"
          label="From Base"
          rules={[{ required: true, message: 'Please select source base' }]}
        >
          <Select
            placeholder="Select source base"
            disabled={true}
          >
            {bases.map(base => (
              <Option key={base.id} value={base.id}>{base.name}</Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="to_base_id"
          label="To Base"
          rules={[{ required: true, message: 'Please select destination base' }]}
        >
          <Select
            placeholder="Select destination base"
            disabled={selectedAsset ? false : true}
          >
            {bases
              .filter(base => base.id !== selectedAsset?.base_id)
              .map(base => (
                <Option key={base.id} value={base.id}>{base.name}</Option>
              ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="transfer_date"
          label="Transfer Date"
          rules={[{ required: true, message: 'Please select transfer date' }]}
        >
          <DatePicker
            style={{ width: '100%' }}
            disabledDate={current => current && current < new Date().setHours(0, 0, 0, 0)}
          />
        </Form.Item>

        <Form.Item
          name="reason"
          label="Reason for Transfer"
          rules={[{ required: true, message: 'Please provide a reason for transfer' }]}
        >
          <TextArea
            rows={4}
            placeholder="Enter the reason for this transfer"
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default NewTransferModal; 