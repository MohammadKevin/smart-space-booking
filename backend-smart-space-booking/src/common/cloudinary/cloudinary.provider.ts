import { v2 as cloudinary } from 'cloudinary';
import { ConfigService } from '@nestjs/config';

export const CLOUDINARY = 'CLOUDINARY';

export const CloudinaryProvider = {
  provide: CLOUDINARY,
  useFactory: (configService: ConfigService) => {
    return cloudinary.config({
      cloud_name:
        configService.get<string>('CLOUDINARY_CLOUD_NAME') ||
        process.env.CLOUDINARY_CLOUD_NAME ||
        'n2q3f6uz',
      api_key:
        configService.get<string>('CLOUDINARY_API_KEY') ||
        process.env.CLOUDINARY_API_KEY ||
        '998714454127672',
      api_secret:
        configService.get<string>('CLOUDINARY_API_SECRET') ||
        process.env.CLOUDINARY_API_SECRET ||
        'znTPktUS-hVwZQGLcZXc_qZ4aoE',
    });
  },
  inject: [ConfigService],
};
