import createDebugLogger from 'debug';
import assert from 'node:assert';
import {READERS} from '@natlibfi/fixura';
import generateTests from '@natlibfi/fixugen';
import {Error as TransformationError} from '@natlibfi/melinda-commons';
import * as testContext from './create-material-fields.js';

const debug = createDebugLogger('@natlibfi/melinda-record-import-transformer-helmet/transform/convert:create-material-fields');

generateTests({
  callback,
  path: [import.meta.dirname, '..', '..', '..', 'test-fixtures', 'create-material-fields'],
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
      assert.deepStrictEqual(results, expectedResults);
      return;
    }
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
