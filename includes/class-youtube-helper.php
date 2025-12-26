<?php
/**
 * YouTube Helper Class
 *
 * Utility methods for YouTube embed detection and validation.
 *
 * @package Custom_YouTube_Block
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Class Custom_YouTube_Block_Helper
 */
class Custom_YouTube_Block_Helper {

	/**
	 * Check if embed attributes indicate a YouTube embed
	 *
	 * @param array $attrs Block attributes.
	 * @return bool True if YouTube, false otherwise.
	 */
	public static function is_youtube_embed( $attrs ) {
		if ( ! is_array( $attrs ) ) {
			return false;
		}

		return ( ! empty( $attrs['providerNameSlug'] ) && 'youtube' === $attrs['providerNameSlug'] ) ||
		       ( ! empty( $attrs['url'] ) && is_string( $attrs['url'] ) && ( false !== strpos( $attrs['url'], 'youtube.com' ) || false !== strpos( $attrs['url'], 'youtu.be' ) ) );
	}

	/**
	 * Validate that URL is a legitimate YouTube URL
	 *
	 * Prevents SSRF attacks by strictly validating the hostname.
	 *
	 * @param string $url The URL to validate.
	 * @return bool True if valid YouTube URL, false otherwise.
	 */
	public static function is_valid_youtube_url( $url ) {
		$parsed = wp_parse_url( $url );

		if ( ! $parsed || empty( $parsed['host'] ) ) {
			return false;
		}

		if ( ! empty( $parsed['scheme'] ) && ! in_array( strtolower( $parsed['scheme'] ), array( 'http', 'https' ), true ) ) {
			return false;
		}

		$host = strtolower( $parsed['host'] );
		return in_array( $host, array( 'youtube.com', 'www.youtube.com', 'youtu.be' ), true );
	}

	/**
	 * Recursively check blocks for YouTube embed with custom attributes enabled
	 *
	 * @param array $blocks Array of block data.
	 * @param array $attributes Array of attribute names to check (e.g., ['fullwidth', 'autoplay']).
	 * @return bool True if found, false otherwise.
	 */
	public static function check_blocks_for_youtube_with_attributes( $blocks, $attributes = array() ) {
		foreach ( $blocks as $block ) {
			if ( isset( $block['blockName'] ) && 'core/embed' === $block['blockName']
				&& self::is_youtube_embed( isset( $block['attrs'] ) ? $block['attrs'] : array() ) ) {

				if ( empty( $attributes ) ) {
					return true;
				}

				foreach ( $attributes as $attr ) {
					if ( isset( $block['attrs'][ $attr ] ) && $block['attrs'][ $attr ] ) {
						return true;
					}
				}
			}

			if ( ! empty( $block['innerBlocks'] ) && self::check_blocks_for_youtube_with_attributes( $block['innerBlocks'], $attributes ) ) {
				return true;
			}
		}
		return false;
	}
}

