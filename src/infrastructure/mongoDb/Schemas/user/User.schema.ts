import { Schema } from 'mongoose';
import crypto from 'node:crypto';
import PasswordHelpers from '@/lib/Passwords/PasswordHelpers';
import { CustomError } from '@/lib';
import { AuthMethods, User } from '@/features/user/interfaces/user.types';
import { PASSWORD_RULE_MESSAGE } from '@/features/authentication/schemas/password.schema';

const UserMongoSchema = new Schema<User>(
  {
    uuid: {
      type: String,
      required: true,
      unique: true,
      default: () => crypto.randomUUID(),
    },
    username: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      validate: {
        validator: (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
        message: 'Email is not valid',
      },
    },
    password: {
      type: String,
      required: true,
      trim: true,
    },
    authenticationMethod: {
      type: String,
      required: true,
      enum: Object.values(AuthMethods),
      default: AuthMethods.BASIC,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

UserMongoSchema.pre('save', async function (next) {
  // Si el usuario se autentica con Google y ya tiene una contraseña, solo la encriptamos
  if (this.authenticationMethod === 'GOOGLE') {
    if (!this.password) {
      // Generar una contraseña aleatoria si no tiene una
      this.password = PasswordHelpers.generateSecurePassword(this.username);
    }
  } else {
    // Validar la contraseña solo si el método de autenticación no es GOOGLE.
    // Es la misma regla que aplica el schema de Zod, para que una contraseña
    // inválida se rechace en la capa de entrada y no reviente acá con un 500.
    if (!PasswordHelpers.validateCharacters(this.password)) {
      return next(CustomError(400, PASSWORD_RULE_MESSAGE));
    }
  }
  this.password = PasswordHelpers.generateHashing(this.password, 12);
  next();
});

export default UserMongoSchema;
