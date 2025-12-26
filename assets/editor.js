/**
 * Editor JavaScript for Fullwidth YouTube Embeds
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

	// Register the fullwidth attribute (client-side)
	addFilter('blocks.registerBlockType', 'fullwidth-youtube-embeds/add-attribute', (settings, name) => {
		if (name === 'core/embed') {
			settings.attributes = settings.attributes || {};
			settings.attributes.fullwidth = { type: 'boolean', default: false };
		}
		return settings;
	});

	// Add fullwidth toggle to YouTube embed blocks
	addFilter('editor.BlockEdit', 'fullwidth-youtube-embeds/add-toggle', (BlockEdit) => (props) => {
		if (props.name !== 'core/embed') return el(BlockEdit, props);

		const { attributes, setAttributes } = props;
		const isYouTube = attributes.providerNameSlug === 'youtube' ||
			(attributes.url && (attributes.url.includes('youtube.com') || attributes.url.includes('youtu.be')));

		if (!isYouTube) return el(BlockEdit, props);

		return el(Fragment, {},
			el(BlockEdit, props),
			el(InspectorControls, {},
				el(PanelBody, { title: __('YouTube Settings', 'fullwidth-youtube-embeds') },
					el(ToggleControl, {
						label: __('Fullwidth', 'fullwidth-youtube-embeds'),
						help: __('Make youtube video fullwidth.', 'fullwidth-youtube-embeds'),
						checked: attributes.fullwidth,
						onChange: (value) => setAttributes({ fullwidth: value })
					})
				)
			)
		);
	});

})();
