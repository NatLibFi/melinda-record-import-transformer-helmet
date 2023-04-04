import moment from 'moment';

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
