#!/usr/bin/env node
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

import fs from 'fs';
import path from 'path';
import ora from 'ora';
import transform from './transform';
import createValidateFunction from './validate';

run();

async function run() {
	try {
		if (process.argv.length < 3) {
			console.error(`USAGE: transform.js [-v|-f] <INPUT FILE>
				Options:
				-v  Do validation
				-f  Do validation & fixing
				-r  Output only the records (Invalid records are excluded from the output)`);
			process.exit(-1);
		}

		const {mode, file, recordsOnly} = parseArgs(process.argv.slice(1));

		const spinner = ora('Transforming records').start();

		if (['validate', 'fix'].includes(mode)) {
			const validate = await createValidateFunction();
			const records = await transform(fs.createReadStream(file));

			spinner.succeed();
			spinner.start('Validating records');

			const results = await validate(records, mode === 'fix');
			spinner.succeed();

			if (recordsOnly) {
				console.error(`Excluding ${results.filter(r => r.failed).length} failed records`);
				console.log(JSON.stringify(results.filter(r => !r.failed).map(r => r.record), undefined, 2));
			} else {
				console.log(JSON.stringify(results, undefined, 2));
			}

		} else {
			const records = await transform(fs.createReadStream(file));
			spinner.succeed();
			console.log(JSON.stringify(records, undefined, 2));
		}

		process.exit();
	} catch (err) {
		console.error(err);
		process.exit(-1);
	}

	function parseArgs(args) {
		return args.reduce((acc, param) => {
			switch (param) {
				case '-v':
					return Object.assign(acc, {mode: 'validate'});
				case '-f':
					return Object.assign(acc, {mode: 'fix'});
				case '-r':
					return Object.assign(acc, {recordsOnly: true});
				default:
					return Object.assign(acc, {file: param});
			}
		}, {});
	}
}
