export default {
    downloader: {
        getCmd: (url: string, downloadsDir: string) => [
            'yt-dlp',
            url,
            '-o',
            `${downloadsDir}/%(title)s.%(ext)s`,
            '-f',
            'bestaudio/best',
            // My own settings
            '--proxy',
            'http://45.140.143.77:18080',
            '--cookies',
            './cookies.txt'
        ] as const
    } as const
}
