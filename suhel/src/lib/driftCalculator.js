export function calculateDriftScore(accuracy, avgTime, avgRetries) {
    // ((1 - accuracy) * 50) + ((avg_time / 100) * 30) + ((avg_retries / 5) * 20)

    const accuracyComponent = (1 - accuracy) * 50;
    const timeComponent = (avgTime / 100) * 30;
    const retriesComponent = (avgRetries / 5) * 20;

    let driftScore = accuracyComponent + timeComponent + retriesComponent;

    // Clamp between 0 and 100
    driftScore = Math.max(0, Math.min(100, driftScore));

    return driftScore;
}

export function getRiskClassification(driftScore) {
    if (driftScore <= 30) return 'Stable';
    if (driftScore <= 60) return 'Warning';
    return 'High Drift';
}

export function getRiskColor(riskLevel) {
    switch (riskLevel) {
        case 'Stable': return 'text-emerald-700 bg-emerald-100 border-emerald-200';
        case 'Warning': return 'text-amber-700 bg-amber-100 border-amber-200';
        case 'High Drift': return 'text-rose-700 bg-rose-100 border-rose-200';
        default: return 'text-slate-700 bg-slate-100 border-slate-200';
    }
}
