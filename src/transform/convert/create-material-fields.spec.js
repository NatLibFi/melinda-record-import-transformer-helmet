import {READERS} from '@natlibfi/fixura';
import {expect} from 'chai';
import generateTests from '@natlibfi/fixugen';
import createDebugLogger from 'debug';
import {Error as TransformationError} from '@natlibfi/melinda-commons';
import * as testContext from './create-material-fields';

const debug = createDebugLogger('@natlibfi/melinda-record-import-transformer-helmet/transform/convert:create-material-fields');
let validator; // eslint-disable-line

generateTests({
  callback,
  path: [__dirname, '..', '..', '..', 'test-fixtures', 'create-material-fields'],
  recurse: false,
  useMetadataFile: true,
  fixura: {
    failWhenNotFound: true,
    reader: READERS.JSON
  }
});

function callback({
  getFixture,
  expectedError = false,
  expectedErrorStatus = '200'
}) {
  const debugResultHandling = debug.extend('resultHandling');
  const inputData = getFixture('input.json');
  const expectedResults = getFixture('output.json');
  try {
    const results = testContext.default(inputData);
    debugResultHandling(JSON.stringify(results));

    if (results) {
      expect(results).to.eql(expectedResults);
      return;
    }
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
