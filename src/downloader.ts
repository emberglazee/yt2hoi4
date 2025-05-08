import { $ } from 'bun'
import Tracker, { type DownloadedVideo } from './tracker'
import { join, extname, basename } from 'path'
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
    * Download a YouTube video or playlist to the downloads directory, then convert to ogg (Vorbis, 44.1kHz, 192kbps, s16)
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
        // We'll determine the filename after download
        const videoEntry: DownloadedVideo = {
            id: videoId,
            filename: '',
            status: 'pending'
        }
        await this.tracker.addDownloaded(videoEntry)

        // yt-dlp command: download bestaudio only, no conversion
        const cmd = [
            'yt-dlp',
            url,
            '-o',
            `${this.downloadsDir}/%(title)s.%(ext)s`,
            '-f',
            'bestaudio/best'
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
        }

        // Find the downloaded file (most recent non-.ogg file in downloadsDir)
        const files = (await $`ls -t ${this.downloadsDir}`.text()).split('\n').filter(Boolean)
        const audioFile = files.find(f => !f.endsWith('.ogg'))
        if (!audioFile) {
            const errMsg = `No downloaded audio file found in ${yellow(this.downloadsDir)}`
            await this.tracker.updateDownloadedStatus(videoId, 'error', errMsg)
            this.logger.error(errMsg)
            throw new Error(errMsg)
        }
        const inputPath = join(this.downloadsDir, audioFile)
        const outputBase = basename(audioFile, extname(audioFile))
        const outputPath = join(this.downloadsDir, `${outputBase}.ogg`)

        // ffmpeg conversion
        this.logger.info(`Converting ${yellow(audioFile)} to ${yellow(outputBase + '.ogg')} with ffmpeg`)
        const ffmpegProc = Bun.spawn({
            cmd: [
                'ffmpeg',
                '-y',
                '-i', inputPath,
                '-ac', '2',
                '-ar', '44100',
                '-c:a', 'libvorbis',
                '-b:a', '192k',
                outputPath
            ],
            stdout: 'pipe',
            stderr: 'pipe'
        })
        await Promise.all([
            printStream(ffmpegProc.stdout, 'ffmpeg'),
            printStream(ffmpegProc.stderr, 'ffmpeg-err'),
            ffmpegProc.exited
        ])
        if (ffmpegProc.exitCode !== 0) {
            const errMsg = `ffmpeg exited with code ${red(ffmpegProc.exitCode?.toString() ?? 'unknown')}`
            await this.tracker.updateDownloadedStatus(videoId, 'error', errMsg)
            this.logger.error(`Failed to convert ${yellow(audioFile)}: ${errMsg}`)
            throw new Error(errMsg)
        }

        // Update tracker with final ogg filename
        await this.tracker.updateDownloadedStatus(videoId, 'success')
        this.logger.ok(`Downloaded and converted ${yellow(url)} as ${yellow(outputBase + '.ogg')}`)
    }
}

export default Downloader
