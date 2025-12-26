/**
 * Frontend JavaScript for Fullsize YouTube Embeds
 *
 * Only applies to YouTube embed blocks with fullsize attribute enabled.
 */

(function() {

	// Fetch at large size, then scale down with CSS.
	const FETCH_SIZE = 1920;
	const ASPECT_RATIO = 0.5625; // 16:9

	const settings = window.fullsizeYouTubeSettings || {};
	const proxyUrl = settings.restUrl || '/wp-json/oembed/1.0/proxy';

	/**
	 * Process a single embed block
	 */
	const processEmbed = (embedBlock) => {
		if (embedBlock.hasAttribute('data-embed-processed')) return;

		const iframe = embedBlock.querySelector('iframe');
		if (!iframe) {
			embedBlock.setAttribute('data-embed-processed', 'true');
			return;
		}

		// Extract YouTube video ID from iframe src
		const match = iframe.src.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/);
		const videoId = match ? match[1] : null;
		if (!videoId) {
			embedBlock.setAttribute('data-embed-processed', 'true');
			return;
		}

		const url = 'https://www.youtube.com/watch?v=' + videoId;

		// Fetch oEmbed at large size (will scale down with CSS)
		const params = new URLSearchParams({
			url: url,
			maxwidth: FETCH_SIZE,
			maxheight: Math.ceil(FETCH_SIZE * ASPECT_RATIO)
		});
		fetch(proxyUrl + '?' + params.toString())
			.then((res) => res.ok ? res.json() : Promise.reject(new Error('Request failed')))
			.then((data) => data.html || null)
			.catch((err) => { console.warn('oEmbed fetch failed:', err); return null; })
			.then((html) => {
				if (!html) {
					embedBlock.setAttribute('data-embed-processed', 'true');
					return;
				}

				// Replace iframe with fetched version
				const temp = document.createElement('div');
				temp.innerHTML = html;
				const newIframe = temp.querySelector('iframe');
				if (newIframe) {
					// Ensure wrapper exists
					let wrapper = embedBlock.querySelector('.wp-block-embed__wrapper');
					if (!wrapper) {
						wrapper = document.createElement('div');
						wrapper.className = 'wp-block-embed__wrapper';
						embedBlock.insertBefore(wrapper, iframe);
					}

					// Replace old iframe with new one
					wrapper.innerHTML = '';
					wrapper.appendChild(newIframe);

					// Make iframe responsive to container width using CSS
					// Remove fixed dimensions
					newIframe.removeAttribute('width');
					newIframe.removeAttribute('height');

					// Ensure wrapper is positioned relatively and full width
					wrapper.style.position = 'relative';
					wrapper.style.width = '100%';

					// Calculate and set height based on width (16:9 aspect ratio)
					// This ensures height even if :before pseudo-element doesn't work
					const updateHeight = () => {
						const wrapperWidth = wrapper.getBoundingClientRect().width;
						if (wrapperWidth > 0) {
							wrapper.style.height = Math.ceil(wrapperWidth * ASPECT_RATIO) + 'px';
						}
					};

					// Set initial height
					updateHeight();

					// Update on resize
					const resizeObserver = new ResizeObserver(updateHeight);
					resizeObserver.observe(wrapper);

					// Ensure iframe is absolutely positioned and fills wrapper
					newIframe.style.position = 'absolute';
					newIframe.style.top = '0';
					newIframe.style.left = '0';
					newIframe.style.width = '100%';
					newIframe.style.height = '100%';

					// Ensure container is full width
					embedBlock.style.width = '100%';
					embedBlock.style.maxWidth = '100%';

					// Add responsive classes - WordPress CSS uses these for aspect ratio
					// wp-embed-responsive: enables responsive behavior
					// wp-has-aspect-ratio: enables :before padding-top trick
					// wp-embed-aspect-16-9: sets padding-top to 56.25% (16:9 ratio)
					embedBlock.classList.add('wp-embed-responsive', 'wp-has-aspect-ratio', 'wp-embed-aspect-16-9');
				}

				embedBlock.setAttribute('data-embed-processed', 'true');
			});
	};

	document.addEventListener('DOMContentLoaded', () => {
		document.querySelectorAll('.has-fullsize-youtube:not([data-embed-processed])')
			.forEach(processEmbed);
	});

})();
