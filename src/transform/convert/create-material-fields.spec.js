/**
*
* @licstart  The following is the entire license notice for the JavaScript code in this file.
*
* Helmet record transformer for the Melinda record batch import system
*
* Copyright (c) 2018-2019 University Of Helsinki (The National Library Of Finland)
*
* This file is part of melinda-record-import-transformer-helmet
*
* melinda-record-import-transformer-helmet program is free software: you can redistribute it and/or modify
* it under the terms of the GNU Affero General Public License as
* published by the Free Software Foundation, either version 3 of the
* License, or (at your option) any later version.
*
* melinda-record-import-transformer-helmet is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
* GNU Affero General Public License for more details.
*
* You should have received a copy of the GNU Affero General Public License
* along with this program.  If not, see <http://www.gnu.org/licenses/>.
*
* @licend  The above is the entire license notice
* for the JavaScript code in this file.
*
*/

import {READERS} from '@natlibfi/fixura';
import {expect} from 'chai';
import generateTests from '@natlibfi/fixugen';
import createDebugLogger from 'debug';
import {Error as TransformationError} from '@natlibfi/melinda-commons';
import * as testContext from './create-material-fields';

const debug = createDebugLogger('@natlibfi/melinda-record-import-transformer-helmet/transform/index.SPEC');
let validator; // eslint-disable-line

generateTests({
  callback,
  path: [__dirname, '..', '..', 'test-fixtures', 'create-material-fields'],
  recurse: false,
  useMetadataFile: true,
  fixura: {
    failWhenNotFound: true,
    reader: READERS.JSON
  }
});

function callback({
  getFixture,
  enabled = true,
  expectedError = false,
  expectedErrorStatus = '200'
}) {
  if (enabled === false) {
    debug('Test has been set to be disabled in metadata.json');
    throw new Error('DISABLED');
  }

  const debugResultHandling = debug.extend('resultHandling');
  const inputData = getFixture('input.json');
  const expectedResults = getFixture('output.json');
  const results = testContext.default(inputData);

  try {
    debugResultHandling(JSON.stringify(results));
    expect(results).to.eql(expectedResults);
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
  }
}
