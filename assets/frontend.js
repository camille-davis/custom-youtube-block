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


	/**
	 * Extract YouTube video ID
	 */
	function getYouTubeVideoId(url) {
		if (!url) return null;
		var match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/);
		return match ? match[1] : null;
	}

	/**
	 * Get embed URL from iframe
	 */
	function getEmbedUrl(iframe) {
		if (!iframe || !iframe.src) return null;
		var videoId = getYouTubeVideoId(iframe.src);
		return videoId ? 'https://www.youtube.com/watch?v=' + videoId : null;
	}

	/**
	 * Get element width
	 */
	function getWidth(element) {
		return element ? Math.floor(element.getBoundingClientRect().width) : 0;
	}

	/**
	 * Check if embed needs update
	 */
	function needsUpdate(containerWidth, iframeWidth) {
		if (!containerWidth || !iframeWidth || containerWidth < MIN_WIDTH) return false;
		var diff = Math.abs(containerWidth - iframeWidth);
		return diff > WIDTH_THRESHOLD || (diff / containerWidth * 100) > PERCENTAGE_THRESHOLD;
	}

	/**
	 * Fetch oEmbed response
	 */
	function fetchOEmbed(url, width) {
		var height = Math.ceil(width * ASPECT_RATIO);
		var params = 'url=' + encodeURIComponent(url) + '&maxwidth=' + width + '&maxheight=' + height;
		if (nonce) params += '&_wpnonce=' + encodeURIComponent(nonce);

		return fetch(proxyUrl + '?' + params)
			.then(function(res) { return res.ok ? res.json() : Promise.reject(new Error('Request failed')); })
			.then(function(data) { return data.html || null; })
			.catch(function(err) { console.warn('oEmbed fetch failed:', err); return null; });
	}

	/**
	 * Update embed classes
	 */
	function updateClasses(embedBlock, aspectRatio) {
		embedBlock.classList.add('wp-embed-responsive', 'wp-has-aspect-ratio');
		var aspectClass = 'wp-embed-aspect-' + (aspectRatio || '16:9').replace(':', '-');
		if (!embedBlock.classList.contains(aspectClass)) {
			embedBlock.classList.add(aspectClass);
		}
	}

	/**
	 * Replace iframe with new oEmbed HTML
	 */
	function replaceIframe(embedBlock, newHtml) {
		if (!newHtml) return;

		var temp = document.createElement('div');
		temp.innerHTML = newHtml;
		var newIframe = temp.querySelector('iframe');
		if (!newIframe) return;

		var wrapper = embedBlock.querySelector('.wp-block-embed__wrapper');
		if (!wrapper) {
			wrapper = document.createElement('div');
			wrapper.className = 'wp-block-embed__wrapper';
			embedBlock.appendChild(wrapper);
		}

		wrapper.innerHTML = '';
		wrapper.appendChild(newIframe);
		updateClasses(embedBlock, newIframe.getAttribute('data-aspect-ratio'));
	}

	/**
	 * Process single embed block
	 */
	function processEmbed(embedBlock) {
		if (embedBlock.hasAttribute('data-embed-processed') ||
		    embedBlock.hasAttribute('data-embed-processing')) return;

		var iframe = embedBlock.querySelector('iframe');
		if (!iframe) {
			embedBlock.setAttribute('data-embed-processed', 'true');
			return;
		}

		var url = getEmbedUrl(iframe);
		if (!url) {
			embedBlock.setAttribute('data-embed-processed', 'true');
			return;
		}

		var containerWidth = getWidth(embedBlock.querySelector('.wp-block-embed__wrapper') || embedBlock);
		var iframeWidth = parseInt(iframe.getAttribute('width'), 10) || getWidth(iframe);

		if (!needsUpdate(containerWidth, iframeWidth)) {
			embedBlock.setAttribute('data-embed-processed', 'true');
			return;
		}

		embedBlock.setAttribute('data-embed-processing', 'true');
		fetchOEmbed(url, containerWidth)
			.then(function(html) {
				if (html) replaceIframe(embedBlock, html);
				embedBlock.setAttribute('data-embed-processed', 'true');
				embedBlock.removeAttribute('data-embed-processing');
			})
			.catch(function() {
				embedBlock.setAttribute('data-embed-processed', 'true');
				embedBlock.removeAttribute('data-embed-processing');
			});
	}

	/**
	 * Process all embeds
	 */
	function processAll() {
		document.querySelectorAll('.has-fullsize-youtube:not([data-embed-processed]):not([data-embed-processing])')
			.forEach(processEmbed);
	}

	/**
	 * Reset and reprocess on resize
	 */
	var resizeTimer;
	function handleResize() {
		clearTimeout(resizeTimer);
		resizeTimer = setTimeout(function() {
			document.querySelectorAll('.has-fullsize-youtube[data-embed-processed]')
				.forEach(function(el) { el.removeAttribute('data-embed-processed'); });
			processAll();
		}, DEBOUNCE_DELAY);
	}

	/**
	 * Initialize
	 */
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

