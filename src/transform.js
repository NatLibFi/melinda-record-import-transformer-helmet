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
import getStream from 'get-stream';
import {MarcRecord} from '@natlibfi/marc-record';
import {Utils} from '@natlibfi/melinda-commons';
import createMaterialFields from './create-material-fields';

const {createLogger} = Utils;

export default async function (stream) {
	MarcRecord.setValidationOptions({subfieldValues: false});

	const Logger = createLogger();
	const records = await JSON.parse(await getStream(stream));

	Logger.log('debug', `Starting conversion of ${records.length} records...`);
	return Promise.all(records.map(convertRecord));

	function convertRecord(record) {
		const marcRecord = convertToMARC();

		/* Order is significant! */
		handleLeader();
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

		marcRecord.insertField({tag: 'SID', subfields: [
			{code: 'c', value: record.id},
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

		function handleLeader() {
			const chars = marcRecord.leader.split('');

			// Set record as unicode
			chars[9] = 'a';

			if (chars[6] === 'o' && marcRecord.get(/^655$/).some(isBoardGame)) {
				chars[6] = 'r';
			}

			if (chars[18] === 'c') {
				chars[18] = 'i';
			}

			marcRecord.leader = chars.join('');

			function isBoardGame(field) {
				return field.subfields.some(sf => sf.code === 'a' && sf.value === 'lautapelit');
			}
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

				if (['#', '^', 'd', 'u', '|'].includes(chars[39])) {
					chars[39] = 'c';
				}

				f008.value = `${creationDate}${chars.join('')}`;
			}
		}

		function handle007() {
			if (marcRecord.get(/^007$/).length === 0) {
				const fields = createMaterialFields(record) || [];

				fields.forEach(f => {
					if (f.tag === '008') {
						const f008 = marcRecord.get(/^008$/).shift();
						f008.value = f.value;
					} else if (f.tag === '007') {
						marcRecord.insertField(f);
					} else if (f.tag === '006') {
						const f006 = marcRecord.get(/^006$/).shift();

						if (f006) {
							marcRecord.removeField(f006);
						}

						marcRecord.insertField(f);
					}
				});
			}
		}

		function handle020() {
			marcRecord.get(/^020$/)
				.forEach(field => {
					if (!field.subfields.find(sf => sf.code === 'q')) {
						const a = field.subfields.find(sf => sf.code === 'a');

						if (a && /\s/.test(a.value.trim())) {
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

		function handle037() {
			marcRecord.get(/^037$/).forEach(field => {
				field.subfields.push({
					code: '5', value: 'HELME<KEEP>'
				});
			});
		}

		function handle130() {
			marcRecord.get(/^130$/).forEach(field => {
				const a = field.subfields.find(sf => sf.code === 'a' && /:/.test(sf.value));

				if (a) {
					const reComplex = /^(.[^:]*).*(\(.*\))/.exec(a.value);

					if (reComplex) {
						a.value = `${reComplex[1].replace(/\s+$/, '')} ${reComplex[2]}`;
					} else {
						const reSimple = /^(.[^:]*)/.exec(a.value);
						a.value = `${reSimple[1].replace(/\s+$/, '')}.`;
					}
				}
			});
		}

		function handle300() {
			marcRecord.get(/^300$/)
				.forEach(field => {
					const a = field.subfields.find(sf => sf.code === 'a');
					const b = field.subfields.find(sf => sf.code === 'b');

					if (a) {
						if (b && b.value === 'elektroninen') {
							if (/^1 tekstitiedosto/i.test(a.value)) {
								a.value = generateExtendDescr(a.value);
								marcRecord.removeSubfield(b, field);
							} else if (/^1 äänitiedosto/i.test(a.value)) {
								a.value = generateExtendDescr(a.value);
								marcRecord.removeSubfield(b, field);

								marcRecord.insertField({tag: '347', subfields: [
									{code: 'a', value: '1 äänitiedosto'}
								]});
							} else if (/^1 videotiedosto/i.test(a.value)) {
								a.value = generateExtendDescr(a.value);
								marcRecord.removeSubfield(b, field);

								marcRecord.insertField({tag: '347', subfields: [
									{code: 'a', value: '1 videotiedosto'}
								]});
							}
						} else if (/^(e-äänikirja|e-ljudbok|eljudbok|e-kirja)/i.test(a.value)) {
							a.value = generateExtendDescr(a.value);
						} else if (/^(äänikirja|ljudbok)/i.test(a.value)) {
							a.value = generateExtendDescr(a.value, '1 CD-äänilevy');
						} else if (/^cd-skiva/i.test(a.value)) {
							a.value = generateExtendDescr(a.value, '1 CD-ljudskiva');
						} else {
							handleConsoleGames();
						}
					}

					function handleConsoleGames() {
						if (/^konsolipeli \(1 (tietolevy|blu-ray-levy|muistikortti)\)/i.test(a.value)) {
							const re = /^konsolipeli \((.*)\)(.*)$/i.exec(a.value);
							a.value = `${re[1]}${re[2]}`;
						} else if (/^(konsolipeli|konsolspel)/i.test(a.value)) {
							const f007 = marcRecord.get(/^007$/).shift();

							switch (f007.value[1]) {
								case 'o':
									a.value = generateExtendDescr(a.value, '1 tietolevy');
									break;
								case 'b':
									a.value = generateExtendDescr(a.value, '1 piirikotelo');
									break;
								case 'z':
									a.value = generateExtendDescr(a.value, '1 muistikortti');
									break;
								default:
									break;
							}
						}
					}

					function generateExtendDescr(descr, prefix = '1 verkkoaineisto') {
						const re = / \((.*)\)/i.exec(descr);

						if (re) {
							return `${prefix} (${re[1]})`;
						}

						return prefix;
					}
				});
		}

		function handle500() {
			marcRecord.get(/^500$/).forEach(field => {
				const a = field.subfields.find(sf => sf.code === 'a');

				if (a && /^(ääniraita|lainausoikeus\.|ljudspår)/i.test(a.value)) {
					const newField = clone(field);
					newField.tag = /^lainausoikeus/i.test(a.value) ? '540' : '546';

					marcRecord.insertField(newField);
					marcRecord.removeField(field);
				}
			});
		}

		function handle506() {
			marcRecord.get(/^506$/).forEach(field => {
				const a = field.subfields.find(sf => sf.code === 'a');

				if (a) {
					const re = /^(Kielletty alle [0-9]+-v\.)(.*)$/i.exec(a.value);

					if (re) {
						const reInner = /^Kielletty alle ([0-9]+)-v\./i.exec(re[1]);
						a.value = `Kielletty alle ${reInner[1]}-vuotiailta.${re[2]}`;
					}
				}
			});
		}

		function handle530() {
			marcRecord.get(/^530$/).forEach(field => {
				const a = field.subfields.find(sf => sf.code === 'a');

				if (a && /^Julkaistu myös e-kirjana\.$/.test(a.value)) {
					a.value = 'Julkaistu myös verkkoaineistona.';
				}
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

		function handleTerms() {
			marcRecord.get(/^(648|651|655)$/).forEach(field => {
				const sf = field.subfields.find(sf => sf.code === '2');

				if (sf) {
					if (['648', '650'].includes(field.tag) && sf.value === 'kaunokki') {
						sf.value = 'ysa';
					}

					if (field.tag === '655' && sf.value === 'kaunokki') {
						sf.value = 'slm/fin';
					}

					if (field.tag === '655' && sf.value === 'bella') {
						sf.value = 'slm/swe';
					}
				}
			});
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
