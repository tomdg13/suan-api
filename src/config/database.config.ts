import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

export const buildDatabaseConfig = (
  config: ConfigService,
): TypeOrmModuleOptions => ({
  type: 'mysql',
  host: config.get('DB_HOST', 'localhost'),
  port: parseInt(config.get('DB_PORT', '3306'), 10),
  username: config.get('DB_USERNAME', 'root'),
  password: config.get('DB_PASSWORD', ''),
  database: config.get('DB_DATABASE', 'suan_market'),
  autoLoadEntities: true,
  synchronize: false,
  charset: 'utf8mb4',
});
