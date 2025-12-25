/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { InspectorControls } from '@wordpress/block-editor';
import { PanelBody, ToggleControl } from '@wordpress/components';
import { addFilter } from '@wordpress/hooks';

/**
 * Add fullsize toggle to YouTube embed blocks
 */
function addFullsizeToggle( BlockEdit ) {
	return ( props ) => {
		const { attributes, setAttributes, name } = props;

		// Only apply to embed blocks
		if ( name !== 'core/embed' ) {
			return <BlockEdit { ...props } />;
		}

		// Only show for YouTube embeds
		// Check providerNameSlug first (set after oEmbed fetch)
		// Then check URL as fallback (for newly added embeds)
		const isYouTube = attributes.providerNameSlug === 'youtube' ||
		                  ( attributes.url && (
		                      attributes.url.includes( 'youtube.com' ) ||
		                      attributes.url.includes( 'youtu.be' )
		                  ) );

		if ( ! isYouTube ) {
			return <BlockEdit { ...props } />;
		}

		const { fullsize = false } = attributes;

		return (
			<>
				<BlockEdit { ...props } />
				<InspectorControls>
					<PanelBody title={ __( 'YouTube Settings', 'fullsize-youtube-embeds' ) }>
						<ToggleControl
							label={ __( 'Fullsize Mode', 'fullsize-youtube-embeds' ) }
							help={ __( 'Enable to make this embed dynamically resize to match its container width, just like in the editor.', 'fullsize-youtube-embeds' ) }
							checked={ fullsize }
							onChange={ ( value ) => setAttributes( { fullsize: value } ) }
						/>
					</PanelBody>
				</InspectorControls>
			</>
		);
	};
}

addFilter(
	'editor.BlockEdit',
	'fullsize-youtube-embeds/add-toggle',
	addFullsizeToggle
);

