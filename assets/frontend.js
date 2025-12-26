/**
 * Frontend JavaScript for Fullsize YouTube Embeds
 *
 * Only applies to YouTube embed blocks with fullsize attribute enabled.
 */

(function() {
	// Fetch at large size, then scale down with CSS
	// This avoids multiple fetches and ensures iframe is large enough
	var FETCH_SIZE = 1920; // Large enough for any screen

	var ASPECT_RATIO = 0.5625; // 16:9

	var settings = window.fullsizeYouTubeSettings || {};
	var proxyUrl = settings.restUrl || '/wp-json/oembed/1.0/proxy';


	/**
	 * Extract YouTube video ID from iframe src
	 */
	function getVideoId(iframe) {
		if (!iframe || !iframe.src) return null;
		var match = iframe.src.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/);
		return match ? match[1] : null;
	}

	/**
	 * Fetch oEmbed at preset size
	 */
	function fetchOEmbed(url, width) {
		var params = new URLSearchParams({
			url: url,
			maxwidth: width,
			maxheight: Math.ceil(width * ASPECT_RATIO)
		});
		return fetch(proxyUrl + '?' + params.toString())
			.then(function(res) { return res.ok ? res.json() : Promise.reject(new Error('Request failed')); })
			.then(function(data) { return data.html || null; })
			.catch(function(err) { console.warn('oEmbed fetch failed:', err); return null; });
	}

	/**
	 * Make iframe responsive to container width using CSS
	 * WordPress uses :before pseudo-element with padding-top for aspect ratio
	 */
	function makeResponsive(iframe, wrapper, embedBlock) {
		if (!iframe || !wrapper) return;

		// Remove fixed dimensions
		iframe.removeAttribute('width');
		iframe.removeAttribute('height');

		// Ensure wrapper is positioned relatively and full width
		wrapper.style.position = 'relative';
		wrapper.style.width = '100%';

		// Calculate and set height based on width (16:9 aspect ratio)
		// This ensures height even if :before pseudo-element doesn't work
		function updateHeight() {
			var wrapperWidth = wrapper.getBoundingClientRect().width;
			if (wrapperWidth > 0) {
				wrapper.style.height = Math.ceil(wrapperWidth * ASPECT_RATIO) + 'px';
			}
		}

		// Set initial height
		updateHeight();

		// Update on resize
		var resizeObserver = new ResizeObserver(updateHeight);
		resizeObserver.observe(wrapper);

		// Ensure iframe is absolutely positioned and fills wrapper
		iframe.style.position = 'absolute';
		iframe.style.top = '0';
		iframe.style.left = '0';
		iframe.style.width = '100%';
		iframe.style.height = '100%';

		// Ensure container is full width
		embedBlock.style.width = '100%';
		embedBlock.style.maxWidth = '100%';
	}

	/**
	 * Process a single embed block
	 */
	function processEmbed(embedBlock) {
		if (embedBlock.hasAttribute('data-embed-processed')) return;

		var iframe = embedBlock.querySelector('iframe');
		if (!iframe) {
			embedBlock.setAttribute('data-embed-processed', 'true');
			return;
		}

		var videoId = getVideoId(iframe);
		if (!videoId) {
			embedBlock.setAttribute('data-embed-processed', 'true');
			return;
		}

		var url = 'https://www.youtube.com/watch?v=' + videoId;

		// Fetch oEmbed at large size (will scale down with CSS)
		fetchOEmbed(url, FETCH_SIZE).then(function(html) {
			if (html) {
				// Replace iframe with fetched version
				var temp = document.createElement('div');
				temp.innerHTML = html;
				var newIframe = temp.querySelector('iframe');
				if (newIframe) {
					// Ensure wrapper exists
					var wrapper = embedBlock.querySelector('.wp-block-embed__wrapper');
					if (!wrapper) {
						wrapper = document.createElement('div');
						wrapper.className = 'wp-block-embed__wrapper';
						embedBlock.insertBefore(wrapper, iframe);
					}

					// Replace old iframe with new one
					wrapper.innerHTML = '';
					wrapper.appendChild(newIframe);

					// Remove fixed dimensions and ensure full width
					makeResponsive(newIframe, wrapper, embedBlock);

					// Add responsive classes - WordPress CSS uses these for aspect ratio
					// wp-embed-responsive: enables responsive behavior
					// wp-has-aspect-ratio: enables :before padding-top trick
					// wp-embed-aspect-16-9: sets padding-top to 56.25% (16:9 ratio)
					embedBlock.classList.add('wp-embed-responsive', 'wp-has-aspect-ratio', 'wp-embed-aspect-16-9');
				}
			}

			embedBlock.setAttribute('data-embed-processed', 'true');
		});
	}

	/**
	 * Process all embeds
	 */
	function processAll() {
		document.querySelectorAll('.has-fullsize-youtube:not([data-embed-processed])')
			.forEach(processEmbed);
	}

	document.addEventListener('DOMContentLoaded', processAll);

})();
