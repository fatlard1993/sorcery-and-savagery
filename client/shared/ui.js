import { Card, styled } from '@vanilla-bean/components';

/**
 * The game's gold: headings and the numbers a player counts (resources, party size)
 * @param {object} colors - The theme's colors
 * @returns {object} The color
 */
export const gold = colors => colors.light(colors.yellow);

/**
 * A Card that is a <button>, for a choice that can be disabled. The library's Card resets the page's button look, but
 * the page's button:hover and button:disabled rules still out-rank it.
 */
export const CardButton = styled(
	Card,
	({ colors }) => `
		&:hover, &:focus-visible, &:active {
			filter: none;
		}

		&:disabled {
			opacity: 0.5;
			cursor: not-allowed;
			color: inherit;
			background-color: ${colors.alpha(colors.white, 0.05)};
		}
	`,
	{ tag: 'button' },
);
