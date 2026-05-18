import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

// Servicio de autenticación: gestiona registro, login y validación de usuarios
@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  // Registra un nuevo usuario: verifica que el email no exista, crea el usuario y devuelve token JWT
  // El primer usuario registrado en el sistema se convierte automáticamente en admin
  async register(registerDto: RegisterDto) {
    const { email, password, nombre } = registerDto;

    // Verifica si el email ya está registrado
    const existingUser = await this.userRepository.findOne({ where: { email } });
    if (existingUser) {
      throw new ConflictException('El email ya está registrado');
    }

    // Si no hay ningún admin en la BD, el primer registro será admin
    const adminCount = await this.userRepository.count({ where: { rol: 'admin' } });
    const rol = adminCount === 0 ? 'admin' : 'user';

    // Crea el usuario (la contraseña se cifra automáticamente con @BeforeInsert en la entidad)
    const user = this.userRepository.create({ email, password, nombre, rol });
    await this.userRepository.save(user);

    // Genera y devuelve un token JWT con los datos del usuario
    const payload = { email: user.email, sub: user.id, nombre: user.nombre, rol: user.rol };
    return {
      message: 'Usuario registrado correctamente',
      access_token: this.jwtService.sign(payload),
    };
  }

  // Inicia sesión: verifica credenciales y devuelve token JWT
  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // Busca el usuario por email
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Compara la contraseña recibida con la almacenada (cifrada con bcrypt)
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Genera y devuelve un token JWT
    const payload = { email: user.email, sub: user.id, nombre: user.nombre, rol: user.rol };
    return {
      message: 'Login correcto',
      access_token: this.jwtService.sign(payload),
    };
  }

  // Valida las credenciales de un usuario (usado por LocalStrategy)
  // Devuelve el usuario sin la contraseña si es válido, o null si no
  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.userRepository.findOne({ where: { email } });
    if (user && (await bcrypt.compare(password, user.password))) {
      const { password: _, ...result } = user;
      return result;
    }
    return null;
  }
}
