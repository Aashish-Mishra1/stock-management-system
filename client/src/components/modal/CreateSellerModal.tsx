import { Button, Flex, Modal } from 'antd';
import { FieldValues, useForm } from 'react-hook-form';
import CustomInput from '../CustomInput';
import { useCreateSellerMutation } from '../../redux/features/management/sellerApi';
import toastMessage from '../../lib/toastMessage';
import { SpinnerIcon } from '@phosphor-icons/react';

interface CreateSellerModalProps {
  openModal: boolean;
  setOpenModal: React.Dispatch<React.SetStateAction<boolean>>;
}

const CreateSellerModal = ({ openModal, setOpenModal }: CreateSellerModalProps) => {
  const [createSeller, { isLoading }] = useCreateSellerMutation();
  const {
    handleSubmit,
    register,
    reset,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data: FieldValues) => {
    try {
      // Build payload only with provided, non-empty values so validation schema receives proper types
      const payload: any = {};
      if (data.name && String(data.name).trim() !== '') payload.name = String(data.name).trim();
      if (data.email && String(data.email).trim() !== '') payload.email = String(data.email).trim();
      if (data.contactNo && String(data.contactNo).trim() !== '') payload.phone = String(data.contactNo).trim();
      if ((data as any).address && String((data as any).address).trim() !== '') payload.address = String((data as any).address).trim();

      const res = await createSeller(payload).unwrap();
      if (res.success) {
        reset();
        toastMessage({ icon: 'success', text: res.message });
        setOpenModal(false);
      }
    } catch (error: any) {
      toastMessage({ icon: 'error', text: error.data.message });
    }
  };

  return (
    <>
      <Modal
        title='Create New Seller!'
        centered
        open={openModal}
        onOk={() => setOpenModal(false)}
        onCancel={() => setOpenModal(false)}
        footer={[
          <Button key='back' onClick={() => setOpenModal(false)}>
            Close
          </Button>,
        ]}
      >
        <form onSubmit={handleSubmit(onSubmit)}>
          <CustomInput
            name='name'
            errors={errors}
            register={register}
            label='Seller Name'
            required={true}
          />
          <CustomInput
            name='email'
            errors={errors}
            register={register}
            label='Seller Email'
            required={true}
          />
          <CustomInput
            name='contactNo'
            errors={errors}
            register={register}
            label='Contact No.'
            required={true}
          />
          <Flex justify='center' style={{ margin: '1rem' }}>
            <Button key='submit' type='primary' htmlType='submit' disabled={isLoading}>
              {isLoading && <SpinnerIcon className='spin' weight='bold' />}
              Create Seller
            </Button>
          </Flex>
        </form>
      </Modal>
    </>
  );
};

export default CreateSellerModal;
