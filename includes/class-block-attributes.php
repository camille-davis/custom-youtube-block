<?php
/**
 * Block Attributes Class
 *
 * Handles registration of custom block attributes.
 *
 * @package Custom_YouTube_Block
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Class Custom_YouTube_Block_Attributes
 */
class Custom_YouTube_Block_Attributes {

	/**
	 * Initialize the class
	 */
	public function __construct() {
		add_filter( 'block_type_metadata_settings', array( $this, 'add_custom_attributes' ), 10, 2 );
	}

	/**
	 * Add custom attributes to Embed blocks.
	 *
	 * @param array $settings Block settings.
	 * @param array $metadata Block metadata.
	 * @return array Modified settings.
	 */
	public function add_custom_attributes( $settings, $metadata ) {
		if ( 'core/embed' !== $metadata['name'] ) {
			return $settings;
		}

		$settings['attributes']['fullwidth'] = array(
			'type'    => 'boolean',
			'default' => false,
		);

		$settings['attributes']['autoplay'] = array(
			'type'    => 'boolean',
			'default' => false,
		);

		return $settings;
	}
}

