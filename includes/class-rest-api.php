<?php
/**
 * REST API Class
 *
 * Handles REST API permissions for oEmbed proxy.
 *
 * @package Custom_YouTube_Block
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Class Custom_YouTube_Block_REST_API
 */
class Custom_YouTube_Block_REST_API {

	/**
	 * Initialize the class
	 */
	public function __construct() {
		add_filter( 'rest_pre_dispatch', array( $this, 'make_oembed_proxy_public' ), 10, 3 );
	}

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
		if ( ! $url || ! Custom_YouTube_Block_Helper::is_valid_youtube_url( $url ) ) {
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
}

