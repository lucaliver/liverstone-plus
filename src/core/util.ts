let uid = 0;
export const nextUid = (): number => ++uid;
export const resetUid = (to = 0): void => {
  uid = to;
};
export const peekUid = (): number => uid;
