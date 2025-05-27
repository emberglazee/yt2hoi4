export default {
    downloader: {
        getCmd: (url: string, downloadsDir: string, ytdlpArgs?: string[]) => [
            'yt-dlp',
            url,
            '-o',
            `${downloadsDir}/%(title)s.%(ext)s`,
            '-f',
            'bestaudio/best',
            ...(ytdlpArgs || [])
        ] as const
    } as const
}
