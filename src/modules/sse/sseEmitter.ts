import pkg from 'pg';
const { Client } = pkg;
import { EventEmitter } from 'events';
import * as dotenv from 'dotenv';

dotenv.config();

interface AnalysisNotification {
    id: string;
    [key: string]: any;
}

class AnalysisEmitter extends EventEmitter {
    private client: pkg.Client | null = null;
    private isConnecting: boolean = false;

    constructor() {
        super();
    }

    async start() {
        if (this.isConnecting) return;
        this.isConnecting = true;

        try {
            // Always clean up old client if it exists
            if (this.client) {
                try {
                    await this.client.end();
                } catch (e) {
                    console.error('[AnalysisEmitter] Error closing old client:', e);
                }
                this.client = null;
            }

            this.client = new Client({
                connectionString: process.env.DATABASE_URL,
            });

            await this.client.connect();
            console.log('[AnalysisEmitter] Connected to Postgres for LISTEN');

            await this.client.query('LISTEN analysis_update');

            this.client.on('notification', (msg) => {
                if (msg.channel === 'analysis_update' && msg.payload) {
                    try {
                        const data: AnalysisNotification = JSON.parse(msg.payload);
                        console.log('[AnalysisEmitter] Received notification:', data.id);
                        this.emit('new_analysis', data);
                    } catch (e) {
                        console.error('[AnalysisEmitter] Failed to parse notification payload:', e);
                    }
                }
            });

            this.client.on('error', (err) => {
                console.error('[AnalysisEmitter] Postgres client error:', err);
                this.reconnect();
            });

            this.isConnecting = false;
        } catch (error) {
            console.error('[AnalysisEmitter] Failed to start:', error);
            this.isConnecting = false;
            this.reconnect();
        }
    }

    private reconnect() {
        console.log('[AnalysisEmitter] Reconnecting in 5 seconds...');
        setTimeout(() => this.start(), 5000);
    }
}

export const analysisEmitter = new AnalysisEmitter();
analysisEmitter.start();

