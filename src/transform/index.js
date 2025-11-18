import {chain} from 'stream-chain';
import streamJsonPkg from 'stream-json';
const {parser} = streamJsonPkg;
import streamArrayPkg from 'stream-json/streamers/StreamArray.js';
const {streamArray} = streamArrayPkg;
import {EventEmitter} from 'events';
import {MarcRecord} from '@natlibfi/marc-record';
import {createLogger} from '@natlibfi/melinda-backend-commons';
import createValidator from '../validate/index.js';

import {handleSID, handleLeader} from './convert/generate-static-fields.js';
import {handle020, handle028, handle037, handle084, handle097} from './convert/generate0XXFields.js';
import {handle130} from './convert/generate1XXFields.js';
import {handle300} from './convert/generate3XXFields.js';
import {handle500, handle506, handle530, handle546} from './convert/generate5XXFields.js';
import {handle7xx} from './convert/generate7XXFields.js';
import {generate884, handle856} from './convert/generate8XXFields.js';
import {handle003, handle007, handle008} from './convert/generateControlFields.js';

class TransformEmitter extends EventEmitter { }

export default (testRun) => (stream, {validate = true, fix = true} = {}) => {
  MarcRecord.setValidationOptions({subfieldValues: false});
  const Emitter = new TransformEmitter();
  const logger = createLogger();

  logger.debug('Starting to send recordEvents');

  readStream(stream);
  return Emitter;

  async function readStream(stream) {
    try {
      const datas = [];
      const validator = await createValidator();
      const pipeline = chain([
        stream,
        parser(),
        streamArray()
      ]).on('error', err => Emitter.emit('error', err));

      pipeline.on('data', data => {
        datas.push(data.value);
      });
      pipeline.on('end', async () => {
        try {
          logger.debug(`Got ${datas.length} recordEvents`);
          await transformPump(datas);
          logger.debug('Sending end of recordEvents');
          Emitter.emit('end', datas.length);
        } catch (err) {
          logger.error('Unexpected transformation error in the end');
          Emitter.emit('error', err);
        }

        async function transformPump(datas) {
          const [data, ...rest] = datas;

          if (data === undefined) {
            return;
          }

          try {
            const result = await convertRecord(data, validator);
            logger.info('Record transformation done');
            Emitter.emit('record', result);
            return transformPump(rest);
          } catch (err) {
            logger.error('Unexpected record transformation error');
            Emitter.emit('error', err);
            return transformPump(rest);
          }
        }
      });
    } catch (err) {
      logger.error('Unexpected stream transformation error');
      Emitter.emit('error', err);
    }
  }

  async function convertRecord(record, validator) {
    const marcRecord = convertToMARC();

    /* Old style */
    /* Order is significant! */
    handleLeader(marcRecord);
    handle003(marcRecord);
    handle007(marcRecord, record);
    handle008(marcRecord, testRun);
    handle020(marcRecord);
    // handle028(marcRecord);
    // handle037(marcRecord);
    handle097(marcRecord); // Remove Helmet-only 097 fiels
    handle130(marcRecord);
    // handle300(marcRecord);
    handle500(marcRecord);
    handle506(marcRecord);
    handle530(marcRecord);
    handle546(marcRecord);
    // handle856(marcRecord);
    // handleSID(marcRecord, record);


    /* New style */
    const newFields = [
      // handleLeader(marcRecord);
      // handle003(marcRecord);
      // handle007(marcRecord, record);
      // handle008(marcRecord, testRun);
      // handle020(marcRecord);
      handle028(marcRecord),
      handle037(marcRecord),
      handle084(marcRecord),
      // handle130(marcRecord);
      handle300(marcRecord),
      // handle500(marcRecord);
      // handle506(marcRecord);
      // handle530(marcRecord);
      // handle546(marcRecord);
      handle7xx(marcRecord),
      handle856(marcRecord),
      handleSID(marcRecord, record)
    ].flat();

    marcRecord.insertFields(newFields);

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
          if (field.content) {
            if (field.fieldTag === '_') {
              marcRecord.leader = field.content;
            } else if (typeof field.marcTag === 'string') {
              marcRecord.insertField({tag: field.marcTag, value: field.content});
            }
          } else if (field.subfields && typeof field.marcTag === 'string') {
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
