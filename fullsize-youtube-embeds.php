<?php
/**
 * Plugin Name: Fullsize Option for YouTube Embeds
 * Plugin URI: https://github.com/camilledavis/fullsize-youtube-embeds
 * Description: Adds a fullsize toggle option to YouTube embed blocks.
 * Version: 1.0.0
 * Author: Camille Davis
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
	 * Flag to track if fullsize YouTube embed was found during rendering
	 *
	 * @var bool
	 */
	private static $found_fullsize_youtube = false;

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
		add_action( 'enqueue_block_editor_assets', array( $this, 'enqueue_editor_assets' ) );
		add_action( 'wp_enqueue_scripts', array( $this, 'maybe_enqueue_frontend_assets' ) );
		add_action( 'wp_print_scripts', array( $this, 'maybe_enqueue_frontend_assets_fallback' ) );
		add_filter( 'block_type_metadata_settings', array( $this, 'add_fullsize_attribute' ), 10, 2 );
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

		// Verify it's a YouTube embed
		$is_youtube = ( ! empty( $block['attrs']['providerNameSlug'] ) && 'youtube' === $block['attrs']['providerNameSlug'] ) ||
		              ( ! empty( $block['attrs']['url'] ) && ( false !== strpos( $block['attrs']['url'], 'youtube.com' ) || false !== strpos( $block['attrs']['url'], 'youtu.be' ) ) );
		if ( ! $is_youtube ) {
			return $block_content;
		}

		// Set flag for fallback enqueue
		self::$found_fullsize_youtube = true;

		// Add class and data attribute to the figure element
		$block_content = preg_replace(
			'/(<figure[^>]*class="[^"]*wp-block-embed[^"]*)(")/',
			'$1 has-fullsize-youtube$2 data-fullsize="true"',
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
			array( 'wp-blocks', 'wp-element', 'wp-block-editor', 'wp-components', 'wp-i18n', 'wp-hooks' ),
			self::VERSION,
			true
		);
	}

	/**
	 * Conditionally enqueue frontend assets only if needed
	 */
	public function maybe_enqueue_frontend_assets() {
		// Only enqueue if there's a YouTube embed with fullsize enabled
		if ( ! $this->has_fullsize_youtube_embed() ) {
			return;
		}

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

	/**
	 * Check if current page has YouTube embed with fullsize enabled
	 *
	 * @return bool True if found, false otherwise.
	 */
	private function has_fullsize_youtube_embed() {
		// Check if we're in a post/page context
		if ( ! is_singular() && ! is_home() && ! is_front_page() && ! is_archive() ) {
			return false;
		}

		global $post;
		if ( ! $post || empty( $post->post_content ) ) {
			return false;
		}

		// Parse blocks from post content
		$blocks = parse_blocks( $post->post_content );
		if ( empty( $blocks ) ) {
			return false;
		}

		// Recursively check blocks for YouTube embeds with fullsize enabled
		return $this->check_blocks_for_fullsize_youtube( $blocks );
	}

	/**
	 * Recursively check blocks for YouTube embed with fullsize enabled
	 *
	 * @param array $blocks Array of block data.
	 * @return bool True if found, false otherwise.
	 */
	private function check_blocks_for_fullsize_youtube( $blocks ) {
		foreach ( $blocks as $block ) {
			// Check if this is an embed block with fullsize enabled
			if ( 'core/embed' === $block['blockName'] && ! empty( $block['attrs']['fullsize'] ) ) {
				$is_youtube = ( ! empty( $block['attrs']['providerNameSlug'] ) && 'youtube' === $block['attrs']['providerNameSlug'] ) ||
				              ( ! empty( $block['attrs']['url'] ) && ( false !== strpos( $block['attrs']['url'], 'youtube.com' ) || false !== strpos( $block['attrs']['url'], 'youtu.be' ) ) );

				if ( $is_youtube ) {
					return true;
				}
			}

			// Recursively check inner blocks
			if ( ! empty( $block['innerBlocks'] ) && $this->check_blocks_for_fullsize_youtube( $block['innerBlocks'] ) ) {
				return true;
			}
		}

		return false;
	}

	/**
	 * Fallback: Enqueue frontend assets if found during block rendering
	 * Handles edge cases like widgets, reusable blocks, etc.
	 */
	public function maybe_enqueue_frontend_assets_fallback() {
		if ( ! self::$found_fullsize_youtube ) {
			return;
		}

		// Only enqueue if not already enqueued
		if ( wp_script_is( 'fullsize-youtube-embeds-frontend', 'enqueued' ) ) {
			return;
		}

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
