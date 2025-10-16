# Device-Level Carbon Emissions Methodology

This document outlines the methodology for incorporating local device power consumption into carbon footprint calculations for AI-assisted development.

## Overview

Total carbon emissions from AI-assisted development include:
1. **Remote AI Inference** (currently tracked) - API calls to Claude
2. **Local Device Power** (proposed addition) - Developer workstation energy consumption
3. **Network Infrastructure** (future consideration) - Data transmission

## Device Power Consumption Estimates

### Hardware Categories

#### 1. Laptops

**Standard Developer Laptop** (MacBook Pro, Dell XPS, ThinkPad)
- **Idle/Light Editing**: 15-25W
- **Active Coding (VSCode + Browser)**: 30-50W
- **Heavy Load (Compilation, Multiple IDEs)**: 60-100W
- **Average Development Session**: ~40W

**Gaming/High-Performance Laptop**
- **Idle**: 20-30W
- **Active Development**: 50-80W
- **Heavy Load**: 100-200W
- **Average**: ~70W

#### 2. Desktop Workstations

**Standard Desktop** (without dedicated GPU)
- **Idle**: 50-80W (system + monitor)
- **Active Development**: 100-150W
- **Heavy Load**: 150-250W
- **Average**: ~120W

**High-Performance Desktop** (with dedicated GPU)
- **Idle**: 80-120W
- **Active Development**: 150-250W
- **Heavy Load (GPU active)**: 300-500W
- **Average Development**: ~180W

**Desktop + External Monitor(s)**
- Add 20-40W per 24" monitor
- Add 40-60W per 27"+ monitor

### Display Power Consumption

| Display Type | Power Draw |
|-------------|-----------|
| Laptop built-in (13-14") | 5-10W |
| Laptop built-in (15-16") | 10-15W |
| External 24" (1080p) | 20-30W |
| External 27" (1440p) | 30-50W |
| External 32" (4K) | 50-80W |

## Grid Carbon Intensity by Region

Carbon intensity varies significantly by location and energy mix:

| Region/Country | gCO2e/kWh | Notes |
|---------------|-----------|-------|
| **Global Average** | 473 | 2024 average |
| **Europe (EU)** | 213 | Low due to renewables/nuclear |
| **United States** | 369 | Below global average |
| **China** | 560 | High coal dependency |
| **India** | 708 | Highest major economy |
| **Russia** | 449 | Near global average |
| **France** | 60-80 | Very low (nuclear) |
| **Iceland** | 15-20 | Nearly 100% renewable |
| **Australia** | 650-700 | High coal usage |

### Regional Variations Within Countries

**United States by Region** (approximate):
- **Pacific Northwest**: 100-200 gCO2/kWh (hydro)
- **California**: 200-250 gCO2/kWh (mixed renewable)
- **Northeast**: 300-400 gCO2/kWh
- **Midwest/Coal States**: 600-800 gCO2/kWh
- **Texas**: 400-500 gCO2/kWh (mixed gas/wind)

## Heuristic Calculation Formulas

### Basic Formula

```
Local Device CO₂ (kg) = (Power Draw in W / 1000) × Hours × Grid Carbon Intensity (kg CO₂/kWh)
```

### Simplified Development Session Formula

```
Session CO₂ = (Device Power × Activity Factor × Session Hours × Carbon Intensity) / 1000

Where:
- Device Power: Base power in watts (see tables above)
- Activity Factor: Intensity multiplier (0.5 = idle, 1.0 = typical, 1.5 = heavy)
- Session Hours: Duration in hours
- Carbon Intensity: gCO2/kWh for user's region / 1000 to convert to kg
```

### Example Calculations

**Example 1: MacBook Pro, 4-hour coding session, US West Coast**
```
Device Power: 40W (typical)
Activity Factor: 1.0 (normal coding)
Session Hours: 4h
Carbon Intensity: 0.2 kg CO₂/kWh (200 gCO2/kWh)

CO₂ = (40 × 1.0 × 4 × 0.2) / 1000
    = 32 / 1000
    = 0.032 kg CO₂
    = 32 grams CO₂
```

**Example 2: High-end Desktop + 2 monitors, 8-hour workday, Midwest US**
```
Device Power: 180W (desktop) + 60W (2×30W monitors) = 240W
Activity Factor: 1.0
Session Hours: 8h
Carbon Intensity: 0.7 kg CO₂/kWh (700 gCO2/kWh)

CO₂ = (240 × 1.0 × 8 × 0.7) / 1000
    = 1,344 / 1000
    = 1.344 kg CO₂
```

**Example 3: Gaming laptop, intense development with compilation, 6 hours, EU**
```
Device Power: 70W (base)
Activity Factor: 1.5 (heavy compilation work)
Session Hours: 6h
Carbon Intensity: 0.213 kg CO₂/kWh (EU average)

CO₂ = (70 × 1.5 × 6 × 0.213) / 1000
    = 134.19 / 1000
    = 0.134 kg CO₂
    = 134 grams CO₂
```

## Activity Factors for Different Development Tasks

| Activity | Factor | Description |
|----------|--------|-------------|
| **Idle** | 0.5 | Editor open, no active work |
| **Reading/Browsing Code** | 0.7 | Light CPU usage |
| **Active Coding** | 1.0 | Normal typing, IntelliSense, linting |
| **Running Local Dev Server** | 1.2 | Node/Python server, hot reload |
| **Compilation** | 1.5 | Building large projects |
| **Running Tests** | 1.3 | Test suite execution |
| **Docker/Containers** | 1.4 | Container orchestration |
| **Local AI/ML Training** | 2.0-3.0 | GPU intensive (if applicable) |

## VSCode-Specific Power Considerations

### Extension Impact

**Minimal Extensions** (~5 extensions):
- Baseline: 0% additional power

**Typical Developer** (10-20 extensions):
- Additional: +5-15% power consumption
- Multiply activity factor by 1.1

**Extension Heavy** (30+ extensions, language servers):
- Additional: +20-40% power consumption
- Multiply activity factor by 1.3

### Language Servers

Different language servers have varying impacts:

| Language | Impact | Note |
|----------|--------|------|
| TypeScript/JavaScript | Medium | Moderate CPU usage |
| Python | Low-Medium | Lighter than TS |
| Java/Kotlin | High | Heavy language server |
| C/C++ | High | Complex analysis |
| Rust | Very High | rust-analyzer is intensive |
| Go | Low | Efficient language server |

**Adjustment**: Add 0.1 to activity factor for heavy language servers.

## Time-Based Tracking Approach

### Option 1: Active Window Tracking
Track when VSCode window is focused (requires OS-level permissions)

**Pros:**
- Most accurate
- Captures actual development time

**Cons:**
- Privacy concerns
- Requires system permissions

### Option 2: Extension Activity Tracking
Monitor extension events (file edits, saves, builds)

**Pros:**
- Privacy-friendly
- No special permissions needed

**Cons:**
- May miss idle time with VSCode open

### Option 3: Session-Based Estimation
User-defined session start/stop or automatic based on Claude Code usage

**Pros:**
- Simple to implement
- No continuous monitoring needed

**Cons:**
- Less accurate
- Requires user input or inference

## Proposed Implementation Approach

### Default Configuration

```typescript
{
  // Device type
  deviceType: "laptop" | "desktop" | "high-performance",

  // Base power consumption (auto-detected or user-configured)
  basePowerWatts: 40, // default for laptop

  // Additional displays
  externalDisplays: 0,
  displayPowerWatts: 30, // per display

  // Grid carbon intensity (auto-detect by IP or user-set)
  gridCarbonIntensity: 473, // global average in gCO2/kWh

  // Activity tracking
  trackLocalEmissions: true,
  trackingMode: "session-based" | "event-based",

  // Activity factor (automatic based on detected activity)
  defaultActivityFactor: 1.0
}
```

### Detection Heuristics

**Device Type Detection:**
```typescript
// Detect based on system info
if (screen.width < 1920 && battery.present) {
  deviceType = "laptop";
  basePowerWatts = 40;
} else if (!battery.present) {
  deviceType = "desktop";
  basePowerWatts = 120;
}
```

**Region Detection:**
```typescript
// Option 1: IP geolocation → lookup carbon intensity database
// Option 2: System timezone/locale → approximate
// Option 3: User manual selection
```

**Activity Factor Detection:**
```typescript
// Based on events:
- File edit events: factor = 1.0
- Build/compile events: factor = 1.5
- No events for >5 min: factor = 0.5
- Heavy language server activity: factor += 0.1
```

## Accuracy Considerations

### Confidence Levels

**High Confidence** (±10%):
- User manually configured hardware
- Precise grid carbon intensity known
- Active window tracking enabled

**Medium Confidence** (±25%):
- Auto-detected hardware type
- Regional carbon intensity average
- Event-based tracking

**Low Confidence** (±50%):
- Default global values
- Session-based estimation
- Unknown display configuration

### Sources of Error

1. **Hardware Variation**: Same "laptop" category can vary 2-3×
2. **Activity Patterns**: Actual CPU usage varies significantly
3. **Grid Variability**: Carbon intensity changes hourly
4. **Background Processes**: Other apps using resources
5. **Power Management**: CPU throttling, power-saving modes

## Combined Emissions Formula

### Total Session CO₂

```
Total CO₂ = Remote AI CO₂ + Local Device CO₂

Where:
Remote AI CO₂ = (tokens / 1000) × AI_emission_factor
Local Device CO₂ = (power_watts × activity_factor × hours × grid_intensity) / 1000
```

### Relative Contribution

For a typical 4-hour development session:

**Claude AI Usage** (500 requests, 50K tokens):
- Remote CO₂: 50 × 0.0004 = 0.020 kg = 20g

**Local Device** (Laptop, 40W, US average grid):
- Local CO₂: (40 × 1.0 × 4 × 0.369) / 1000 = 0.059 kg = 59g

**Total**: ~79g CO₂

**Ratio**: ~25% remote, ~75% local

This suggests that **local device emissions often exceed remote AI emissions** for typical development sessions.

## Implementation Priority

### Phase 1: Basic Device Tracking (v0.2.0)
- [ ] User-configurable device type
- [ ] Manual grid carbon intensity setting
- [ ] Session-based time tracking
- [ ] Basic calculations with defaults

### Phase 2: Smart Detection (v0.3.0)
- [ ] Auto-detect device type from system info
- [ ] Auto-detect region and grid intensity
- [ ] Event-based activity tracking
- [ ] Display configuration detection

### Phase 3: Advanced Tracking (v0.4.0)
- [ ] Real-time power monitoring (if available via OS APIs)
- [ ] Hourly grid carbon intensity (via APIs)
- [ ] Activity factor auto-adjustment
- [ ] Historical trends and optimization suggestions

## References

1. 8 Billion Trees. "Carbon Footprint of a Laptop vs Desktop." 2024.
2. EcoFlow. "Laptop vs. Desktop: How Many Watts Does a Computer Use?" 2024.
3. Energuide. "How much power does a computer use? And how much CO2?" 2024.
4. Ember Energy. "Global Electricity Review 2024-2025." 2025.
5. Our World in Data. "Carbon intensity of electricity generation." 2024.
6. IEA. "Emissions Factors 2024." 2024.
7. Oxford IT Services. "Environmental impact of IT: desktops, laptops and screens." 2024.

## Disclaimer

These are **approximations** for educational and awareness purposes. Actual power consumption and emissions vary based on:
- Specific hardware models and configurations
- Actual workload and CPU/GPU utilization
- Power management settings
- Real-time grid carbon intensity
- Background processes and system load
- Ambient temperature and cooling efficiency

For precise measurements, consider using hardware power meters or OS-level monitoring tools.
