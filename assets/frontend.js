/**
 * Frontend JavaScript for Fullsize YouTube Embeds
 *
 * Only applies to YouTube embed blocks with fullsize attribute enabled.
 */

(function() {
	'use strict';

	var MIN_WIDTH = 200;
	var WIDTH_THRESHOLD = 50;
	var PERCENTAGE_THRESHOLD = 20;
	var DEBOUNCE_DELAY = 250;
	var PROCESS_DELAY = 100;
	var ASPECT_RATIO = 0.5625;

	var settings = window.fullsizeYouTubeSettings || {};
	var proxyUrl = settings.restUrl || '/wp-json/oembed/1.0/proxy';
	var nonce = settings.nonce || '';

	function getWidth(element) {
		return element ? Math.floor(element.getBoundingClientRect().width) : 0;
	}

	function processEmbed(embedBlock) {
		if (embedBlock.hasAttribute('data-embed-processed') || embedBlock.hasAttribute('data-embed-processing')) return;

		var iframe = embedBlock.querySelector('iframe');
		if (!iframe) {
			embedBlock.setAttribute('data-embed-processed', 'true');
			return;
		}

		// Get embed URL
		var url = null;
		if (iframe.src) {
			var match = iframe.src.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/);
			if (match) url = 'https://www.youtube.com/watch?v=' + match[1];
		}

		var containerWidth = getWidth(embedBlock.querySelector('.wp-block-embed__wrapper') || embedBlock);
		var iframeWidth = parseInt(iframe.getAttribute('width'), 10) || getWidth(iframe);

		// Check if update needed
		var needsUpdate = false;
		if (containerWidth && iframeWidth && containerWidth >= MIN_WIDTH) {
			var diff = Math.abs(containerWidth - iframeWidth);
			needsUpdate = diff > WIDTH_THRESHOLD || diff / containerWidth * 100 > PERCENTAGE_THRESHOLD;
		}

		if (!url || !needsUpdate) {
			embedBlock.setAttribute('data-embed-processed', 'true');
			return;
		}

		embedBlock.setAttribute('data-embed-processing', 'true');

		// Fetch oEmbed
		var params = 'url=' + encodeURIComponent(url) + '&maxwidth=' + containerWidth + '&maxheight=' + Math.ceil(containerWidth * ASPECT_RATIO);
		if (nonce) params += '&_wpnonce=' + encodeURIComponent(nonce);

		fetch(proxyUrl + '?' + params)
			.then(function(res) { return res.ok ? res.json() : Promise.reject(new Error('Request failed')); })
			.then(function(data) { return data.html || null; })
			.catch(function(err) { console.warn('oEmbed fetch failed:', err); return null; })
			.then(function(html) {
				// Replace iframe
				if (html) {
					var temp = document.createElement('div');
					temp.innerHTML = html;
					var newIframe = temp.querySelector('iframe');
					if (newIframe) {
						var wrapper = embedBlock.querySelector('.wp-block-embed__wrapper');
						if (!wrapper) {
							wrapper = document.createElement('div');
							wrapper.className = 'wp-block-embed__wrapper';
							embedBlock.appendChild(wrapper);
						}
						wrapper.innerHTML = '';
						wrapper.appendChild(newIframe);
						var aspectRatio = newIframe.getAttribute('data-aspect-ratio') || '16:9';
						embedBlock.classList.add('wp-embed-responsive', 'wp-has-aspect-ratio', 'wp-embed-aspect-' + aspectRatio.replace(':', '-'));
					}
				}
			})
			.then(cleanup, cleanup);

		function cleanup() {
			embedBlock.setAttribute('data-embed-processed', 'true');
			embedBlock.removeAttribute('data-embed-processing');
		}
	}

	function processAll() {
		document.querySelectorAll('.has-fullsize-youtube:not([data-embed-processed]):not([data-embed-processing])')
			.forEach(processEmbed);
	}

	var resizeTimer;
	function handleResize() {
		clearTimeout(resizeTimer);
		resizeTimer = setTimeout(function() {
			document.querySelectorAll('.has-fullsize-youtube[data-embed-processed]')
				.forEach(function(el) { el.removeAttribute('data-embed-processed'); });
			processAll();
		}, DEBOUNCE_DELAY);
	}

	function init() {
		if (document.readyState === 'loading') {
			document.addEventListener('DOMContentLoaded', processAll);
		} else {
			processAll();
		}

		setTimeout(processAll, PROCESS_DELAY);
		window.addEventListener('resize', handleResize);

		if (window.MutationObserver) {
			new MutationObserver(function() {
				setTimeout(processAll, PROCESS_DELAY);
			}).observe(document.body, { childList: true, subtree: true });
		}
	}

	init();

})();

