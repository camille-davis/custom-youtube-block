/**
 * Frontend JavaScript for Fullsize YouTube Embeds
 *
 * Only applies to YouTube embed blocks with fullsize attribute enabled.
 */

(function() {

	// Fetch at large size, then scale down with CSS.
	const FETCH_SIZE = 1920;
	const ASPECT_RATIO = 0.5625; // 16:9
	const PROXY_URL = window.fullsizeYouTubeSettings.restUrl || '/wp-json/oembed/1.0/proxy';

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

		// Fetch oEmbed at large size (will scale down with CSS)
		const params = new URLSearchParams({
			url: url,
			maxwidth: FETCH_SIZE,
			maxheight: Math.ceil(FETCH_SIZE * ASPECT_RATIO)
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

				// Get or create wrapper
				let wrapper = embedBlock.querySelector('.wp-block-embed__wrapper');
				if (!wrapper) {
					wrapper = document.createElement('div');
					wrapper.className = 'wp-block-embed__wrapper';
					embedBlock.insertBefore(wrapper, iframe);
				}

				// Replace old iframe with new one
				wrapper.innerHTML = '';
				wrapper.appendChild(newIframe);

				// Configure wrapper
				wrapper.style.width = '100%';

				// Set up height calculation based on width (16:9 aspect ratio)
				const updateHeight = () => {
					const wrapperWidth = wrapper.getBoundingClientRect().width;
					if (wrapperWidth > 0) {
						wrapper.style.height = Math.ceil(wrapperWidth * ASPECT_RATIO) + 'px';
					}
				};
				updateHeight();
				new ResizeObserver(updateHeight).observe(wrapper);

				// Configure iframe
				newIframe.removeAttribute('width');
				newIframe.removeAttribute('height');
				newIframe.style.position = 'absolute';
				newIframe.style.width = '100%';
				newIframe.style.height = '100%';
			});
	};

	document.addEventListener('DOMContentLoaded', () => {
		document.querySelectorAll('.has-fullsize-youtube').forEach(processEmbed);
	});

})();
