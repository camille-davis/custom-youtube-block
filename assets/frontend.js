/**
 * Frontend JavaScript for Custom YouTube Block
 *
 * Handles fullwidth and autoplay features for YouTube embed blocks.
 */

(function() {

	const ASPECT_RATIO = 0.5625; // 16:9
	const PROXY_URL = window.customYouTubeSettings ? window.customYouTubeSettings.restUrl : '/wp-json/oembed/1.0/proxy';
	const BREAKPOINTS = [640, 1024, 1920];
	const EXTRA_LARGE_SIZE = 2560;

	/**
	 * Add autoplay parameters to YouTube iframe URL
	 *
	 * @param {string} src Original iframe src URL
	 * @return {string} Modified URL with autoplay and mute parameters
	 */
	const addAutoplayParams = (src) => {
		if (!src) return src;

		const url = new URL(src);
		url.searchParams.set('autoplay', '1');
		url.searchParams.set('mute', '1');
		return url.toString();
	};

	/**
	 * Process a single embed block with fullwidth
	 *
	 * @param {HTMLElement} embedBlock The embed block element
	 */
	const processFullwidthEmbed = (embedBlock) => {
		const iframe = embedBlock.querySelector('iframe');
		if (!iframe) return;

		// Extract YouTube video ID from iframe src
		const match = iframe.src.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/);
		const videoId = match ? match[1] : null;
		if (!videoId) return;

		const url = 'https://www.youtube.com/watch?v=' + videoId;

		// Get or create wrapper
		let wrapper = embedBlock.querySelector('.wp-block-embed__wrapper');
		if (!wrapper) {
			wrapper = document.createElement('div');
			wrapper.className = 'wp-block-embed__wrapper';
			embedBlock.insertBefore(wrapper, iframe);
		}

		wrapper.style.width = '100%';

		// Track current fetch size
		let currentFetchSize = null;

		/**
		 * Get wrapper width
		 */
		const getWrapperWidth = () => wrapper.getBoundingClientRect().width;

		/**
		 * Update embed height based on width
		 */
		const updateHeight = () => {
			const width = getWrapperWidth();
			if (width > 0) {
				wrapper.style.height = Math.ceil(width * ASPECT_RATIO) + 'px';
			}
		};

		/**
		 * Fetch and update embed based on container width
		 */
		const fetchAndUpdate = () => {
			const width = getWrapperWidth();
			if (width <= 0) return;

			const fetchSize = BREAKPOINTS.find(bp => width <= bp) || EXTRA_LARGE_SIZE;

			// Only fetch if size changed
			if (fetchSize === currentFetchSize) return;

			currentFetchSize = fetchSize;

			// Fetch oEmbed
			const params = new URLSearchParams({
				url: url,
				maxwidth: fetchSize,
				maxheight: Math.ceil(fetchSize * ASPECT_RATIO)
			});
			fetch(PROXY_URL + '?' + params.toString())
				.then((res) => res.ok ? res.json() : Promise.reject(new Error('Request failed')))
				.then((data) => data.html || null)
				.catch((err) => { console.warn('oEmbed fetch failed:', err); return null; })
				.then((html) => {
					if (!html) return;

					// Parse HTML and replace iframe
					const temp = document.createElement('div');
					temp.innerHTML = html;
					const newIframe = temp.querySelector('iframe');
					if (!newIframe) return;

					// Check if autoplay is enabled
					const hasAutoplay = embedBlock.hasAttribute('data-autoplay') && embedBlock.getAttribute('data-autoplay') === 'true';
					if (hasAutoplay) {
						newIframe.src = addAutoplayParams(newIframe.src);
					}

					wrapper.innerHTML = '';
					wrapper.appendChild(newIframe);

					// Configure iframe
					newIframe.removeAttribute('width');
					newIframe.removeAttribute('height');
					newIframe.style.position = 'absolute';
					newIframe.style.width = '100%';
					newIframe.style.height = '100%';
				});
		};

		// Initial setup
		updateHeight();
		fetchAndUpdate();

		// Watch for resize
		new ResizeObserver(() => {
			updateHeight();
			fetchAndUpdate();
		}).observe(wrapper);
	};

	/**
	 * Process a single embed block with autoplay (but not fullwidth)
	 *
	 * @param {HTMLElement} embedBlock The embed block element
	 */
	const processAutoplayEmbed = (embedBlock) => {
		const iframe = embedBlock.querySelector('iframe');
		if (!iframe) return;

		// Check if autoplay is enabled
		const hasAutoplay = embedBlock.hasAttribute('data-autoplay') && embedBlock.getAttribute('data-autoplay') === 'true';
		if (hasAutoplay) {
			iframe.src = addAutoplayParams(iframe.src);
		}
	};

	document.addEventListener('DOMContentLoaded', () => {
		// Process fullwidth embeds (which may also have autoplay)
		document.querySelectorAll('.has-fullwidth-youtube').forEach(processFullwidthEmbed);

		// Process autoplay-only embeds (not fullwidth)
		document.querySelectorAll('.has-autoplay-youtube:not(.has-fullwidth-youtube)').forEach(processAutoplayEmbed);
	});

})();
