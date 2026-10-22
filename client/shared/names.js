import { randFromArray } from '@vanilla-bean/components';

const FANTASY_NAMES = [
	'Aldric',
	'Branwen',
	'Cael',
	'Daveth',
	'Elara',
	'Finn',
	'Gwendolyn',
	'Haldor',
	'Isolde',
	'Jorah',
	'Kaelin',
	'Lyra',
	'Maddox',
	'Nyx',
	'Orion',
	'Petra',
	'Quinn',
	'Rowan',
	'Soren',
	'Thalia',
	'Ulric',
	'Vex',
	'Wren',
	'Xander',
	'Yara',
	'Zephyr',
];

export const fantasyName = () => randFromArray(FANTASY_NAMES);
