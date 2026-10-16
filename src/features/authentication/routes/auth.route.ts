import { PublicRoutes } from '@/constants';
import { AuthenticationGoogleController } from '@/features/authentication/controllers/authGoogle.controller';
import changePasswordController from '@/features/authentication/controllers/changePassword.controller';
import {
  changePasswordSchema,
  forgotPasswordSchema,
  googleLoginSchema,
  verifyCodeSchema,
} from '@/features/authentication/schemas/passwordReset.schemas';
import { Router } from 'express';
import { authenticationController } from '@/features/authentication/controllers/auth.controller';
import { asyncHandler } from '@/core/errors';
import { validateWithZod } from '@/core/middleware/validate/validateWithZod';
import { loginSchema, registerSchema } from '@/features/authentication/schemas/auth.schemas';

const authenticationPaths: Router = Router();

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 example: Password123!
 *               username:
 *                 type: string
 *                 example: johndoe
 *     responses:
 *       200:
 *         description: User registered successfully, returns a JWT
 *       400:
 *         description: Bad request
 */
authenticationPaths.post(
  PublicRoutes.REGISTER,
  validateWithZod(registerSchema, 'body'),
  asyncHandler(authenticationController.register),
);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Log in a user
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 example: Password123!
 *     responses:
 *       200:
 *         description: User logged in successfully
 *       401:
 *         description: Unauthorized
 */
authenticationPaths.post(
  PublicRoutes.LOGIN,
  validateWithZod(loginSchema, 'body'),
  asyncHandler(authenticationController.login),
);

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     summary: Request a password reset code
 *     description: >
 *       Responde siempre lo mismo, exista o no el email, para no revelar qué
 *       correos tienen cuenta.
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: user@example.com
 *     responses:
 *       200:
 *         description: Code sent when the email exists
 *       400:
 *         description: Invalid email
 */
authenticationPaths.post(
  PublicRoutes.FORGOT_PASSWORD,
  validateWithZod(forgotPasswordSchema),
  asyncHandler(changePasswordController.sendCode),
);

/**
 * @swagger
 * /auth/verify-code:
 *   post:
 *     summary: Verify the password reset code
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: user@example.com
 *               code:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Code verified, returns a single-use token
 *       400:
 *         description: The code is incorrect or expired
 */
authenticationPaths.post(
  PublicRoutes.VARIFY_CODE,
  validateWithZod(verifyCodeSchema),
  asyncHandler(changePasswordController.verifyCode),
);

/**
 * @swagger
 * /auth/change-password:
 *   post:
 *     summary: Change the user's password
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: user@example.com
 *               token:
 *                 type: string
 *                 description: Token devuelto por verify-code
 *               newPassword:
 *                 type: string
 *                 example: NuevaClave1!
 *     responses:
 *       200:
 *         description: Password updated
 *       400:
 *         description: Invalid payload or weak password
 *       401:
 *         description: Invalid or expired reset token
 */
authenticationPaths.post(
  PublicRoutes.CHANGE_PASSWORD,
  validateWithZod(changePasswordSchema),
  asyncHandler(changePasswordController.changePassword),
);

/**
 * @swagger
 * /auth/google:
 *   post:
 *     summary: Log in a user using Google authentication
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code:
 *                 type: string
 *                 description: Authorization code issued by Google
 *     responses:
 *       200:
 *         description: Logged in, returns a JWT
 *       401:
 *         description: Google rejected the code
 *       409:
 *         description: The email is registered with another method
 */
authenticationPaths.post(
  PublicRoutes.GOOGLE_LOGIN,
  validateWithZod(googleLoginSchema),
  asyncHandler(AuthenticationGoogleController.login),
);

export default authenticationPaths;
