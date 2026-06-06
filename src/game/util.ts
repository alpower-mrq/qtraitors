/* Small runtime helpers. Math.random is fine here (app runtime). */

export const randInt = (min: number, max: number): number =>
  Math.floor(min + Math.random() * (max - min + 1));

export const randRange = (min: number, max: number): number =>
  min + Math.random() * (max - min);

export const pick = <T>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)];

export const shuffle = <T>(arr: readonly T[]): T[] => {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
};

let _id = 0;
export const uid = (prefix = "k"): string => `${prefix}_${(_id++).toString(36)}`;

export const formatMoney = (n: number): string => {
  // Whole pounds show clean; fractional show 2dp.
  const whole = Number.isInteger(n);
  return `£${whole ? n.toString() : n.toFixed(2)}`;
};
