/**
 * Frontend JavaScript for Fullsize YouTube Embeds
 *
 * Only applies to YouTube embed blocks with fullsize attribute enabled.
 */

(function() {

	const ASPECT_RATIO = 0.5625; // 16:9
	const PROXY_URL = window.fullsizeYouTubeSettings.restUrl || '/wp-json/oembed/1.0/proxy';

	// Breakpoints and corresponding fetch sizes
	const BREAKPOINTS = {
		small: { max: 640, size: 640 },
		medium: { max: 1024, size: 1024 },
		large: { max: 1920, size: 1920 },
		extraLarge: { max: Infinity, size: 2560 }
	};

	/**
	 * Get breakpoint name for given width
	 */
	const getBreakpoint = (width) => {
		if (width <= BREAKPOINTS.small.max) return 'small';
		if (width <= BREAKPOINTS.medium.max) return 'medium';
		if (width <= BREAKPOINTS.large.max) return 'large';
		return 'extraLarge';
	};

	/**
	 * Get fetch size for breakpoint
	 */
	const getFetchSize = (breakpoint) => BREAKPOINTS[breakpoint].size;

	/**
	 * Fetch oEmbed at specified size
	 */
	const fetchOEmbed = (url, width) => {
		const params = new URLSearchParams({
			url: url,
			maxwidth: width,
			maxheight: Math.ceil(width * ASPECT_RATIO)
		});
		return fetch(PROXY_URL + '?' + params.toString())
			.then((res) => res.ok ? res.json() : Promise.reject(new Error('Request failed')))
			.then((data) => data.html || null)
			.catch((err) => { console.warn('oEmbed fetch failed:', err); return null; });
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

		// Store original iframe for reference
		const originalIframe = iframe;

		// Track current breakpoint and fetch size
		let currentBreakpoint = null;
		let currentFetchSize = null;

		/**
		 * Update embed with fetched HTML
		 */
		const updateEmbed = (html) => {
			if (!html) return;

			// Parse HTML to extract iframe
			const temp = document.createElement('div');
			temp.innerHTML = html;
			const newIframe = temp.querySelector('iframe');
			if (!newIframe) return;

			// Replace iframe
			wrapper.innerHTML = '';
			wrapper.appendChild(newIframe);

			// Configure iframe
			newIframe.removeAttribute('width');
			newIframe.removeAttribute('height');
			newIframe.style.position = 'absolute';
			newIframe.style.width = '100%';
			newIframe.style.height = '100%';
		};

		/**
		 * Fetch and update embed based on container width
		 */
		const fetchAndUpdate = () => {
			const wrapperWidth = wrapper.getBoundingClientRect().width;
			if (wrapperWidth <= 0) return;

			const breakpoint = getBreakpoint(wrapperWidth);
			const fetchSize = getFetchSize(breakpoint);

			// Only fetch if breakpoint changed
			if (breakpoint === currentBreakpoint && fetchSize === currentFetchSize) return;

			currentBreakpoint = breakpoint;
			currentFetchSize = fetchSize;

			fetchOEmbed(url, fetchSize).then(updateEmbed);
		};

		// Configure wrapper
		wrapper.style.width = '100%';

		// Set up height calculation based on width (16:9 aspect ratio)
		const updateHeight = () => {
			const wrapperWidth = wrapper.getBoundingClientRect().width;
			if (wrapperWidth > 0) {
				wrapper.style.height = Math.ceil(wrapperWidth * ASPECT_RATIO) + 'px';
			}
		};

		// Initial fetch and height setup
		fetchAndUpdate();
		updateHeight();

		// Watch for resize and update accordingly
		const resizeObserver = new ResizeObserver(() => {
			updateHeight();
			fetchAndUpdate();
		});
		resizeObserver.observe(wrapper);
	};

	document.addEventListener('DOMContentLoaded', () => {
		document.querySelectorAll('.has-fullsize-youtube').forEach(processEmbed);
	});

})();
