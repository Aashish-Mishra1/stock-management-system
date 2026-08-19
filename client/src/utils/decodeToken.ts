import * as jwtDecodePkg from 'jwt-decode'
import { TUser } from '../redux/services/authSlice'

const decodeToken = (token: string): TUser => {
  const decoder = (jwtDecodePkg as any).default ?? (jwtDecodePkg as any).jwtDecode ?? jwtDecodePkg;
  return decoder(token) as TUser
}

export default decodeToken