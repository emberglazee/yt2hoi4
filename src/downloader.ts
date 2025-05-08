import { $ } from 'bun'
import Tracker, { type DownloadedVideo } from './tracker'
import { join } from 'path'
import { Logger, yellow, red } from './logger'

class Downloader {
    private static instance: Downloader
    public downloadsDir = join(process.cwd(), 'downloads')
    private tracker: Tracker | null = null
    private logger = new Logger('Downloader')

    private constructor() {}

    public static getInstance(): Downloader {
        if (!Downloader.instance) {
            Downloader.instance = new Downloader()
        }
        return Downloader.instance
    }

    /**
    * Download a YouTube video or playlist to the downloads directory in ogg format (32-bit, 44.1 kHz, 192 kbps)
    * @param url The YouTube video or playlist URL
    */
    public async download(url: string): Promise<void> {
        if (!this.tracker) this.tracker = await Tracker.getInstance()
        await this.tracker.setCurrentStep('downloading')

        this.logger.info(`Preparing to download: ${yellow(url)}`)

        // Ensure downloads directory exists
        await $`mkdir -p ${this.downloadsDir}`

        // Extract video ID from URL (simple heuristic)
        const idMatch = url.match(/[?&]v=([\w-]+)/)
        const videoId: string = idMatch && idMatch[1] ? idMatch[1] : url
        const filename = `%(${videoId})s.ogg`

        // Add to tracker as pending
        const videoEntry: DownloadedVideo = {
            id: videoId,
            filename: filename,
            status: 'pending'
        }
        await this.tracker.addDownloaded(videoEntry)

        // yt-dlp command
        const cmd = [
            'yt-dlp',
            url,
            '-o',
            `${this.downloadsDir}/%(title)s.%(ext)s`,
            '-f',
            'bestaudio/best',
            '--extract-audio',
            '--audio-format',
            'vorbis',
            '--audio-quality',
            '192K',
            '--postprocessor-args',
            '-ac 2 -ar 44100 -sample_fmt s32'
        ]

        this.logger.info(`Spawning yt-dlp for video ${yellow(videoId)}`)

        const proc = Bun.spawn({
            cmd,
            stdout: 'pipe',
            stderr: 'pipe'
        })

        // Print stdout and stderr in real time
        const printStream = async (stream: ReadableStream<Uint8Array>, label: string) => {
            for await (const chunk of stream) {
                Bun.write(Bun.stdout, `[${label}] `)
                Bun.write(Bun.stdout, chunk)
            }
        }

        await Promise.all([
            printStream(proc.stdout, 'yt-dlp'),
            printStream(proc.stderr, 'yt-dlp-err'),
            proc.exited
        ])

        if (proc.exitCode !== 0) {
            const errMsg = `yt-dlp exited with code ${red(proc.exitCode?.toString() ?? 'unknown')}`
            await this.tracker.updateDownloadedStatus(videoId, 'error', errMsg)
            this.logger.error(`Failed to download ${yellow(url)}: ${errMsg}`)
            throw new Error(errMsg)
        } else {
            await this.tracker.updateDownloadedStatus(videoId, 'success')
            this.logger.ok(`Downloaded ${yellow(url)} as ${yellow(filename)}`)
        }
    }
}

export default Downloader
