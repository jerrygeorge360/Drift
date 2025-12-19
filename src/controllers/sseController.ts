import { Request, Response } from 'express';
import { analysisEmitter } from '../modules/sse/sseEmitter.js';

export const sseAnalysisHandler = (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    console.log('[SSE] Client connected');

    const onNewAnalysis = (data: any) => {
        res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    analysisEmitter.on('new_analysis', onNewAnalysis);

    req.on('close', () => {
        console.log('[SSE] Client disconnected');
        analysisEmitter.off('new_analysis', onNewAnalysis);
    });
};
