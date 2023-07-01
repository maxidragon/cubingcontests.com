import { Role } from '../enums';

interface IUser {
  name: string;
  username: string;
  password: string;
  // Optional, because roles are not assigned on creation; they are assigned manually
  roles?: Role[];
}

export default IUser;