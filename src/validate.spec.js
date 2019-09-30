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

import fs from 'fs';
import path from 'path';
import {expect} from 'chai';
import {MarcRecord} from '@natlibfi/marc-record';
import validator from './validate';
import {EventEmitter} from 'events';

const FIXTURES_PATH = path.join(__dirname, '../test-fixtures/validate');

class ValidatorEmitter extends EventEmitter {}

describe('validate', () => {
	const Emitter = new ValidatorEmitter();

	fs.readdirSync(path.join(FIXTURES_PATH, 'in')).forEach(file => {
		it(file, async () => {
			const record = new MarcRecord(JSON.parse(fs.readFileSync(path.join(FIXTURES_PATH, 'in', file), 'utf8')));

			let result;
			validator(record, true, true, Emitter);
			await new Promise(resolve => {
				Emitter
					.on('end', () => resolve(true))
					.on('record', recordEvent);
			});

			function recordEvent(payload) {
				result = payload;
				Emitter.emit('end');
			}

			const expectedPath = path.join(FIXTURES_PATH, 'out', file);
			const stringResult = JSON.stringify({...result, record: result.record.toObject()}, undefined, 2);

			expect(stringResult).to.eql(fs.readFileSync(expectedPath, 'utf8'));
		});
	});
});
