"use client";

import { useCallback, useState } from "react";
import type { TimeSegment } from "@/components/expense-filters/expense-filters";

export function useExpensePeriodFilter() {
  const now = new Date();
  const [timeSegment, setTimeSegment] = useState<TimeSegment>("month");
  const [selectedMonthIdx, setSelectedMonthIdx] = useState(now.getMonth());
  const [selectedQuarterIdx, setSelectedQuarterIdx] = useState(Math.floor(now.getMonth() / 3));
  const [selectedWeekIdx, setSelectedWeekIdx] = useState(0);
  const reset = useCallback(() => {
    const currentDate = new Date();
    setTimeSegment("month");
    setSelectedMonthIdx(currentDate.getMonth());
    setSelectedQuarterIdx(Math.floor(currentDate.getMonth() / 3));
    setSelectedWeekIdx(0);
  }, []);

  return {
    timeSegment,
    onTimeSegmentChange: setTimeSegment,
    selectedMonthIdx,
    onMonthChange: setSelectedMonthIdx,
    selectedQuarterIdx,
    onQuarterChange: setSelectedQuarterIdx,
    selectedWeekIdx,
    onWeekChange: setSelectedWeekIdx,
    reset,
  };
}
