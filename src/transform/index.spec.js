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
import moment from 'moment';
import {expect} from 'chai';
import generateTests from '@natlibfi/fixugen';
import createTransformHandler from './index';
import createDebugLogger from 'debug';
import {Error as TransformationError} from '@natlibfi/melinda-commons';

const debug = createDebugLogger('@natlibfi/melinda-record-import-transformer-helmet/transform/index.SPEC');

generateTests({
  callback,
  path: [__dirname, '..', '..', 'test-fixtures', 'transform'],
  recurse: false,
  useMetadataFile: true,
  fixura: {
    failWhenNotFound: true
  }
});

function callback({
  getFixture,
  enabled = true,
  succesRecords = 1,
  failedRecords = 0,
  expectedError = false,
  expectedErrorStatus = '200'
}) {
  if (enabled === false) {
    debug('Test has been set to be disabled in metadata.json');
    throw new Error('DISABLED');
  }

  const momentMock = () => moment('2000-01-01T00:00:00');
  const inputData = getFixture({components: ['input.json'], reader: READERS.STREAM});
  const expectedSuccesRecords = getFixture({components: ['outputSucces.json'], reader: READERS.JSON});
  const expectedFailedRecords = getFixture({components: ['outputFailed.json'], reader: READERS.JSON});
  const transformHandler = createTransformHandler(momentMock);

  return new Promise((resolve, reject) => {
    const succesRecordsArray = [];
    const failedRecordsArray = [];

    transformHandler(inputData)
      .on('error', errorHandling)
      .on('record', recordEvent)
      .on('end', resultHandling);

    function recordEvent(payload) {
      if (payload.failed) {
        return failedRecordsArray.push(payload); // eslint-disable-line
      }

      return succesRecordsArray.push(payload); // eslint-disable-line
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
          expect(recordArray).to.have.lengthOf(expectedRecordsAmount);
          recordArray.forEach((result, index) => {
            debugResultHandling(JSON.stringify(result));
            expect(result.messages).to.be.an('Array'); // validator tests are in validators spec
            expect(result.failed).to.be.an('Boolean'); // validator tests are in validators spec
            expect(result.failed).to.eql(expectedRecords[index].failed);
            if (result.failed) {
              return;
            }

            // Check succeeded record
            expect(result.record).to.deep.include(expectedRecords[index].record);
          });

          return;
        }
      }
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
            return resolve(); // test ok
          }

          // common error
          expect(err.message).to.match(new RegExp(expectedError, 'u'));
          return resolve(); // test ok
        } catch (err) {
          return reject(err);
        }
      }

      reject(err);
    }
  });
}
