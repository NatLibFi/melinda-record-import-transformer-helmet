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
import createValidator from './validate';

const FIXTURES_PATH = path.join(__dirname, '../test-fixtures/validate');

describe('validate', () => {
	let validator;

	before(async () => {
		validator = await createValidator();
	});

	fs.readdirSync(path.join(FIXTURES_PATH, 'in')).forEach(file => {
		it(file, async () => {
			const record = new MarcRecord(JSON.parse(fs.readFileSync(path.join(FIXTURES_PATH, 'in', file), 'utf8')));

			const result = await validator(record, true, true);
			const expectedPath = path.join(FIXTURES_PATH, 'out', file);
			const formattedResult = {...result, record: result.record.toObject()};

			expect(formattedResult).to.eql(JSON.parse(fs.readFileSync(expectedPath, 'utf8')));
		});
	});
});
