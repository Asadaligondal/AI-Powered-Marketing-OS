// Server-side only — reads process.env at call time (not module load) for Next.js compatibility

export type AutomationRule = {
  keyword: string;
  listId: string | undefined;
  welcomeMessage: string;
};

export function getAutomationRules(): AutomationRule[] {
  return [
    {
      keyword: 'MOBILITY',
      listId: process.env.KLAVIYO_LIST_ID,
      welcomeMessage: 'Get the free Mobility Reset guide',
    },
    {
      keyword: 'RESET',
      listId: process.env.KLAVIYO_LIST_ID,
      welcomeMessage: 'Get the 10-minute routine',
    },
    {
      keyword: 'WORKSHOP',
      listId: process.env.KLAVIYO_LIST_ID,
      welcomeMessage: 'See upcoming workshop dates',
    },
  ];
}

export function findRuleForKeyword(keyword: string | null | undefined): AutomationRule | undefined {
  if (!keyword) return undefined;
  return getAutomationRules().find((r) => r.keyword === keyword.toUpperCase());
}

export const AUTOMATION_RULE_KEYWORDS = ['MOBILITY', 'RESET', 'WORKSHOP'] as const;

export type AutomationRuleDisplay = { keyword: string; welcomeMessage: string };

export const AUTOMATION_RULES_DISPLAY: AutomationRuleDisplay[] = [
  { keyword: 'MOBILITY', welcomeMessage: 'Get the free Mobility Reset guide' },
  { keyword: 'RESET', welcomeMessage: 'Get the 10-minute routine' },
  { keyword: 'WORKSHOP', welcomeMessage: 'See upcoming workshop dates' },
];
