# Stream Proxy Service

This service consumes an HTTP FLV stream from an external source and makes it available via HTTPS using both HLS and DASH protocols.

## Features

- Consumes an external FLV stream (http://65.21.255.63:9080/live/stream.flv)
- Provides the stream over secure HTTPS via Traefik
- Supports multiple streaming formats:
  - RTMP (port 1935)
  - HLS (HTTP Live Streaming)
  - DASH (Dynamic Adaptive Streaming over HTTP)
- Includes CORS headers for cross-origin access
- Provides stream statistics via `/stat` endpoint

## URLs

When deployed, the stream will be available at:
- HLS: `https://stream-proxy.ethglobal-trifecta-hackathon.orb.local/hls/secure_stream.m3u8`
- DASH: `https://stream-proxy.ethglobal-trifecta-hackathon.orb.local/dash/secure_stream.mpd`
- Stats: `https://stream-proxy.ethglobal-trifecta-hackathon.orb.local/stat`
- Direct access: `https://stream-proxy.ethglobal-trifecta-hackathon.orb.local/secure_stream` (redirects to HLS)

## Technology

- Nginx with RTMP module
- FFmpeg for stream conversion
- Traefik for HTTPS termination and routing
