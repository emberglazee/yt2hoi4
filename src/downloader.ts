import { $ } from 'bun'
import { join, extname, basename } from 'path'
import { Logger, yellow, red } from './logger'
import settings from '../settings'

class Downloader {
    private static instance: Downloader
    public downloadsDir = join(process.cwd(), 'downloads')
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
    * @param ytdlpArgs Additional arguments to pass to yt-dlp
    */
    public async download(url: string, ytdlpArgs?: string[]): Promise<void> {
        this.logger.info(`Preparing to download: ${yellow(url)}`)

        // Ensure downloads directory exists
        await $`mkdir -p ${this.downloadsDir}`

        // Extract video ID from URL (simple heuristic)
        const idMatch = url.match(/[?&]v=([\w-]+)/)
        const videoId: string = idMatch && idMatch[1] ? idMatch[1] : url

        const cmd = settings.downloader.getCmd(url, this.downloadsDir, ytdlpArgs)

        this.logger.info(`Spawning yt-dlp for video ${yellow(videoId)}`)

        const proc = Bun.spawn({
            cmd: [...cmd],
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
            this.logger.error(`Failed to download ${yellow(url)}: ${errMsg}`)
            throw new Error(errMsg)
        }

        // Find all downloaded files (non-.ogg files in downloadsDir)
        const files = (await $`ls -t ${this.downloadsDir}`.text()).split('\n').filter(Boolean)
        const audioFiles = files.filter(f => !f.endsWith('.ogg'))
        if (audioFiles.length === 0) {
            const errMsg = `No downloaded audio files found in ${yellow(this.downloadsDir)}`
            this.logger.error(errMsg)
            throw new Error(errMsg)
        }

        let allSuccess = true
        for (const audioFile of audioFiles) {
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
                const errMsg = `ffmpeg exited with code ${red(ffmpegProc.exitCode?.toString() ?? 'unknown')} for file ${audioFile}`
                this.logger.error(`Failed to convert ${yellow(audioFile)}: ${errMsg}`)
                allSuccess = false
                continue
            }
            this.logger.ok(`Converted ${yellow(audioFile)} as ${yellow(outputBase + '.ogg')}`)
        }

        if (allSuccess) {
            this.logger.ok(`Downloaded and converted ${yellow(url)} to .ogg files`)
        } else {
            this.logger.error(`Some files failed to convert for ${yellow(url)}`)
        }
    }
}

export default Downloader
