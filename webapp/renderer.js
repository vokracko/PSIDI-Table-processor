"use strict";

class Renderer {
	constructor() {
		this.items = [];
	}

	addItem(item) {
		this.items.push(item);
	}

	addItems(items) {
		for(var i = 0; i < items.length; ++i) {
			this.addItem(items[i]);
		}
	}

	renderItems() {
		for(var i = 0; i < this.items.length; ++i) {
			this.items[i].render();
		}
	}

	setOverlay(overlay) {
		this.overlay = overlay;
	}

	flashMessage(text, type) {
		this.overlay.setData({text: text, type: type});
		this.overlay.flash(5500);
	}
}
