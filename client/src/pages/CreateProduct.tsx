import { Button, Col, Row } from 'antd';
import React from 'react';

type FlexProps = React.HTMLAttributes<HTMLDivElement> & {
  vertical?: boolean;
  justify?: 'center' | 'start' | 'end' | 'between' | 'around';
};

const Flex: React.FC<FlexProps> = ({ vertical, justify, style, children, ...rest }) => {
  const justifyMap: any = {
    center: 'center',
    start: 'flex-start',
    end: 'flex-end',
    between: 'space-between',
    around: 'space-around',
  };
  const mergedStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: vertical ? 'column' : 'row',
    justifyContent: justify ? justifyMap[justify] : undefined,
    ...style,
  };
  return (
    <div style={mergedStyle} {...rest}>
      {children}
    </div>
  );
};
import { FieldValues, useForm } from 'react-hook-form';
import CustomInput from '../components/CustomInput';
import toastMessage from '../lib/toastMessage';
import { useGetAllBrandsQuery } from '../redux/features/management/brandApi';
import { useGetAllCategoriesQuery } from '../redux/features/management/categoryApi';
import { useCreateNewProductMutation, useCreateVariantMutation } from '../redux/features/management/productApi';
import { useGetAllSellerListQuery } from '../redux/features/management/sellerApi';
import { ICategory } from '../types/product.types';
import CreateSeller from '../components/product/CreateSeller';
import CreateCategory from '../components/product/CreateCategory';
import CreateBrand from '../components/product/CreateBrand';
import { SpinnerIcon } from '@phosphor-icons/react';

const CreateProduct = () => {
  const [createNewProduct, { isLoading: isCreatingProduct }] = useCreateNewProductMutation();
  const [createVariant] = useCreateVariantMutation();
  const { data: categories } = useGetAllCategoriesQuery(undefined);
  const { data: sellers } = useGetAllSellerListQuery(undefined);
  const { data: brands } = useGetAllBrandsQuery(undefined);

  const sellerItems = Array.isArray((sellers as any)) ? (sellers as any) : (sellers?.data ?? []);
  const categoryItems = Array.isArray((categories as any)) ? (categories as any) : (categories?.data ?? []);
  const brandItems = Array.isArray((brands as any)) ? (brands as any) : (brands?.data ?? []);

  const {
    handleSubmit,
    register,
    formState: { errors },
    reset,
  } = useForm();

  const onSubmit = async (data: FieldValues) => {
    // Build payload that matches backend productSchema
    const payload: any = {
      name: String(data.name).trim(),
      description: data.description ? String(data.description).trim() : undefined,
      sku: data.sku ? String(data.sku).trim() : undefined,
      basePrice: Number(data.price),
    };

    if (data.category) payload.categoryId = Number(data.category);
    if (data.brand) payload.brandId = Number(data.brand);
    if (data.size && data.size !== '') payload.size = data.size;

    try {
      const res = await createNewProduct(payload).unwrap();
      if (res.success) {
        // If stock provided, create a default variant with that stock
        const createdProduct = res.data?.product ?? res?.product ?? null;
        if (createdProduct && data.stock) {
          try {
            await createVariant({
              productId: createdProduct.id ?? createdProduct._id ?? createdProduct.key,
              variantName: 'Default',
              price: Number(data.price),
              quantityInStock: Number(data.stock),
            }).unwrap();
          } catch (err) {
            // variant creation failed, but product was created — notify user
            // eslint-disable-next-line no-console
            console.error('createVariant error', err);
          }
        }

        toastMessage({ icon: 'success', text: res.message });
        reset();
      }
    } catch (error: any) {
      toastMessage({ icon: 'error', text: error.data?.message || error.message });
    }
  };

  return (
    <>
      <Row
        gutter={30}
        style={{
          height: 'calc(100vh - 6rem)',
          overflow: 'auto',
        }}
      >
        <Col
          xs={{ span: 24 }}
          lg={{ span: 14 }}
          style={{
            display: 'flex',
          }}
        >
          <Flex
            vertical
            style={{
              width: '100%',
              padding: '1rem 2rem',
              border: '1px solid #164863',
              borderRadius: '.6rem',
            }}
          >
            <h1
              style={{
                marginBottom: '.8rem',
                fontWeight: '900',
                textAlign: 'center',
                textTransform: 'uppercase',
              }}
            >
              Add New Product
            </h1>
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
              <CustomInput
                errors={errors}
                label='Stock'
                type='number'
                name='stock'
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
                    {...register('seller', { required: true })}
                    className={`input-field ${errors['seller'] ? 'input-field-error' : ''}`}
                  >
                    <option value=''>Select Seller*</option>
                    {sellerItems.map((item: any) => {
                      const key = item.id ?? item._id;
                      return (
                        <option value={key} key={key}>{item.name ?? item.username ?? item.seller_name ?? ''}</option>
                      );
                    })}
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
                    {categoryItems.map((item: ICategory) => {
                      const key = (item as any).id ?? (item as any)._id;
                      return (
                        <option value={key} key={key}>{item.name}</option>
                      );
                    })}
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
                    {brandItems.map((item: ICategory) => {
                      const key = (item as any).id ?? (item as any)._id;
                      return (
                        <option value={key} key={key}>{item.name}</option>
                      );
                    })}
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
                  disabled={isCreatingProduct}
                  style={{ textTransform: 'uppercase', fontWeight: 'bold' }}
                >
                  {isCreatingProduct && <SpinnerIcon className='spin' weight='bold' />}
                  Add Product
                </Button>
              </Flex>
            </form>
          </Flex>
        </Col>
        <Col xs={{ span: 24 }} lg={{ span: 10 }}>
          <Flex
            vertical
            style={{
              width: '100%',
              height: '100%',
              padding: '1rem 2rem',
              border: '1px solid #164863',
              borderRadius: '.6rem',
              justifyContent: 'space-around',
            }}
          >
            <CreateSeller />
            <CreateCategory />
            <CreateBrand />
          </Flex>
        </Col>
      </Row>
    </>
  );
};

export default CreateProduct;
