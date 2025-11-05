export * from './grid.js';
export * from './pathfinding.js';
export * from './spatial.js';

/**
 *
 * @param length
 */
export function simpleId(length = 8) {
	return Math.random().toString(36).substring(2, 2 + length);
}

/**
 *
 * @param func
 * @param wait
 */
export function debounce(func, wait) {
	let timeout;
	return function executedFunction(...args) {
		const later = () => {
			clearTimeout(timeout);
			func(...args);
		};
		clearTimeout(timeout);
		timeout = setTimeout(later, wait);
	};
}

/**
 *
 * @param func
 * @param limit
 */
export function throttle(func, limit) {
	let inThrottle;
	return function executedFunction(...args) {
		if (!inThrottle) {
			func.apply(this, args);
			inThrottle = true;
			setTimeout(() => (inThrottle = false), limit);
		}
	};
}
