import { PrivateRoutes } from '@/constants';
import { authorize } from '@/core/middleware/auth/authorize';
import { Router } from 'express';
import { userControllers } from '../controller/user.controllers';
import { asyncHandler } from '@/core/errors';

const userRouterPaths: Router = Router();

/**
 * @swagger
 * /user/profile:
 *   get:
 *     summary: Get user profile information
 *     description: Retrieves the profile information for the authenticated user
 *     security:
 *       - bearerAuth: []
 *     tags:
 *       - Users
 *     responses:
 *       200:
 *         description: Successfully retrieved user profile
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 uuid:
 *                   type: string
 *                 email:
 *                   type: string
 *                 name:
 *                   type: string
 *       401:
 *         description: Unauthorized - Invalid or missing authentication token
 *       404:
 *         description: User profile not found
 *       500:
 *         description: Internal server error
 */
userRouterPaths.get(PrivateRoutes.PROFILE, authorize, asyncHandler(userControllers.getUserByUuid));

/**
 * @swagger
 * /user:
 *   get:
 *     summary: Get all users
 *     security:
 *       - bearerAuth: []
 *     tags:
 *       - Users
 *     responses:
 *       200:
 *         description: Successfully retrieved all users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   uuid:
 *                     type: string
 *                   email:
 *                     type: string
 *                   name:
 *                     type: string
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized - Invalid or missing authentication token
 *       500:
 *         description: Internal server error
 */
userRouterPaths.get('/', authorize, asyncHandler(userControllers.getAllUsers));

/**
 * @swagger
 * /user/{email}:
 *   get:
 *     summary: Get user by email
 *     security:
 *       - bearerAuth: []  # 👈 esta línea protege el endpoint
 *     tags:
 *       - Users
 *     parameters:
 *       - in: path
 *         name: email
 *         schema:
 *           type: string
 *         required: true
 *         description: User email
 *     responses:
 *       200:
 *         description: User data
 */
userRouterPaths.get('/:email', authorize, asyncHandler(userControllers.getUserByEmail));

/**
 * @swagger
 * /user/{uuid}:
 *   put:
 *     summary: Update a user
 *     security:
 *       - bearerAuth: []  # 👈 esta línea protege el endpoint
 *     tags:
 *       - Users
 *     parameters:
 *       - in: path
 *         name: uuid
 *         schema:
 *           type: string
 *         required: true
 *         description: User ID
 *     requestBody:
 *       required: true
 *     responses:
 *       200:
 *         description: Updated user
 */
userRouterPaths.put('/:uuid', authorize, asyncHandler(userControllers.updateUser));

/**
 * @swagger
 * /user/{id}:
 *   delete:
 *     summary: Delete a user
 *     security:
 *       - bearerAuth: []  # 👈 esta línea protege el endpoint
 *     tags:
 *       - Users
 *     parameters:
 *       - in: path
 *         name: uuid
 *         schema:
 *           type: string
 *         required: true
 *         description: User ID
 *     responses:
 *       204:
 *         description: User deleted
 */
userRouterPaths.delete('/:uuid', authorize, asyncHandler(userControllers.deleteUser));

export default userRouterPaths;
