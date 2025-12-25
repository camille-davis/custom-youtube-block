<?php
/**
 * Plugin Name: Fullsize Option for YouTube Embeds
 * Plugin URI: https://github.com/yourusername/fullsize-youtube-embeds
 * Description: Adds a fullsize toggle option to YouTube embed blocks that makes them dynamically resize to match their container width, just like in the editor.
 * Version: 1.0.0
 * Author: Your Name
 * License: GPL-2.0-or-later
 * Text Domain: fullsize-youtube-embeds
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Main plugin class
 */
class Fullsize_YouTube_Embeds {

	/**
	 * Plugin version
	 */
	const VERSION = '1.0.0';

	/**
	 * Constructor
	 */
	public function __construct() {
		add_action( 'init', array( $this, 'init' ) );
	}

	/**
	 * Initialize plugin
	 */
	public function init() {
		// Only load if block editor is available
		if ( ! function_exists( 'register_block_type' ) ) {
			return;
		}

		// Enqueue editor assets
		add_action( 'enqueue_block_editor_assets', array( $this, 'enqueue_editor_assets' ) );

		// Enqueue frontend assets
		add_action( 'wp_enqueue_scripts', array( $this, 'enqueue_frontend_assets' ) );

		// Filter embed block attributes
		add_filter( 'block_type_metadata_settings', array( $this, 'add_fullsize_attribute' ), 10, 2 );

		// Filter embed block output to add class
		add_filter( 'render_block_core/embed', array( $this, 'render_embed_block' ), 10, 2 );
	}

	/**
	 * Add fullsize attribute to YouTube embed blocks
	 *
	 * @param array $settings Block settings.
	 * @param array $metadata Block metadata.
	 * @return array Modified settings.
	 */
	public function add_fullsize_attribute( $settings, $metadata ) {
		if ( 'core/embed' !== $metadata['name'] ) {
			return $settings;
		}

		if ( ! isset( $settings['attributes'] ) ) {
			$settings['attributes'] = array();
		}

		$settings['attributes']['fullsize'] = array(
			'type'    => 'boolean',
			'default' => false,
		);

		return $settings;
	}

	/**
	 * Filter embed block output to add fullsize class
	 *
	 * @param string $block_content The block content.
	 * @param array  $block         The block data.
	 * @return string Modified block content.
	 */
	public function render_embed_block( $block_content, $block ) {
		// Only process YouTube embeds with fullsize enabled
		if ( empty( $block['attrs']['fullsize'] ) ) {
			return $block_content;
		}

		// Check if it's a YouTube embed
		$is_youtube = false;
		if ( ! empty( $block['attrs']['providerNameSlug'] ) && 'youtube' === $block['attrs']['providerNameSlug'] ) {
			$is_youtube = true;
		} elseif ( ! empty( $block['attrs']['url'] ) ) {
			$url = $block['attrs']['url'];
			$is_youtube = ( false !== strpos( $url, 'youtube.com' ) || false !== strpos( $url, 'youtu.be' ) );
		}

		if ( ! $is_youtube ) {
			return $block_content;
		}

		// Add class to the figure element
		$block_content = preg_replace(
			'/(<figure[^>]*class="[^"]*wp-block-embed[^"]*)/',
			'$1 has-fullsize-youtube',
			$block_content,
			1
		);

		// Add data attribute
		$block_content = preg_replace(
			'/(<figure[^>]*class="[^"]*has-fullsize-youtube[^"]*")/',
			'$1 data-fullsize="true"',
			$block_content,
			1
		);

		return $block_content;
	}

	/**
	 * Enqueue editor assets
	 */
	public function enqueue_editor_assets() {
		wp_enqueue_script(
			'fullsize-youtube-embeds-editor',
			plugins_url( 'assets/editor.js', __FILE__ ),
			array( 'wp-blocks', 'wp-element', 'wp-editor', 'wp-components', 'wp-i18n' ),
			self::VERSION,
			true
		);
	}

	/**
	 * Enqueue frontend assets
	 */
	public function enqueue_frontend_assets() {
		wp_enqueue_script(
			'fullsize-youtube-embeds-frontend',
			plugins_url( 'assets/frontend.js', __FILE__ ),
			array(),
			self::VERSION,
			true
		);

		wp_localize_script(
			'fullsize-youtube-embeds-frontend',
			'fullsizeYouTubeSettings',
			array(
				'restUrl' => rest_url( 'oembed/1.0/proxy' ),
				'nonce'   => wp_create_nonce( 'wp_rest' ),
			)
		);
	}
}

new Fullsize_YouTube_Embeds();
