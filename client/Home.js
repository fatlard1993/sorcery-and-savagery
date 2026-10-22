import { styled, Content, Elem, Link, Toolbar, View } from '@vanilla-bean/components';

import { gold } from './shared/ui.js';

export default class Home extends styled(
	View,
	({ colors, space }) => `
		& > .variant-bar > .heading {
			color: ${gold(colors)};
		}

		& .splash {
			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: center;
			gap: ${space.lg};
			min-height: 100%;
			padding: ${space.xl} ${space.lg};
			text-align: center;
		}

		& .subtitle {
			color: ${colors.muted};
		}

		& .button-group {
			display: flex;
			flex-direction: column;
			gap: ${space.sm};
			min-width: 200px;
		}
	`,
) {
	build() {
		new Toolbar({ appendTo: this, variant: 'bar', heading: 'Sorcery & Savagery' });

		new Content({
			appendTo: this,
			append: new Elem({
				className: 'splash',
				append: [
					new Elem({
						className: 'subtitle',
						textContent: 'A Medieval Fantasy RTS',
					}),
					new Elem({
						className: 'button-group',
						append: [
							new Link({ textContent: 'New Game', href: '#/create', variant: 'button' }),
							new Link({ textContent: 'Game Lobby', href: '#/hub' }),
						],
					}),
				],
			}),
		});
	}
}
