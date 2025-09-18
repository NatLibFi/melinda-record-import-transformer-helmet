import createDebugLogger from 'debug';
import assert from 'node:assert';
import {READERS} from '@natlibfi/fixura';
import generateTests from '@natlibfi/fixugen';
import {Error as TransformationError} from '@natlibfi/melinda-commons';
import {MarcRecord} from '@natlibfi/marc-record';
import {handle300} from './generate3XXFields.js';

const debug = createDebugLogger('@natlibfi/tests/melinda-record-import-transformer-helmet/transform/convert:generate3XXFields');

generateTests({
  callback,
  path: [import.meta.dirname, '..', '..', '..', 'test-fixtures', 'generate3XXFields'],
  recurse: true,
  useMetadataFile: true,
  fixura: {
    failWhenNotFound: true,
    reader: READERS.JSON
  }
});

/**
 * Callback function for tests
 * @date 11/10/2023 - 8:03:40 AM
 *
 * @param {{ getFixture: READER, functionToUse: string, expectedError?: boolean, expectedErrorStatus?: string }} metadataParams From metadata.json
 * @param {READER} metadataParams.getFixture Auto generated file reader
 * @param {string} metadataParams.functionToUse
 * @param {boolean} [metadataParams.expectedError=false]
 * @param {string} [metadataParams.expectedErrorStatus='200']
 */
function callback({
  getFixture,
  functionToUse,
  expectedError = false,
  expectedErrorStatus = '200'
}) {
  const inputData = new MarcRecord(getFixture('input.json'));
  const expectedResults = getFixture('output.json');
  const result = handleProcess(functionToUse, inputData, expectedError, expectedErrorStatus); // eslint-disable-line

  if (result) {
    assert.deepStrictEqual(result, expectedResults);
    return;
  }


  /**
   * Test process handling. Handles normal and error cases
   * @date 12/04/2024 - 8:30:00 AM
   *
   * @param {string} functionToUse Name of function for testing
   * @param {MarcRecord} inputData Input record
   * @param {boolean} expectedError Is error expected from this test
   * @param {string} expectedErrorStatus What is status of error that is expected
   * @returns {object|false} Marc record result object or false
   */
  function handleProcess(functionToUse, inputData, expectedError, expectedErrorStatus) {
    try {
      if (functionToUse === 'handle300') {
        const result = inputData.insertFields(handle300(inputData)).toObject();
        return result;
      }

      throw new Error('Invalid function name!');
    } catch (err) {
      const debugErrorHandling = debug.extend('errorHandling');
      debugErrorHandling(err);

      if (expectedError) {
        assert(err instanceof Error);

        if (err instanceof TransformationError) { // specified error
          assert.match(err.payload, new RegExp(expectedError, 'u'));
          assert.match(err.status, new RegExp(expectedErrorStatus, 'u'));
          return false;
        }

        // common error
        assert.match(err.message, new RegExp(expectedError, 'u'));
        return false;
      }

      throw err;
    }
  }
}
