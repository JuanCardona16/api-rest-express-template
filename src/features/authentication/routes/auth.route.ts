import { PublicRoutes } from '@/constants';
import { Router } from 'express';
import { authenticationController } from '@/features/authentication/modules/basic/controllers/auth.controller';
import changePasswordController from '@/features/authentication/modules/change-password/controllers/changePassword.controller';
import AuthenticationGoogleController from '@/features/authentication/modules/google/controllers/authGoogle.controller';
import { asyncHandler } from '@/core/errors';
import { validateWithZod } from '@/core/middleware/validate/validateWithZod';
import { loginSchema, registerSchema } from '../modules/basic/schemas/auth.schemas';

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
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Bad request
 */
authenticationPaths.post(
  PublicRoutes.REGISTER,
  validateWithZod(registerSchema, 'body'),
  asyncHandler(authenticationController.register)
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
  asyncHandler(authenticationController.login)
);

// /**
//  * @swagger
//  * /forgot-password:
//  *   post:
//  *     summary: Send a password reset code to the user's email
//  *     tags:
//  *       - Authentication
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             type: object
//  *             properties:
//  *               email:
//  *                 type: string
//  *                 example: user@example.com
//  *     responses:
//  *       200:
//  *         description: Reset code sent successfully
//  *       404:
//  *         description: User not found
//  */
// authenticationPaths.post(
//   PublicRoutes.FORGOT_PASSWORD,
//   asyncHandler(changePasswordController.sendCode)
// );

// /**
//  * @swagger
//  * /verify-code:
//  *   post:
//  *     summary: Verify the password reset code
//  *     tags:
//  *       - Authentication
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             type: object
//  *             properties:
//  *               email:
//  *                 type: string
//  *                 example: user@example.com
//  *               code:
//  *                 type: string
//  *                 example: 123456
//  *     responses:
//  *       200:
//  *         description: Code verified successfully
//  *       400:
//  *         description: Invalid code
//  */
// authenticationPaths.post(
//   PublicRoutes.VARIFY_CODE,
//   asyncHandler(changePasswordController.verifyCode)
// );

// /**
//  * @swagger
//  * /change-password:
//  *   put:
//  *     summary: Change the user's password
//  *     tags:
//  *       - Authentication
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             type: object
//  *             properties:
//  *               email:
//  *                 type: string
//  *                 example: user@example.com
//  *               code:
//  *                 type: string
//  *                 example: 123456
//  *               newPassword:
//  *                 type: string
//  *                 example: NewPassword123!
//  *     responses:
//  *       200:
//  *         description: Password changed successfully
//  *       400:
//  *         description: Invalid request
//  */
// authenticationPaths.put(
//   PublicRoutes.CHANGE_PASSWORD,
//   asyncHandler(changePasswordController.changePassword)
// );

// /**
//  * @swagger
//  * /google-login:
//  *   post:
//  *     summary: Log in a user using Google authentication
//  *     tags:
//  *       - Authentication
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             type: object
//  *             properties:
//  *               token:
//  *                 type: string
//  *                 example: ya29.a0AfH6SM...
//  *     responses:
//  *       200:
//  *         description: User logged in successfully
//  *       401:
//  *         description: Unauthorized
//  */
// authenticationPaths.post(
//   PublicRoutes.GOOGLE_LOGIN,
//   asyncHandler(AuthenticationGoogleController.login)
// );

export default authenticationPaths;
