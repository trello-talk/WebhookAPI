import CatLoggr from 'cat-loggr/ts';

export const logger = new CatLoggr({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug'
});
