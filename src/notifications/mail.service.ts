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

  async sendWeeklySalesReport(email: string, reportUrl: string): Promise<void> {
    const mailOptions = {
      from: this.configService.get<string>('MAIL_FROM'),
      to: email,
      subject: 'Relatório Semanal de Vendas',
      html: `
        <h1>Relatório Semanal de Vendas</h1>
        <p>Segue o relatório de vendas da semana:</p>
        <a href="${reportUrl}">Ver Relatório Completo</a>
        <p>Este relatório contém todas as vendas realizadas entre ${reportUrl.split('=')[1].split('&')[0]} e ${reportUrl.split('=')[2]}</p>
      `,
    };

    await this.transporter.sendMail(mailOptions);
  }

  async sendWeeklyShoppingReport(email: string, reportUrl: string): Promise<void> {
    const mailOptions = {
      from: this.configService.get<string>('MAIL_FROM'),
      to: email,
      subject: 'Relatório Semanal de Compras',
      html: `
        <h1>Relatório Semanal de Compras</h1>
        <p>Segue o relatório de compras da semana:</p>
        <a href="${reportUrl}">Ver Relatório Completo</a>
        <p>Este relatório contém todas as compras realizadas entre ${reportUrl.split('=')[1].split('&')[0]} e ${reportUrl.split('=')[2]}</p>
      `,
    };

    await this.transporter.sendMail(mailOptions);
  }
}