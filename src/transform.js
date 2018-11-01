/**
*
* @licstart  The following is the entire license notice for the JavaScript code in this file.
*
* Helmet record transformer for the Melinda record batch import system
*
* Copyright (C) 2018 University Of Helsinki (The National Library Of Finland)
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

/* eslint-disable no-unused-vars */

import moment from 'moment';
import getStream from 'get-stream';
import {MarcRecord} from '@natlibfi/marc-record';
import {TransformerUtils as Utils} from '@natlibfi/melinda-record-import-commons';
import createMaterialFields from './create-material-fields';

export default async function (stream) {
	MarcRecord.setValidationOptions({subfieldValues: false});

	const records = await JSON.parse(await getStream(stream));
	return Promise.all(records.map(convertRecord));

	function convertRecord(record) {
		const marcRecord = convertToMARC();

		handle008();
		handle007();
		handle020();
		handle300();
		handle500();
		handle546();
		handle856();

		marcRecord.insertField({tag: 'SID', subfields: [
			{code: 'a', value: record.id},
			{code: 'b', value: 'helme'}
		]});

		return marcRecord;

		function convertToMARC() {
			const marcRecord = new MarcRecord();

			record.varFields
				.forEach(field => {
					if (field.content) {
						if (field.fieldTag === '_') {
							marcRecord.leader = field.content;
						} else {
							marcRecord.insertField({tag: field.marcTag, value: field.content});
						}
					} else if (field.subfields) {
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

		function handle008() {
			const f008 = marcRecord.get(/^008$/).shift();

			if (f008) {
				const creationDate = moment().format('YYMMDD');
				// Convert to array, pad to 41 characters and remove first 6 chars (Creation time) and the erroneous last three chars ('nam')
				const chars = f008.value.split('').slice(0, 40).slice(6);
	
				if (chars[17] === ' ') {
					chars[17] = '^';
				}
	
				if (chars[18] === 'c') {
					chars[18] = 'i';
				}
	
				f008.value = `${creationDate}${chars.join('')}`;
			}
		}

		function handle007() {
			if (marcRecord.get(/^007$/).length === 0) {
				const fields = createMaterialFields(record) || [];
				fields.forEach(f => {
					if (f.tag === '006') {
						const f006 = marcRecord.get(/^006$/).shift();

						if (f006) {
							marcRecord.removeField(f006);
						}
					}

					marcRecord.insertField(f);
				});
			}
		}

		function handle020() {
			marcRecord.get(/^020$/)
				.forEach(field => {
					if (!field.subfields.find(sf => sf.code === 'q')) {
						const a = field.subfields.find(sf => sf.code === 'a');

						if (/\s/.test(a.value.trim())) {
							const [isbn, postfix] = a.value.split(/\s/);
							a.value = isbn;

							field.subfields.push({
								code: 'q',
								value: postfix.replace(/[()]/, '')
							});
						}
					}
				});
		}

		function handle300() {
			marcRecord.get(/^300$/)
				.forEach(field => {
					const a = field.subfields.find(sf => sf.code === 'a');
					const b = field.subfields.find(sf => sf.code === 'b');

					if (a && b && b.value === 'elektroninen') {
						if (/(tekstitiedosto|äänitiedosto|videotiedosto|e-kirja|e-äänikirja)$/.test(a.value)) {
							marcRecord.removeSubfield(b, field);
							a.value = '1 verkkoaineisto';

							if (a.value === 'äänitiedosto') {
								record.insertField({tag: '347', subfields: [
									{code: 'a', value: '1 äänitiedosto'}
								]});
							} else if (a.value === 'videotiedosto') {
								record.insertField({tag: '347', subfields: [
									{code: 'a', value: '1 videotiedosto'}
								]});
							}
						}
					}
				});
		}

		function handle500() {
			marcRecord.get(/^500$/)
				.filter(field => {
					const a = field.subfields.find(sf => sf.code === 'a');
					return /^Ä\/ääniraita/.test(a.value);
				})
				.forEach(field => {
					const f546 = clone(field);
					f546.ind1 = f546.ind2 = '#';					 
					f546.tag = '546';

					marcRecord.insertField(f546);
					marcRecord.removeField(field);
				});
		}

		function handle546() {
			const f040 = marcRecord.get(/^040$/).shift();

			if (f040) {
				const b = f040.subfields.find(sf => sf.code === 'b');

				if (b && b.value === 'fin') {
					marcRecord.get(/^546$/)
						.forEach(field => {
							const a = field.subfields.find(sf => sf.code === 'a');

							if (a && /svenska/i.test(a.value)) {
								a.value = a.value.replace(/svenska/i, 'ruotsi');
								a.value = a.value.replace(/^ruotsi/, 'Ruotsi');
							}
						});
				}
			}
		}

		function handle856() {
			marcRecord.get(/^856$/).forEach(field => {
				const subfield = field.subfields.find(sf => sf.code === 'z');

				if (subfield) {
					subfield.code = 'y';
				}

				const y = field.subfields.find(sf => sf.code === 'y');

				/* Move subfield y to the last index */
				if (y) {
					const index = field.subfields.indexOf(y);
					field.subfields.splice(index, 1);
					field.subfields.push(y);
				}
			});
		}
	}

	function clone(o) {
		return JSON.parse(JSON.stringify(o));
	}
}
