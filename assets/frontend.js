/**
 * Frontend JavaScript for Custom YouTube Block
 *
 * Handles fullwidth, autoplay, and hide controls features for YouTube embed blocks.
 */

(function() {

	const ASPECT_RATIO = 0.5625; // 16:9
	const PROXY_URL = window.customYouTubeSettings ? window.customYouTubeSettings.restUrl : '/wp-json/oembed/1.0/proxy';
	const BREAKPOINTS = [640, 1024, 1920];
	const EXTRA_LARGE_SIZE = 2560;

	const addAutoplayParams = (src) => {
		if (!src) return src;
		const url = new URL(src);
		url.searchParams.set('autoplay', '1');
		url.searchParams.set('mute', '1');
		return url.toString();
	};

	const addHideControlsParams = (src) => {
		if (!src) return src;
		const url = new URL(src);
		url.searchParams.set('controls', '0');
		return url.toString();
	};

	const processFullwidthEmbed = (embedBlock) => {
		const iframe = embedBlock.querySelector('iframe');
		if (!iframe) return;

		const match = iframe.src.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/);
		const videoId = match ? match[1] : null;
		if (!videoId) return;

		const url = 'https://www.youtube.com/watch?v=' + videoId;
		let wrapper = embedBlock.querySelector('.wp-block-embed__wrapper');
		if (!wrapper) {
			wrapper = document.createElement('div');
			wrapper.className = 'wp-block-embed__wrapper';
			embedBlock.insertBefore(wrapper, iframe);
		}

		wrapper.style.width = '100%';

		let currentFetchSize = null;

		const getWrapperWidth = () => wrapper.getBoundingClientRect().width;

		const updateHeight = () => {
			const width = getWrapperWidth();
			if (width > 0) {
				wrapper.style.height = Math.ceil(width * ASPECT_RATIO) + 'px';
			}
		};

		const fetchAndUpdate = () => {
			const width = getWrapperWidth();
			if (width <= 0) return;

			const fetchSize = BREAKPOINTS.find(bp => width <= bp) || EXTRA_LARGE_SIZE;
			if (fetchSize === currentFetchSize) return;

			currentFetchSize = fetchSize;

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

					const temp = document.createElement('div');
					temp.innerHTML = html;
					const newIframe = temp.querySelector('iframe');
					if (!newIframe) return;

					let iframeSrc = newIframe.src;
					if (embedBlock.getAttribute('data-autoplay') === 'true') {
						iframeSrc = addAutoplayParams(iframeSrc);
					}
					if (embedBlock.getAttribute('data-hide-controls') === 'true') {
						iframeSrc = addHideControlsParams(iframeSrc);
					}
					newIframe.src = iframeSrc;

					wrapper.innerHTML = '';
					wrapper.appendChild(newIframe);
					newIframe.removeAttribute('width');
					newIframe.removeAttribute('height');
					newIframe.style.position = 'absolute';
					newIframe.style.width = '100%';
					newIframe.style.height = '100%';
				});
		};

		updateHeight();
		fetchAndUpdate();
		new ResizeObserver(() => {
			updateHeight();
			fetchAndUpdate();
		}).observe(wrapper);
	};

	const processAutoplayEmbed = (embedBlock) => {
		const iframe = embedBlock.querySelector('iframe');
		if (!iframe) return;
		let iframeSrc = iframe.src;
		if (embedBlock.getAttribute('data-autoplay') === 'true') {
			iframeSrc = addAutoplayParams(iframeSrc);
		}
		if (embedBlock.getAttribute('data-hide-controls') === 'true') {
			iframeSrc = addHideControlsParams(iframeSrc);
		}
		if (iframeSrc !== iframe.src) {
			iframe.src = iframeSrc;
		}
	};

	document.addEventListener('DOMContentLoaded', () => {
		document.querySelectorAll('.has-fullwidth-youtube').forEach(processFullwidthEmbed);
		document.querySelectorAll('.has-autoplay-youtube:not(.has-fullwidth-youtube), .has-hide-controls-youtube:not(.has-fullwidth-youtube)').forEach(processAutoplayEmbed);
	});

})();
