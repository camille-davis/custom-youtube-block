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
		$features = array(
			'fullwidth'    => isset( $attrs['fullwidth'] ) && $attrs['fullwidth'],
			'autoplay'     => isset( $attrs['autoplay'] ) && $attrs['autoplay'],
			'hideControls' => isset( $attrs['hideControls'] ) && $attrs['hideControls'],
			'loop'         => isset( $attrs['loop'] ) && $attrs['loop'],
		);

		if ( ! array_filter( $features ) ) {
			return $block_content;
		}

		self::$found_custom_youtube = true;

		$feature_map = array(
			'fullwidth'    => 'fullwidth',
			'autoplay'     => 'autoplay',
			'hideControls' => 'hide-controls',
			'loop'         => 'loop',
		);

		$classes = array();
		$data_attrs = array();

		foreach ( $feature_map as $feature_key => $feature_slug ) {
			if ( $features[ $feature_key ] ) {
				$classes[] = 'has-' . $feature_slug . '-youtube';
				$data_attrs[] = 'data-' . $feature_slug . '="true"';
			}
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

