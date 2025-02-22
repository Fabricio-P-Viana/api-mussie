import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { MailService } from './mail.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
    private mailService: MailService,
  ) {}

  async register(registerDto: RegisterDto): Promise<{ access_token: string }> {
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);
    const user = this.userRepository.create({
      email: registerDto.email,
      password: hashedPassword,
    });
    const savedUser = await this.userRepository.save(user);
    const payload = { email: savedUser.email, sub: savedUser.id };
    return { access_token: this.jwtService.sign(payload) };
  }

  async login(loginDto: LoginDto): Promise<{ access_token: string }> {
    const user = await this.userRepository.findOneBy({ email: loginDto.email });
    if (!user || !(await bcrypt.compare(loginDto.password, user.password))) {
      throw new UnauthorizedException('Credenciais inválidas');
    }
    const payload = { email: user.email, sub: user.id };
    return { access_token: this.jwtService.sign(payload) };
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const user = await this.userRepository.findOneBy({ email: forgotPasswordDto.email });
    if (!user) return;

    const token = uuidv4();
    const expiry = new Date();
    expiry.setHours(expiry.getHours() + 1);

    await this.userRepository.update(user.id, {
      resetToken: token,
      resetTokenExpiry: expiry,
    });

    await this.mailService.sendResetPasswordEmail(user.email, token);
    return { message: 'E-mail de redefinição enviado' };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const user = await this.userRepository.findOneBy({ resetToken: resetPasswordDto.token });
    if (!user || !user.resetTokenExpiry || user.resetTokenExpiry < new Date()) {
      throw new UnauthorizedException('Token inválido ou expirado');
    }

    const hashedPassword = await bcrypt.hash(resetPasswordDto.newPassword, 10);
    await this.userRepository.update(user.id, {
      password: hashedPassword,
      resetToken: null,
      resetTokenExpiry: null,
    });

    return { message: 'Senha redefinida com sucesso' };
  }

  async uploadProfileImage(file: Express.Multer.File) {
    const userId = 1; // Substitua por lógica para obter o ID do usuário autenticado
    const imagePath = `/uploads/${file.filename}`;
    await this.userRepository.update(userId, { profileImage: imagePath });
    return { imagePath };
  }
}