import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '2877', 10),
  apiPrefix: process.env.API_PREFIX || 'api/v1',
}));
