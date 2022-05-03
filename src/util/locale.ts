import lodash from 'lodash';
import moment from 'moment';
import M from 'mustache';
import path from 'path';

import { logger } from '../logger';
import { iterateFolder } from '.';

export interface LocaleModule {
  (string: string, params?: Record<string, string>): string;
  valid(string: string): boolean;
  numSuffix(string: string, value: number, params: Record<string, string>): string;
  toLocaleString(number: number): string;
  moment(...args: any[]): moment.Moment;
  locale: string;
  json(): any;
}

export const locales = new Map<string, any>();
export const load = () => iterateFolder(path.join(__dirname, '../../locale/bot'), loadFile, '.json');

export function loadFile(filePath: string) {
  logger.log('Loading locale', filePath);
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const json = require(filePath);
  locales.set(path.parse(filePath).name, json);
}

export const sourceLocale = 'en_US';
export function source() {
  return locales.get('en_US');
}

export function toArray() {
  const array = [];
  locales.forEach((json, locale) => array.push([locale, json]));
  return array;
}

export function toModule(locale: string): LocaleModule {
  locale = locale || sourceLocale;
  const _ = (string: string, params: Record<string, string> = {}) => {
    const localeJSON = locales.get(locale);
    const source = locales.get(sourceLocale);
    const localeBase = localeJSON ? lodash.defaultsDeep(localeJSON, source) : source;
    const localeString = lodash.get(localeBase, string);
    if (!localeString) throw new Error(`No string named '${string}' was found in the source translation.`);
    return M.render(localeString, params);
  };

  _.valid = (string: string): boolean => {
    const localeJSON = locales.get(locale);
    const source = locales.get(sourceLocale);
    const localeBase = localeJSON ? lodash.defaultsDeep(localeJSON, source) : source;
    return lodash.has(localeBase, string);
  };

  _.numSuffix = (string: string, value: number, params: Record<string, string>) => {
    const suffixTable: [number, string][] = [
      [0, 'zero'],
      [1, 'one'],
      [2, 'two'],
      [3, 'three'],
      [4, 'four'],
      [5, 'five']
    ];

    for (const [num, suffix] of suffixTable) {
      if (value !== num) continue;
      if (_.valid(`${string}.${suffix}`)) return _(`${string}.${suffix}`, params);
    }

    return _(`${string}.many`, params);
  };

  _.toLocaleString = (number: number) => number.toLocaleString(locale.replace('_', '-'));

  _.moment = (...args: any[]) => moment(...args).locale(locale.replace('_', '-'));

  _.locale = locale;

  _.json = () => {
    const localeJSON = locales.get(locale);
    const source = locales.get(sourceLocale);
    const localeBase = localeJSON ? lodash.defaultsDeep(localeJSON, source) : source;
    return localeBase;
  };

  return _;
}
