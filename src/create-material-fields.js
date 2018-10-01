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

export default function (record) {
	const materialType = record.materialType.code.trim();

	if (materialType === 'v') {
		return createElectronicVideo();
	}

	if (materialType === 't') {
		return createElectronicRecording();
	}

	const f007 = {tag: '007'};

	switch (materialType) {
		case 'h':
			f007.value = create007Value({len: 9, i0: 'v', i1: 'd', i4: 's', i10: 'm'});
			break;
		case '3':
			f007.value = create007Value({len: 14, i0: 's', i1: 'd'});
			break;
		case 'b':
			f007.value = create007Value({len: 9, i0: 'g', i1: 's'});
			break;
		case 'g':
			f007.value = create007Value({len: 9, i0: 'v', i1: 'd', i4: 'v'});
			break;
		case 'z':
			f007.value = create007Value({len: 2, i0: 'c', i1: 'r'});
			break;
		case 'y':
			f007.value = create007Value({len: 2, i0: 'c', i1: 'r'});
			break;
		case '4':
			f007.value = create007Value({len: 14, i0: 's', i1: 's', i3: 'l', i6: 'j', i10: 'p'});
			break;
		case 's':
			f007.value = create007Value({len: 14, i0: 'c', i4: 'g', i5: 'a'});
			break;
		case 'a':
			f007.value = create007Value({len: 6, i0: 'k'});
			break;
		case '6':
			f007.value = create007Value({len: 14, i0: 's', i1: 'd', i3: 'b', i6: 'e', i10: 'p'});
			break;
		case 'n':
			f007.value = create007Value({len: 2, i0: 'f', i1: 'b'});
			break;
		case 'c':
			f007.value = create007Value({len: 6, i0: 'k', i1: 'l'});
			break;
		case 'f':
			f007.value = create007Value({len: 9, i0: 'v', i1: 'f', i4: 'b'});
			break;
		case 'd':
			f007.value = create007Value({len: 14, i0: 'c', i1: 'd', i4: 'g'});
			break;
		case 'x':
			f007.value = create007Value({len: 14, i0: 'c', i1: 'r'});
			break;
		case '2':
			f007.value = create007Value({len: 8, i0: 'a'});
			break;
		case 'e':
			f007.value = create007Value({len: 14, i0: 'c', i1: 'd', i4: 'g'});
			break;
		case 'j':
			f007.value = create007Value({len: 13, i0: 'h', i1: 'u'});
			break;
		case 'r':
			f007.value = create007Value({len: 2, i0: 'z', i1: 'u'});
			break;
		default:
			break;
	}

	if (f007.value) {
		return [f007];
	}

	function create007Value(opts) {
		const value = Array(opts.len).fill('|');

		Object.keys(opts).filter(k => k.startsWith('i')).forEach(k => {
			const index = k[1];
			value[index] = opts[k];
		});

		return value.join('');
	}

	function createElectronicVideo() {
		const valuesFirst007 = Array(9).fill('|');
		const valuesSecond007 = Array(9).fill('|');
		const values006 = Array(18).fill('|');

		values006[0] = 'm';
		values006[6] = 'o';
		values006[9] = 'h';

		valuesFirst007[0] = 'v';
		valuesFirst007[1] = 'z';

		valuesSecond007[0] = 'c';
		valuesSecond007[1] = 'r';

		return [
			{tag: '006', value: values006.join('')},
			{tag: '007', value: valuesFirst007.join('')},
			{tag: '007', value: valuesFirst007.join('')}
		];
	}

	function createElectronicRecording() {
		const valuesFirst007 = Array(14).fill('|');
		const valuesSecond007 = Array(14).fill('|');
		const values006 = Array(18).fill('|');

		values006[0] = 'm';
		values006[6] = 'o';

		valuesFirst007[0] = 's';
		valuesFirst007[1] = 'r';

		valuesSecond007[0] = 'c';
		valuesSecond007[1] = 'r';

		return [
			{tag: '006', value: values006.join('')},
			{tag: '007', value: valuesFirst007.join('')},
			{tag: '007', value: valuesFirst007.join('')}
		];
	}
}
