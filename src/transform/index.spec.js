import {READERS} from '@natlibfi/fixura';
import {expect} from 'chai';
import generateTests from '@natlibfi/fixugen';
import createTransformHandler from './index';
import createDebugLogger from 'debug';
import {Error as TransformationError} from '@natlibfi/melinda-commons';
import {MarcRecord} from '@natlibfi/marc-record';

const debug = createDebugLogger('@natlibfi/melinda-record-import-transformer-helmet/transform/index.SPEC');

generateTests({
  callback,
  path: [__dirname, '..', '..', 'test-fixtures', 'transform'],
  recurse: false,
  useMetadataFile: true,
  fixura: {
    failWhenNotFound: true
  }
});

function callback({
  getFixture,
  succesRecords = 1,
  failedRecords = 0,
  expectedError = false,
  expectedErrorStatus = '200'
}) {
  const inputData = getFixture({components: ['input.json'], reader: READERS.STREAM});
  const expectedSuccesRecords = getFixture({components: ['outputSucces.json'], reader: READERS.JSON});
  const expectedFailedRecords = getFixture({components: ['outputFailed.json'], reader: READERS.JSON});
  const transformHandler = createTransformHandler(true);

  return new Promise((resolve, reject) => {
    const succesRecordsArray = [];
    const failedRecordsArray = [];

    transformHandler(inputData)
      .on('error', errorHandling)
      .on('record', recordEvent)
      .on('end', resultHandling);

    function recordEvent(payload) {
      if (payload.failed) {
        return failedRecordsArray.push(payload); // eslint-disable-line
      }

      return succesRecordsArray.push(payload); // eslint-disable-line
    }

    async function resultHandling() {
      const debugResultHandling = debug.extend('resultHandling');

      try {
        await handleRecords(succesRecordsArray, succesRecords, expectedSuccesRecords);
        await handleRecords(failedRecordsArray, failedRecords, expectedFailedRecords);

        resolve();
      } catch (err) {
        reject(err);
      }

      async function handleRecords(recordArray, expectedRecordsAmount, expectedRecords) {
        if (expectedRecordsAmount > 0) {
          await Promise.all(recordArray);
          debugResultHandling(`${recordArray.length} records handled`);
          expect(recordArray).to.have.lengthOf(expectedRecordsAmount);
          recordArray.forEach((result, index) => {
            // Comment out after dev
            // debugResultHandling(JSON.stringify(result));
            expect(result.messages).to.be.an('Array'); // validator tests are in validators spec
            expect(result.failed).to.be.an('Boolean'); // validator tests are in validators spec
            expect(result.failed).to.eql(expectedRecords[index].failed);
            if (result.failed) {
              return;
            }

            // Check succeeded record
            const expectedRecord = new MarcRecord(expectedRecords[index].record);
            expect(result.record).to.deep.eql(expectedRecord);
          });

          return;
        }
      }
    }

    function errorHandling(err) {
      const debugErrorHandling = debug.extend('errorHandling');
      debugErrorHandling(err);

      if (expectedError) { // eslint-disable-line
        try {
          expect(err).to.be.an('error');

          if (err instanceof TransformationError) { // specified error
            expect(err.payload).to.match(new RegExp(expectedError, 'u'));
            expect(err.status).to.match(new RegExp(expectedErrorStatus, 'u'));
            return resolve(); // test ok
          }

          // common error
          expect(err.message).to.match(new RegExp(expectedError, 'u'));
          return resolve(); // test ok
        } catch (err) {
          return reject(err);
        }
      }

      reject(err);
    }
  });
}
