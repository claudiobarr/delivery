import { Controller, Post, Get, UseInterceptors, UploadedFile, BadRequestException, UseGuards } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import * as fs from 'fs';
import * as crypto from 'crypto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

const UPLOADS_DIR = join(__dirname, '..', '..', 'uploads');

const MAGIC_BYTES: Record<string, Buffer> = {
  '.jpg': Buffer.from([0xff, 0xd8, 0xff]),
  '.jpeg': Buffer.from([0xff, 0xd8, 0xff]),
  '.png': Buffer.from([0x89, 0x50, 0x4e, 0x47]),
  '.gif': Buffer.from([0x47, 0x49, 0x46]),
  '.webp': Buffer.from([0x52, 0x49, 0x46, 0x46]),
};

const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];

@Controller('uploads')
@UseGuards(JwtAuthGuard)
export class UploadsController {
  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
          cb(null, UPLOADS_DIR);
        },
        filename: (_req, file, cb) => {
          const ext = extname(file.originalname).toLowerCase();
          const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, unique + ext);
        },
      }),
      fileFilter: (_req, file, cb) => {
        const ext = extname(file.originalname).toLowerCase();
        if (!ALLOWED_EXTENSIONS.includes(ext)) {
          cb(new BadRequestException('Only .jpg, .jpeg, .png, .gif, .webp files allowed'), false);
          return;
        }
        if (!file.mimetype.match(/^image\//)) {
          cb(new BadRequestException('Only image files allowed'), false);
          return;
        }
        cb(null, true);
      },
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('File required');

    const ext = extname(file.originalname).toLowerCase();
    const expectedMagic = MAGIC_BYTES[ext];
    if (expectedMagic) {
      const buffer = fs.readFileSync(file.path);
      const magic = buffer.subarray(0, expectedMagic.length);
      if (!magic.equals(expectedMagic)) {
        fs.unlinkSync(file.path);
        throw new BadRequestException('File content does not match extension');
      }
    }

    return { url: `/uploads/${file.filename}`, filename: file.filename };
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  listFiles() {
    if (!fs.existsSync(UPLOADS_DIR)) return [];
    return fs.readdirSync(UPLOADS_DIR).map((f) => ({
      url: `/uploads/${f}`,
      filename: f,
    }));
  }
}
