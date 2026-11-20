import { Transform } from 'class-transformer';

export const ToBoolean = () => {
  return Transform(
    ({
      value,
      obj,
      key,
    }: {
      value: unknown;
      obj?: Record<string, unknown>;
      key?: string;
    }): unknown => {
      const rawVal: unknown =
        obj && typeof obj === 'object' && key && key in obj ? obj[key] : value;
      if (rawVal === undefined || rawVal === null || rawVal === '') {
        return undefined;
      }
      if (
        rawVal === 'true' ||
        rawVal === true ||
        rawVal === 1 ||
        rawVal === '1'
      ) {
        return true;
      }
      if (
        rawVal === 'false' ||
        rawVal === false ||
        rawVal === 0 ||
        rawVal === '0'
      ) {
        return false;
      }
      return rawVal;
    },
  );
};
