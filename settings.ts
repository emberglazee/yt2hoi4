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
            '--audio-format', 'vorbis',
            '--audio-quality', '192K',
            ...(ytdlpArgs || []),
            '--postprocessor-args', '-ar 44100'
        ] as const
    } as const
}
