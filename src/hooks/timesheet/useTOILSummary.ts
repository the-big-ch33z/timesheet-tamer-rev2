
import { getTOILSummary } from '@/utils/time/services/toil/storage';

export const useTOILSummary = ({ userId, date }) => {
  const monthYear = date.toISOString().slice(0, 7); // 'YYYY-MM'

  const summary = getTOILSummary(userId, monthYear);

  return {
    summary,
    isLoading: false,
    error: null,
    refreshSummary: () => {}
  };
};
