export const NOW_YEAR = new Date().getFullYear();

export const getWeekKey = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay() + 1);
  return d.toISOString().split("T")[0];
};
