export interface IUser {
  name: string;
  email: string;
  title?: string;
  description?: string;
  role: string;
  avatar?: string;
  password: string;
  status: string;
  address?: string;
  phone?: string
  city?: string;
  country?: string;
  facebook?: string;
  twitter?: string;
  linkedin?: string;
  instagram?: string;
}

export const profileKeys = [
  { keyName: 'username' },
  { keyName: 'email' },
  { keyName: 'first_name' },
  { keyName: 'last_name' },
  { keyName: 'role' },
]

export const profileInputFields = [
  { id: 1, name: 'username', label: 'Username' },
  { id: 2, name: 'email', label: 'Email' },
  { id: 3, name: 'firstName', label: 'First Name' },
  { id: 4, name: 'lastName', label: 'Last Name' },
]