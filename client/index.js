import { Page } from 'vanilla-bean-components';
import router from './router.js';

new Page({
	appendTo: document.getElementById('app'),
	append: router,
});
