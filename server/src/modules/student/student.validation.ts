import { z } from 'zod';

export const createStudentSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  fullName: z.string().optional(),
  email: z.string().email(),
  studentId: z.string().optional(),
  rollNumber: z.string().optional(),
  dateOfBirth: z.string().optional(),
  gender: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  fatherName: z.string().optional(),
  fatherPhone: z.string().optional(),
  section: z.string().optional(),
  enrollmentDate: z.string().optional(),
  status: z.string().optional(),
  departmentId: z.string().optional(),
  semester: z.string().optional(),
});

export const updateStudentSchema = createStudentSchema.partial();

export type CreateStudentInput = z.infer<typeof createStudentSchema>;
export type UpdateStudentInput = z.infer<typeof updateStudentSchema>;
