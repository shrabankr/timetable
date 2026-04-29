/**
 * Calculates the current academic session based on the rule:
 * Academic session starts on April 1st and ends on March 31st of the next year.
 * @returns String in format "YYYY-YYYY" (e.g., "2024-2025")
 */
export const getCurrentAcademicSession = (): string => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-indexed (0 = Jan, 3 = April)

  if (currentMonth >= 3) {
    // April to December: Current Year to Next Year
    return `${currentYear}-${currentYear + 1}`;
  } else {
    // January to March: Previous Year to Current Year
    return `${currentYear - 1}-${currentYear}`;
  }
};

/**
 * Returns default start date (April 1st) for a given session string "YYYY-YYYY"
 */
export const getDefaultSessionStart = (session: string): string => {
  const [startYear] = session.split('-');
  return `${startYear}-04-01`;
};

/**
 * Returns default end date (March 31st) for a given session string "YYYY-YYYY"
 */
export const getDefaultSessionEnd = (session: string): string => {
  const [, endYear] = session.split('-');
  return `${endYear}-03-31`;
};

/**
 * Returns a list of academic sessions around the current one for selection.
 */
export const getRecommendedSessions = (): string[] => {
  const currentSession = getCurrentAcademicSession();
  const [startYearStr] = currentSession.split('-');
  const startYear = parseInt(startYearStr);
  
  return [
    `${startYear - 1}-${startYear}`,
    `${startYear}-${startYear + 1}`,
    `${startYear + 1}-${startYear + 2}`
  ];
};
