
export const useTOILSummary = () => {
  return {
    summary: {
      userId: 'test',
      monthYear: '2025-05',
      accrued: 0,
      used: 0,
      remaining: 0
    },
    isLoading: false,
    error: null,
    refreshSummary: () => {}
  };
};
