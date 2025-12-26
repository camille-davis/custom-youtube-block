<?php
/**
 * Feature Registry Class
 *
 * Centralized configuration for all YouTube block features.
 * Single source of truth for feature definitions.
 *
 * @package Custom_YouTube_Block
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Class Custom_YouTube_Block_Feature_Registry
 */
class Custom_YouTube_Block_Feature_Registry {

	/**
	 * Get all feature definitions
	 *
	 * @return array Feature definitions with keys, slugs, labels, and help text.
	 */
	public static function get_features() {
		return array(
			'fullwidth' => array(
				'slug' => 'fullwidth',
				'label' => __( 'Fullwidth', 'custom-youtube-block' ),
				'help' => __( 'Make youtube video fullwidth.', 'custom-youtube-block' ),
			),
			'autoplay' => array(
				'slug' => 'autoplay',
				'label' => __( 'Autoplay', 'custom-youtube-block' ),
				'help' => __( 'Automatically play the video when the page loads. Video will be muted.', 'custom-youtube-block' ),
			),
			'loop' => array(
				'slug' => 'loop',
				'label' => __( 'Loop Video', 'custom-youtube-block' ),
				'help' => __( 'Make the video loop continuously when it reaches the end.', 'custom-youtube-block' ),
			),
			'hideControls' => array(
				'slug' => 'hide-controls',
				'label' => __( 'Hide Controls', 'custom-youtube-block' ),
				'help' => __( 'Remove video player controls from the YouTube embed.', 'custom-youtube-block' ),
			),
			'hideRelatedVideos' => array(
				'slug' => 'hide-related-videos',
				'label' => __( 'Hide Related Videos', 'custom-youtube-block' ),
				'help' => __( 'Hide related videos that appear at the end of the video. Only videos from the same channel will be shown.', 'custom-youtube-block' ),
			),
			'disableInteraction' => array(
				'slug' => 'disable-interaction',
				'label' => __( 'Disable Interaction', 'custom-youtube-block' ),
				'help' => __( 'Prevent all mouse and keyboard interactions with the video player, including pause on click and keyboard controls. Warning: This blocks all user interactions.', 'custom-youtube-block' ),
			),
		);
	}

	/**
	 * Get feature keys in order
	 *
	 * @return array Array of feature keys.
	 */
	public static function get_feature_keys() {
		return array_keys( self::get_features() );
	}

	/**
	 * Get feature map (key => slug) for rendering
	 *
	 * @return array Feature map.
	 */
	public static function get_feature_map() {
		$features = self::get_features();
		$map = array();
		foreach ( $features as $key => $config ) {
			$map[ $key ] = $config['slug'];
		}
		return $map;
	}

	/**
	 * Get feature configuration for JavaScript
	 *
	 * Returns simplified array for JavaScript consumption.
	 *
	 * @return array Feature configuration.
	 */
	public static function get_js_config() {
		$features = self::get_features();
		$config = array();
		foreach ( $features as $key => $data ) {
			$config[] = array(
				'key' => $key,
				'label' => $data['label'],
				'help' => $data['help'],
			);
		}
		return $config;
	}
}

