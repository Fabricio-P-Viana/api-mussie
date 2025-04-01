import { Injectable } from '@nestjs/common';
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
  }

  async sendResetPasswordEmail(to: string, token: string) {
    const resetLink = `http://localhost:${this.configService.get<number>('APP_PORT_FRONT')}/reset-password?token=${token}`;
    await this.transporter.sendMail({
      from: `"Confeitaria API" <${this.configService.get<string>('MAIL_USER')}>`,
      to,
      subject: 'Redefinição de Senha',
      html: `<p>Clique <a href="${resetLink}">aqui</a> para redefinir sua senha. O link expira em 1 hora.</p>`,
    });
  }

  async sendWeeklyReport(to: string, userId: number, startDate: string, endDate: string) {
    const reportLink = `${this.configService.get<string>('APP_BACKEND_URL')}/reports?firstDay=${startDate}&lastDay=${endDate}`;
    const shoppingListLink = `${this.configService.get<string>('APP_BACKEND_URL')}/shopping-list?userId=${userId}&firstDay=${startDate}&lastDay=${endDate}`;
    
    await this.transporter.sendMail({
      from: `"Confeitaria API" <${this.configService.get<string>('MAIL_USER')}>`,
      to,
      subject: 'Relatório Semanal - Confeitaria',
      html: `
        <h1>Relatório Semanal</h1>
        <p>Segue abaixo os links para acessar seus relatórios:</p>
        <ul>
          <li><a href="${reportLink}">Relatório de Consumo (${startDate} a ${endDate})</a></li>
          <li><a href="${shoppingListLink}">Lista de Compras (${startDate} a ${endDate})</a></li>
        </ul>
        <p>Atenciosamente,<br/>Equipe Confeitaria API</p>
      `,
    });
  }
}