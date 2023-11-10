import moment from 'moment';

/**
 * Function for generating timestamps.
 * Supported formats: YYMMDD, YYYYMMDD testYYMMDD, testYYYYMMDD.
 * Test time stamp 2000-01-01T00:00:00
 * @param {string} timeStampFormat Format of timestamp wanted. Defaults YYMMDD
 * @returns moment().format(<format>)
 */
export function getTimeStamp(timeStampFormat = 'YYMMDD') {
  if (timeStampFormat === 'testYYMMDD') {
    return moment('2000-01-01T00:00:00').format('YYMMDD');
  }

  if (timeStampFormat === 'testYYYYMMDD') {
    return moment('2000-01-01T00:00:00').format('YYYYMMDD');
  }

  if (timeStampFormat === 'YYYYMMDD') {
    return moment().format('YYYYMMDD');
  }

  return moment().format('YYMMDD');
}
