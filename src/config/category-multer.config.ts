import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { diskStorage } from 'multer';
import { join } from 'path';
import { extname } from 'path';

export const categoryMulterOptions: MulterOptions = {
  storage: diskStorage({
    destination: join(process.cwd(), 'uploads', 'categories'),
    filename: (_req, file, cb) => {
      const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
      cb(null, `${unique}${extname(file.originalname)}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
};
