/**
 * Frontend JavaScript for Custom YouTube Block
 *
 * Handles fullwidth, autoplay, hide controls, loop, hide related videos, and interaction disabling features.
 */

(function() {

	const ASPECT_RATIO = 0.5625; // 16:9
	const PROXY_URL = window.customYouTubeSettings ? window.customYouTubeSettings.restUrl : '/wp-json/oembed/1.0/proxy';
	const BREAKPOINTS = [640, 1024, 1920];
	const EXTRA_LARGE_SIZE = 2560;

	const extractVideoId = (src) => {
		const match = src.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/);
		return match ? match[1] : null;
	};

	const getDataAttribute = (embedBlock, attr) => embedBlock.getAttribute(attr) === 'true';

	const applyYouTubeParams = (src, embedBlock) => {
		if (!src) return src;
		const url = new URL(src);
		if (getDataAttribute(embedBlock, 'data-autoplay')) {
			url.searchParams.set('autoplay', '1');
			url.searchParams.set('mute', '1');
		}
		if (getDataAttribute(embedBlock, 'data-hide-controls')) {
			url.searchParams.set('controls', '0');
		}
		if (getDataAttribute(embedBlock, 'data-loop')) {
			const videoId = extractVideoId(src);
			if (videoId) {
				url.searchParams.set('loop', '1');
				url.searchParams.set('playlist', videoId);
			}
		}
		if (getDataAttribute(embedBlock, 'data-disable-interaction')) {
			url.searchParams.set('disablekb', '1');
		}
		if (getDataAttribute(embedBlock, 'data-hide-related-videos')) {
			url.searchParams.set('rel', '0');
		}
		return url.toString();
	};

	const applyIframeStyles = (iframe, embedBlock) => {
		if (getDataAttribute(embedBlock, 'data-disable-interaction')) {
			iframe.style.pointerEvents = 'none';
		}
	};

	const setupIframe = (iframe, embedBlock) => {
		iframe.removeAttribute('width');
		iframe.removeAttribute('height');
		iframe.style.position = 'absolute';
		iframe.style.width = '100%';
		iframe.style.height = '100%';
		applyIframeStyles(iframe, embedBlock);
	};

	const processFullwidthEmbed = (embedBlock) => {
		const iframe = embedBlock.querySelector('iframe');
		if (!iframe) return;

		applyIframeStyles(iframe, embedBlock);

		const videoId = extractVideoId(iframe.src);
		if (!videoId) return;

		const url = 'https://www.youtube.com/watch?v=' + videoId;
		let wrapper = embedBlock.querySelector('.wp-block-embed__wrapper');
		if (!wrapper) {
			wrapper = document.createElement('div');
			wrapper.className = 'wp-block-embed__wrapper';
			embedBlock.insertBefore(wrapper, iframe);
		}

		wrapper.style.width = '100%';

		let currentBreakpoint = null;

		const getWrapperWidth = () => wrapper.getBoundingClientRect().width;

		const getDeviceBreakpoint = () => {
			const deviceWidth = window.innerWidth;
			return BREAKPOINTS.find(bp => deviceWidth <= bp) || EXTRA_LARGE_SIZE;
		};

		const updateHeight = () => {
			const width = getWrapperWidth();
			if (width > 0) {
				wrapper.style.height = Math.ceil(width * ASPECT_RATIO) + 'px';
			}
		};

		const fetchAndUpdate = () => {
			const width = getWrapperWidth();
			if (width <= 0) return;

			const params = new URLSearchParams({
				url: url,
				maxwidth: width,
				maxheight: Math.ceil(width * ASPECT_RATIO)
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

					newIframe.src = applyYouTubeParams(newIframe.src, embedBlock);
					setupIframe(newIframe, embedBlock);

					wrapper.innerHTML = '';
					wrapper.appendChild(newIframe);
				});
		};

		const checkBreakpointChange = () => {
			const newBreakpoint = getDeviceBreakpoint();
			if (newBreakpoint !== currentBreakpoint) {
				currentBreakpoint = newBreakpoint;
				fetchAndUpdate();
			}
		};

		updateHeight();
		fetchAndUpdate();
		currentBreakpoint = getDeviceBreakpoint();

		new ResizeObserver(() => {
			updateHeight();
		}).observe(wrapper);

		let resizeTimeout;
		window.addEventListener('resize', () => {
			clearTimeout(resizeTimeout);
			resizeTimeout = setTimeout(() => {
				checkBreakpointChange();
			}, 100);
		});
	};

	const processCustomParamsEmbed = (embedBlock) => {
		const iframe = embedBlock.querySelector('iframe');
		if (!iframe) return;
		const newSrc = applyYouTubeParams(iframe.src, embedBlock);
		if (newSrc !== iframe.src) {
			iframe.src = newSrc;
		}
		applyIframeStyles(iframe, embedBlock);
	};

	document.addEventListener('DOMContentLoaded', () => {
		document.querySelectorAll('.has-fullwidth-youtube').forEach(processFullwidthEmbed);
		document.querySelectorAll('[class*="has-"][class*="-youtube"]:not(.has-fullwidth-youtube)').forEach(processCustomParamsEmbed);
	});

})();
