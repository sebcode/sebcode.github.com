
var Event = YAHOO.util.Event;
var Dom = YAHOO.util.Dom;

function jsonFlickrApi(data)
{
	return Main.jsonFlickrApi(data);
}

var Main = {

	getUrl: function(data, size)
	{
		if (!size) {
			size = '';
		} else {
			size = '_' + size;
		}

		return 'http://farm' + data.farm + '.static.flickr.com/' + data.server + '/' + data.id + '_' + data.secret + size + '.jpg';
	},

	renderThumbs: function(photos)
	{
		var container = document.getElementById('container');
		container.innerHTML = '';

		var w = Math.round((Dom.getViewportWidth() - 100) / 75);
		var h = Math.round((Dom.getViewportHeight() - 100) / 75);
		var j = 0;

		container.style.width = w * 75;

		var progress = Dom.get('progress');

		for (var i = 1; i <= (w * h); i++) {
			var img = document.createElement('img');
			Dom.addClass(img, 'thumb');
			img.data = photos[j++];
			img.src = this.getUrl(img.data, 's');
			container.appendChild(img);
			
			if (j >= photos.length) {
				j = 0;
			}

			if ((i % w) === 0) {
				container.appendChild(document.createElement('div'));
			}
		}
		
		var div = document.createElement('div');
		div.id = 'cursor';
		Dom.setStyle(div, 'display', 'none');
		container.appendChild(div);
		
		Dom.setStyle(container, 'display', 'block');
		Dom.setStyle(progress, 'display', 'none');
		Dom.setStyle('searchbutton', 'display', 'block');
	},

	jsonFlickrApi: function(data)
	{
		if (!data.photos || !(data.photos && data.photos.photo.length)) {
			Dom.setStyle('progress', 'display', 'none');
			Dom.setStyle('searchbutton', 'display', 'block');
			return;
		}

		var photos = data.photos.photo;
		this.lastResult = photos;
		this.renderThumbs(photos);
	},

	update: function(query)
	{
		Dom.setStyle('container', 'display', 'none');
		Dom.setStyle('search', 'display', 'none');
		Dom.setStyle('searchbutton', 'display', 'none');

		var progress = Dom.get('progress');
		Dom.setStyle(progress, 'display', 'block');
		Dom.setStyle(progress, 'left', Math.round((Dom.getViewportWidth() - 75) / 2));
		Dom.setStyle(progress, 'top', Math.round((Dom.getViewportHeight() - 75) / 2));

		if (!query) {
			query = this.lastQuery;
		}

		if (query) {
			var url = 'http://api.flickr.com/services/rest/?method=flickr.photos.search&format=json&api_key=bd1ad462b5f8362832c34da515a1b680';
			url += '&machine_tag_mode=any&text=' + encodeURIComponent(query);
		
			this.lastQuery = query;
			document.location.hash = '#' + query;
		} else {
			var url = 'http://api.flickr.com/services/rest/?method=flickr.panda.getPhotos&format=json&panda_name=ling%20ling&api_key=bd1ad462b5f8362832c34da515a1b680';
		}

		YAHOO.util.Get.script(url);
	},

	init: function() 
	{
		if (document.location.hash && document.location.hash.length > 1) {
			this.update(decodeURIComponent(document.location.hash.substr(1)));
		} else {
			this.update();
		}
		
		var t = this;
		window.setInterval(function() {
			if (document.location.hash && document.location.hash.length > 1) {
				var q = decodeURIComponent(document.location.hash.substr(1));
				if (q != t.lastQuery) {
					t.update(q);
				}
			}
		}, 100);
		
		Event.on(window, 'keydown', function(e) {
			if (this.loading) {
				return;
			}

			if (Event.getCharCode(e) === 37) { // left
				var el = Dom.getPreviousSiblingBy(this.activePreviewImage, function(e) { return e.tagName == 'IMG'; });
				this.showPreview(el);
			} else if (Event.getCharCode(e) === 39) { // right
				var el = Dom.getNextSiblingBy(this.activePreviewImage, function(e) { return e.tagName == 'IMG'; });
				this.showPreview(el);
			} else if (Event.getCharCode(e) === 27) {
				this.showPreview();
			}
		}, this, true);
		
		Event.on('search', 'keypress', function(e) {
			if (e.which && e.which == 13) {
				this.update(Dom.get('search').value);
			}
		}, this, true);

		Event.on(window, 'resize', function() {
			if (this.lastResult) {
				this.renderThumbs(this.lastResult);
			} else {
				this.update();
			}
		}, this, true);

		Event.on('container', 'mousemove', function(e) {
			var t = Event.getTarget(e);

			if (t.id && t.id == 'cursor') {
				return;
			}

			if (Dom.hasClass(t, 'thumb')) {
				this.highlighted = t;
				Dom.setStyle('cursor', 'display', 'block');
				Dom.setStyle('cursor', 'top', t.offsetTop);
				Dom.setStyle('cursor', 'left', t.offsetLeft);
			} else {
				this.highlighted = null;
				Dom.setStyle('cursor', 'display', 'none');
			}
		}, this, true);

		this.loading = false;

		Event.on('container', 'click', function(e) {
			this.showPreview(this.highlighted);
		}, this, true);
		
		Event.on('searchbutton', 'click', function(e) {
			if (Dom.getStyle('search', 'display') == 'block') {
				Dom.setStyle('search', 'display', 'none');
			} else {
				Dom.setStyle('search', 'display', 'block');
				Dom.get('search').value = '';
				Dom.get('search').focus();
			}
		}, this, true);

		Dom.setStyle('progress', 'display', 'block');
	},

	showPreview: function(img)
	{
		var p = Dom.get('preview');
		if (p) {
			p.parentNode.removeChild(p);
		}

		if (this.loading || !img || !img.data) {
			return;
		}

		this.loading = true;
		this.activePreviewImage = null;

		var progress = Dom.get('progress2');
		Dom.setStyle(progress, 'left', Dom.getX(img));
		Dom.setStyle(progress, 'top', Dom.getY(img));
		Dom.setStyle(progress, 'display', 'block');

		var el = document.createElement('img');
		el.id = 'preview';
		var size = '';
		if (Dom.getViewportWidth() < 500 || Dom.getViewportHeight() < 500) {
			size = 'm';
		}
		el.src = this.getUrl(img.data, size);
		Dom.setStyle(el, 'display', 'none');
		Dom.get('container').appendChild(el);

		var t = this;
		el.onload = function() {
			Dom.setStyle(el, 'display', 'block');
			Dom.setStyle(el, 'left', Math.round((Dom.getViewportWidth() - el.width) / 2));
			Dom.setStyle(el, 'top', Math.round((Dom.getViewportHeight() - el.height) / 2));
			Dom.setStyle(progress, 'display', 'none');
			t.loading = false;
			t.activePreviewImage = img;
		};
		
		Dom.setStyle('cursor', 'display', 'none');
	}

};

Event.onDOMReady(function() {
	Main.init();
});

