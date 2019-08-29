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
import createRecordValidator from './validate-record';
import {Transformer} from '@natlibfi/melinda-record-import-commons';
import moment from 'moment';
import path from 'path';

const {runCLI} = Transformer;

run();

async function run() {
	const yargs = [
		{option: 'v', conf: {alias: 'validate', default: false, type: 'boolean', describe: 'Validate records'}},
		{option: 'f', conf: {alias: 'fix', default: false, type: 'boolean', describe: 'Validate & fix records'}}
	];
	const name = 'melinda-record-import-transformer-helmet';
	runCLI(name, yargs, readArgs);

	async function readArgs(stream, args, spinner, fs) {
		const records = await transformStream(stream, args.validate, args.fix);

		if (args.validate || args.fix) {
			spinner.succeed();
			spinner.start('Validating records');

			const invalidCount = records.filter(r => r.failed).length;
			const validCount = records.length - invalidCount;
			spinner.succeed(`Validating records (Valid: ${validCount}, invalid: ${invalidCount})`);

			if (args.recordsOnly) {
				console.error(`Excluding ${records.filter(r => r.failed).length} failed records`);
				handleRecordsOutput(records.filter(r => !r.failed).map(r => r.record));
			} else {
				console.log(JSON.stringify(records.map(r => {
					return {record: r.record.toObject(), timestamp: moment(), ...r};
				}), undefined, 2));
			}
		} else {
			spinner.succeed();
			handleRecordsOutput(records);
		}

		function handleRecordsOutput(records) {
			if (args.outputDirectory) {
				if (!fs.existsSync(args.outputDirectory)) {
					fs.mkdirSync(args.outputDirectory);
				}

				records
					.forEach((record, index) => {
						const file = path.join(args.outputDirectory, `${index}.json`);
						fs.writeFileSync(file, JSON.stringify(record.toObject(), undefined, 2));
					});
			} else {
				console.log(JSON.stringify(records.map(r => r.toObject()), undefined, 2));
			}
		}
	}

	async function transformStream(stream, argsValidate, argsFix) {
		const records = await transform(stream);
		if (argsValidate || argsFix) {
			const validate = await createValidator();
			const validateRecord = await createRecordValidator(validate);
			return validateRecord(records, argsFix);
		}

		return records;
	}
}
