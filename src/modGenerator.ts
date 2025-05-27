import { write } from 'bun'
import { Logger, yellow } from './logger'
import { join } from 'path'
import { version as modVersion } from '../package.json'
import { ScriptHandler } from './scriptHandler'


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
     * Generate a HOI4 music mod from the given .ogg files
     * @param modName The name of the mod (used for folder and file names)
     * @param trackFiles Array of .ogg file paths (relative to downloads/)
     */
    public async generateMod(modName: string, trackFiles: string[], hoi4Version: string): Promise<void> {
        const scriptHandler = ScriptHandler.getInstance(modName)

        this.logger.info(`Setting up mod structure for ${yellow(modName)}`)
        // Prepare folder structure (moved to ScriptHandler)
        await scriptHandler.prepareModFolders()

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
        // .dds placeholder
        const dds = Bun.file(join(__dirname, '../radio_station.dds'))
        await write(`${scriptHandler.gfxDir}/${modName}_faceplate.dds`, dds)
        this.logger.ok(`Wrote interface files for ${yellow(modName)}`)

        // Write music script
        await scriptHandler.createMusicDefinition(trackLocKeys)

        // Write music asset file
        await scriptHandler.createMusicAsset(trackLocKeys)

        this.logger.ok(`Mod generation complete for ${yellow(modName)}`)
    }
}

export default ModGenerator
