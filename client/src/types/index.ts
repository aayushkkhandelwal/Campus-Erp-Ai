export type Role = 'ADMIN' | 'FACULTY' | 'STUDENT';

export interface User {
  id: string;
  fullName: string;
  email: string;
  role: Role;
  phone?: string | null;
  status?: string;
  phoneVerified?: boolean;
  twoFactorEnabled?: boolean;
  mustChangePassword?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  fullName: string;
  email: string;
  password: string;
  phone?: string;
  role?: Role;
}

export interface Student {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  studentId: string;
  dateOfBirth: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  address: string;
  phone: string;
  fatherName?: string | null;
  fatherPhone?: string | null;
  section?: string | null;
  enrollmentDate: string;
  semester?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'GRADUATED' | 'SUSPENDED';
  departmentId: string;
  department?: Department;
  createdAt: string;
  updatedAt: string;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  description?: string;
  headOfDepartment?: string;
  facultyCount?: number;
  studentCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Faculty {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  employeeId: string;
  phone: string;
  designation: string;
  qualification: string;
  specialization: string;
  departmentId: string;
  department?: Department;
  joiningDate: string;
  status: 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE';
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  code?: string;
}
