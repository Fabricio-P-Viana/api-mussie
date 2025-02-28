import { Injectable, UnauthorizedException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { MailService } from './mail.service';
import { v4 as uuidv4 } from 'uuid';
import { UpdateUserDto } from '../users/dto/update-user.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
    private mailService: MailService,
  ) {}

  async getPortfolio(userId: number): Promise<{ id: number; name: string; nameConfectionery: string; phone: string; recipes: any[] }> {
    try {
      const user = await this.userRepository.findOne({
        where: { id: userId },
        relations: ['recipes'],
      });
      if (!user) {
        throw new BadRequestException('Usuário não encontrado');
      }
      return {
        id: user.id,
        name: user.name,
        nameConfectionery: user.nameConfectionery || '',
        phone: user.phone || '',
        recipes: user.recipes.map(recipe => ({
          id: recipe.id,
          name: recipe.name,
          price: recipe.price,
          description: recipe.description,
          image: recipe.image,
        })),
      };
    } catch (error) {
      console.error('Erro ao buscar portfólio:', error);
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException('Erro ao buscar portfólio');
    }
  }

  async register(registerDto: RegisterDto): Promise<{ access_token: string; refresh_token: string }> {
    try {
      const hashedPassword = await bcrypt.hash(registerDto.password, 10);
      const user = this.userRepository.create({
        email: registerDto.email,
        password: hashedPassword,
        name: registerDto.name,
        nameConfectionery: registerDto.nameConfectionery || null,
        phone: registerDto.phone || null,
      });
      const savedUser = await this.userRepository.save(user);
      const payload = { email: savedUser.email, sub: savedUser.id };
      const accessToken = this.jwtService.sign(payload);
      const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });
      await this.userRepository.update(savedUser.id, { refreshToken });
      return { access_token: accessToken, refresh_token: refreshToken };
    } catch (error) {
      console.error('Erro ao registrar usuário:', error);
      if (error.code === '23505') { // Erro de duplicidade no PostgreSQL (email único)
        throw new BadRequestException('E-mail já registrado');
      }
      throw new InternalServerErrorException('Erro ao registrar usuário');
    }
  }

  async login(loginDto: LoginDto): Promise<{ access_token: string; refresh_token: string }> {
    try {
      const user = await this.userRepository.findOneBy({ email: loginDto.email });
      if (!user || !(await bcrypt.compare(loginDto.password, user.password))) {
        throw new UnauthorizedException('Credenciais inválidas');
      }
      const payload = { email: user.email, sub: user.id };
      const accessToken = this.jwtService.sign(payload);
      const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });
      await this.userRepository.update(user.id, { refreshToken });
      return { access_token: accessToken, refresh_token: refreshToken };
    } catch (error) {
      console.error('Erro ao fazer login:', error);
      if (error instanceof UnauthorizedException) throw error;
      throw new InternalServerErrorException('Erro ao fazer login');
    }
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    try {
      const user = await this.userRepository.findOneBy({ email: forgotPasswordDto.email });
      if (!user) return { message: 'E-mail de redefinição enviado (se o usuário existir)' };

      const token = uuidv4();
      const expiry = new Date();
      expiry.setHours(expiry.getHours() + 1);

      await this.userRepository.update(user.id, {
        resetToken: token,
        resetTokenExpiry: expiry,
      });

      await this.mailService.sendResetPasswordEmail(user.email, token);
      return { message: 'E-mail de redefinição enviado' };
    } catch (error) {
      console.error('Erro ao solicitar redefinição de senha:', error);
      throw new InternalServerErrorException('Erro ao processar solicitação de redefinição de senha');
    }
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    try {
      const user = await this.userRepository.findOneBy({ resetToken: resetPasswordDto.token });
      if (!user || (user.resetTokenExpiry && user.resetTokenExpiry < new Date())) {
        throw new UnauthorizedException('Token inválido ou expirado');
      }

      const hashedPassword = await bcrypt.hash(resetPasswordDto.newPassword, 10);
      await this.userRepository.update(user.id, {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
      });

      return { message: 'Senha redefinida com sucesso' };
    } catch (error) {
      console.error('Erro ao redefinir senha:', error);
      if (error instanceof UnauthorizedException) throw error;
      throw new InternalServerErrorException('Erro ao redefinir senha');
    }
  }

  async uploadProfileImage(userId: number, file: Express.Multer.File) {
    try {
      if (!file) throw new BadRequestException('Imagem é obrigatória para este endpoint');
      const user = await this.userRepository.findOneBy({ id: userId });
      if (!user) throw new BadRequestException('Usuário não encontrado');
      const imagePath = `/uploads/${file.filename}`;
      await this.userRepository.update(userId, { profileImage: imagePath });
      return { imagePath };
    } catch (error) {
      console.error('Erro ao fazer upload da imagem de perfil:', error);
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException('Erro ao fazer upload da imagem de perfil');
    }
  }

  async updateProfile(userId: number, updateUserDto: UpdateUserDto): Promise<User> {
    try {
      const user = await this.userRepository.findOneBy({ id: userId });
      if (!user) throw new BadRequestException('Usuário não encontrado');

      await this.userRepository.update(userId, {
        name: updateUserDto.name || user.name,
        nameConfectionery: updateUserDto.nameConfectionery ?? user.nameConfectionery,
        phone: updateUserDto.phone ?? user.phone,
      });

      const updatedUser = await this.userRepository.findOneBy({ id: userId });
      if (!updatedUser) throw new BadRequestException('Usuário não encontrado após atualização');
      return updatedUser;
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException('Erro ao atualizar perfil');
    }
  }

  async refreshToken(refreshTokenDto: RefreshTokenDto): Promise<{ access_token: string; refresh_token: string }> {
    try {
      const { refreshToken } = refreshTokenDto;
      const user = await this.userRepository.findOneBy({ refreshToken });
      if (!user) throw new UnauthorizedException('Refresh token inválido');

      const payload = this.jwtService.verify(refreshToken);
      if (payload.sub !== user.id) throw new UnauthorizedException('Refresh token inválido');

      const newPayload = { email: user.email, sub: user.id };
      const accessToken = this.jwtService.sign(newPayload);
      const newRefreshToken = this.jwtService.sign(newPayload, { expiresIn: '7d' });

      await this.userRepository.update(user.id, { refreshToken: newRefreshToken });
      return { access_token: accessToken, refresh_token: newRefreshToken };
    } catch (error) {
      console.error('Erro ao renovar token:', error);
      if (error instanceof UnauthorizedException) throw error;
      throw new InternalServerErrorException('Erro ao renovar token');
    }
  }
}