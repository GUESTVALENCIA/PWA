/**
 * Router Principal
 */

import express from 'express';
import projectRoutes from './projects.js';
import readRoutes from './read.js';
import proposeRoutes from './propose.js';
import reviewRoutes from './review.js';
import unifyRoutes from './unify.js';
import implementRoutes from './implement.js';
import contextRoutes from './context.js';

const router = express.Router();

// Montar todas las rutas
router.use('/projects', projectRoutes);
router.use('/', readRoutes);
router.use('/', proposeRoutes);
router.use('/', reviewRoutes);
router.use('/', unifyRoutes);
router.use('/', implementRoutes);
router.use('/', contextRoutes);

export default router;
