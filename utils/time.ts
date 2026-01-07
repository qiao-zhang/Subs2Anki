export const formatTime = (seconds: number): string => {
  const date = new Date(0);
  date.setSeconds(seconds);
  const iso = date.toISOString().substr(11, 8);
  // Remove leading hours if 00
  return iso.startsWith('00:') ? iso.slice(3) : iso;
};

export const parseVTTTime = (timeString: string): number => {
  const parts = timeString.split(':').reverse();
  let seconds = 0;
  for (let i = 0; i < parts.length; i++) {
    seconds += parseFloat(parts[i].replace(',', '.')) * Math.pow(60, i);
  }
  return seconds;
};
