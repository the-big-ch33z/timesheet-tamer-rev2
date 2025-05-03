
import { getSafeTOILSummary } from '@/utils/time/services/toil/storage/getSafeTOILSummary';

export const useTOILSummary = ({ userId, date }) => {
  const monthYear = date.toISOString().slice(0, 7);
  const summary = getSafeTOILSummary(userId, monthYear);

  console.log('[TOIL] Diagnostic mode - userId:', userId, 'monthYear:', monthYear, 'summary:', summary);

  return {
    summary,
    isLoading: false,
    error: null,
    refreshSummary: () => {}
  };
};
