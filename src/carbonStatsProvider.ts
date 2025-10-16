import * as vscode from 'vscode';
import { CarbonTracker } from './carbonTracker';

export class CarbonStatsProvider implements vscode.TreeDataProvider<StatsItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<StatsItem | undefined | null | void> = new vscode.EventEmitter<StatsItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<StatsItem | undefined | null | void> = this._onDidChangeTreeData.event;

    constructor(private carbonTracker: CarbonTracker) {
        // Auto-refresh every 10 seconds
        setInterval(() => this.refresh(), 10000);
    }

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: StatsItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: StatsItem): Thenable<StatsItem[]> {
        if (!element) {
            // Root level items
            const stats = this.carbonTracker.getStats();
            const equivalents = this.carbonTracker.getEquivalents();
            const currentTier = this.carbonTracker.getCurrentMilestoneTier();
            const nextMilestone = this.carbonTracker.getNextMilestone();
            const progress = this.carbonTracker.getMilestoneProgress();

            const items = [
                new StatsItem(
                    `${currentTier.emoji} Current: ${currentTier.name}`,
                    vscode.TreeItemCollapsibleState.Collapsed,
                    'milestone'
                ),
                new StatsItem(
                    `Total CO₂: ${stats.totalCO2.toFixed(4)} kg`,
                    vscode.TreeItemCollapsibleState.None,
                    'flame'
                ),
                new StatsItem(
                    `Total Tokens: ${stats.totalTokens.toLocaleString()}`,
                    vscode.TreeItemCollapsibleState.Collapsed,
                    'symbol-number'
                ),
                new StatsItem(
                    `Requests: ${stats.requestCount}`,
                    vscode.TreeItemCollapsibleState.None,
                    'pulse'
                ),
                new StatsItem(
                    'Environmental Impact',
                    vscode.TreeItemCollapsibleState.Collapsed,
                    'globe'
                ),
                new StatsItem(
                    `Tracking since: ${stats.startDate.toLocaleDateString()}`,
                    vscode.TreeItemCollapsibleState.None,
                    'calendar'
                )
            ];

            return Promise.resolve(items);
        } else {
            // Child items
            const stats = this.carbonTracker.getStats();
            const equivalents = this.carbonTracker.getEquivalents();
            const currentTier = this.carbonTracker.getCurrentMilestoneTier();
            const nextMilestone = this.carbonTracker.getNextMilestone();
            const progress = this.carbonTracker.getMilestoneProgress();

            if (element.label && element.label.includes('Current:')) {
                const children = [
                    new StatsItem(
                        `≈ ${currentTier.equivalent}`,
                        vscode.TreeItemCollapsibleState.None,
                        'info'
                    ),
                    new StatsItem(
                        currentTier.description,
                        vscode.TreeItemCollapsibleState.None,
                        'note'
                    )
                ];

                if (nextMilestone) {
                    children.push(
                        new StatsItem(
                            `Next: ${nextMilestone.emoji} ${nextMilestone.name}`,
                            vscode.TreeItemCollapsibleState.None,
                            'arrow-up'
                        ),
                        new StatsItem(
                            `Progress: ${progress.toFixed(0)}%`,
                            vscode.TreeItemCollapsibleState.None,
                            'graph'
                        )
                    );
                }

                return Promise.resolve(children);
            } else if (element.label === `Total Tokens: ${stats.totalTokens.toLocaleString()}`) {
                return Promise.resolve([
                    new StatsItem(
                        `Input: ${stats.inputTokens.toLocaleString()}`,
                        vscode.TreeItemCollapsibleState.None,
                        'arrow-right'
                    ),
                    new StatsItem(
                        `Output: ${stats.outputTokens.toLocaleString()}`,
                        vscode.TreeItemCollapsibleState.None,
                        'arrow-left'
                    )
                ]);
            } else if (element.label === 'Environmental Impact') {
                return Promise.resolve([
                    new StatsItem(
                        `${equivalents.treesNeeded} trees/year needed`,
                        vscode.TreeItemCollapsibleState.None,
                        'symbol-color'
                    ),
                    new StatsItem(
                        `= ${equivalents.kmDriven} km driven`,
                        vscode.TreeItemCollapsibleState.None,
                        'dashboard'
                    ),
                    new StatsItem(
                        `= ${equivalents.smartphones} smartphones charged`,
                        vscode.TreeItemCollapsibleState.None,
                        'device-mobile'
                    ),
                    new StatsItem(
                        `= ${equivalents.lightBulb} hours of 60W bulb`,
                        vscode.TreeItemCollapsibleState.None,
                        'lightbulb'
                    )
                ]);
            }
        }

        return Promise.resolve([]);
    }
}

class StatsItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        iconId?: string
    ) {
        super(label, collapsibleState);
        if (iconId) {
            this.iconPath = new vscode.ThemeIcon(iconId);
        }
    }
}
