<?php
/**
 * Assets Class
 *
 * Handles enqueuing of editor and frontend assets.
 *
 * @package Custom_YouTube_Block
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Class Custom_YouTube_Block_Assets
 */
class Custom_YouTube_Block_Assets {

	/**
	 * Plugin version
	 *
	 * @var string
	 */
	private $version;

	/**
	 * Plugin file path
	 *
	 * @var string
	 */
	private $plugin_file;

	/**
	 * Constructor
	 *
	 * @param string $version Plugin version.
	 * @param string $plugin_file Plugin file path.
	 */
	public function __construct( $version, $plugin_file ) {
		$this->version = $version;
		$this->plugin_file = $plugin_file;
	}

	/**
	 * Initialize the class
	 */
	public function init() {
		// Editor assets
		add_action( 'enqueue_block_editor_assets', array( $this, 'enqueue_editor_assets' ) );

		// Frontend assets - two-stage detection
		add_action( 'wp_enqueue_scripts', array( $this, 'enqueue_frontend_assets_early' ) );
		add_action( 'wp_print_scripts', array( $this, 'enqueue_frontend_assets_late' ) );
	}

	/**
	 * Enqueue editor assets
	 */
	public function enqueue_editor_assets() {
		wp_enqueue_script(
			'custom-youtube-block-editor',
			plugins_url( 'assets/editor.js', $this->plugin_file ),
			array( 'wp-blocks', 'wp-element', 'wp-block-editor', 'wp-components', 'wp-i18n', 'wp-hooks' ),
			$this->version,
			true
		);
	}

	/**
	 * Early detection: Check post content and enqueue if found
	 *
	 * Runs during wp_enqueue_scripts hook (before blocks render).
	 */
	public function enqueue_frontend_assets_early() {
		if ( $this->has_custom_youtube_in_post() ) {
			$this->enqueue_frontend_script();
		}
	}

	/**
	 * Late detection: Check flag set during block rendering
	 *
	 * Runs during wp_print_scripts hook (after blocks render, before scripts output).
	 */
	public function enqueue_frontend_assets_late() {
		if ( Custom_YouTube_Block_Renderer::get_found_flag() ) {
			$this->enqueue_frontend_script();
		}
	}

	/**
	 * Enqueue frontend script and localize settings
	 *
	 * Shared method used by both early and late detection.
	 */
	private function enqueue_frontend_script() {
		if ( wp_script_is( 'custom-youtube-block-frontend', 'enqueued' ) ) {
			return;
		}

		wp_enqueue_script(
			'custom-youtube-block-frontend',
			plugins_url( 'assets/frontend.js', $this->plugin_file ),
			array(),
			$this->version,
			true
		);

		wp_localize_script(
			'custom-youtube-block-frontend',
			'customYouTubeSettings',
			array(
				'restUrl' => rest_url( 'oembed/1.0/proxy' ),
			)
		);
	}

	/**
	 * Check if current page has YouTube embed with custom attributes enabled in post content
	 *
	 * @return bool True if found, false otherwise.
	 */
	private function has_custom_youtube_in_post() {
		global $post;
		if ( ! $post || ! has_block( 'core/embed', $post ) ) {
			return false;
		}

		$blocks = parse_blocks( $post->post_content );
		return ! empty( $blocks ) && Custom_YouTube_Block_Helper::check_blocks_for_youtube_with_attributes( $blocks, array( 'fullwidth', 'autoplay', 'hideControls', 'loop' ) );
	}
}

