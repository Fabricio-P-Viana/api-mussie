import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('MAIL_HOST'),
      port: this.configService.get<number>('MAIL_PORT'),
      secure: false,
      auth: {
        user: this.configService.get<string>('MAIL_USER'),
        pass: this.configService.get<string>('MAIL_PASS'),
      },
    });

    this.transporter.verify((error, success) => {
      if (error) {
        console.error('Erro ao verificar transporte SMTP:', error);
      } else {
        console.log('Transporte SMTP configurado com sucesso');
      }
    });
  }

  

  async sendResetPasswordEmail(to: string, token: string) {
    try {
      console.log(`Enviando e-mail de redefinição para ${to} com token ${token}`);
      const resetLink = `http://localhost:${this.configService.get<number>('APP_PORT_FRONT')}/reset-password?token=${token}`;
      const info = await this.transporter.sendMail({
        from: `"Confeitaria API" <${this.configService.get<string>('MAIL_USER')}>`,
        to,
        subject: 'Redefinição de Senha',
        html: `<p>Clique <a href="${resetLink}">aqui</a> para redefinir sua senha. O link expira em 1 hora.</p>`,
      });
      console.log('E-mail enviado com sucesso:', info.messageId);
      return info;
    } catch (error) {
      console.error('Erro ao enviar e-mail de redefinição:', error);
      throw new InternalServerErrorException('Falha ao enviar e-mail de redefinição');
    }
  }
}