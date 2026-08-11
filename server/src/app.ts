import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import authRoutes from './modules/auth/auth.routes';
import studentRoutes from './modules/student/student.routes';
import departmentRoutes from './modules/department/department.routes';
import facultyRoutes from './modules/faculty/faculty.routes';
import timetableRoutes from './modules/timetable/timetable.routes';
import attendanceRoutes from './modules/attendance/attendance.routes';
import aiRoutes from './modules/ai/ai.routes';
import { authenticate } from './middlewares/auth.middleware';
import { apiLimiter } from './middlewares/rateLimiter.middleware';
import { globalErrorHandler } from './middlewares/errorHandler.middleware';

const app: Application = express();

// Trust reverse proxy header (Nginx, Vercel, Railway, Render, Cloudflare)
app.set('trust proxy', 1);

// 1. Security Headers (Helmet)
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// 2. CORS Configuration with environment override for production hosting
const allowedOrigins = process.env.CORS_ORIGIN || process.env.FRONTEND_URL;

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
        return callback(null, true);
      }
      if (allowedOrigins) {
        const originsList = allowedOrigins.split(',').map((s) => s.trim());
        if (originsList.includes(origin)) {
          return callback(null, true);
        }
        return callback(new Error('CORS policy restricted access from this origin.'));
      }
      return callback(null, true);
    },
    credentials: true,
  })
);

// 3. Body & Cookie Parsing Middleware
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// 4. Rate Limiting for API routes
app.use('/api', apiLimiter);

// 5. Healthcheck Route
app.get('/', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: '🚀 College ERP AI Production-Secure Backend is running',
  });
});

// 6. Authentication Routes
app.use('/api/v1/auth', authRoutes);

// 7. Domain Routes with Authentication Guards
app.use('/api/v1/students', authenticate, studentRoutes);
app.use('/api/v1/departments', authenticate, departmentRoutes);
app.use('/api/v1/faculties', authenticate, facultyRoutes);
app.use('/api/v1/faculty', authenticate, facultyRoutes);
app.use('/api/v1/timetable', authenticate, timetableRoutes);
app.use('/api/v1/attendance', authenticate, attendanceRoutes);
app.use('/api/v1/ai', authenticate, aiRoutes);

// 8. Global Production Error Handler
app.use(globalErrorHandler);

export default app;