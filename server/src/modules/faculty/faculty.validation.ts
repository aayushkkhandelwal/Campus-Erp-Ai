import { z } from 'zod';

export const createFacultySchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  fullName: z.string().optional(),
  email: z.string().email(),
  employeeId: z.string().optional(),
  phone: z.string().optional(),
  designation: z.string().optional(),
  qualification: z.string().optional(),
  specialization: z.string().optional(),
  joiningDate: z.string().optional(),
  status: z.string().optional(),
  departmentId: z.string(),
});

export const updateFacultySchema = createFacultySchema.partial();

export type CreateFacultyInput = z.infer<typeof createFacultySchema>;
export type UpdateFacultyInput = z.infer<typeof updateFacultySchema>;
