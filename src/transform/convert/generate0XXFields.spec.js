import {READERS} from '@natlibfi/fixura';
import {expect} from 'chai';
import generateTests from '@natlibfi/fixugen';
import createDebugLogger from 'debug';
import {Error as TransformationError} from '@natlibfi/melinda-commons';
import {handle028, handle037} from './generate0XXFields';
import {MarcRecord} from '@natlibfi/marc-record';

const debug = createDebugLogger('@natlibfi/tests/melinda-record-import-transformer-helmet/transform/convert:generate0XXFields');

generateTests({
  callback,
  path: [__dirname, '..', '..', '..', 'test-fixtures', 'generate0XXFields'],
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
 * @param {{ getFixture: READER; functionToUse: string; expectedError?: boolean; expectedErrorStatus?: string; }} metadataParams From metadata.json
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
    expect(result).to.eql(expectedResults);
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
      if (functionToUse === 'handle028') {
        const result = inputData.insertFields(handle028(inputData)).toObject();
        return result;
      }

      if (functionToUse === 'handle037') {
        const result = inputData.insertFields(handle037(inputData)).toObject();
        return result;
      }

      throw new Error('Invalid function name!');
    } catch (err) {
      const debugErrorHandling = debug.extend('errorHandling');
      debugErrorHandling(err);

      if (expectedError) { // eslint-disable-line
        expect(err).to.be.an('error');

        if (err instanceof TransformationError) { // specified error
          expect(err.payload).to.match(new RegExp(expectedError, 'u'));
          expect(err.status).to.match(new RegExp(expectedErrorStatus, 'u'));
          return false;
        }

        // common error
        expect(err.message).to.match(new RegExp(expectedError, 'u'));
        return false;
      }

      throw err;
    }
  }
}
