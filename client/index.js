import { Page } from '@vanilla-bean/components';
import '@fatlard1993/web-game-framework/client/socket';
import '@vanilla-bean/components/app/reloadOnBuild';
import router from './router.js';

new Page({
	appendTo: document.body,
	append: router,
});
