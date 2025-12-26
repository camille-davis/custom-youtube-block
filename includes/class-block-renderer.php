<?php
/**
 * Block Renderer Class
 *
 * Handles rendering of custom YouTube embed blocks.
 *
 * @package Custom_YouTube_Block
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Class Custom_YouTube_Block_Renderer
 */
class Custom_YouTube_Block_Renderer {

	/**
	 * Flag to track if custom YouTube embed was found during rendering.
	 *
	 * @var bool
	 */
	private static $found_custom_youtube = false;

	/**
	 * Initialize the class
	 */
	public function __construct() {
		add_filter( 'render_block_core/embed', array( $this, 'render_embed_block' ), 10, 2 );
	}

	/**
	 * Filter embed block output to add custom classes and data attributes
	 *
	 * Also sets flag for late-stage script enqueuing if needed.
	 *
	 * @param string $block_content The block content.
	 * @param array  $block         The block data.
	 * @return string Modified block content.
	 */
	public function render_embed_block( $block_content, $block ) {
		if ( ! isset( $block['attrs'] ) || ! Custom_YouTube_Block_Helper::is_youtube_embed( $block['attrs'] ) ) {
			return $block_content;
		}

		$attrs = $block['attrs'];
		$has_fullwidth = isset( $attrs['fullwidth'] ) && $attrs['fullwidth'];
		$has_autoplay = isset( $attrs['autoplay'] ) && $attrs['autoplay'];

		if ( ! $has_fullwidth && ! $has_autoplay ) {
			return $block_content;
		}

		self::$found_custom_youtube = true;

		$classes = array();
		$data_attrs = array();

		if ( $has_fullwidth ) {
			$classes[] = 'has-fullwidth-youtube';
			$data_attrs[] = 'data-fullwidth="true"';
		}

		if ( $has_autoplay ) {
			$classes[] = 'has-autoplay-youtube';
			$data_attrs[] = 'data-autoplay="true"';
		}

		$class_string = implode( ' ', $classes );
		$data_string = ' ' . implode( ' ', $data_attrs );
		$block_content = preg_replace(
			'/(<figure[^>]*class="[^"]*wp-block-embed[^"]*)(")/',
			'$1 ' . esc_attr( $class_string ) . '$2' . $data_string,
			$block_content,
			1
		);

		return $block_content;
	}

	/**
	 * Get the found flag
	 *
	 * @return bool
	 */
	public static function get_found_flag() {
		return self::$found_custom_youtube;
	}
}

