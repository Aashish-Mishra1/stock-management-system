import { SpinnerIcon } from '@phosphor-icons/react';
import { Button, Flex } from 'antd';
import { FieldValues, useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import toastMessage from '../../lib/toastMessage';
import { useRegisterMutation } from '../../redux/features/authApi';
import { useAppDispatch } from '../../redux/hooks';
import { loginUser } from '../../redux/services/authSlice';
import decodeToken from '../../utils/decodeToken';

const RegisterPage = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [userRegistration, { isLoading }] = useRegisterMutation();
  const {
    handleSubmit,
    register,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data: FieldValues) => {
    try {
      if (data.password !== data.confirmPassword) {
        toastMessage({ icon: 'error', text: 'Password and confirm password must be same!' });
        return;
      }
      // Send only required fields to backend
      const payload = {
        username: data.username,
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName
      };
      const res = await userRegistration(payload).unwrap();
      if (res.statusCode === 201) {
        const user = decodeToken(res.data.token);
        dispatch(loginUser({ token: res.data.token, user }));
        navigate('/');
        toastMessage({ icon: 'success', text: res.message });
      }
    } catch (error: any) {
      let errMsg = 'Registration failed';
      if (error?.data?.errors && Array.isArray(error.data.errors)) {
        errMsg = error.data.errors.map((e: any) => `${e.field}: ${e.message}`).join(', ');
      } else if (error?.data?.message) {
        errMsg = error.data.message;
      }
      toastMessage({ icon: 'error', text: errMsg });
    }
  };

  return (
    <Flex justify='center' align='center' style={{ height: '100vh' }}>
      <Flex
        vertical
        style={{
          width: '400px',
          padding: '3rem',
          border: '1px solid #164863',
          borderRadius: '.6rem',
        }}
      >
        <h1 style={{ marginBottom: '.7rem', textAlign: 'center', textTransform: 'uppercase' }}>
          Register
        </h1>
        <form onSubmit={handleSubmit(onSubmit)}>
          <input
            type='text'
            {...register('username', { required: true })}
            placeholder='Username*'
            className={`input-field ${errors['username'] ? 'input-field-error' : ''}`}
          />
          <input
            type='text'
            {...register('email', { required: true })}
            placeholder='Your Email*'
            className={`input-field ${errors['email'] ? 'input-field-error' : ''}`}
          />
          <input
            type='password'
            placeholder='Your Password*'
            {...register('password', { required: true })}
            className={`input-field ${errors['password'] ? 'input-field-error' : ''}`}
          />
          <input
            type='password'
            placeholder='Confirm Password*'
            {...register('confirmPassword', { required: true })}
            className={`input-field ${errors['confirmPassword'] ? 'input-field-error' : ''}`}
          />
          <Flex justify='center'>
            <Button
              htmlType='submit'
              type='primary'
              style={{ textTransform: 'uppercase', fontWeight: 'bold', width: '100%' }}
            >
              {isLoading && <SpinnerIcon className='spin' weight='bold' />}
              Register
            </Button>
          </Flex>
        </form>
        <p style={{ marginTop: '1rem' }}>
          Already have an account? <Link to='/login'>Login Here</Link>
        </p>
      </Flex>
    </Flex>
  );
};

export default RegisterPage;
