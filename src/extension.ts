import * as vscode from 'vscode';
import { CarbonTracker } from './carbonTracker';
import { CarbonStatsProvider } from './carbonStatsProvider';
import { ClaudeDataMonitor } from './claudeDataMonitor';

let carbonTracker: CarbonTracker;
let statusBarItem: vscode.StatusBarItem;
let dataMonitor: ClaudeDataMonitor;

export function activate(context: vscode.ExtensionContext) {
    console.log('Claude Carbon Tracker is now active');

    // Initialize the carbon tracker with milestone callback
    carbonTracker = new CarbonTracker(context, (message: string, emoji: string) => {
        // Show milestone notification
        vscode.window.showInformationMessage(`🌿 ${message}`, 'View Stats', 'Dismiss').then(selection => {
            if (selection === 'View Stats') {
                vscode.commands.executeCommand('claude-carbon-tracker.showStats');
            }
        });
    });

    // Create status bar item
    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBarItem.command = 'claude-carbon-tracker.showStats';
    context.subscriptions.push(statusBarItem);

    // Register the stats tree view provider
    const statsProvider = new CarbonStatsProvider(carbonTracker);
    vscode.window.registerTreeDataProvider('claudeCarbonStats', statsProvider);

    // Register commands
    context.subscriptions.push(
        vscode.commands.registerCommand('claude-carbon-tracker.showStats', () => {
            const stats = carbonTracker.getStats();
            vscode.window.showInformationMessage(
                `Carbon Emissions: ${stats.totalCO2.toFixed(4)} kg CO₂ | Tokens: ${stats.totalTokens.toLocaleString()} | Requests: ${stats.requestCount}`
            );
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('claude-carbon-tracker.resetStats', () => {
            vscode.window.showWarningMessage(
                'Are you sure you want to reset carbon tracking statistics?',
                'Yes',
                'No'
            ).then(selection => {
                if (selection === 'Yes') {
                    carbonTracker.resetStats();
                    statsProvider.refresh();
                    vscode.window.showInformationMessage('Carbon tracking statistics have been reset');
                }
            });
        })
    );

    // Update status bar periodically
    updateStatusBar();
    const interval = setInterval(updateStatusBar, 5000);
    context.subscriptions.push({ dispose: () => clearInterval(interval) });

    // Start monitoring (this will be implemented to hook into Claude Code)
    startMonitoring(context);
}

function updateStatusBar() {
    const config = vscode.workspace.getConfiguration('claudeCarbonTracker');
    if (config.get('showInStatusBar', true)) {
        const stats = carbonTracker.getStats();
        const currentTier = carbonTracker.getCurrentMilestoneTier();

        // Show tier emoji + CO₂ amount
        statusBarItem.text = `${currentTier.emoji} ${stats.totalCO2.toFixed(4)} kg CO₂`;
        statusBarItem.tooltip = `Carbon Emissions from Claude Code\n${currentTier.name}: ${currentTier.equivalent}\n${stats.totalTokens.toLocaleString()} tokens | ${stats.requestCount} requests`;
        statusBarItem.show();
    } else {
        statusBarItem.hide();
    }
}

function startMonitoring(context: vscode.ExtensionContext) {
    // Initialize the Claude data monitor
    dataMonitor = new ClaudeDataMonitor(carbonTracker);

    // Start monitoring Claude's JSONL files
    dataMonitor.start();

    // Add a command to check monitoring status
    context.subscriptions.push(
        vscode.commands.registerCommand('claude-carbon-tracker.monitoringStatus', () => {
            const status = dataMonitor.getMonitoringStatus();
            vscode.window.showInformationMessage(
                `Monitoring: ${status.isMonitoring ? 'Active' : 'Inactive'} | ` +
                `Paths found: ${status.pathsFound} | ` +
                `Messages processed: ${status.messagesProcessed}`
            );
        })
    );

    console.log('Claude data monitoring started');
}

export function deactivate() {
    if (dataMonitor) {
        dataMonitor.stop();
    }
    console.log('Claude Carbon Tracker deactivated');
}
