import { styled, Button, Elem } from '@vanilla-bean/components';

export default class Home extends (styled.Component`
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	width: 100%;
	height: 100vh;
	gap: 20px;

	& h1 {
		font-size: 3em;
		color: #ffd700;
		text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
		margin-bottom: 20px;
	}

	& .subtitle {
		font-size: 1.2em;
		color: #aaa;
		margin-bottom: 40px;
	}

	& .button-group {
		display: flex;
		flex-direction: column;
		gap: 15px;
	}
`) {
	build() {
		this.title = new Elem({
			appendTo: this,
			tag: 'h1',
			textContent: 'Sorcery & Savagery',
		});

		this.subtitle = new Elem({
			appendTo: this,
			className: 'subtitle',
			textContent: 'A Medieval Fantasy RTS',
		});

		this.buttonGroup = new Elem({
			appendTo: this,
			className: 'button-group',
			append: [
				new Button({
					content: 'New Game',
					onPointerPress: () => {
						window.location.href = '#/starting-group';
					},
				}),
				new Button({
					content: 'Game Lobby',
					onPointerPress: () => {
						window.location.href = '#/hub';
					},
				}),
			],
		});
	}
}
