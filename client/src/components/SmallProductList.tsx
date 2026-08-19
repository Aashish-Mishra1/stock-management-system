import React from 'react';
import { Table } from 'antd';
import { useGetAllProductsQuery } from '../redux/features/management/productApi';

const SmallProductList: React.FC = () => {
  const { data, isLoading } = useGetAllProductsQuery({ page: 1, limit: 5 }, {
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true,
    refetchOnReconnect: true,
  });

  const resp: any = data ?? {};
  let items: any[] = [];

  if (Array.isArray(resp)) items = resp;
  else if (Array.isArray(resp.data)) items = resp.data;
  else if (Array.isArray(resp.products)) items = resp.products;
  else if (resp.data && Array.isArray(resp.data.products)) items = resp.data.products;
  else items = [];

  const tableData = items.map((p: any) => ({
    key: p._id ?? p.id,
    name: p.name,
    price: Number(p.price ?? p.base_price ?? p.basePrice ?? 0),
    stock: Number(p.stock ?? p.quantity_in_stock ?? p.quantityInStock ?? 0),
  }));

  const columns = [
    { title: 'Product', dataIndex: 'name', key: 'name' },
    { title: 'Price', dataIndex: 'price', key: 'price', align: 'right' as const },
    { title: 'Stock', dataIndex: 'stock', key: 'stock', align: 'right' as const },
  ];

  return <Table size='small' columns={columns} dataSource={tableData} loading={isLoading} pagination={false} />;
};

export default SmallProductList;
