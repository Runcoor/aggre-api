import { useState, useCallback } from 'react';
import { API, showError } from '../../helpers';

export const useFinanceData = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [timeRange, setTimeRange] = useState('30d');

  const fetchData = useCallback(async (range) => {
    const tr = range || timeRange;
    setLoading(true);
    try {
      const res = await API.get(`/api/finance/summary?time_range=${tr}`);
      const { success, data: respData, message } = res.data;
      if (success) {
        setData(respData);
      } else {
        showError(message || 'Failed to load finance data');
      }
    } catch (err) {
      showError(err.message || 'Network error');
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  const changeTimeRange = useCallback((newRange) => {
    setTimeRange(newRange);
    fetchData(newRange);
  }, [fetchData]);

  return {
    loading,
    data,
    timeRange,
    fetchData,
    changeTimeRange,
  };
};
