import * as vscode from 'vscode';
import { checkForSpecificMilestone, getCurrentTier, getNextMilestone, getProgressToNextMilestone } from './milestones';

export interface CarbonStats {
    totalTokens: number;
    totalCO2: number;
    requestCount: number;
    inputTokens: number;
    outputTokens: number;
    startDate: Date;
    lastUpdated: Date;
}

export interface TokenUsage {
    inputTokens: number;
    outputTokens: number;
    modelName?: string;
    timestamp: Date;
}

export class CarbonTracker {
    private stats!: CarbonStats;
    private context: vscode.ExtensionContext;
    private emissionFactor!: number;
    private onMilestoneReached?: (message: string, emoji: string) => void;

    constructor(context: vscode.ExtensionContext, onMilestoneReached?: (message: string, emoji: string) => void) {
        this.context = context;
        this.onMilestoneReached = onMilestoneReached;
        this.loadStats();
        this.loadConfig();

        // Watch for configuration changes
        vscode.workspace.onDidChangeConfiguration(e => {
            if (e.affectsConfiguration('claudeCarbonTracker.emissionFactor')) {
                this.loadConfig();
                this.recalculateCO2();
            }
        });
    }

    private loadConfig() {
        const config = vscode.workspace.getConfiguration('claudeCarbonTracker');
        this.emissionFactor = config.get('emissionFactor', 0.0004);
    }

    private loadStats() {
        const savedStats = this.context.globalState.get<CarbonStats>('carbonStats');
        if (savedStats) {
            this.stats = {
                ...savedStats,
                startDate: new Date(savedStats.startDate),
                lastUpdated: new Date(savedStats.lastUpdated)
            };
        } else {
            this.stats = {
                totalTokens: 0,
                totalCO2: 0,
                requestCount: 0,
                inputTokens: 0,
                outputTokens: 0,
                startDate: new Date(),
                lastUpdated: new Date()
            };
        }
    }

    private async saveStats() {
        await this.context.globalState.update('carbonStats', this.stats);
    }

    public trackUsage(usage: TokenUsage) {
        const totalTokens = usage.inputTokens + usage.outputTokens;
        const co2Kg = (totalTokens / 1000) * this.emissionFactor;

        // Store previous CO2 for milestone checking
        const previousCO2 = this.stats.totalCO2;

        this.stats.totalTokens += totalTokens;
        this.stats.inputTokens += usage.inputTokens;
        this.stats.outputTokens += usage.outputTokens;
        this.stats.totalCO2 += co2Kg;
        this.stats.requestCount += 1;
        this.stats.lastUpdated = new Date();

        this.saveStats();

        // Check for milestone achievements
        this.checkMilestones(previousCO2, this.stats.totalCO2);

        console.log(`Tracked usage: ${totalTokens} tokens = ${co2Kg.toFixed(6)} kg CO₂`);
    }

    private checkMilestones(previousCO2: number, currentCO2: number) {
        // Check for specific milestone
        const specificMilestone = checkForSpecificMilestone(previousCO2, currentCO2);
        if (specificMilestone && this.onMilestoneReached) {
            this.onMilestoneReached(specificMilestone.message, specificMilestone.emoji);
        }

        // Check for tier change
        const previousTier = getCurrentTier(previousCO2);
        const currentTier = getCurrentTier(currentCO2);

        if (previousTier.id !== currentTier.id && this.onMilestoneReached) {
            const message = `${currentTier.emoji} You've reached "${currentTier.name}" tier! Equivalent to: ${currentTier.equivalent}`;
            this.onMilestoneReached(message, currentTier.emoji);
        }
    }

    public getStats(): CarbonStats {
        return { ...this.stats };
    }

    public async resetStats() {
        this.stats = {
            totalTokens: 0,
            totalCO2: 0,
            requestCount: 0,
            inputTokens: 0,
            outputTokens: 0,
            startDate: new Date(),
            lastUpdated: new Date()
        };
        await this.saveStats();
    }

    private recalculateCO2() {
        // Recalculate CO2 based on new emission factor
        this.stats.totalCO2 = (this.stats.totalTokens / 1000) * this.emissionFactor;
        this.saveStats();
    }

    public getEmissionFactor(): number {
        return this.emissionFactor;
    }

    public getEquivalents() {
        const co2 = this.stats.totalCO2;

        // Various equivalents for perspective
        return {
            treesNeeded: (co2 / 21).toFixed(2), // Trees needed for 1 year to offset
            kmDriven: (co2 / 0.12).toFixed(2), // km driven in average car
            smartphones: (co2 / 0.011).toFixed(0), // smartphones charged
            lightBulb: (co2 / 0.0006).toFixed(0) // hours of 60W bulb
        };
    }

    public getCurrentMilestoneTier() {
        return getCurrentTier(this.stats.totalCO2);
    }

    public getNextMilestone() {
        return getNextMilestone(this.stats.totalCO2);
    }

    public getMilestoneProgress() {
        return getProgressToNextMilestone(this.stats.totalCO2);
    }
}
