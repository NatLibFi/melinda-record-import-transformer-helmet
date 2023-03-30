import moment from 'moment';

export function getTimeStamp(generateTestTimeStamp) {
  if (generateTestTimeStamp) {
    return moment('2000-01-01T00:00:00').format('YYMMDD');
  }

  return moment().format('YYMMDD');
}
