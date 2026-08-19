import { DeleteFilled, EditFilled } from '@ant-design/icons';
import type { PaginationProps, TableColumnsType } from 'antd';
import { Button, Col, Flex, Modal, Pagination, Row, Table, Tag } from 'antd';
import { useState, useEffect } from 'react';
import { FieldValues, useForm } from 'react-hook-form';
import {
  useDeleteProductMutation,
  useGetAllProductsQuery,
  useUpdateProductMutation,
} from '../../redux/features/management/productApi';
import { useCreatePurchaseMutation } from '../../redux/features/management/purchaseApi';
import { ICategory, IProduct } from '../../types/product.types';
import ProductManagementFilter from '../../components/query-filters/ProductManagementFilter';
import CustomInput from '../../components/CustomInput';
import toastMessage from '../../lib/toastMessage';
import { useGetAllCategoriesQuery } from '../../redux/features/management/categoryApi';
import { useGetAllSellerQuery } from '../../redux/features/management/sellerApi';
import { useGetAllBrandsQuery } from '../../redux/features/management/brandApi';
import { useCreateSaleMutation } from '../../redux/features/management/saleApi';
import { useGetProductVariantsQuery } from '../../redux/features/management/productApi';
import { SpinnerIcon } from '@phosphor-icons/react';

const ProductManagePage = () => {
  const [current, setCurrent] = useState(1);
  const [query, setQuery] = useState({
    name: '',
    category: '',
    brand: '',
    limit: 10,
    minPrice: 100,
    maxPrice: 1000,
  });

  const apiQuery = {
    page: current,
    limit: query.limit,
    search: query.name ?? undefined,
    categoryId: query.category ?? undefined,
    brandId: query.brand ?? undefined,
    minPrice: (query as any).minPrice ?? undefined,
    maxPrice: (query as any).maxPrice ?? undefined,
  };

  const { data: products, isFetching } = useGetAllProductsQuery(apiQuery);

  const onChange: PaginationProps['onChange'] = (page) => {
    setCurrent(page);
  };

  const prodItems = Array.isArray((products as any)) ? (products as any) : (products?.data ?? []);

  const tableData = prodItems.map((product: IProduct) => ({
    key: (product as any)._id ?? (product as any).id,
    name: product.name,
    category: product.category,
    categoryName: product.category?.name ?? product.category_name ?? '',
    price: (product as any).price ?? (product as any).base_price ?? 0,
    stock: (product as any).stock ?? (product as any).quantity_in_stock ?? 0,
    seller: product?.seller,
    sellerName: product?.seller?.name || 'DELETED SELLER',
    brand: product.brand,
    brandName: product.brand_name ?? product.brand?.name ?? '',
    size: product.size,
    description: product.description,
  }));

  const columns: TableColumnsType<any> = [
    {
      title: 'Product Name',
      key: 'name',
      dataIndex: 'name',
    },
    {
      title: 'Category',
      key: 'categoryName',
      dataIndex: 'categoryName',
      align: 'center',
    },
    {
      title: 'Brand',
      key: 'brandName',
      dataIndex: 'brandName',
      align: 'center',
    },
    {
      title: 'price',
      key: 'price',
      dataIndex: 'price',
      align: 'center',
    },
    {
      title: 'stock',
      key: 'stock',
      dataIndex: 'stock',
      align: 'center',
    },
    {
      title: 'Purchase From',
      key: 'sellerName',
      dataIndex: 'sellerName',
      align: 'center',
      render: (sellerName: string) => {
        if (sellerName === 'DELETED SELLER') return <Tag color='red'>{sellerName}</Tag>;
        return <Tag color='green'>{sellerName}</Tag>;
      },
    },
    {
      title: 'Action',
      key: 'x',
      align: 'center',
      render: (item) => {
        return (
          <div style={{ display: 'flex' }}>
            <SellProductModal product={item} />
            <AddStockModal product={item} />
            <UpdateProductModal product={item} />
            <DeleteProductModal id={item.key} />
          </div>
        );
      },
      width: '1%',
    },
  ];

  const clearFilters = () => {
    setQuery({ name: '', category: '', brand: '', limit: 10, minPrice: 100, maxPrice: 1000 });
    setCurrent(1);
  };

  return (
    <>
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <div style={{ flex: 1 }}>
          <ProductManagementFilter query={query} setQuery={setQuery} />
        </div>
        <div>
          <Button onClick={clearFilters} style={{ height: '40px' }}>
            Clear Filters
          </Button>
        </div>
      </div>
      <Table
        size='small'
        loading={isFetching}
        columns={columns}
        dataSource={tableData}
        pagination={false}
      />
      <Flex justify='center' style={{ marginTop: '1rem' }}>
        <Pagination
          current={current}
          onChange={onChange}
          defaultPageSize={query.limit}
          total={products?.meta?.total}
        />
      </Flex>
    </>
  );
};

/**
 * Sell Product Modal
 */
const SellProductModal = ({ product }: { product: IProduct & { key: string } }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null);
  const { data: variantsResp } = useGetProductVariantsQuery(product.key);

  // when variants load, default to first
  useEffect(() => {
    if (variantsResp?.data && variantsResp.data.length > 0) {
      const first = variantsResp.data[0];
      setSelectedVariantId(first.id ?? first.ID ?? first._id ?? null);
    }
  }, [variantsResp]);
  const {
    handleSubmit,
    register,
    reset,
    formState: { errors },
  } = useForm();
  const [saleProduct, { isLoading }] = useCreateSaleMutation();

  const onSubmit = async (data: FieldValues) => {
    const variantIdToUse = selectedVariantId ?? Number(product.key);
    const selectedVariant = variantsResp?.data?.find((v: any) => Number(v.id ?? v._id) === Number(variantIdToUse));
    const unitPriceToUse = selectedVariant ? Number(selectedVariant.price ?? selectedVariant.unit_price ?? product.price ?? product.base_price ?? 0) : Number(product.price ?? product.base_price ?? 0);
    const payload = {
      customerName: data.buyerName,
      items: [
        {
          productVariantId: Number(variantIdToUse),
          quantity: Number(data.quantity),
          unitPrice: unitPriceToUse,
        },
      ],
      paymentMethod: data.paymentMethod ?? 'cash',
      date: data.date,
    };
    try {
      const res = await saleProduct(payload).unwrap();
      if (res.success) {
        toastMessage({ icon: 'success', text: res.message });
        reset();
        handleCancel();
      }
    } catch (error: any) {
      handleCancel();
      toastMessage({ icon: 'error', text: error.data.message });
    }
  };

  const showModal = () => {
    setIsModalOpen(true);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
  };

  return (
    <>
      <Button
        onClick={showModal}
        type='primary'
        className='table-btn'
        style={{ backgroundColor: 'royalblue' }}
      >
        Sell
      </Button>
      <Modal title='Sell Product' open={isModalOpen} onCancel={handleCancel} footer={null}>
        <form onSubmit={handleSubmit(onSubmit)} style={{ marginTop: '1rem' }}>
          <CustomInput
            name='buyerName'
            label='Buyer Name'
            errors={errors}
            required={true}
            register={register}
            type='text'
          />
          {variantsResp?.data && variantsResp.data.length > 0 ? (
            <div style={{ margin: '0 1rem 1rem 0' }}>
              <label className='label'>Variant</label>
              <select
                className='input-field'
                value={selectedVariantId ?? ''}
                onChange={(e) => setSelectedVariantId(Number(e.target.value))}
              >
                {variantsResp.data.map((v: any) => (
                  <option key={v.id ?? v._id} value={v.id ?? v._id}>
                    {v.variant_name ?? v.variantName ?? v.variantName}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
          <CustomInput
            name='date'
            label='Selling date'
            errors={errors}
            required={true}
            register={register}
            type='date'
          />
          <CustomInput
            name='quantity'
            label='Quantity'
            errors={errors}
            required={true}
            register={register}
            type='number'
          />
          <Flex justify='center' style={{ marginTop: '1rem' }}>
            <Button htmlType='submit' type='primary' disabled={isLoading}>
              {isLoading && <SpinnerIcon className='spin' weight='bold' />}
              Sell Product
            </Button>
          </Flex>
        </form>
      </Modal>
    </>
  );
};

/**
 * Add Stock Modal
 */
const AddStockModal = ({ product }: { product: IProduct & { key: string } }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { handleSubmit, register, reset } = useForm();
  const [createPurchase, { isLoading }] = useCreatePurchaseMutation();

  const onSubmit = async (data: FieldValues) => {
    const sellerIdRaw = product.seller?._id ?? product.seller ?? product.seller?.id ?? undefined;
    const payload = {
      sellerId: sellerIdRaw ? Number(sellerIdRaw) : undefined,
      status: 'completed',
      items: [
        {
          productVariantId: Number(product.key),
          quantity: Number(data.stock),
          unitCost: Number(product.price || 0),
        },
      ],
    };

    try {
      const res = await createPurchase(payload).unwrap();
      if (res.success) {
        toastMessage({ icon: 'success', text: res.message });
        reset();
        handleCancel();
      }
    } catch (error: any) {
      handleCancel();
      toastMessage({ icon: 'error', text: error.data?.message || error.message });
    }
  };

  const showModal = () => {
    setIsModalOpen(true);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
  };

  return (
    <>
      <Button
        onClick={showModal}
        type='primary'
        className='table-btn'
        style={{ backgroundColor: 'blue' }}
      >
        Add Stock
      </Button>
      <Modal title='Add Product to Stock' open={isModalOpen} onCancel={handleCancel} footer={null}>
        <form onSubmit={handleSubmit(onSubmit)} style={{ margin: '2rem' }}>
          <CustomInput name='stock' label='Add Stock' register={register} type='number' />
          <Flex justify='center' style={{ marginTop: '1rem' }}>
            <Button htmlType='submit' type='primary' disabled={isLoading}>
              {isLoading && <SpinnerIcon className='spin' weight='bold' />}
              Submit
            </Button>
          </Flex>
        </form>
      </Modal>
    </>
  );
};

/**
 * Update Product Modal
 */
const UpdateProductModal = ({ product }: { product: IProduct & { key: string } }) => {
  const [updateProduct] = useUpdateProductMutation();
  const { data: categories } = useGetAllCategoriesQuery(undefined);
  const { data: sellers, isLoading: isSellerLoading } = useGetAllSellerQuery(undefined);
  const { data: brands } = useGetAllBrandsQuery(undefined);

  const sellerDefault = product?.seller?._id ?? product?.seller ?? product?.seller?.id ?? '';
  const categoryDefault =
    product?.category?._id ?? product?.category ?? product?.category?.id ?? product?.category_id ?? '';
  const brandDefault = product?.brand?._id ?? product?.brand ?? product?.brand?.id ?? '';

  const {
    handleSubmit,
    register,
    formState: { errors },
    reset,
  } = useForm({
    defaultValues: {
      name: product.name,
      price: product.price,
      seller: sellerDefault,
      category: categoryDefault,
      brand: brandDefault,
      description: product.description,
      size: product.size,
    },
  });
  const [isModalOpen, setIsModalOpen] = useState(false);

  const onSubmit = async (data: FieldValues) => {
    try {
      const res = await updateProduct({ id: product.key, payload: data }).unwrap();
      if (res.success) {
        toastMessage({ icon: 'success', text: res.message });
        reset();
        handleCancel();
      }
    } catch (error: any) {
      handleCancel();
      toastMessage({ icon: 'error', text: error.data.message });
    }
  };

  const showModal = () => {
    setIsModalOpen(true);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
  };

  return (
    <>
      <Button
        onClick={showModal}
        type='primary'
        className='table-btn-small'
        style={{ backgroundColor: 'green' }}
      >
        <EditFilled />
      </Button>
      <Modal title='Update Product Info' open={isModalOpen} onCancel={handleCancel} footer={null}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CustomInput
            name='name'
            errors={errors}
            label='Name'
            register={register}
            required={true}
          />
          <CustomInput
            errors={errors}
            label='Price'
            type='number'
            name='price'
            register={register}
            required={true}
          />
          <Row>
            <Col xs={{ span: 23 }} lg={{ span: 6 }}>
              <label htmlFor='Size' className='label'>
                Seller
              </label>
            </Col>
            <Col xs={{ span: 23 }} lg={{ span: 18 }}>
              <select
                disabled={isSellerLoading}
                {...register('seller', { required: true })}
                className={`input-field ${errors['seller'] ? 'input-field-error' : ''}`}
              >
                <option value=''>Select Seller*</option>
                {sellers?.data?.map((item: any) => (
                  <option value={item._id ?? item.id} key={item._id ?? item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </Col>
          </Row>

          <Row>
            <Col xs={{ span: 23 }} lg={{ span: 6 }}>
              <label htmlFor='Size' className='label'>
                Category
              </label>
            </Col>
            <Col xs={{ span: 23 }} lg={{ span: 18 }}>
              <select
                {...register('category', { required: true })}
                className={`input-field ${errors['category'] ? 'input-field-error' : ''}`}
              >
                <option value=''>Select Category*</option>
                {categories?.data?.map((item: any) => (
                  <option value={item._id ?? item.id} key={item._id ?? item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </Col>
          </Row>

          <Row>
            <Col xs={{ span: 23 }} lg={{ span: 6 }}>
              <label htmlFor='Size' className='label'>
                Brand
              </label>
            </Col>
            <Col xs={{ span: 23 }} lg={{ span: 18 }}>
              <select
                {...register('brand')}
                className={`input-field ${errors['brand'] ? 'input-field-error' : ''}`}
              >
                <option value=''>Select brand</option>
                {brands?.data?.map((item: any) => (
                  <option value={item._id ?? item.id} key={item._id ?? item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </Col>
          </Row>

          <CustomInput label='Description' name='description' register={register} />

          <Row>
            <Col xs={{ span: 23 }} lg={{ span: 6 }}>
              <label htmlFor='Size' className='label'>
                Size
              </label>
            </Col>
            <Col xs={{ span: 23 }} lg={{ span: 18 }}>
              <select className={`input-field`} {...register('size')}>
                <option value=''>Select Product Size</option>
                <option value='SMALL'>Small</option>
                <option value='MEDIUM'>Medium</option>
                <option value='LARGE'>Large</option>
              </select>
            </Col>
          </Row>
          <Flex justify='center'>
            <Button
              htmlType='submit'
              type='primary'
              style={{ textTransform: 'uppercase', fontWeight: 'bold' }}
            >
              Update
            </Button>
          </Flex>
        </form>
      </Modal>
    </>
  );
};

/**
 * Delete Product Modal
 */
const DeleteProductModal = ({ id }: { id: string }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteProduct] = useDeleteProductMutation();

  const showModal = () => {
    setIsModalOpen(true);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await deleteProduct(id).unwrap();
      if (res.success) {
        toastMessage({ icon: 'success', text: res.message });
        handleCancel();
      }
    } catch (error: any) {
      handleCancel();
      toastMessage({ icon: 'error', text: error.data.message });
    }
  };

  return (
    <>
      <Button
        onClick={showModal}
        type='primary'
        className='table-btn-small'
        style={{ backgroundColor: 'red' }}
      >
        <DeleteFilled />
      </Button>
      <Modal title='Delete Product' open={isModalOpen} onCancel={handleCancel} footer={null}>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <h2>Are you want to delete this product?</h2>
          <h4>You won't be able to revert it.</h4>
          <div
            style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '1rem' }}
          >
            <Button
              onClick={handleCancel}
              type='primary'
              style={{ backgroundColor: 'lightseagreen' }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => handleDelete(id)}
              type='primary'
              style={{ backgroundColor: 'red' }}
            >
              Yes! Delete
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default ProductManagePage;
