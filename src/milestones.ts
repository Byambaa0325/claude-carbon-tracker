export interface MilestoneTier {
    id: string;
    name: string;
    minCO2: number; // in kg
    maxCO2: number; // in kg
    emoji: string;
    equivalent: string;
    description: string;
    color: string; // for UI theming
}

export const MILESTONES: MilestoneTier[] = [
    {
        id: 'idle',
        name: 'Idle',
        minCO2: 0,
        maxCO2: 0.01, // 10g
        emoji: '💡',
        equivalent: 'One LED bulb for an hour',
        description: 'Just browsing code, reading docs, or quick edits',
        color: '#22c55e' // green
    },
    {
        id: 'light',
        name: 'Light Usage',
        minCO2: 0.01, // 10g
        maxCO2: 0.1, // 100g
        emoji: '☕',
        equivalent: 'Brewing a cup of coffee',
        description: 'Quick AI queries, code reviews, or small refactoring sessions',
        color: '#84cc16' // lime
    },
    {
        id: 'moderate',
        name: 'Moderate Session',
        minCO2: 0.1, // 100g
        maxCO2: 0.5, // 500g
        emoji: '🍳',
        equivalent: 'Cooking breakfast on a stove',
        description: 'Active coding session with continuous AI assistance',
        color: '#eab308' // yellow
    },
    {
        id: 'active',
        name: 'Active Development',
        minCO2: 0.5, // 500g
        maxCO2: 1.0, // 1kg
        emoji: '🍽️',
        equivalent: 'Cooking a full meal',
        description: 'Extended AI-assisted development, code generation, or refactoring',
        color: '#f59e0b' // amber
    },
    {
        id: 'intensive',
        name: 'Intensive Session',
        minCO2: 1.0, // 1kg
        maxCO2: 3.0, // 3kg
        emoji: '🚗',
        equivalent: 'Driving 8 km (5 miles)',
        description: 'Heavy AI usage with large context, multiple iterations, or complex tasks',
        color: '#f97316' // orange
    },
    {
        id: 'heavy',
        name: 'Heavy Usage',
        minCO2: 3.0, // 3kg
        maxCO2: 10.0, // 10kg
        emoji: '🏭',
        equivalent: 'Manufacturing a pair of jeans',
        description: 'Day-long AI-heavy development or batch processing',
        color: '#ef4444' // red
    },
    {
        id: 'power',
        name: 'Power User',
        minCO2: 10.0, // 10kg
        maxCO2: 50.0, // 50kg
        emoji: '✈️',
        equivalent: 'Short-haul flight (100 km)',
        description: 'Continuous AI assistance over multiple days or team usage',
        color: '#dc2626' // dark red
    },
    {
        id: 'extreme',
        name: 'Extreme Usage',
        minCO2: 50.0, // 50kg
        maxCO2: Infinity,
        emoji: '🌍',
        equivalent: 'A week of average electricity consumption',
        description: 'Extended team usage or automated systems over weeks',
        color: '#991b1b' // very dark red
    }
];

export function getCurrentTier(totalCO2Kg: number): MilestoneTier {
    for (const tier of MILESTONES) {
        if (totalCO2Kg >= tier.minCO2 && totalCO2Kg < tier.maxCO2) {
            return tier;
        }
    }
    // Return the last tier if over all limits
    return MILESTONES[MILESTONES.length - 1];
}

export function getNextMilestone(totalCO2Kg: number): MilestoneTier | null {
    const currentTier = getCurrentTier(totalCO2Kg);
    const currentIndex = MILESTONES.findIndex(t => t.id === currentTier.id);

    if (currentIndex < MILESTONES.length - 1) {
        return MILESTONES[currentIndex + 1];
    }

    return null; // Already at max tier
}

export function getProgressToNextMilestone(totalCO2Kg: number): number {
    const currentTier = getCurrentTier(totalCO2Kg);
    const range = currentTier.maxCO2 - currentTier.minCO2;
    const progress = totalCO2Kg - currentTier.minCO2;

    return Math.min(100, (progress / range) * 100);
}

// Additional interesting comparisons for specific milestones
export const SPECIFIC_MILESTONES = [
    {
        co2Kg: 0.025,
        emoji: '📧',
        equivalent: 'Sending 50 emails',
        message: 'You\'ve emitted as much CO₂ as sending 50 emails!'
    },
    {
        co2Kg: 0.05,
        emoji: '🔍',
        equivalent: 'An hour of Google searches',
        message: 'That\'s equivalent to an hour of web browsing!'
    },
    {
        co2Kg: 0.2,
        emoji: '🍫',
        equivalent: 'A chocolate bar',
        message: 'You\'ve emitted the carbon footprint of a chocolate bar!'
    },
    {
        co2Kg: 0.4,
        emoji: '🥤',
        equivalent: 'A liter of bottled water',
        message: 'Equivalent to producing a liter of bottled water!'
    },
    {
        co2Kg: 2.5,
        emoji: '🍕',
        equivalent: 'A large pizza',
        message: 'You\'ve reached the carbon footprint of a large pizza!'
    },
    {
        co2Kg: 5.0,
        emoji: '👕',
        equivalent: 'A cotton T-shirt',
        message: 'That\'s the same as manufacturing a T-shirt!'
    },
    {
        co2Kg: 20.0,
        emoji: '📱',
        equivalent: 'A smartphone',
        message: 'You\'ve emitted as much CO₂ as manufacturing a smartphone!'
    }
];

export function checkForSpecificMilestone(previousCO2Kg: number, currentCO2Kg: number): typeof SPECIFIC_MILESTONES[0] | null {
    for (const milestone of SPECIFIC_MILESTONES) {
        if (previousCO2Kg < milestone.co2Kg && currentCO2Kg >= milestone.co2Kg) {
            return milestone;
        }
    }
    return null;
}
