import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AuthLayout } from '../layouts/AuthLayout';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { ProtectedRoute } from '../components/common/ProtectedRoute';
import { RoleGuard } from '../components/common/RoleGuard';
import { Login } from '../pages/auth/Login';
import { Register } from '../pages/auth/Register';
import { ForgotPassword } from '../pages/auth/ForgotPassword';
import { Dashboard } from '../pages/dashboard/Dashboard';
import { StudentList } from '../pages/students/StudentList';
import { AddStudent } from '../pages/students/AddStudent';
import { EditStudent } from '../pages/students/EditStudent';
import { DepartmentList } from '../pages/departments/DepartmentList';
import { AddDepartment } from '../pages/departments/AddDepartment';
import { EditDepartment } from '../pages/departments/EditDepartment';
import { FacultyList } from '../pages/faculty/FacultyList';
import { AddFaculty } from '../pages/faculty/AddFaculty';
import { EditFaculty } from '../pages/faculty/EditFaculty';
import { Profile } from '../pages/profile/Profile';
import { Settings } from '../pages/settings/Settings';
import { MarkAttendance } from '../pages/faculty/MarkAttendance';
import { EnterMarks } from '../pages/faculty/EnterMarks';
import { StudentAttendance } from '../pages/student/StudentAttendance';
import { StudentTimetable } from '../pages/student/StudentTimetable';
import { StudentMarks } from '../pages/student/StudentMarks';
import { StudentFees } from '../pages/student/StudentFees';

// AI Feature Pages
import { AITimetableGenerator } from '../pages/admin/AITimetableGenerator';
import { AIReportGenerator } from '../pages/admin/AIReportGenerator';
import { AINoticeGenerator } from '../pages/admin/AINoticeGenerator';
import { AIQuestionPaperGenerator } from '../pages/faculty/AIQuestionPaperGenerator';
import { AIPerformanceAnalysis } from '../pages/faculty/AIPerformanceAnalysis';
import { AIAssignmentChecker } from '../pages/faculty/AIAssignmentChecker';
import { AIStudyAssistant } from '../pages/student/AIStudyAssistant';

import { ChangePassword } from '../pages/auth/ChangePassword';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AuthLayout />,
    children: [
      { index: true, element: <Navigate to="/login" replace /> },
      { path: 'login', element: <Login /> },
      { path: 'register', element: <Register /> },
      { path: 'forgot-password', element: <ForgotPassword /> },
      { path: 'change-password', element: <ProtectedRoute><ChangePassword /></ProtectedRoute> },
    ],
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    children: [
      { path: 'dashboard', element: <Dashboard /> },

      { path: 'students', element: <StudentList /> },
      { path: 'students/add', element: <RoleGuard allowedRoles={['ADMIN', 'FACULTY']} fallback={<Navigate to="/dashboard" replace />}><AddStudent /></RoleGuard> },
      { path: 'students/edit/:id', element: <RoleGuard allowedRoles={['ADMIN', 'FACULTY']} fallback={<Navigate to="/dashboard" replace />}><EditStudent /></RoleGuard> },
      { path: 'students/:id/edit', element: <RoleGuard allowedRoles={['ADMIN', 'FACULTY']} fallback={<Navigate to="/dashboard" replace />}><EditStudent /></RoleGuard> },
      
      { path: 'departments', element: <DepartmentList /> },
      { path: 'departments/add', element: <RoleGuard allowedRoles={['ADMIN']} fallback={<Navigate to="/dashboard" replace />}><AddDepartment /></RoleGuard> },
      { path: 'departments/edit/:id', element: <RoleGuard allowedRoles={['ADMIN']} fallback={<Navigate to="/dashboard" replace />}><EditDepartment /></RoleGuard> },
      { path: 'departments/:id/edit', element: <RoleGuard allowedRoles={['ADMIN']} fallback={<Navigate to="/dashboard" replace />}><EditDepartment /></RoleGuard> },
      
      { path: 'faculty', element: <FacultyList /> },
      { path: 'faculty/add', element: <RoleGuard allowedRoles={['ADMIN']} fallback={<Navigate to="/dashboard" replace />}><AddFaculty /></RoleGuard> },
      { path: 'faculty/edit/:id', element: <RoleGuard allowedRoles={['ADMIN']} fallback={<Navigate to="/dashboard" replace />}><EditFaculty /></RoleGuard> },
      { path: 'faculty/:id/edit', element: <RoleGuard allowedRoles={['ADMIN']} fallback={<Navigate to="/dashboard" replace />}><EditFaculty /></RoleGuard> },
      
      // Admin AI Routes
      { path: 'admin/ai-timetable', element: <RoleGuard allowedRoles={['ADMIN']} fallback={<Navigate to="/dashboard" replace />}><AITimetableGenerator /></RoleGuard> },
      { path: 'admin/ai-reports', element: <RoleGuard allowedRoles={['ADMIN']} fallback={<Navigate to="/dashboard" replace />}><AIReportGenerator /></RoleGuard> },
      { path: 'admin/ai-notices', element: <RoleGuard allowedRoles={['ADMIN']} fallback={<Navigate to="/dashboard" replace />}><AINoticeGenerator /></RoleGuard> },

      // Faculty AI & Teaching Routes
      { path: 'faculty/attendance', element: <RoleGuard allowedRoles={['FACULTY', 'ADMIN']} fallback={<Navigate to="/dashboard" replace />}><MarkAttendance /></RoleGuard> },
      { path: 'faculty/marks', element: <RoleGuard allowedRoles={['FACULTY', 'ADMIN']} fallback={<Navigate to="/dashboard" replace />}><EnterMarks /></RoleGuard> },
      { path: 'faculty/ai-question-paper', element: <RoleGuard allowedRoles={['FACULTY', 'ADMIN']} fallback={<Navigate to="/dashboard" replace />}><AIQuestionPaperGenerator /></RoleGuard> },
      { path: 'faculty/ai-performance', element: <RoleGuard allowedRoles={['FACULTY', 'ADMIN']} fallback={<Navigate to="/dashboard" replace />}><AIPerformanceAnalysis /></RoleGuard> },
      { path: 'faculty/ai-assignment-checker', element: <RoleGuard allowedRoles={['FACULTY', 'ADMIN']} fallback={<Navigate to="/dashboard" replace />}><AIAssignmentChecker /></RoleGuard> },
      
      // Student AI & Academic Routes
      { path: 'student/attendance', element: <RoleGuard allowedRoles={['STUDENT', 'ADMIN']} fallback={<Navigate to="/dashboard" replace />}><StudentAttendance /></RoleGuard> },
      { path: 'student/timetable', element: <RoleGuard allowedRoles={['STUDENT', 'ADMIN']} fallback={<Navigate to="/dashboard" replace />}><StudentTimetable /></RoleGuard> },
      { path: 'student/marks', element: <RoleGuard allowedRoles={['STUDENT', 'ADMIN']} fallback={<Navigate to="/dashboard" replace />}><StudentMarks /></RoleGuard> },
      { path: 'student/fees', element: <RoleGuard allowedRoles={['STUDENT', 'ADMIN']} fallback={<Navigate to="/dashboard" replace />}><StudentFees /></RoleGuard> },
      { path: 'student/ai-assistant', element: <RoleGuard allowedRoles={['STUDENT', 'ADMIN']} fallback={<Navigate to="/dashboard" replace />}><AIStudyAssistant /></RoleGuard> },
      
      { path: 'profile', element: <Profile /> },
      { path: 'settings', element: <Settings /> },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/dashboard" replace />,
  },
]);