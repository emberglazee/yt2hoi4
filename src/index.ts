import Downloader from './downloader'
import ModGenerator from './modGenerator'
import { Logger, yellow, red } from './logger'
import { $ } from 'bun'
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
import { ScriptHandler } from './scriptHandler'
import { HOI4_VERSION } from './config'

const logger = new Logger()

const argv = yargs(hideBin(process.argv))
    .usage('Usage: $0 [options]')
    .option('url', {
        type: 'string',
        description: 'The YouTube URL to download'
    })
    .option('mod-name', {
        type: 'string',
        description: 'The name of the mod to generate'
    })
    .option('ytdlp-args', {
        type: 'array',
        description: 'Additional arguments to pass to yt-dlp (e.g. --ytdlp-args --cookies cookies.txt --throttle-rate 100K)',
        string: true
    })
    .option('use-thumbnail', {
        type: 'boolean',
        description: 'Use the playlist/video thumbnail as the radio station faceplate',
        default: false
    })
    .option('ignore-ytdlp-errors', {
        type: 'boolean',
        description: 'Ignore yt-dlp exit code 1 (e.g. if a video in a playlist is unavailable)',
        default: false
    })
    .option('clear', {
        type: 'boolean',
        description: 'Clean up the downloads and output folders, then exit',
        default: false
    })
    .option('verbose', {
        type: 'boolean',
        description: 'Show verbose output from external tools like yt-dlp and ffmpeg',
        default: false
    })
    .check(argv => {
        if (argv.clear) {
            return true
        }
        if (!argv.url || !argv['mod-name']) {
            throw new Error('Please provide both --url and --mod-name arguments, or use --clear')
        }
        return true
    })
    .help()
    .parseSync()

if (argv.clear) {
    logger.info('Cleaning up downloads and output folders...')
    try {
        await $`rm -rf ${Downloader.downloadsDir}`.quiet()
        await $`rm -rf ${ScriptHandler.OUTPUT_ROOT}`.quiet()
        logger.ok('Cleanup complete.')
        process.exit(0)
    } catch (e) {
        logger.error(`Error during cleanup: ${red(e instanceof Error ? e.message : String(e))}`)
        process.exit(1)
    }
}

try {
    logger.info(`Starting download for ${yellow(argv.url!)}`)
    const downloader = new Downloader()
    await downloader.download(argv.url!, argv['ytdlp-args'] as string[], argv.ignoreYtdlpErrors, argv.verbose)
    logger.ok(`Download complete for ${yellow(argv.url!)}`)

    const files = (await $`ls ${Downloader.downloadsDir}`.text()).split('\n').filter(Boolean)
    const oggFiles = files.filter(f => f.endsWith('.ogg'))
    if (oggFiles.length === 0) {
        logger.error(`No .ogg files found in ${yellow(Downloader.downloadsDir)}`)
        process.exit(1)
    }

    logger.info(`Generating mod ${yellow(argv.modName!)} with tracks: ${oggFiles.map(f => yellow(f)).join(', ')}`)
    const modGen = new ModGenerator(argv.modName!)
    await modGen.generateMusicMod(oggFiles, HOI4_VERSION, argv.url, argv.useThumbnail, argv.verbose)
    logger.ok(`Mod generation complete for ${yellow(argv.modName!)}`)
} catch (e) {
    logger.error(`Fatal error: ${red(e instanceof Error ? e.message : String(e))}`)
    process.exit(1)
}
