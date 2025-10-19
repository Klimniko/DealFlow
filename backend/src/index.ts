import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { ZodError } from 'zod';
import { config } from './config.js';
import authRoutes from './routes/auth.routes.js';
import organizationRoutes from './routes/organizations.routes.js';
import rfxRoutes from './routes/rfx.routes.js';
import integrationRoutes from './routes/integrations.routes.js';
import { HttpError } from './utils/errors.js';

const app = express();

app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(
  cors({
    origin: config.CORS_ORIGIN,
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/auth', authRoutes);
app.use('/organizations', organizationRoutes);
app.use('/rfx', rfxRoutes);
app.use('/integrations/n8n', integrationRoutes);

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ message: err.message, code: err.code });
  }
  if (err instanceof ZodError) {
    return res.status(422).json({
      message: 'Validation failed',
      issues: err.issues.map((issue) => ({ path: issue.path, message: issue.message })),
    });
  }
  if (err && typeof err === 'object' && 'status' in err && typeof (err as any).status === 'number') {
    const status = (err as any).status as number;
    const message = (err as any).message ?? 'Server error';
    return res.status(status).json({ message });
  }
  console.error(err);
  return res.status(500).json({ message: 'Internal server error' });
});

app.listen(config.PORT, config.HOST, () => {
  console.log(`API listening on http://${config.HOST}:${config.PORT}`);
});
