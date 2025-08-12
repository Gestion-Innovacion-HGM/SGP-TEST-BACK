import * as Brevo from '@getbrevo/brevo';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';

@Injectable()
export class MailerService {
  constructor(private config: ConfigService) {}

  async sendMail(data: {
    mailData: any;
    template?: string;
    content?: string;
    attachments?: any[];
  }): Promise<boolean> {
    try {
      const apiKey = this.config.get('SIB_API_KEY');

      const apiInstance = new Brevo.TransactionalEmailsApi();
      apiInstance.setApiKey(0, apiKey);

      const { mailData, template, content, attachments } = data;
      const { receivers, subject, params, sender } = mailData;

      let emailContent: string;

      if (template) {
        // If a template is provided, use it
        emailContent = fs.readFileSync(
          `src/mailer/templates/${template}.html`,
          'utf8',
        );
      } else if (content) {
        // If content is provided, use it
        emailContent = content;
      } else {
        emailContent = '';
      }

      await apiInstance.sendTransacEmail({
        sender: sender,
        to: receivers,
        subject: subject,
        htmlContent: emailContent,
        params: {
          ...params,
        },
        attachment: attachments && attachments.length > 0 ? attachments : null!,
      });

      return true;
    } catch (error) {
      console.log('ERROR SENDING EMAIL: ', error);
      return false;
    }
  }
}
