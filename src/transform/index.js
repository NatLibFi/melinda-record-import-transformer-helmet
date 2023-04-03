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

import {chain} from 'stream-chain';
import {parser} from 'stream-json';
import {streamArray} from 'stream-json/streamers/StreamArray';
import {MarcRecord} from '@natlibfi/marc-record';
import createValidator from '../validate';
import {createLogger} from '@natlibfi/melinda-backend-commons';
import {EventEmitter} from 'events';
import {generate884, handle856} from './convert/generate8XXFields.js';
import {handleTerms} from './convert/generate6XXFields.js';
import {handle500, handle506, handle530, handle546} from './convert/generate5XXFields.js';
import {handle300} from './convert/generate3XXFields.js';
import {handle130} from './convert/generate1XXFields.js';
import {handle020, handle037} from './convert/generate0XXFields.js';
import {handle003, handle007, handle008} from './convert/generateControlFields';
import {handleSID, handleLeader} from './convert/generate-static-fields';

class TransformEmitter extends EventEmitter { }

export default (testRun) => (stream, {validate = true, fix = true} = {}) => {
  MarcRecord.setValidationOptions({subfieldValues: false});
  const Emitter = new TransformEmitter();
  const logger = createLogger();

  logger.log('debug', 'Starting to send recordEvents');

  readStream(stream);
  return Emitter;

  async function readStream(stream) {
    try {
      const promises = [];
      const validator = await createValidator();
      const pipeline = chain([
        stream,
        parser(),
        streamArray()
      ]).on('error', err => Emitter.emit('error', err));

      pipeline.on('data', data => {
        promises.push(transform(data.value)); // eslint-disable-line functional/immutable-data

        async function transform(value) {
          try {
            const result = await convertRecord(value, validator);
            Emitter.emit('record', result);
          } catch (err) {
            logger.log('error', 'Unexpected record transformation error');
            Emitter.emit('error', err);
          }
        }
      });
      pipeline.on('end', async () => {
        try {
          logger.log('debug', `Handled ${promises.length} recordEvents`);
          await Promise.all(promises);
          Emitter.emit('end', promises.length);
        } catch (err) {
          logger.log('error', 'Unexpected transformation error in the end');
          Emitter.emit('error', err);
        }
      });
    } catch (err) {
      logger.log('error', 'Unexpected stream transformation error');
      Emitter.emit('error', err);
    }
  }

  async function convertRecord(record, validator) {
    const marcRecord = convertToMARC();

    /* Order is significant! */
    handleLeader(marcRecord);
    handle003(marcRecord);
    handle007(marcRecord, record);
    handle008(marcRecord, testRun);
    handle020(marcRecord);
    handle037(marcRecord);
    handle130(marcRecord);
    handle300(marcRecord);
    handle500(marcRecord);
    handle506(marcRecord);
    handle530(marcRecord);
    handle546(marcRecord);
    handleTerms(marcRecord);
    handle856(marcRecord);
    handleSID(marcRecord, record);

    try {
      if (validate === true || fix === true) {
        const validationResult = await validator(marcRecord, validate, fix);
        validationResult.record.insertFields(generate884(marcRecord, testRun));
        return validationResult;
      }
    } catch (error) {
      logger.log('error', 'Unexpected validation error');
      throw error;
    }

    return {failed: false, record: marcRecord};

    function convertToMARC() {
      const marcRecord = new MarcRecord();

      record.varFields
        .forEach(field => {
          if (field.content) { // eslint-disable-line functional/no-conditional-statement
            if (field.fieldTag === '_') { // eslint-disable-line functional/no-conditional-statement
              marcRecord.leader = field.content; // eslint-disable-line functional/immutable-data
            } else if (typeof field.marcTag === 'string') { // eslint-disable-line functional/no-conditional-statement
              marcRecord.insertField({tag: field.marcTag, value: field.content});
            }
          } else if (field.subfields && typeof field.marcTag === 'string') { // eslint-disable-line functional/no-conditional-statement
            marcRecord.insertField({
              tag: field.marcTag,
              ind1: field.ind1,
              ind2: field.ind2,
              subfields: field.subfields.map(subfield => {
                if ('content' in subfield && subfield.content.length === 0) {
                  return {code: subfield.tag};
                }

                return {
                  code: subfield.tag,
                  value: subfield.content
                };
              })
            });
          }
        });

      return marcRecord;
    }
  }
};
