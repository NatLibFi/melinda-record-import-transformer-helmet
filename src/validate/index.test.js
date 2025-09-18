import createDebugLogger from 'debug';
import assert from 'node:assert';
import {READERS} from '@natlibfi/fixura';
import generateTests from '@natlibfi/fixugen';
import {Error as TransformationError} from '@natlibfi/melinda-commons';
import {MarcRecord} from '@natlibfi/marc-record';
import createValidator from './index.js';

const debug = createDebugLogger('@natlibfi/melinda-record-import-transformer-helmet/transform/index.SPEC');
let validator;

generateTests({
  callback,
  path: [import.meta.dirname, '..', '..', 'test-fixtures', 'validate'],
  recurse: false,
  useMetadataFile: true,
  fixura: {
    failWhenNotFound: true,
    reader: READERS.JSON
  },
  hooks: {
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
    assert.equal(Array.isArray(result.messages), true);
    assert.deepStrictEqual(result.messages, expectedResults.messages);
    assert.equal(typeof result.failed === 'boolean', true);
    assert.equal(result.failed, expectedResults.failed);
    assert.equal(result.failed, expectedResults.failed);
    assert.deepStrictEqual(result.record.toObject(), expectedResults.record);
  } catch (err) {
    errorHandling(err);
  }

  function errorHandling(err) {
    const debugErrorHandling = debug.extend('errorHandling');
    debugErrorHandling(err);

    if (expectedError) { // eslint-disable-line
      try {
        assert(err instanceof Error);

        if (err instanceof TransformationError) { // specified error
          assert.match(err.payload, new RegExp(expectedError, 'u'));
          assert.match(err.status, new RegExp(expectedErrorStatus, 'u'));
          return false;
        }

        // common error
        assert.match(err.message, new RegExp(expectedError, 'u'));
        return;
      } catch (err) {
        return;
      }
    }

    throw err;
  }
}
