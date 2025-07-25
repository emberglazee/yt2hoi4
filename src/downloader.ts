import { Logger, yellow, red } from './logger'
const logger = new Logger('Downloader')

import { $ } from 'bun'
import { join } from 'path'
import settings from '../settings'
import { printStream } from './utils'
import { watch, type FSWatcher } from 'fs'

export default class Downloader {
    static downloadsDir = join(process.cwd(), 'downloads')
    static archivePath = join(Downloader.downloadsDir, '.yt2hoi4-archive.txt')

    /**
    * Download a YouTube video or playlist to the downloads directory, then convert to ogg (Vorbis, 44.1kHz, 192kbps, s16)
    * @param url The YouTube video or playlist URL
    * @param ytdlpArgs Additional arguments to pass to yt-dlp
    * @param ignoreErrors Whether to ignore yt-dlp exit code 1
    * @param verbose Show yt-dlp output
    */
    public async download(url: string, ytdlpArgs: string[] = [], ignoreErrors?: boolean, verbose?: boolean): Promise<void> {
        logger.info(`Preparing to download: ${yellow(url)}`)

        // Ensure downloads directory exists
        await $`mkdir -p ${Downloader.downloadsDir}`.quiet()

        const allYtdlpArgs = [...ytdlpArgs, '--download-archive', Downloader.archivePath]

        const cmd = settings.downloader.getCmd(url, Downloader.downloadsDir, allYtdlpArgs)

        let watcher: FSWatcher | undefined
        if (!verbose) {
            const seenFiles = new Set<string>()
            try {
                watcher = watch(Downloader.downloadsDir, (_, filename) => {
                    if (filename && filename.endsWith('.ogg') && !seenFiles.has(filename)) {
                        logger.info(`Finished converting ${yellow(filename)}`)
                        seenFiles.add(filename)
                    }
                })
            } catch (e) {
                logger.warn(`Could not start file watcher: ${e}`)
            }
        }

        const runYtdlp = async (check: boolean = false) => {
            const stage = check ? 'double-check' : 'initial download'
            const logPrefix = check ? 'yt-dlp-check' : 'yt-dlp'
            logger.info(`Spawning yt-dlp for ${yellow(url)} (${stage})`)

            const proc = Bun.spawn({
                cmd: [...cmd],
                stdout: 'pipe',
                stderr: 'pipe'
            })

            if (verbose) {
                await Promise.all([
                    printStream(proc.stdout, logPrefix),
                    printStream(proc.stderr, `${logPrefix}-err`),
                    proc.exited
                ])
            } else {
                await proc.exited
            }

            if (proc.exitCode !== 0) {
                const errMsg = `yt-dlp exited with code ${red(proc.exitCode?.toString() ?? 'unknown')} on ${stage}`
                if (proc.exitCode === 1 && ignoreErrors) {
                    logger.warn(`Ignoring yt-dlp exit code 1 for ${yellow(url)} on ${stage} as requested.`)
                } else {
                    logger.error(`Failed to download ${yellow(url)} on ${stage}: ${errMsg}`)
                    throw new Error(errMsg)
                }
            }
        }

        try {
            await runYtdlp()
            await runYtdlp(true)
        } finally {
            if (watcher) {
                watcher.close()
            }
        }

        logger.ok(`Downloaded and converted ${yellow(url)} to .ogg files`)
    }

    /**
     * Download a thumbnail from a YouTube video or playlist URL
     * @param url The YouTube video or playlist URL
     * @param verbose Show yt-dlp output
     * @returns Path to the downloaded thumbnail file
     */
    public async downloadThumbnail(url: string, verbose?: boolean): Promise<string> {
        logger.info(`Downloading thumbnail for: ${yellow(url)}`)

        // Ensure downloads directory exists
        await $`mkdir -p ${Downloader.downloadsDir}`.quiet()

        const thumbnailPath = join(Downloader.downloadsDir, 'thumbnail.jpg')

        // Use yt-dlp to download only the playlist/video thumbnail
        const cmd = [
            'yt-dlp',
            '--write-thumbnail',
            '--skip-download',
            '--playlist-items', '0',  // Only get playlist info, no individual videos
            '--convert-thumbnails',
            'jpg',
            '--output',
            thumbnailPath.replace(/\.jpg$/, ''), // yt-dlp will add the extension
            url
        ]

        const proc = Bun.spawn({
            cmd,
            stdout: 'pipe',
            stderr: 'pipe'
        })

        if (verbose) {
            await Promise.all([
                printStream(proc.stdout, 'yt-dlp'),
                printStream(proc.stderr, 'yt-dlp-err'),
                proc.exited
            ])
        } else {
            await proc.exited
        }

        if (proc.exitCode !== 0) {
            const errMsg = `yt-dlp exited with code ${red(proc.exitCode?.toString() ?? 'unknown')}`
            logger.error(`Failed to download thumbnail for ${yellow(url)}: ${errMsg}`)
            throw new Error(errMsg)
        }

        logger.ok(`Downloaded thumbnail for ${yellow(url)}`)
        return thumbnailPath
    }
}
