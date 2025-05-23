import Downloader from './downloader'
import ModGenerator from './modGenerator'
import { Logger, yellow, red } from './logger'
import { $ } from 'bun'
import { parseArgs } from 'util'

const logger = new Logger()

const { values, positionals } = parseArgs({
    args: Bun.argv.slice(2),
    options: {
        url: {
            type: 'string',
            description: 'The YouTube URL to download'
        },
        modName: {
            type: 'string',
            description: 'The name of the mod to generate'
        }
    },
    strict: true,
    allowPositionals: true
})

let url = values.url
let modName = values.modName

if (!url && positionals.length > 0) {
    url = positionals[0]
}
if (!modName && positionals.length > 1) {
    modName = positionals[1]
}
if (!url || !modName) {
    logger.error('Missing required arguments: --url and --modName (or provide as positionals)')
    process.exit(1)
}

try {
    logger.info(`Starting download for ${yellow(url)}`)
    const downloader = Downloader.getInstance()
    await downloader.download(url)
    logger.ok(`Download complete for ${yellow(url)}`)

    // For demo, assume the downloaded file is in downloads/ and has .ogg extension
    // In a real scenario, you would want to get the actual filename from the tracker
    // Here, we just glob for .ogg files in downloads/
    const { downloadsDir } = downloader
    const files = (await $`ls ${downloadsDir}`.text()).split('\n').filter(Boolean)
    const oggFiles = files.filter(f => f.endsWith('.ogg'))
    if (oggFiles.length === 0) {
        logger.error(`No .ogg files found in ${yellow(downloadsDir)}`)
        process.exit(1)
    }

    logger.info(`Generating mod ${yellow(modName)} with tracks: ${oggFiles.map(f => yellow(f)).join(', ')}`)
    const modGen = await ModGenerator.getInstance()
    await modGen.generateMod(modName, oggFiles)
    logger.ok(`Mod generation complete for ${yellow(modName)}`)
} catch (e) {
    logger.error(`Fatal error: ${red(e instanceof Error ? e.message : String(e))}`)
    process.exit(1)
}
