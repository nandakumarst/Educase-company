import React, { useState } from 'react';
import { Layout, Menu, Button } from 'antd';
import { Link, useLocation } from 'react-router-dom';
import {
  DashboardOutlined,
  SwapOutlined,
  ShoppingCartOutlined,
  TeamOutlined,
  ToolOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined
} from '@ant-design/icons';

const { Sider } = Layout;

const Sidebar = () => {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const menuItems = [
    {
      key: '/',
      icon: <DashboardOutlined />,
      label: <Link to="/">Dashboard</Link>,
    },
    {
      key: '/transfers',
      icon: <SwapOutlined />,
      label: <Link to="/transfers">Transfers</Link>,
    },
    {
      key: '/purchases',
      icon: <ShoppingCartOutlined />,
      label: <Link to="/purchases">Purchases</Link>,
    },
    {
      key: '/assignments',
      icon: <TeamOutlined />,
      label: <Link to="/assignments">Assignments</Link>,
    },
    {
      key: '/assets',
      icon: <ToolOutlined />,
      label: <Link to="/assets">Assets</Link>,
    },
  ];

  return (
    <Sider
      width={250}
      collapsed={collapsed}
      className="site-sider"
      style={{
        background: '#fff',
        boxShadow: '2px 0 8px rgba(0, 0, 0, 0.1)',
      }}
    >
      <div className="sider-header">
        <h2 style={{ 
          margin: 0, 
          color: '#1890ff',
          fontSize: collapsed ? '16px' : '20px',
          transition: 'all 0.2s'
        }}>
          {collapsed ? 'MAMS' : 'Military Assets'}
        </h2>
        <Button
          type="text"
          icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          onClick={() => setCollapsed(!collapsed)}
          style={{
            fontSize: '16px',
            width: 32,
            height: 32,
            position: 'absolute',
            right: 16,
            top: 16,
          }}
        />
      </div>
      <Menu
        mode="inline"
        selectedKeys={[location.pathname]}
        items={menuItems}
        style={{ 
          borderRight: 0,
          padding: '8px 0'
        }}
      />
    </Sider>
  );
};

export default Sidebar; 