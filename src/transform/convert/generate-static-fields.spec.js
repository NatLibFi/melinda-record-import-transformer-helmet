import {READERS} from '@natlibfi/fixura';
import {expect} from 'chai';
import generateTests from '@natlibfi/fixugen';
import createDebugLogger from 'debug';
import {Error as TransformationError} from '@natlibfi/melinda-commons';
import {handleLeader, handleSID} from './generate-static-fields';
import {MarcRecord} from '@natlibfi/marc-record';

const debug = createDebugLogger('@natlibfi/tests/melinda-record-import-transformer-helmet/transform/convert:generate-static-fields');

generateTests({
  callback,
  path: [__dirname, '..', '..', '..', 'test-fixtures', 'generate-static-fields'],
  recurse: true,
  useMetadataFile: true,
  fixura: {
    failWhenNotFound: true,
    reader: READERS.JSON
  }
});

function callback({
  getFixture,
  functionToUse,
  expectedError = false,
  expectedErrorStatus = '200'
}) {
  const inputData = new MarcRecord(getFixture('input.json'));
  const expectedResults = getFixture('output.json');
  const result = handleProcess(functionToUse, inputData) // eslint-disable-line

  expect(result).to.eql(expectedResults);

  function handleProcess(functionToUse, inputData) {
    try {
      if (functionToUse === 'handleLeader') {
        handleLeader(inputData);
        return inputData.toObject();
      }

      if (functionToUse === 'handleSID') {
        const record = getFixture('record.json');

        const result = inputData.insertFields(handleSID(inputData, record)).toObject();
        return result;
      }

      throw new Error('Invalid function name!');
    } catch (err) {
      return errorHandling(err);
    }
  }

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
  }
}
