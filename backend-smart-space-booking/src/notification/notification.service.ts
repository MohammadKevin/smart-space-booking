import { Injectable } from '@nestjs/common';

@Injectable()
export class NotificationService {
  async sendNotification(recipient: string, message: string): Promise<boolean> {
    // Placeholder for email/whatsapp/sms notification dispatch
    return true;
  }
}
