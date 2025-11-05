import { Page } from 'vanilla-bean-components';
import router from './router.js';
import './socket.js';

new Page({
	appendTo: document.body,
	append: router,
});
