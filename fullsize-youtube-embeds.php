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
	 * Flag to track if fullsize YouTube embed was found during rendering.
	 *
	 * Set to true when a YouTube embed with fullsize enabled is rendered.
	 * Used by the fallback enqueue mechanism (wp_print_scripts hook) to detect
	 * embeds in widgets, reusable blocks, or other contexts not covered by
	 * the early detection method.
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

		// Block registration and rendering
		add_filter( 'block_type_metadata_settings', array( $this, 'add_fullsize_attribute' ), 10, 2 );
		add_filter( 'render_block_core/embed', array( $this, 'render_embed_block' ), 10, 2 );

		// Editor assets
		add_action( 'enqueue_block_editor_assets', array( $this, 'enqueue_editor_assets' ) );

		// Frontend assets - two-stage detection
		add_action( 'wp_enqueue_scripts', array( $this, 'enqueue_frontend_assets_early' ) );
		add_action( 'wp_print_scripts', array( $this, 'enqueue_frontend_assets_late' ) );
	}

	// ============================================================================
	// Block Registration & Rendering
	// ============================================================================

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
	 * Also sets flag for late-stage script enqueuing if needed.
	 *
	 * @param string $block_content The block content.
	 * @param array  $block         The block data.
	 * @return string Modified block content.
	 */
	public function render_embed_block( $block_content, $block ) {
		// Only process YouTube embeds with fullsize enabled
		if ( ! isset( $block['attrs'] ) || empty( $block['attrs']['fullsize'] ) || ! $this->is_youtube_embed( $block['attrs'] ) ) {
			return $block_content;
		}

		// Set flag for late-stage enqueue (handles widgets, reusable blocks, etc.)
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

	// ============================================================================
	// Editor Assets
	// ============================================================================

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

	// ============================================================================
	// Frontend Assets
	// ============================================================================

	/**
	 * Early detection: Check post content and enqueue if found
	 *
	 * Runs during wp_enqueue_scripts hook (before blocks render).
	 * Checks the main post content for YouTube embeds with fullsize enabled.
	 * This catches most cases efficiently.
	 */
	public function enqueue_frontend_assets_early() {
		if ( $this->has_fullsize_youtube_in_post() ) {
			$this->enqueue_frontend_script();
		}
	}

	/**
	 * Late detection: Check flag set during block rendering
	 *
	 * Runs during wp_print_scripts hook (after blocks render, before scripts output).
	 * Uses the flag set by render_embed_block() to catch embeds in:
	 * - Widgets
	 * - Reusable blocks (synced patterns)
	 * - Theme templates
	 * - Any other context not in main post content
	 */
	public function enqueue_frontend_assets_late() {
		if ( self::$found_fullsize_youtube ) {
			$this->enqueue_frontend_script();
		}
	}

	/**
	 * Enqueue frontend script and localize settings
	 *
	 * Shared method used by both early and late detection.
	 * Includes safety check to prevent duplicate enqueues.
	 */
	private function enqueue_frontend_script() {
		// Prevent duplicate enqueues
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

	// ============================================================================
	// Helper Methods
	// ============================================================================

	/**
	 * Check if current page has YouTube embed with fullsize enabled in post content
	 *
	 * @return bool True if found, false otherwise.
	 */
	private function has_fullsize_youtube_in_post() {
		global $post;
		if ( ! $post || ! has_block( 'core/embed', $post ) ) {
			return false;
		}

		$blocks = parse_blocks( $post->post_content );
		return ! empty( $blocks ) && $this->check_blocks_for_fullsize_youtube( $blocks );
	}

	/**
	 * Recursively check blocks for YouTube embed with fullsize enabled
	 *
	 * @param array $blocks Array of block data.
	 * @return bool True if found, false otherwise.
	 */
	private function check_blocks_for_fullsize_youtube( $blocks ) {
		foreach ( $blocks as $block ) {
			if ( isset( $block['blockName'] ) && 'core/embed' === $block['blockName']
				&& isset( $block['attrs']['fullsize'] ) && ! empty( $block['attrs']['fullsize'] )
				&& $this->is_youtube_embed( $block['attrs'] ) ) {
				return true;
			}

			if ( ! empty( $block['innerBlocks'] ) && $this->check_blocks_for_fullsize_youtube( $block['innerBlocks'] ) ) {
				return true;
			}
		}
		return false;
	}

	/**
	 * Check if embed attributes indicate a YouTube embed
	 *
	 * @param array $attrs Block attributes.
	 * @return bool True if YouTube, false otherwise.
	 */
	private function is_youtube_embed( $attrs ) {
		if ( ! is_array( $attrs ) ) {
			return false;
		}

		return ( ! empty( $attrs['providerNameSlug'] ) && 'youtube' === $attrs['providerNameSlug'] ) ||
		       ( ! empty( $attrs['url'] ) && is_string( $attrs['url'] ) && ( false !== strpos( $attrs['url'], 'youtube.com' ) || false !== strpos( $attrs['url'], 'youtu.be' ) ) );
	}
}

new Fullsize_YouTube_Embeds();
