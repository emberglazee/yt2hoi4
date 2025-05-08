import { write } from 'bun'
import Tracker from './tracker'
import { Logger, yellow } from './logger'

const OUTPUT_ROOT = './output'
const HOI4_MOD_VERSION = '1.12.*'

class ModGenerator {
    private static instance: ModGenerator
    private tracker: Tracker | null = null
    private logger = new Logger('ModGenerator')

    private constructor() {}

    public static async getInstance(): Promise<ModGenerator> {
        if (!ModGenerator.instance) {
            ModGenerator.instance = new ModGenerator()
            ModGenerator.instance.tracker = await Tracker.getInstance()
        }
        return ModGenerator.instance
    }

    /**
     * Generate a HOI4 music mod from the given .ogg files
     * @param modName The name of the mod (used for folder and file names)
     * @param trackFiles Array of .ogg file paths (relative to downloads/)
     */
    public async generateMod(modName: string, trackFiles: string[]): Promise<void> {
        if (!this.tracker) this.tracker = await Tracker.getInstance()
        await this.tracker.setCurrentStep('mod:setup')
        this.logger.info(`Setting up mod structure for ${yellow(modName)}`)

        // Prepare folder structure
        const modRoot = `${OUTPUT_ROOT}/${modName}`
        const musicDir = `${modRoot}/music/radio/${modName}`
        const localisationDir = `${modRoot}/localisation`
        const interfaceDir = `${modRoot}/interface`
        const gfxDir = `${modRoot}/gfx/interface`

        await Bun.$`mkdir -p ${musicDir}`
        await Bun.$`mkdir -p ${localisationDir}`
        await Bun.$`mkdir -p ${interfaceDir}`
        await Bun.$`mkdir -p ${gfxDir}`
        this.logger.ok(`Created mod folder structure for ${yellow(modName)}`)

        // Copy .ogg files to music/radio/modName
        await this.tracker.setCurrentStep('mod:copy_music')
        this.logger.info(`Copying music files for ${yellow(modName)}`)
        for (const src of trackFiles) {
            const base = src.replace(/^.*\//, '')
            const dest = `${musicDir}/${base}`
            await Bun.$`cp ./downloads/${base} ${dest}`
            this.logger.ok(`Copied ${yellow(base)} to ${yellow(dest)}`)
        }

        // Write descriptor.mod
        await this.tracker.setCurrentStep('mod:descriptor')
        this.logger.info(`Writing descriptor.mod for ${yellow(modName)}`)
        const descriptor = `name="${modName}"
path="mod/${modName}"
supported_version="${HOI4_MOD_VERSION}"
`
        await write(`${modRoot}/descriptor.mod`, descriptor)
        this.logger.ok(`Wrote descriptor.mod for ${yellow(modName)}`)

        // Write localisation file
        await this.tracker.setCurrentStep('mod:localisation')
        this.logger.info(`Writing localisation for ${yellow(modName)}`)
        const locFile = `${modName}_l_english.yml`
        let locContent = `l_english:
  ${modName}: "${modName} Radio"
`
        for (const src of trackFiles) {
            const base = src.replace(/^.*\//, '')
            const trackId = base.replace(/\..*$/, '')
            locContent += `  ${trackId}: "${trackId}"
`
        }
        await write(`${localisationDir}/${locFile}`, locContent)
        this.logger.ok(`Wrote localisation file ${yellow(locFile)}`)

        // Write interface files (minimal placeholders)
        await this.tracker.setCurrentStep('mod:interface')
        this.logger.info(`Writing interface files for ${yellow(modName)}`)
        await write(`${interfaceDir}/${modName}.gfx`, `# Placeholder .gfx for ${modName}
`)
        await write(`${interfaceDir}/${modName}.gui`, `# Placeholder .gui for ${modName}
`)
        await write(`${gfxDir}/${modName}.dds`, '') // Placeholder, real DDS should be added later
        this.logger.ok(`Wrote interface placeholders for ${yellow(modName)}`)

        // Write music script
        await this.tracker.setCurrentStep('mod:music_script')
        this.logger.info(`Writing music script for ${yellow(modName)}`)
        let musicScript = `music = {
  name = "${modName}"
  tracks = {
`
        for (const src of trackFiles) {
            const base = src.replace(/^.*\//, '')
            const trackId = base.replace(/\..*$/, '')
            musicScript += `    "${modName}/${trackId}"
`
        }
        musicScript += `  }
}`
        await write(`${modRoot}/music/${modName}_music.txt`, musicScript)
        this.logger.ok(`Wrote music script for ${yellow(modName)}`)

        await this.tracker.setCurrentStep('mod:done')
        this.logger.ok(`Mod generation complete for ${yellow(modName)}`)
    }
}

export default ModGenerator
