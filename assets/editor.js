/**
 * Editor JavaScript for Fullsize YouTube Embeds
 *
 * Adds a toggle control to YouTube embed blocks in the editor.
 */

(function() {
	const el = wp.element.createElement;
	const __ = wp.i18n.__;
	const Fragment = wp.element.Fragment;
	const InspectorControls = wp.blockEditor.InspectorControls;
	const PanelBody = wp.components.PanelBody;
	const ToggleControl = wp.components.ToggleControl;
	const addFilter = wp.hooks.addFilter;

	// Register the fullsize attribute (client-side)
	addFilter('blocks.registerBlockType', 'fullsize-youtube-embeds/add-attribute', (settings, name) => {
		if (name === 'core/embed') {
			settings.attributes = settings.attributes || {};
			settings.attributes.fullsize = { type: 'boolean', default: false };
		}
		return settings;
	});

	// Add fullsize toggle to YouTube embed blocks
	addFilter('editor.BlockEdit', 'fullsize-youtube-embeds/add-toggle', (BlockEdit) => (props) => {
		if (props.name !== 'core/embed') return el(BlockEdit, props);

		const { attributes, setAttributes } = props;
		const isYouTube = attributes.providerNameSlug === 'youtube' ||
			(attributes.url && (attributes.url.includes('youtube.com') || attributes.url.includes('youtu.be')));

		if (!isYouTube) return el(BlockEdit, props);

		return el(Fragment, {},
			el(BlockEdit, props),
			el(InspectorControls, {},
				el(PanelBody, { title: __('YouTube Settings', 'fullsize-youtube-embeds') },
					el(ToggleControl, {
						label: __('Fullsize Mode', 'fullsize-youtube-embeds'),
						help: __('Enable to make this embed dynamically resize to match its container width, just like in the editor.', 'fullsize-youtube-embeds'),
						checked: attributes.fullsize,
						onChange: (value) => setAttributes({ fullsize: value })
					})
				)
			)
		);
	});

})();
