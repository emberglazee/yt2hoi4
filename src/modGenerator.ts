import { green, Logger } from './logger'
const logger = new Logger('ModGenerator')

import { $, write } from 'bun'
import { join } from 'path'
import { version as modVersion } from '../package.json'
import { ScriptHandler } from './scriptHandler'
import Downloader from './downloader'
import { randomUUID } from 'crypto'
import {
    FACEPLATE_WIDTH,
    FACEPLATE_HEIGHT,
    FACEPLATE_COMBINED_WIDTH,
    TEMP_DIR_NAME,
    FACEPLATE_TEMPLATE_FILE,
    DEFAULT_FACEPLATE_FILE,
    DDS_COMPRESSION,
    DDS_MIPMAPS,
    DDS_FORMAT
} from './config'

export default class ModGenerator {
    public modName: string
    public normalizedModName: string
    constructor(modName: string) {
        this.modName = modName
        this.normalizedModName = modName.replace(/[^A-Za-z0-9_]/g, '_').replace(/^_+|_+$/g, '')
    }
    /**
     * Process a thumbnail image into a radio station faceplate
     * @param thumbnailPath Path to the thumbnail image
     * @param outputPath Path where the processed DDS file should be saved
     * @param verbose Show external tool output
     */
    private async processThumbnail(thumbnailPath: string, outputPath: string, verbose?: boolean): Promise<void> {
        logger.info(`{processThumbnail} Processing thumbnail "${green(thumbnailPath)}" into faceplate...`)

        // Create a temporary working directory
        const tempDir = join(process.cwd(), TEMP_DIR_NAME)
        await $`mkdir -p ${tempDir}`.quiet()

        try {
            // 1. Resize and crop the thumbnail to 152x120
            const resizedPath = join(tempDir, 'resized.png')
            let resizeCmd = $`ffmpeg -y -i ${thumbnailPath} -vf "scale=${FACEPLATE_WIDTH}:${FACEPLATE_HEIGHT}:force_original_aspect_ratio=increase,crop=${FACEPLATE_WIDTH}:${FACEPLATE_HEIGHT}" ${resizedPath}`
            if (!verbose) resizeCmd = resizeCmd.quiet()
            await resizeCmd

            // 2. Create a 304x120 image with the resized thumbnail duplicated
            const combinedPath = join(tempDir, 'combined.png')
            let combineCmd = $`ffmpeg -y -i ${resizedPath} -filter_complex "[0]split[left][right];[left]pad=${FACEPLATE_COMBINED_WIDTH}:${FACEPLATE_HEIGHT}[left_pad];[right]pad=${FACEPLATE_COMBINED_WIDTH}:${FACEPLATE_HEIGHT}:${FACEPLATE_WIDTH}:0[right_pad];[left_pad][right_pad]blend=all_mode=addition" ${combinedPath}`
            if (!verbose) combineCmd = combineCmd.quiet()
            await combineCmd

            // 3. Overlay the template
            const templatePath = join(process.cwd(), FACEPLATE_TEMPLATE_FILE)
            const overlaidPath = join(tempDir, 'overlaid.png')
            let overlayCmd = $`ffmpeg -y -i ${combinedPath} -i ${templatePath} -filter_complex "[0][1]overlay=0:0" ${overlaidPath}`
            if (!verbose) overlayCmd = overlayCmd.quiet()
            await overlayCmd

            // 4. Convert to DDS format using ImageMagick
            let convertCmd = $`magick ${overlaidPath} -define dds:compression=${DDS_COMPRESSION} -define dds:mipmaps=${DDS_MIPMAPS} -define dds:format=${DDS_FORMAT} ${outputPath}`
            if (!verbose) convertCmd = convertCmd.quiet()
            await convertCmd

            logger.ok(`{processThumbnail} ✓ ${green(outputPath)}`)
        } finally {
            // Clean up temporary files
            await $`rm -rf ${tempDir}`.quiet()
        }
    }

    /**
     * Generate a HOI4 music mod from the given .ogg files
     * @param modName The name of the mod (used for folder and file names)
     * @param trackFiles Array of .ogg file paths (relative to downloads/)
     * @param hoi4Version HOI4 game version to support
     * @param url YouTube URL for thumbnail download (only used if useThumbnail is true)
     * @param useThumbnail Whether to use the playlist/video thumbnail as faceplate (defaults to false)
     * @param verbose Show external tool output
     */
    public async generateMusicMod(
        trackFiles: string[],
        hoi4Version: string,
        url?: string,
        useThumbnail: boolean = false,
        verbose?: boolean
    ): Promise<void> {
        const scriptHandler = new ScriptHandler(this.modName, this.normalizedModName)

        logger.info('{generateMusicMod} Setting up the mod structure...')
        await scriptHandler.prepareModFolders()

        // Handle faceplate
        const faceplateOutput = `${scriptHandler.gfxDir}/${this.normalizedModName}_faceplate.dds`
        if (useThumbnail && url) {
            // Download and process thumbnail if URL is provided and useThumbnail is true
            const downloader = new Downloader()
            const thumbnailPath = await downloader.downloadThumbnail(url, verbose)
            await this.processThumbnail(thumbnailPath, faceplateOutput, verbose)
        } else {
            // Use default faceplate
            const dds = Bun.file(join(process.cwd(), DEFAULT_FACEPLATE_FILE))
            await write(faceplateOutput, dds)
            if (useThumbnail && !url) {
                logger.warn('{generateMusicMod} useThumbnail was set to true but no URL was provided. Using default faceplate.')
            }
        }

        const tracks: { id: string, displayName: string, fileName: string }[] = []

        // Copy .ogg files to music/normalizedModName with UUID filenames, and prepare track data
        for (const src of trackFiles) {
            const originalFileName = src.replace(/^.*\//, '')
            const displayName = originalFileName.replace(/\..*$/, '') // remove the extension for display
            const newFileName = `${randomUUID().replace(/-/g, '')}.ogg`
            const dest = `${scriptHandler.musicDir}/${newFileName}`
            const sourceFile = join(Downloader.downloadsDir, originalFileName)

            let cmd = $`cp ${sourceFile} ${dest}`
            if (!verbose) {
                cmd = cmd.quiet()
            }
            await cmd
            logger.info(`{generateMusicMod} Copied "${green(originalFileName)}" => "${green(dest)}"`)

            tracks.push({
                id: `music_${randomUUID().replace(/-/g, '')}`,
                displayName,
                fileName: newFileName
            })
        }

        await scriptHandler.createModDescriptor(hoi4Version, modVersion)
        await scriptHandler.createLocalModDescriptor(modVersion)

        await scriptHandler.createLocalization(tracks)

        await scriptHandler.createGFX()
        await scriptHandler.createGUI()

        await scriptHandler.createMusicDefinition(tracks)

        await scriptHandler.createMusicAsset(tracks)

        logger.ok('{generateMusicMod} Done!')
    }
}
