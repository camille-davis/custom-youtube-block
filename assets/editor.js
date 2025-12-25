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

	/**
	 * Add fullsize toggle to YouTube embed blocks
	 */
	function addFullsizeToggle(BlockEdit) {
		return function(props) {
			var attributes = props.attributes;
			var setAttributes = props.setAttributes;
			var name = props.name;

			// Only apply to embed blocks
			if (name !== 'core/embed') {
				return el(BlockEdit, props);
			}

			// Only show for YouTube embeds
			var isYouTube = attributes.providerNameSlug === 'youtube' ||
			                (attributes.url && (
			                    attributes.url.indexOf('youtube.com') !== -1 ||
			                    attributes.url.indexOf('youtu.be') !== -1
			                ));

			if (!isYouTube) {
				return el(BlockEdit, props);
			}

			var fullsize = !!attributes.fullsize;

			return el(
				wp.element.Fragment,
				{},
				el(BlockEdit, props),
				el(
					InspectorControls,
					{},
					el(
						PanelBody,
						{
							title: __('YouTube Settings', 'fullsize-youtube-embeds')
						},
						el(
							ToggleControl,
							{
								label: __('Fullsize Mode', 'fullsize-youtube-embeds'),
								help: __('Enable to make this embed dynamically resize to match its container width, just like in the editor.', 'fullsize-youtube-embeds'),
								checked: fullsize,
								onChange: function(value) {
									setAttributes({ fullsize: value });
								}
							}
						)
					)
				)
			);
		};
	}

	// Register the filter
	addFilter(
		'editor.BlockEdit',
		'fullsize-youtube-embeds/add-toggle',
		addFullsizeToggle
	);

})();

