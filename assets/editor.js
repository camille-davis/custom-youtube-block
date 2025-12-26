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

	// Get features from localized data (fallback to empty array if not available)
	const features = (window.customYouTubeBlock && window.customYouTubeBlock.features) || [];

	// Register custom attributes (client-side)
	addFilter('blocks.registerBlockType', 'custom-youtube-block/add-attribute', (settings, name) => {
		if (name === 'core/embed') {
			settings.attributes = settings.attributes || {};
			features.forEach(feature => {
				settings.attributes[feature.key] = { type: 'boolean', default: false };
			});
		}
		return settings;
	});

	// Add toggle controls to YouTube embed blocks
	addFilter('editor.BlockEdit', 'custom-youtube-block/add-toggles', (BlockEdit) => (props) => {
		if (props.name !== 'core/embed') return el(BlockEdit, props);

		const { attributes, setAttributes } = props;

		// Check if this is a YouTube embed (consistent with PHP helper logic)
		const isYouTube = attributes.providerNameSlug === 'youtube' ||
			(attributes.url && typeof attributes.url === 'string' &&
				(attributes.url.indexOf('youtube.com') !== -1 || attributes.url.indexOf('youtu.be') !== -1));

		if (!isYouTube) return el(BlockEdit, props);

		const toggleControls = features.map(toggle => el(ToggleControl, {
			key: toggle.key,
			label: toggle.label,
			help: toggle.help,
			checked: attributes[toggle.key],
			onChange: (value) => setAttributes({ [toggle.key]: value })
		}));

		return el(Fragment, {},
			el(BlockEdit, props),
			el(InspectorControls, {},
				el(PanelBody, { title: __('YouTube Settings', 'custom-youtube-block') },
					toggleControls
				)
			)
		);
	});

})();
