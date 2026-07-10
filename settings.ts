import { AUDIO_FORMAT, AUDIO_QUALITY, AUDIO_SAMPLE_RATE } from './src/config'

export default {
    downloader: {
        getCmd: (url: string, downloadsDir: string, ytdlpArgs?: string[]) => [
            'yt-dlp',
            url,
            '-o',
            `${downloadsDir}/%(title)s.%(ext)s`,
            '-f',
            'bestaudio/best',
            '--extract-audio',
            '--audio-format', AUDIO_FORMAT,
            '--audio-quality', AUDIO_QUALITY,
            ...(ytdlpArgs || []),
            '--postprocessor-args', `-ar ${AUDIO_SAMPLE_RATE}`
        ] as const
    } as const
}
