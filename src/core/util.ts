export const clamp = (v: number, min: number, max: number): number => Math.max(min, Math.min(max, v));
export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

let uid = 0;
export const nextUid = (): number => ++uid;
export const resetUid = (to = 0): void => {
  uid = to;
};
export const peekUid = (): number => uid;
