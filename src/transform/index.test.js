import createDebugLogger from 'debug';
import assert from 'node:assert';
import {READERS} from '@natlibfi/fixura';
import generateTests from '@natlibfi/fixugen';
import {Error as TransformationError} from '@natlibfi/melinda-commons';
import {MarcRecord} from '@natlibfi/marc-record';
import createTransformHandler from './index.js';

const debug = createDebugLogger('@natlibfi/melinda-record-import-transformer-helmet/transform/index.SPEC');

generateTests({
  callback,
  path: [import.meta.dirname, '..', '..', 'test-fixtures', 'transform'],
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
        return failedRecordsArray.push(payload);
      }

      return succesRecordsArray.push(payload);
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
          assert.equal(recordArray.length, expectedRecordsAmount);
          recordArray.forEach((result, index) => {
            // Comment out after dev
            // debugResultHandling(JSON.stringify(result));
            assert.equal(Array.isArray(result.messages), true); // validator tests are in validators test js
            assert.equal(typeof result.failed === 'boolean', true); // validator tests are in validators test js
            assert.equal(result.failed, expectedRecords[index].failed);
            if (result.failed) {
              return;
            }

            // Check succeeded record
            const expectedRecord = new MarcRecord(expectedRecords[index].record);
            assert.deepStrictEqual(result.record, expectedRecord);
          });

          return;
        }
      }
    }

    function errorHandling(err) {
      const debugErrorHandling = debug.extend('errorHandling');
      debugErrorHandling(err);

      if (expectedError) {
        try {
          assert(err instanceof Error);

          if (err instanceof TransformationError) { // specified error
            assert.match(err.payload, new RegExp(expectedError, 'u'));
            assert.match(err.status, new RegExp(expectedErrorStatus, 'u'));
            return false;
          }

          // common error
          assert.match(err.message, new RegExp(expectedError, 'u'));
          return resolve(); // test ok
        } catch (err) {
          return reject(err);
        }
      }

      reject(err);
    }
  });
}
