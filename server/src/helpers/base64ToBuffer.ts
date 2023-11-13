export const base64ToBuffer = (base64: string) => {
  return Buffer.from(base64, 'base64');
};
