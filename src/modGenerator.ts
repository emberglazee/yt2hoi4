import { write } from 'bun'
import { Logger, yellow } from './logger'
import { join } from 'path'
import { version as modVersion } from '../package.json'
import { ScriptHandler } from './scriptHandler'
import Downloader from './downloader'


class ModGenerator {
    private static instance: ModGenerator
    private logger = new Logger('ModGenerator')

    private constructor() {}

    public static async getInstance(): Promise<ModGenerator> {
        if (!ModGenerator.instance) {
            ModGenerator.instance = new ModGenerator()
        }
        return ModGenerator.instance
    }

    /**
     * Process a thumbnail image into a radio station faceplate
     * @param thumbnailPath Path to the thumbnail image
     * @param outputPath Path where the processed DDS file should be saved
     */
    private async processThumbnail(thumbnailPath: string, outputPath: string): Promise<void> {
        this.logger.info(`Processing thumbnail ${yellow(thumbnailPath)} into faceplate`)

        // Create a temporary working directory
        const tempDir = join(process.cwd(), 'temp')
        await Bun.$`mkdir -p ${tempDir}`

        try {
            // 1. Resize and crop the thumbnail to 152x120
            const resizedPath = join(tempDir, 'resized.png')
            await Bun.$`ffmpeg -y -i ${thumbnailPath} -vf "scale=152:120:force_original_aspect_ratio=increase,crop=152:120" ${resizedPath}`

            // 2. Create a 304x120 image with the resized thumbnail duplicated
            const combinedPath = join(tempDir, 'combined.png')
            await Bun.$`ffmpeg -y -i ${resizedPath} -filter_complex "[0]split[left][right];[left]pad=304:120[left_pad];[right]pad=304:120:152:0[right_pad];[left_pad][right_pad]blend=all_mode=addition" ${combinedPath}`

            // 3. Overlay the template
            const templatePath = join(process.cwd(), 'radio_station_cover_template.png')
            const overlaidPath = join(tempDir, 'overlaid.png')
            await Bun.$`ffmpeg -y -i ${combinedPath} -i ${templatePath} -filter_complex "[0][1]overlay=0:0" ${overlaidPath}`

            // 4. Convert to DDS format using ImageMagick
            // First, ensure the image is in the correct format (RGBA)
            await Bun.$`magick convert ${overlaidPath} -define dds:compression=none -define dds:mipmaps=0 -define dds:format=dxt5 ${outputPath}`

            this.logger.ok(`Successfully created faceplate at ${yellow(outputPath)}`)
        } finally {
            // Clean up temporary files
            await Bun.$`rm -rf ${tempDir}`
        }
    }

    /**
     * Generate a HOI4 music mod from the given .ogg files
     * @param modName The name of the mod (used for folder and file names)
     * @param trackFiles Array of .ogg file paths (relative to downloads/)
     * @param hoi4Version HOI4 game version to support
     * @param url YouTube URL for thumbnail download (only used if useThumbnail is true)
     * @param useThumbnail Whether to use the playlist/video thumbnail as faceplate (defaults to false)
     */
    public async generateMod(
        modName: string,
        trackFiles: string[],
        hoi4Version: string,
        url?: string,
        useThumbnail: boolean = false
    ): Promise<void> {
        const scriptHandler = ScriptHandler.getInstance(modName)

        this.logger.info(`Setting up mod structure for ${yellow(modName)}`)
        await scriptHandler.prepareModFolders()

        // Handle faceplate
        const faceplateOutput = `${scriptHandler.gfxDir}/${modName}_faceplate.dds`
        if (useThumbnail && url) {
            // Download and process thumbnail if URL is provided and useThumbnail is true
            const downloader = Downloader.getInstance()
            const thumbnailPath = await downloader.downloadThumbnail(url)
            await this.processThumbnail(thumbnailPath, faceplateOutput)
        } else {
            // Use default faceplate
            const dds = Bun.file(join(__dirname, '../radio_station.dds'))
            await write(faceplateOutput, dds)
            if (useThumbnail && !url) {
                this.logger.warn('useThumbnail was set to true but no URL was provided. Using default faceplate.')
            }
        }

        // Copy .ogg files to music/modName
        for (const src of trackFiles) {
            const base = src.replace(/^.*\//, '')
            const dest = `${scriptHandler.musicDir}/${base}`
            await Bun.$`cp ./downloads/${base} ${dest}`
            this.logger.info(`Copied ${yellow(base)} to ${yellow(dest)}`)
        }

        // Write both mod descriptor files
        await scriptHandler.createModDescriptor(hoi4Version)
        await scriptHandler.createUserModDescriptor(hoi4Version, modVersion)

        // Write localization file
        const trackLocKeys: Record<string, string> = {}
        for (const src of trackFiles) {
            const base = src.replace(/^.*\//, '') // remove the path
            const displayName = base.replace(/\..*$/, '') // remove the extension for display
            trackLocKeys[base] = displayName
        }
        await scriptHandler.createLocalization(trackLocKeys)
        this.logger.ok(`Wrote localization file ${yellow(modName)}`)

        // Write interface files
        // .gfx file
        await scriptHandler.createGFX()
        // .gui file
        await scriptHandler.createGUI()
        this.logger.ok(`Wrote interface files for ${yellow(modName)}`)

        // Write music script
        await scriptHandler.createMusicDefinition(trackLocKeys)

        // Write music asset file
        await scriptHandler.createMusicAsset(trackLocKeys)

        this.logger.ok(`Mod generation complete for ${yellow(modName)}`)
    }
}

export default ModGenerator
