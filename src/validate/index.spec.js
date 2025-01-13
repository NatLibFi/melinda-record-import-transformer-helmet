import {READERS} from '@natlibfi/fixura';
import {expect} from 'chai';
import generateTests from '@natlibfi/fixugen';
import createDebugLogger from 'debug';
import {Error as TransformationError} from '@natlibfi/melinda-commons';
import createValidator from './index';
import {MarcRecord} from '@natlibfi/marc-record';

const debug = createDebugLogger('@natlibfi/melinda-record-import-transformer-helmet/transform/index.SPEC');
let validator; // eslint-disable-line

generateTests({
  callback,
  path: [__dirname, '..', '..', 'test-fixtures', 'validate'],
  recurse: false,
  useMetadataFile: true,
  fixura: {
    failWhenNotFound: true,
    reader: READERS.JSON
  },
  mocha: {
    before: async () => {
      validator = await createValidator();
    }
  }
});

async function callback({
  getFixture,
  expectedError = false,
  expectedErrorStatus = '200'
}) {

  const debugResultHandling = debug.extend('resultHandling');
  const inputData = getFixture('input.json');
  const expectedResults = getFixture('output.json');
  const result = await validator(new MarcRecord(inputData, {subfieldValues: false}), true, true);

  try {
    debugResultHandling(JSON.stringify(result));
    expect(result.messages).to.be.an('Array');
    expect(result.messages).to.deep.eql(expectedResults.messages);
    expect(result.failed).to.be.an('Boolean');
    expect(result.failed).to.eql(expectedResults.failed);
    expect(result.failed).to.eql(expectedResults.failed);
    expect(result.record).to.deep.eql(expectedResults.record);
  } catch (err) {
    errorHandling(err);
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
          return;
        }

        // common error
        expect(err.message).to.match(new RegExp(expectedError, 'u'));
        return;
      } catch (err) {
        return;
      }
    }

    throw err;
  }
}
