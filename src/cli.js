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

import transform from './transform';
import createValidator from './validate';
import { Transformer } from '@natlibfi/melinda-record-import-commons';
import moment from 'moment';
import { EventEmitter } from 'events';

const { runCLI } = Transformer;

class TransformCLIEmitter extends EventEmitter { }
const Emitter = new TransformCLIEmitter();

run();

async function run() {
	const transformerSettings = {
		name: 'melinda-record-import-transformer-helmet',
		yargsOptions: [
			{ option: 'v', conf: { alias: 'validate', default: false, type: 'boolean', describe: 'Validate records' } },
			{ option: 'f', conf: { alias: 'fix', default: false, type: 'boolean', describe: 'Validate & fix records' } }
		],
		Emitter
	};
	runCLI(transformerSettings);
}

async function transformStream({ stream, args: { argsValidate, argsFix, recordsOnly } }) {
	let records = await transform(stream);
	Emitter.emit('spinner', { state: 'succeed' });

	if (argsValidate || argsFix) {
		Emitter.emit('spinner', { state: 'start', message: 'Validating records' });
		const validate = await createValidator();
		records = validate(records, argsFix, argsValidate);

		const invalidCount = records.filter(r => r.failed).length;
		const validCount = records.length - invalidCount;
		Emitter.emit('spinner', { state: 'succeed', message: `Validating records (Valid: ${validCount}, invalid: ${invalidCount})` });

		if (recordsOnly) {
			Emitter.emit('fail', `Excluding ${records.filter(r => r.failed).length} failed records`);
			Emitter.emit('handle', records.filter(r => !r.failed).map(r => r.record));
		} else {
			Emitter.emit('log', JSON.stringify(records.map(r => {
				return { record: r.record.toObject(), timestamp: moment(), ...r };
			}), undefined, 2));
		}
	} else {
		Emitter.emit('spinner', { state: 'succeed' });
		Emitter.emit('handle', records);
	}
}
