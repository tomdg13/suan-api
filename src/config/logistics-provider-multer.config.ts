import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { randomUUID } from 'crypto';
import { BadRequestException } from '@nestjs/common';

export const logisticsProviderMulterOptions = {
  storage: diskStorage({
    destination: join(__dirname, '..', '..', 'uploads', 'logistics-providers'),
    filename: (req, file, callback) => {
      const ext = extname(file.originalname).toLowerCase();
      callback(null, `${randomUUID()}${ext}`);
    },
  }),
  fileFilter: (req, file, callback) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.webp'];
    const ext = extname(file.originalname).toLowerCase();
    if (!allowed.includes(ext)) {
      return callback(
        new BadRequestException('Only JPG, PNG, and WEBP images are allowed'),
        false,
      );
    }
    callback(null, true);
  },
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
};
