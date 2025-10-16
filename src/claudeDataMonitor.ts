import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { CarbonTracker, TokenUsage } from './carbonTracker';

export interface ClaudeMessage {
    id: string;
    timestamp: Date;
    role: string;
    usage?: {
        input_tokens: number;
        output_tokens: number;
        cache_creation_input_tokens?: number;
        cache_read_input_tokens?: number;
    };
}

export class ClaudeDataMonitor {
    private carbonTracker: CarbonTracker;
    private processedMessages: Set<string> = new Set();
    private monitorInterval?: NodeJS.Timeout;
    private claudeDataPaths: string[];

    constructor(carbonTracker: CarbonTracker) {
        this.carbonTracker = carbonTracker;
        this.claudeDataPaths = this.getClaudeDataPaths();
    }

    private getClaudeDataPaths(): string[] {
        const homeDir = os.homedir();
        const paths: string[] = [];

        if (process.platform === 'win32') {
            // Windows
            paths.push(path.join(homeDir, '.claude', 'projects'));
        } else if (process.platform === 'darwin') {
            // macOS
            paths.push(path.join(homeDir, '.claude', 'projects'));
            paths.push(path.join(homeDir, '.config', 'claude', 'projects'));
        } else {
            // Linux
            paths.push(path.join(homeDir, '.config', 'claude', 'projects'));
            paths.push(path.join(homeDir, '.claude', 'projects'));
        }

        // Filter to only existing paths
        return paths.filter(p => {
            try {
                return fs.existsSync(p);
            } catch {
                return false;
            }
        });
    }

    public start() {
        console.log('Starting Claude data monitoring...');
        console.log('Monitoring paths:', this.claudeDataPaths);

        if (this.claudeDataPaths.length === 0) {
            vscode.window.showWarningMessage(
                'Claude Carbon Tracker: Could not find Claude data directory. Make sure Claude Code is installed and has been used at least once.'
            );
            return;
        }

        // Initial scan
        this.scanForNewMessages();

        // Poll every 5 seconds for new messages
        this.monitorInterval = setInterval(() => {
            this.scanForNewMessages();
        }, 5000);
    }

    public stop() {
        if (this.monitorInterval) {
            clearInterval(this.monitorInterval);
            this.monitorInterval = undefined;
        }
    }

    private async scanForNewMessages() {
        for (const basePath of this.claudeDataPaths) {
            try {
                if (!fs.existsSync(basePath)) {
                    continue;
                }

                const projectDirs = fs.readdirSync(basePath);

                for (const projectDir of projectDirs) {
                    const projectPath = path.join(basePath, projectDir);

                    try {
                        const stats = fs.statSync(projectPath);
                        if (!stats.isDirectory()) {
                            continue;
                        }

                        const files = fs.readdirSync(projectPath)
                            .filter(f => f.endsWith('.jsonl'));

                        for (const file of files) {
                            const filePath = path.join(projectPath, file);
                            await this.parseAndTrackFile(filePath);
                        }
                    } catch (err) {
                        // Skip directories we can't access
                        console.warn(`Could not access project directory: ${projectDir}`, err);
                    }
                }
            } catch (err) {
                console.warn(`Error scanning ${basePath}:`, err);
            }
        }
    }

    private async parseAndTrackFile(filePath: string) {
        try {
            const messages = await this.parseSessionFile(filePath);

            for (const message of messages) {
                // Skip if already processed
                if (this.processedMessages.has(message.id)) {
                    continue;
                }

                // Track the usage if present
                if (message.usage) {
                    const usage: TokenUsage = {
                        inputTokens: message.usage.input_tokens,
                        outputTokens: message.usage.output_tokens,
                        timestamp: message.timestamp
                    };

                    this.carbonTracker.trackUsage(usage);
                }

                // Mark as processed
                this.processedMessages.add(message.id);
            }
        } catch (err) {
            console.warn(`Error parsing file ${filePath}:`, err);
        }
    }

    private async parseSessionFile(filePath: string): Promise<ClaudeMessage[]> {
        const content = await fs.promises.readFile(filePath, 'utf-8');
        const lines = content.split('\n').filter(line => line.trim().length > 0);
        const messages: ClaudeMessage[] = [];

        for (const line of lines) {
            try {
                const parsed = JSON.parse(line);

                // Skip summary entries or entries without messages
                if (parsed.type === 'summary' || !parsed.message) {
                    continue;
                }

                const msg = parsed.message;

                const message: ClaudeMessage = {
                    id: msg.id || parsed.uuid || `${filePath}-${messages.length}`,
                    timestamp: parsed.timestamp ? new Date(parsed.timestamp) : new Date(),
                    role: msg.role || 'user',
                    usage: msg.usage ? {
                        input_tokens: msg.usage.input_tokens || 0,
                        output_tokens: msg.usage.output_tokens || 0,
                        cache_creation_input_tokens: msg.usage.cache_creation_input_tokens,
                        cache_read_input_tokens: msg.usage.cache_read_input_tokens
                    } : undefined
                };

                messages.push(message);
            } catch (err) {
                // Skip invalid JSON lines
                console.warn(`Could not parse line in ${filePath}:`, err);
            }
        }

        return messages;
    }

    public getMonitoringStatus(): { isMonitoring: boolean; pathsFound: number; messagesProcessed: number } {
        return {
            isMonitoring: this.monitorInterval !== undefined,
            pathsFound: this.claudeDataPaths.length,
            messagesProcessed: this.processedMessages.size
        };
    }
}
