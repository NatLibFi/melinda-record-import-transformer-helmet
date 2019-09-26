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
import {Transformer} from '@natlibfi/melinda-record-import-commons';
import {EventEmitter} from 'events';

class TransformCLIEmitter extends EventEmitter {}

const {runCLI} = Transformer;

run();

async function run() {
	const transformerSettings = {
		name: 'melinda-record-import-transformer-helmet',
		yargsOptions: [
			{option: 'v', conf: {alias: 'validate', default: false, type: 'boolean', describe: 'Validate records'}},
			{option: 'f', conf: {alias: 'fix', default: false, type: 'boolean', describe: 'Validate & fix records'}}
		],
		callback: transformCallback
	};
	runCLI(transformerSettings);

	function transformCallback({stream, args: {validate, fix}}) {
		const Emitter = new TransformCLIEmitter();
		transform(stream, Emitter, validate, fix);
		return Emitter;
	}
}
