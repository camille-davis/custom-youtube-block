/**
 * Editor JavaScript for Custom YouTube Block
 *
 * Adds toggle controls to YouTube embed blocks in the editor.
 */

(function() {
	const el = wp.element.createElement;
	const __ = wp.i18n.__;
	const Fragment = wp.element.Fragment;
	const InspectorControls = wp.blockEditor.InspectorControls;
	const PanelBody = wp.components.PanelBody;
	const ToggleControl = wp.components.ToggleControl;
	const addFilter = wp.hooks.addFilter;

	// Register custom attributes (client-side)
	addFilter('blocks.registerBlockType', 'custom-youtube-block/add-attribute', (settings, name) => {
		if (name === 'core/embed') {
			settings.attributes = settings.attributes || {};
			settings.attributes.fullwidth = { type: 'boolean', default: false };
			settings.attributes.autoplay = { type: 'boolean', default: false };
			settings.attributes.hideControls = { type: 'boolean', default: false };
			settings.attributes.loop = { type: 'boolean', default: false };
		}
		return settings;
	});

	// Add toggle controls to YouTube embed blocks
	addFilter('editor.BlockEdit', 'custom-youtube-block/add-toggles', (BlockEdit) => (props) => {
		if (props.name !== 'core/embed') return el(BlockEdit, props);

		const { attributes, setAttributes } = props;
		const isYouTube = attributes.providerNameSlug === 'youtube' ||
			(attributes.url && (attributes.url.includes('youtube.com') || attributes.url.includes('youtu.be')));

		if (!isYouTube) return el(BlockEdit, props);

		return el(Fragment, {},
			el(BlockEdit, props),
			el(InspectorControls, {},
				el(PanelBody, { title: __('YouTube Settings', 'custom-youtube-block') },
					el(ToggleControl, {
						label: __('Fullwidth', 'custom-youtube-block'),
						help: __('Make youtube video fullwidth.', 'custom-youtube-block'),
						checked: attributes.fullwidth,
						onChange: (value) => setAttributes({ fullwidth: value })
					}),
					el(ToggleControl, {
						label: __('Autoplay', 'custom-youtube-block'),
						help: __('Automatically play the video when the page loads. Video will be muted.', 'custom-youtube-block'),
						checked: attributes.autoplay,
						onChange: (value) => setAttributes({ autoplay: value })
					}),
					el(ToggleControl, {
						label: __('Hide Controls', 'custom-youtube-block'),
						help: __('Remove video player controls from the YouTube embed.', 'custom-youtube-block'),
						checked: attributes.hideControls,
						onChange: (value) => setAttributes({ hideControls: value })
					}),
					el(ToggleControl, {
						label: __('Loop Video', 'custom-youtube-block'),
						help: __('Make the video loop continuously when it reaches the end.', 'custom-youtube-block'),
						checked: attributes.loop,
						onChange: (value) => setAttributes({ loop: value })
					})
				)
			)
		);
	});

})();
