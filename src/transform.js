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
	const records = await JSON.parse(await getStream(stream));
	return Promise.all(records.map(convertRecord));

	function convertRecord(record) {
		const marcRecord = new MarcRecord();
		record.varFields.forEach(field => {
			if (field.content) {
				if (field.fieldTag === '_') {
					marcRecord.leader = field.content;
				} else {
					marcRecord.insertField({tag: field.marcTag, value: field.content});
				}
			} else if (field.subfields) {
				try {
					marcRecord.insertField({
						tag: field.marcTag,
						ind1: field.ind1,
						ind2: field.ind2,
						subfields: field.subfields.map(subfield => ({
							code: subfield.tag,
							value: subfield.content
						}))
					});
				} catch (err) {
					if (!/^Field is invalid/.test(err.message)) {
						throw err;
					}
				}
			}
		});

		if (!record.varFields.find(f => f.marcTag === '007')) {
			const fields = createMaterialFields(record) || [];
			fields.forEach(f => {
				if (f.tag === '006') {
					const f006 = marcRecord.get(/^006$/).shift();

					if (f006) {
						marcRecord.removeField(f006);
					}
				}

				marcRecord.insertField(f)
			});
		}

		marcRecord.insertField({tag: 'SID', subfields: [
			{code: 'a', value: record.id},
			{code: 'b', value: 'helme'}
		]});

		return marcRecord;
	}
}
