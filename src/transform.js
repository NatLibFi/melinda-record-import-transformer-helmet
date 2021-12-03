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

import moment from 'moment';
import {chain} from 'stream-chain';
import {parser} from 'stream-json';
import {streamArray} from 'stream-json/streamers/StreamArray';
import {MarcRecord} from '@natlibfi/marc-record';
import createMaterialFields from './create-material-fields';
import createValidator from './validate';
import {createLogger} from '@natlibfi/melinda-backend-commons';
import {EventEmitter} from 'events';

class TransformEmitter extends EventEmitter { }

export default function (stream, {validate = true, fix = true}) {
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
          logger.log('error', 'Unexpected transformation error');
          Emitter.emit('error', err);
        }
      });
    } catch (err) {
      logger.log('error', 'Unexpected stream transformation error');
      Emitter.emit('error', err);
    }
  }

  function convertRecord(record, validator) {
    const marcRecord = convertToMARC();

    /* Order is significant! */
    handleLeader();
    handle003();
    handle007();
    handle008();
    handle020();
    handle037();
    handle130();
    handle300();
    handle500();
    handle506();
    handle530();
    handle546();
    handleTerms();
    handle856();

    marcRecord.insertField({
      tag: 'SID', subfields: [
        {code: 'c', value: record.id},
        {code: 'b', value: 'helme'}
      ]
    });

    try {
      if (validate === true || fix === true) {
        return validator(marcRecord, validate, fix);
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

    function handleLeader() {
      const chars = marcRecord.leader.split('');

      // Set record as unicode
      chars[9] = 'a'; // eslint-disable-line functional/immutable-data

      if (chars[6] === 'o' && marcRecord.get(/^655$/u).some(isBoardGame)) { // eslint-disable-line functional/no-conditional-statement
        chars[6] = 'r'; // eslint-disable-line functional/immutable-data
      }

      if (chars[18] === 'c') { // eslint-disable-line functional/no-conditional-statement
        chars[18] = 'i'; // eslint-disable-line functional/immutable-data
      }

      marcRecord.leader = chars.join(''); // eslint-disable-line functional/immutable-data

      function isBoardGame(field) {
        return field.subfields.some(sf => sf.code === 'a' && sf.value === 'lautapelit');
      }
    }

    function handle003() {
      marcRecord.get(/^003$/u).forEach(field => marcRecord.removeField(field));
    }

    function handle008() {
      const [f008] = marcRecord.get(/^008$/u);
      if (f008) { // eslint-disable-line functional/no-conditional-statement
        const creationDate = moment().format('YYMMDD'); // eslint-disable-line functional/immutable-data

        // Convert to array, pad to 41 characters and remove first 6 chars (Creation time) and the erroneous last three chars ('nam')
        const chars = f008.value.split('').slice(0, 40).slice(6);
        if (chars[17] === ' ') { // eslint-disable-line functional/no-conditional-statement
          chars[17] = '^'; // eslint-disable-line functional/immutable-data
        }

        if (chars[18] === 'c') { // eslint-disable-line functional/no-conditional-statement
          chars[18] = 'i'; // eslint-disable-line functional/immutable-data
        }

        if (['#', '^', 'd', 'u', '|'].includes(chars[39])) { // eslint-disable-line functional/no-conditional-statement
          chars[39] = 'c'; // eslint-disable-line functional/immutable-data
        }

        if (marcRecord.leader[6] === 'r' && chars[33] === 'g') { // eslint-disable-line functional/no-conditional-statement
          chars.fill('|', 18, 21); // eslint-disable-line functional/immutable-data
          chars.fill('|', 30, 32); // eslint-disable-line functional/immutable-data
          chars.fill('|', 34, 35); // eslint-disable-line functional/immutable-data
        }

        f008.value = `${creationDate}${chars.join('')}`; // eslint-disable-line functional/immutable-data
      }
    }

    function handle007() {
      if (marcRecord.get(/^007$/u).length === 0) { // eslint-disable-line functional/no-conditional-statement
        const fields = createMaterialFields(record) || [];

        fields.forEach(f => {
          if (f.tag === '008') { // eslint-disable-line functional/no-conditional-statement
            const [f008] = marcRecord.get(/^008$/u);
            f008.value = f.value; // eslint-disable-line functional/immutable-data
          } else if (f.tag === '007') { // eslint-disable-line functional/no-conditional-statement
            marcRecord.insertField(f);
          } else if (f.tag === '006') { // eslint-disable-line functional/no-conditional-statement
            const [f006] = marcRecord.get(/^006$/u);

            if (f006) { // eslint-disable-line functional/no-conditional-statement
              marcRecord.removeField(f006);
            }

            marcRecord.insertField(f);
          }
        });
      }
    }

    function handle020() {
      marcRecord.get(/^020$/u)
        .forEach(field => {
          if (!field.subfields.find(sf => sf.code === 'q')) { // eslint-disable-line functional/no-conditional-statement
            const a = field.subfields.find(sf => sf.code === 'a'); // eslint-disable-line functional/immutable-data

            if (a && (/\s/u).test(a.value.trim())) { // eslint-disable-line functional/no-conditional-statement
              const [isbn, postfix] = a.value.split(/\s/u);
              a.value = isbn; // eslint-disable-line functional/immutable-data

              field.subfields.push({ // eslint-disable-line functional/immutable-data
                code: 'q',
                value: postfix.replace(/[()]/u, '')
              });
            }
          }
        });
    }

    function handle037() {
      marcRecord.get(/^037$/u).forEach(field => {
        field.subfields.push({ // eslint-disable-line functional/immutable-data
          code: '5', value: 'HELME<KEEP>'
        });
      });
    }

    function handle130() {
      marcRecord.get(/^130$/u).forEach(field => {
        const a = field.subfields.find(sf => sf.code === 'a' && (/:/u).test(sf.value));

        if (a) { // eslint-disable-line functional/no-conditional-statement
          const reComplex = (/^(.[^:]*).*(\(.*\))/u).exec(a.value); // eslint-disable-line prefer-named-capture-group

          if (reComplex) { // eslint-disable-line functional/no-conditional-statement
            a.value = `${reComplex[1].replace(/\s+$/u, '')} ${reComplex[2]}`; // eslint-disable-line functional/immutable-data
          } else { // eslint-disable-line functional/no-conditional-statement
            const reSimple = (/^(.[^:]*)/u).exec(a.value); // eslint-disable-line prefer-named-capture-group
            a.value = `${reSimple[1].replace(/\s+$/u, '')}.`; // eslint-disable-line functional/immutable-data
          }
        }
      });
    }

    function handle300() {
      marcRecord.get(/^300$/u)
        .forEach(field => {
          const a = field.subfields.find(sf => sf.code === 'a'); // eslint-disable-line functional/immutable-data
          const b = field.subfields.find(sf => sf.code === 'b'); // eslint-disable-line functional/immutable-data

          if (a) { // eslint-disable-line functional/no-conditional-statement
            if (b && b.value === 'elektroninen') { // eslint-disable-line functional/no-conditional-statement
              if ((/^1 tekstitiedosto/ui).test(a.value)) { // eslint-disable-line functional/no-conditional-statement
                a.value = generateExtendDescr(a.value); // eslint-disable-line functional/immutable-data
                marcRecord.removeSubfield(b, field);
              } else if ((/^1 äänitiedosto/ui).test(a.value)) { // eslint-disable-line functional/no-conditional-statement
                a.value = generateExtendDescr(a.value); // eslint-disable-line functional/immutable-data
                marcRecord.removeSubfield(b, field);

                marcRecord.insertField({
                  tag: '347', subfields: [{code: 'a', value: '1 äänitiedosto'}]
                });
              } else if ((/^1 videotiedosto/ui).test(a.value)) { // eslint-disable-line functional/no-conditional-statement
                a.value = generateExtendDescr(a.value); // eslint-disable-line functional/immutable-data
                marcRecord.removeSubfield(b, field);

                marcRecord.insertField({
                  tag: '347', subfields: [{code: 'a', value: '1 videotiedosto'}]
                });
              }
            } else if ((/^(e-äänikirja|e-ljudbok|eljudbok|e-kirja)/ui).test(a.value)) { // eslint-disable-line functional/no-conditional-statement, prefer-named-capture-group
              a.value = generateExtendDescr(a.value); // eslint-disable-line functional/immutable-data
            } else if ((/^(äänikirja|ljudbok)/ui).test(a.value)) { // eslint-disable-line functional/no-conditional-statement, prefer-named-capture-group
              a.value = generateExtendDescr(a.value, '1 CD-äänilevy'); // eslint-disable-line functional/immutable-data
            } else if ((/^cd-skiva/ui).test(a.value)) { // eslint-disable-line functional/no-conditional-statement
              a.value = generateExtendDescr(a.value, '1 CD-ljudskiva'); // eslint-disable-line functional/immutable-data
            } else { // eslint-disable-line functional/no-conditional-statement
              handleConsoleGames();
            }
          }

          function handleConsoleGames() {
            if ((/^konsolipeli \(1 (tietolevy|blu-ray-levy|muistikortti)\)/ui).test(a.value)) { // eslint-disable-line functional/no-conditional-statement, prefer-named-capture-group
              const re = (/^konsolipeli \((.*)\)(.*)$/ui).exec(a.value); // eslint-disable-line prefer-named-capture-group
              a.value = `${re[1]}${re[2]}`; // eslint-disable-line functional/immutable-data
            } else if ((/^(konsolipeli|konsolspel)/ui).test(a.value)) { // eslint-disable-line functional/no-conditional-statement, prefer-named-capture-group
              const [f007] = marcRecord.get(/^007$/u);

              if (f007.value[1] === 'o') { // eslint-disable-line functional/no-conditional-statement
                a.value = generateExtendDescr(a.value, '1 tietolevy'); // eslint-disable-line functional/immutable-data
              }

              if (f007.value[1] === 'b') { // eslint-disable-line functional/no-conditional-statement
                a.value = generateExtendDescr(a.value, '1 piirikotelo'); // eslint-disable-line functional/immutable-data
              }

              if (f007.value[1] === 'z') { // eslint-disable-line functional/no-conditional-statement
                a.value = generateExtendDescr(a.value, '1 muistikortti'); // eslint-disable-line functional/immutable-data
              }
            }
          }

          function generateExtendDescr(descr, prefix = '1 verkkoaineisto') {
            const re = (/ \((.*)\)/ui).exec(descr); // eslint-disable-line prefer-named-capture-group

            if (re) { // eslint-disable-line functional/no-conditional-statement
              return `${prefix} (${re[1]})`;
            }

            return prefix;
          }
        });
    }

    function handle500() {
      marcRecord.get(/^500$/u).forEach(field => {
        const a = field.subfields.find(sf => sf.code === 'a');

        if (a && (/^(ääniraita|lainausoikeus\.|ljudspår)/ui).test(a.value)) { // eslint-disable-line functional/no-conditional-statement, prefer-named-capture-group
          const newField = clone(field);
          newField.tag = (/^lainausoikeus/ui).test(a.value) ? '540' : '546'; // eslint-disable-line functional/immutable-data

          marcRecord.insertField(newField);
          marcRecord.removeField(field);
        }
      });
    }

    function handle506() {
      marcRecord.get(/^506$/u).forEach(field => {
        const a = field.subfields.find(sf => sf.code === 'a');

        if (a) { // eslint-disable-line functional/no-conditional-statement
          const re = (/^(Kielletty alle [0-9]+-v\.)(.*)$/ui).exec(a.value); // eslint-disable-line prefer-named-capture-group

          if (re) { // eslint-disable-line functional/no-conditional-statement
            const reInner = (/^Kielletty alle ([0-9]+)-v\./ui).exec(re[1]); // eslint-disable-line prefer-named-capture-group
            a.value = `Kielletty alle ${reInner[1]}-vuotiailta.${re[2]}`; // eslint-disable-line functional/immutable-data
          }
        }
      });
    }

    function handle530() {
      marcRecord.get(/^530$/u).forEach(field => {
        const a = field.subfields.find(sf => sf.code === 'a');

        if (a && (/^Julkaistu myös e-kirjana\.$/u).test(a.value)) { // eslint-disable-line functional/no-conditional-statement
          a.value = 'Julkaistu myös verkkoaineistona.'; // eslint-disable-line functional/immutable-data
        }
      });
    }

    function handle546() {
      const [f040] = marcRecord.get(/^040$/u); // eslint-disable-line functional/immutable-data

      if (f040) { // eslint-disable-line functional/no-conditional-statement
        const b = f040.subfields.find(sf => sf.code === 'b');

        if (b && b.value === 'fin') { // eslint-disable-line functional/no-conditional-statement
          marcRecord.get(/^546$/u)
            .forEach(field => {
              const a = field.subfields.find(sf => sf.code === 'a');

              if (a && (/svenska/ui).test(a.value)) { // eslint-disable-line functional/no-conditional-statement
                a.value = a.value.replace(/svenska/ui, 'ruotsi'); // eslint-disable-line functional/immutable-data
                a.value = a.value.replace(/^ruotsi/u, 'Ruotsi'); // eslint-disable-line functional/immutable-data
              }
            });
        }
      }
    }

    function handleTerms() {
      marcRecord.get(/^(648|651|655)$/u).forEach(field => { // eslint-disable-line prefer-named-capture-group
        const sf = field.subfields.find(sf => sf.code === '2');

        if (sf) {
          if (['648', '650'].includes(field.tag) && sf.value === 'kaunokki') { // eslint-disable-line functional/no-conditional-statement
            sf.value = 'ysa'; // eslint-disable-line functional/immutable-data
          }

          if (field.tag === '655' && sf.value === 'kaunokki') { // eslint-disable-line functional/no-conditional-statement
            sf.value = 'slm/fin'; // eslint-disable-line functional/immutable-data
          }

          if (field.tag === '655' && sf.value === 'bella') { // eslint-disable-line functional/no-conditional-statement
            sf.value = 'slm/swe'; // eslint-disable-line functional/immutable-data
          }
        }
      });
    }

    function handle856() {
      marcRecord.get(/^856$/u).forEach(field => {
        const subfield = field.subfields.find(sf => sf.code === 'z');

        if (subfield) { // eslint-disable-line functional/no-conditional-statement
          subfield.code = 'y'; // eslint-disable-line functional/immutable-data
        }

        const y = field.subfields.find(sf => sf.code === 'y');

        /* Move subfield y to the last index */
        if (y) { // eslint-disable-line functional/no-conditional-statement
          const index = field.subfields.indexOf(y);
          field.subfields.splice(index, 1); // eslint-disable-line functional/immutable-data
          field.subfields.push(y); // eslint-disable-line functional/immutable-data
        }
      });
    }
  }

  function clone(o) {
    return JSON.parse(JSON.stringify(o));
  }
}
