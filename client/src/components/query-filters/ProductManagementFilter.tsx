import {Col, Flex, Row, Slider} from 'antd';
import React from 'react';
import {useGetAllCategoriesQuery} from '../../redux/features/management/categoryApi';
import {useGetAllBrandsQuery} from '../../redux/features/management/brandApi';

interface ProductManagementFilterProps {
  query: { name: string; category: string; brand: string; limit: number; minPrice?: number; maxPrice?: number };
  setQuery: React.Dispatch<
    React.SetStateAction<{ name: string; category: string; brand: string; limit: number; minPrice?: number; maxPrice?: number }>
  >;
}

const ProductManagementFilter = ({query, setQuery}: ProductManagementFilterProps) => {
  const {data: categories} = useGetAllCategoriesQuery(undefined);
  const {data: brands} = useGetAllBrandsQuery(undefined);

  const categoryItems = Array.isArray((categories as any)) ? (categories as any) : (categories?.data ?? []);
  const brandItems = Array.isArray((brands as any)) ? (brands as any) : (brands?.data ?? []);

  return (
    <Flex
      style={{
        border: '1px solid grey',
        padding: '1rem',
        marginBottom: '.5rem',
        borderRadius: '1rem',
        boxShadow: '0px 0px 10px rgba(0, 0, 0, 0.4) inset',
      }}
    >
      <Row gutter={2} style={{width: '100%'}}>
        <Col xs={{span: 24}} md={{span: 8}}>
          <label style={{fontWeight: 700}}>Price Range</label>
          <Slider
            range
            step={100}
            min={0}
            max={2000}
            value={[query.minPrice ?? 100, query.maxPrice ?? 1000]}
            onChange={(value: number[]) => {
              setQuery((prev) => ({
                ...prev,
                minPrice: value[0],
                maxPrice: value[1],
              }));
            }}
          />
        </Col>
        <Col xs={{span: 24}} md={{span: 8}}>
          <label style={{fontWeight: 700}}>Search by product name</label>
          <input
            type='text'
            value={query.name}
            className={`input-field`}
            placeholder='Search by Product Name'
            onChange={(e) => setQuery((prev) => ({...prev, name: e.target.value}))}
          />
        </Col>
        <Col xs={{span: 24}} md={{span: 4}}>
          <label style={{fontWeight: 700}}>Filter by Category</label>
          <select
            name='category'
            className={`input-field`}
            defaultValue={query.category}
            onChange={(e) => setQuery((prev) => ({...prev, category: e.target.value}))}
            onBlur={(e) => setQuery((prev) => ({...prev, category: e.target.value}))}
          >
            <option value=''>Filter by Category</option>
            {categoryItems.map((category: any) => (
              <option value={category._id ?? category.id} key={category._id ?? category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </Col>
        <Col xs={{span: 24}} md={{span: 4}}>
          <label style={{fontWeight: 700}}>Filter by Brand</label>
          <select
            name='Brand'
            className={`input-field`}
            defaultValue={query.brand}
            onChange={(e) => setQuery((prev) => ({...prev, brand: e.target.value}))}
            onBlur={(e) => setQuery((prev) => ({...prev, brand: e.target.value}))}
          >
            <option value=''>Filter by Brand</option>
            {brandItems.map((brand: any) => (
              <option value={brand._id ?? brand.id} key={brand._id ?? brand.id}>
                {brand.name}
              </option>
            ))}
          </select>
        </Col>
      </Row>
    </Flex>
  );
};

export default ProductManagementFilter;
