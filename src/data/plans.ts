export const plans = {
  free: { name: 'Free', devices: 5, aiQuestions: 5, features: ['Up to 5 monitored devices per household', 'Shared access for household members', 'Home dashboard and device controls', 'Energy and cost charts', 'Today and Week history', 'Essential device, balance and budget alerts', '5 AI questions per household per day'] },
  plus: { name: 'Plus', devices: 20, aiQuestions: 50, features: ['Up to 20 monitored devices per household', 'Shared access for household members', 'Everything in Free', 'Month view and up to 12 months of history', 'Configurable device alert thresholds', '50 AI questions per household per day', 'Electricity usage data export'] },
} as const;
export const memberExplanation = 'Members can view household usage and switch devices on or off. Household setup is managed by the person who created it.';
