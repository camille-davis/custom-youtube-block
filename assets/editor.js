/**
 * Editor JavaScript for Fullsize YouTube Embeds
 *
 * Adds a toggle control to YouTube embed blocks in the editor.
 */

(function() {
	'use strict';

	var el = wp.element.createElement;
	var __ = wp.i18n.__;
	var InspectorControls = wp.blockEditor.InspectorControls;
	var PanelBody = wp.components.PanelBody;
	var ToggleControl = wp.components.ToggleControl;
	var addFilter = wp.hooks.addFilter;

	// Register the fullsize attribute
	addFilter('blocks.registerBlockType', 'fullsize-youtube-embeds/add-attribute', function(settings, name) {
		if (name === 'core/embed') {
			settings.attributes = settings.attributes || {};
			settings.attributes.fullsize = { type: 'boolean', default: false };
		}
		return settings;
	});

	// Add fullsize toggle to YouTube embed blocks
	addFilter('editor.BlockEdit', 'fullsize-youtube-embeds/add-toggle', function(BlockEdit) {
		return function(props) {
			if (props.name !== 'core/embed') return el(BlockEdit, props);

			var attrs = props.attributes;
			var isYouTube = attrs.providerNameSlug === 'youtube' ||
			                (attrs.url && (attrs.url.indexOf('youtube.com') !== -1 || attrs.url.indexOf('youtu.be') !== -1));

			if (!isYouTube) return el(BlockEdit, props);

			return el(wp.element.Fragment, {},
				el(BlockEdit, props),
				el(InspectorControls, {},
					el(PanelBody, { title: __('YouTube Settings', 'fullsize-youtube-embeds') },
						el(ToggleControl, {
							label: __('Fullsize Mode', 'fullsize-youtube-embeds'),
							help: __('Enable to make this embed dynamically resize to match its container width, just like in the editor.', 'fullsize-youtube-embeds'),
							checked: !!attrs.fullsize,
							onChange: function(value) { props.setAttributes({ fullsize: value }); }
						})
					)
				)
			);
		};
	});

})();

