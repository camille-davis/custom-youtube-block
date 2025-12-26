<?php
/**
 * Plugin Name: Custom Youtube Block
 * Plugin URI: https://github.com/camilledavis/custom-youtube-block
 * Description: Adds fullwidth and autoplay toggle options to YouTube embed blocks.
 * Version: 1.1.0
 * Author: Camille Davis
 * License: GPL-2.0-or-later
 * Text Domain: custom-youtube-block
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Main plugin class
 */
class Custom_YouTube_Block {

	/**
	 * Plugin version
	 */
	const VERSION = '1.1.0';

	/**
	 * Plugin file path
	 *
	 * @var string
	 */
	private $plugin_file;

	/**
	 * Constructor
	 */
	public function __construct() {
		$this->plugin_file = __FILE__;
		$this->load_dependencies();
		$this->init();
	}

	/**
	 * Load plugin dependencies
	 */
	private function load_dependencies() {
		require_once plugin_dir_path( $this->plugin_file ) . 'includes/class-youtube-helper.php';
		require_once plugin_dir_path( $this->plugin_file ) . 'includes/class-block-attributes.php';
		require_once plugin_dir_path( $this->plugin_file ) . 'includes/class-block-renderer.php';
		require_once plugin_dir_path( $this->plugin_file ) . 'includes/class-rest-api.php';
		require_once plugin_dir_path( $this->plugin_file ) . 'includes/class-assets.php';
	}

	/**
	 * Initialize plugin
	 */
	private function init() {
		// Initialize component classes
		new Custom_YouTube_Block_Attributes();
		new Custom_YouTube_Block_Renderer();
		new Custom_YouTube_Block_REST_API();

		$assets = new Custom_YouTube_Block_Assets( self::VERSION, $this->plugin_file );
		$assets->init();
	}
}

new Custom_YouTube_Block();

