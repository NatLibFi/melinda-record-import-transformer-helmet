import {READERS} from '@natlibfi/fixura';
import {expect} from 'chai';
import generateTests from '@natlibfi/fixugen';
import createDebugLogger from 'debug';
import {Error as TransformationError} from '@natlibfi/melinda-commons';
import {handle856} from './generate8XXFields';
import {MarcRecord} from '@natlibfi/marc-record';

const debug = createDebugLogger('@natlibfi/tests/melinda-record-import-transformer-helmet/transform/convert:generate8XXFields');

generateTests({
  callback,
  path: [__dirname, '..', '..', '..', 'test-fixtures', 'generate8XXFields'],
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
  const result = handleProcess(functionToUse, inputData); // eslint-disable-line

  expect(result).to.eql(expectedResults);


  /**
   * Description placeholder
   * @date 11/10/2023 - 8:10:04 AM
   *
   * @param {string} functionToUse Name of function for testing
   * @param {MarcRecord} inputData Input record
   * @returns {MarcRecord} result
   */
  function handleProcess(functionToUse, inputData) {
    try {
      if (functionToUse === 'handle856') {
        const result = inputData.insertFields(handle856(inputData)).toObject();
        return result;
      }

      throw new Error('Invalid function name!');
    } catch (err) {
      return errorHandling(err);
    }
  }

  /**
   * Error situation handling for tests
   * @date 11/10/2023 - 8:11:46 AM
   *
   * @param {Error} err Thrown error from test
   */
  function errorHandling(err) {
    const debugErrorHandling = debug.extend('errorHandling');
    debugErrorHandling(err);

    if (expectedError) { // eslint-disable-line
      expect(err).to.be.an('error');

      if (err instanceof TransformationError) { // specified error
        expect(err.payload).to.match(new RegExp(expectedError, 'u'));
        expect(err.status).to.match(new RegExp(expectedErrorStatus, 'u'));
        return;
      }

      // common error
      expect(err.message).to.match(new RegExp(expectedError, 'u'));
      return;
    }

    throw err;
  }
}
