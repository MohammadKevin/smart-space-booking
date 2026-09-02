import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  sendNotification(recipient: string, message: string): boolean {
    this.logger.log(`Dispatching notification to ${recipient}: ${message}`);
    return true;
  }
}
