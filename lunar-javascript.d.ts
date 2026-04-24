declare module 'lunar-javascript' {
  export const Solar: {
    fromDate(date: Date): {
      getLunar(): {
        getYear(): number;
        getMonth(): number;
        getDay(): number;
        getYearInGanZhi(): string;
      };
      getYear(): number;
      getMonth(): number;
      getDay(): number;
    };
  };

  export const Lunar: {
    fromYmd(year: number, month: number, day: number): {
      getSolar(): {
        getYear(): number;
        getMonth(): number;
        getDay(): number;
      };
    };
  };
}