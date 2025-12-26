<?php
/**
 * Plugin Name: Fullwidth Option for YouTube Embeds
 * Plugin URI: https://github.com/camilledavis/fullwidth-youtube-embeds
 * Description: Adds a fullwidth toggle option to YouTube embed blocks.
 * Version: 1.0.0
 * Author: Camille Davis
 * License: GPL-2.0-or-later
 * Text Domain: fullwidth-youtube-embeds
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Main plugin class
 */
class Fullwidth_YouTube_Embeds {

	/**
	 * Plugin version
	 */
	const VERSION = '1.0.0';

	/**
	 * Flag to track if fullwidth YouTube embed was found during rendering.
	 *
	 * @var bool
	 */
	private static $found_fullwidth_youtube = false;

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
		add_filter( 'block_type_metadata_settings', array( $this, 'add_fullwidth_attribute' ), 10, 2 );
		add_filter( 'render_block_core/embed', array( $this, 'render_embed_block' ), 10, 2 );

		// Make oEmbed proxy endpoint public for YouTube URLs
		add_filter( 'rest_pre_dispatch', array( $this, 'make_oembed_proxy_public' ), 10, 3 );

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
	 * Add fullwidth attribute to Embed blocks.
	 *
	 * @param array $settings Block settings.
	 * @param array $metadata Block metadata.
	 * @return array Modified settings.
	 */
	public function add_fullwidth_attribute( $settings, $metadata ) {
		if ( 'core/embed' !== $metadata['name'] ) {
			return $settings;
		}

		$settings['attributes']['fullwidth'] = array(
			'type'    => 'boolean',
			'default' => false,
		);

		return $settings;
	}

	/**
	 * Filter embed block output to add fullwidth class
	 *
	 * Also sets flag for late-stage script enqueuing if needed.
	 *
	 * @param string $block_content The block content.
	 * @param array  $block         The block data.
	 * @return string Modified block content.
	 */
	public function render_embed_block( $block_content, $block ) {

		// Only process YouTube embeds with fullwidth enabled
		if ( ! isset( $block['attrs'] ) || ! isset( $block['attrs']['fullwidth'] ) || ! $block['attrs']['fullwidth'] || ! $this->is_youtube_embed( $block['attrs'] ) ) {
			return $block_content;
		}

		// Set flag for late-stage enqueue (handles widgets, reusable blocks, etc.)
		self::$found_fullwidth_youtube = true;

		// Add class and data attribute to the figure element
		$block_content = preg_replace(
			'/(<figure[^>]*class="[^"]*wp-block-embed[^"]*)(")/',
			'$1 has-fullwidth-youtube$2 data-fullwidth="true"',
			$block_content,
			1
		);

		return $block_content;
	}

	// ============================================================================
	// REST API Permissions
	// ============================================================================

	/**
	 * Make oEmbed proxy endpoint public for YouTube URLs
	 *
	 * By default, the oEmbed proxy endpoint requires edit_posts capability.
	 * This filter intercepts YouTube oEmbed requests and handles them directly,
	 * bypassing the permission check.
	 *
	 * @param mixed           $result  Response to replace the requested version with.
	 * @param WP_REST_Server  $server  Server instance.
	 * @param WP_REST_Request $request Request used to generate the response.
	 * @return mixed Response or null to continue with normal processing.
	 */
	public function make_oembed_proxy_public( $result, $server, $request ) {
		// Only handle oEmbed proxy requests
		if ( '/oembed/1.0/proxy' !== $request->get_route() ) {
			return $result;
		}

		// Validate YouTube URL with strict hostname check
		$url = $request->get_param( 'url' );
		if ( ! $url || ! $this->is_valid_youtube_url( $url ) ) {
			return $result;
		}

		// For YouTube URLs, bypass permission check by calling the controller directly
		$controller = new WP_oEmbed_Controller();
		$response = $controller->get_proxy_item( $request );

		// If we got a response, return it (bypassing permission check)
		if ( ! is_wp_error( $response ) ) {
			return rest_ensure_response( $response );
		}

		// If there was an error, let normal processing handle it
		return $result;
	}

	/**
	 * Validate that URL is a legitimate YouTube URL
	 *
	 * Prevents SSRF attacks by strictly validating the hostname.
	 *
	 * @param string $url The URL to validate.
	 * @return bool True if valid YouTube URL, false otherwise.
	 */
	private function is_valid_youtube_url( $url ) {
		$parsed = wp_parse_url( $url );

		// Must have valid scheme and host
		if ( ! $parsed || empty( $parsed['host'] ) ) {
			return false;
		}

		// Only allow http/https
		if ( ! empty( $parsed['scheme'] ) && ! in_array( strtolower( $parsed['scheme'] ), array( 'http', 'https' ), true ) ) {
			return false;
		}

		// Strictly validate hostname (prevents SSRF)
		$host = strtolower( $parsed['host'] );
		$allowed_hosts = array( 'youtube.com', 'www.youtube.com', 'youtu.be' );

		return in_array( $host, $allowed_hosts, true );
	}

	// ============================================================================
	// Editor Assets
	// ============================================================================

	/**
	 * Enqueue editor assets
	 */
	public function enqueue_editor_assets() {
		wp_enqueue_script(
			'fullwidth-youtube-embeds-editor',
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
	 * Checks the main post content for YouTube embeds with fullwidth enabled.
	 * This catches most cases efficiently.
	 */
	public function enqueue_frontend_assets_early() {
		if ( $this->has_fullwidth_youtube_in_post() ) {
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
		if ( self::$found_fullwidth_youtube ) {
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
		if ( wp_script_is( 'fullwidth-youtube-embeds-frontend', 'enqueued' ) ) {
			return;
		}

		wp_enqueue_script(
			'fullwidth-youtube-embeds-frontend',
			plugins_url( 'assets/frontend.js', __FILE__ ),
			array(),
			self::VERSION,
			true
		);

		wp_localize_script(
			'fullwidth-youtube-embeds-frontend',
			'fullwidthYouTubeSettings',
			array(
				'restUrl' => rest_url( 'oembed/1.0/proxy' ),
			)
		);
	}

	// ============================================================================
	// Helper Methods
	// ============================================================================

	/**
	 * Check if current page has YouTube embed with fullwidth enabled in post content
	 *
	 * @return bool True if found, false otherwise.
	 */
	private function has_fullwidth_youtube_in_post() {
		global $post;
		if ( ! $post || ! has_block( 'core/embed', $post ) ) {
			return false;
		}

		$blocks = parse_blocks( $post->post_content );
		return ! empty( $blocks ) && $this->check_blocks_for_fullwidth_youtube( $blocks );
	}

	/**
	 * Recursively check blocks for YouTube embed with fullwidth enabled
	 *
	 * @param array $blocks Array of block data.
	 * @return bool True if found, false otherwise.
	 */
	private function check_blocks_for_fullwidth_youtube( $blocks ) {
		foreach ( $blocks as $block ) {
			if ( isset( $block['blockName'] ) && 'core/embed' === $block['blockName']
				&& isset( $block['attrs']['fullwidth'] ) && $block['attrs']['fullwidth']
				&& $this->is_youtube_embed( $block['attrs'] ) ) {
				return true;
			}

			if ( ! empty( $block['innerBlocks'] ) && $this->check_blocks_for_fullwidth_youtube( $block['innerBlocks'] ) ) {
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

new Fullwidth_YouTube_Embeds();
