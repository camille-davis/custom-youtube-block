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

		// Track current fetch size
		let currentFetchSize = null;

		/**
		 * Fetch and update embed based on container width
		 */
		const fetchAndUpdate = () => {
			const wrapperWidth = wrapper.getBoundingClientRect().width;
			if (wrapperWidth <= 0) return;

			// Determine fetch size based on breakpoints
			let fetchSize;
			if (wrapperWidth <= BREAKPOINTS[0]) fetchSize = BREAKPOINTS[0];
			else if (wrapperWidth <= BREAKPOINTS[1]) fetchSize = BREAKPOINTS[1];
			else if (wrapperWidth <= BREAKPOINTS[2]) fetchSize = BREAKPOINTS[2];
			else fetchSize = EXTRA_LARGE_SIZE;

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
				});
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
