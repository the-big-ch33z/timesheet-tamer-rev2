
import React from 'react';
import { Card } from '@/components/ui/card';

const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="container py-6">
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
      <div className="space-y-6">
        {children}
      </div>
    </div>
  );
};

export default AdminLayout;
