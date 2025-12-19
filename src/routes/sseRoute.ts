import * as express from 'express';
import { sseAnalysisHandler } from '../controllers/sseController.js';

const sseRouter = express.Router();

sseRouter.get('/analysis', sseAnalysisHandler);

export default sseRouter;
