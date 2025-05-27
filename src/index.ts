import Downloader from './downloader'
import ModGenerator from './modGenerator'
import { Logger, yellow, red } from './logger'
import { $ } from 'bun'
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'

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
    .demandOption(['url', 'mod-name'], 'Please provide both --url and --mod-name arguments')
    .help()
    .parseSync()

try {
    logger.info(`Starting download for ${yellow(argv.url)}`)
    const downloader = Downloader.getInstance()
    await downloader.download(argv.url, argv['ytdlp-args'] as string[])
    logger.ok(`Download complete for ${yellow(argv.url)}`)

    const { downloadsDir } = downloader
    const files = (await $`ls ${downloadsDir}`.text()).split('\n').filter(Boolean)
    const oggFiles = files.filter(f => f.endsWith('.ogg'))
    if (oggFiles.length === 0) {
        logger.error(`No .ogg files found in ${yellow(downloadsDir)}`)
        process.exit(1)
    }

    logger.info(`Generating mod ${yellow(argv.modName)} with tracks: ${oggFiles.map(f => yellow(f)).join(', ')}`)
    const modGen = await ModGenerator.getInstance()
    await modGen.generateMod(argv.modName, oggFiles, '1.16.8')
    logger.ok(`Mod generation complete for ${yellow(argv.modName)}`)
} catch (e) {
    logger.error(`Fatal error: ${red(e instanceof Error ? e.message : String(e))}`)
    process.exit(1)
}
