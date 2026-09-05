function isDairyCategory(category) {
  return String(category || '').trim().toLowerCase() === 'dairy';
}

export function buildFeasibilityData({ t, category, location }) {
  const dairy = isDairyCategory(category);
  return {
    category: category || '—',
    location: location || '—',
    market: dairy ? t.dairyConsumerBase.replace('{location}', location || 'the selected location') : t.genericConsumerBase,
    channels: dairy ? t.mockChannels : t.mockChannelsGeneric,
    strengths: dairy ? t.mockStrengths : t.genericStrengths,
    weaknesses: dairy ? t.mockWeaknesses : t.genericWeaknesses,
    opportunities: dairy ? t.mockOpportunities : t.genericOpportunities,
    threats: dairy ? t.mockThreats : t.genericThreats,
    risks: dairy ? t.mockRisks : t.genericRisks,
    niche: dairy ? t.mockNiche : t.genericNiche,
    competition: dairy ? t.mockCompetitionReason : t.genericCompetition,
    pricingRange: dairy ? t.mockPricingRange : t.genericPricingRange,
    pricingReason: dairy ? t.mockPricingReason : t.genericPricingReason,
    score: 72,
    viabilityReason: dairy ? t.mockViabilityReason : t.genericViabilityReason,
    recommendations: dairy ? t.mockRecommendations : t.genericRecommendations,
  };
}
