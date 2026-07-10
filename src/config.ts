// HOI4 game version to target
export const HOI4_VERSION = '1.19.*' as const

// ── Audio encoding ──────────────────────────────────────────────────
// HOI4 expects OGG Vorbis at 192kbps / 44.1kHz. Changing these will
// produce errors in the game's logs.
export const AUDIO_FORMAT = 'vorbis' as const
export const AUDIO_QUALITY = '192K' as const
export const AUDIO_SAMPLE_RATE = '44100' as const

// ── Directory / file names ─────────────────────────────────────────
export const DOWNLOADS_DIR_NAME = 'downloads' as const
export const OUTPUT_DIR_NAME = 'output' as const
export const DOWNLOAD_ARCHIVE_FILE = '.yt2hoi4-archive.txt' as const
export const THUMBNAIL_FILE = 'thumbnail.jpg' as const
export const TEMP_DIR_NAME = 'temp' as const

// ── Music asset defaults ───────────────────────────────────────────
export const DEFAULT_MUSIC_VOLUME = 0.65

// ── Faceplate / thumbnail ──────────────────────────────────────────
export const FACEPLATE_WIDTH = 152
export const FACEPLATE_HEIGHT = 120
export const FACEPLATE_COMBINED_WIDTH = 304
export const DEFAULT_FACEPLATE_FILE = 'radio_station.dds' as const
export const FACEPLATE_TEMPLATE_FILE = 'radio_station_cover_template.png' as const

// ── DDS conversion (ImageMagick) ───────────────────────────────────
export const DDS_COMPRESSION = 'none' as const
export const DDS_MIPMAPS = '0' as const
export const DDS_FORMAT = 'dxt5' as const
