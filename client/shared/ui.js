/**
 * The game's gold: headings and the numbers a player counts (resources, party size)
 * @param {object} colors - The theme's colors
 * @returns {object} The color
 */
export const gold = colors => colors.light(colors.yellow);

/**
 * A view's toolbar heading in the game's gold
 * @param {object} theme - The theme
 * @param {object} theme.colors - The theme's colors
 * @returns {string} The styles
 */
export const goldHeading = ({ colors }) => `
	& > .variant-bar > .heading {
		color: ${gold(colors)};
	}
`;
