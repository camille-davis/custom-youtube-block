/**
 * Frontend JavaScript for Fullsize YouTube Embeds
 *
 * Only applies to YouTube embed blocks with fullsize attribute enabled.
 */

(function() {

	const ASPECT_RATIO = 0.5625; // 16:9
	const PROXY_URL = window.fullsizeYouTubeSettings.restUrl || '/wp-json/oembed/1.0/proxy';
	const BREAKPOINTS = [640, 1024, 1920];
	const EXTRA_LARGE_SIZE = 2560;

	/**
	 * Get fetch size for given width
	 */
	const getFetchSize = (width) => BREAKPOINTS.find(bp => width <= bp) || EXTRA_LARGE_SIZE;

	/**
	 * Configure iframe for responsive display
	 */
	const configureIframe = (iframe) => {
		iframe.removeAttribute('width');
		iframe.removeAttribute('height');
		iframe.style.position = 'absolute';
		iframe.style.width = '100%';
		iframe.style.height = '100%';
	};

	/**
	 * Process a single embed block
	 */
	const processEmbed = (embedBlock) => {
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
		 * Replace iframe with new one from HTML
		 */
		const replaceIframe = (html) => {
			const temp = document.createElement('div');
			temp.innerHTML = html;
			const newIframe = temp.querySelector('iframe');
			if (!newIframe) return;

			wrapper.innerHTML = '';
			wrapper.appendChild(newIframe);
			configureIframe(newIframe);
		};

		/**
		 * Fetch and update embed based on container width
		 */
		const fetchAndUpdate = () => {
			const width = getWrapperWidth();
			if (width <= 0) return;

			const fetchSize = getFetchSize(width);

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
				.then((html) => html && replaceIframe(html));
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

	document.addEventListener('DOMContentLoaded', () => {
		document.querySelectorAll('.has-fullsize-youtube').forEach(processEmbed);
	});

})();
