import { write } from 'bun'
import Tracker from './tracker'
import { Logger, yellow } from './logger'

const OUTPUT_ROOT = './output'
const HOI4_MOD_VERSION = '1.16.4'

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
        const localisationDir = `${modRoot}/localisation` // important: hoi4 uses "localisation" spelling, not "localization"
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
            const trackId = base.replace(/\..*$/, '').replace(/ /g, '_')
            locContent += `  ${trackId}: "${trackId}"
`
        }
        await write(`${localisationDir}/${locFile}`, locContent)
        this.logger.ok(`Wrote localisation file ${yellow(locFile)}`)

        // Write interface files (generate .gfx and .gui, placeholder .dds)
        await this.tracker.setCurrentStep('mod:interface')
        this.logger.info(`Writing interface files for ${yellow(modName)}`)
        // .gfx file
        const gfxContent = `spriteTypes = {
    spriteType = {
        name = "GFX_${modName}_album_art"
        texturefile = "gfx/${modName}_album_art.dds"
        noOfFrames = 2
    }
}`
        await write(`${interfaceDir}/${modName}.gfx`, gfxContent)
        this.logger.ok(`Wrote .gfx file for ${yellow(modName)}`)
        // .gui file (generate from template)
        const guiContent = `guiTypes = {
	containerWindowType = {
		name = "${modName}_faceplate"
		position = { x =0 y=0 }
		size = { width = 590 height = 46 }

		iconType = {
			name = "musicplayer_header_bg"
			spriteType = "GFX_musicplayer_header_bg"
			position = { x= 0 y = 0 }
		}

		instantTextboxType = {
			name = "track_name"
			position = { x = 72 y = 20 }
			font = "hoi_20b"
			text = "Roger Pontare - Nar vindarna viskar mitt namn"
			maxWidth = 450
			maxHeight = 25
			format = center
		}

		instantTextboxType = {
			name = "track_elapsed"
			position = { x = 124 y = 30 }
			font = "hoi_18b"
			text = "00:00"
			maxWidth = 50
			maxHeight = 25
			format = center
		}

		instantTextboxType = {
			name = "track_duration"
			position = { x = 420 y = 30 }
			font = "hoi_18b"
			text = "02:58"
			maxWidth = 50
			maxHeight = 25
			format = center
		}

		buttonType = {
			name = "prev_button"
			position = { x = 220 y = 20 }
			quadTextureSprite = "GFX_musicplayer_previous_button"
			buttonFont = "Main_14_black"
			Orientation = "LOWER_LEFT"
			clicksound = click_close
			pdx_tooltip = "MUSICPLAYER_PREV"
		}

		buttonType = {
			name = "play_button"
			position = { x = 263 y = 20 }
			quadTextureSprite = "GFX_musicplayer_play_pause_button"
			buttonFont = "Main_14_black"
			Orientation = "LOWER_LEFT"
			clicksound = click_close
		}

		buttonType = {
			name = "next_button"
			position = { x = 336 y = 20 }
			quadTextureSprite = "GFX_musicplayer_next_button"
			buttonFont = "Main_14_black"
			Orientation = "LOWER_LEFT"
			clicksound = click_close
			pdx_tooltip = "MUSICPLAYER_NEXT"
		}

		extendedScrollbarType = {
			name = "volume_slider"
			position = { x = 100 y = 45}
			size = { width = 75 height = 18 }
			tileSize = { width = 12 height = 12}
			maxValue =100
			minValue =0
			stepSize =1
			startValue = 50
			horizontal = yes
			orientation = lower_left
			origo = lower_left
			setTrackFrameOnChange = yes

			slider = {
				name = "Slider"	
				quadTextureSprite = "GFX_scroll_drager"
				position = { x=0 y = 1 }
				pdx_tooltip = "MUSICPLAYER_ADJUST_VOL"
			}

			track = {
				name = "Track"
				quadTextureSprite = "GFX_volume_track"
				position = { x=0 y = 3 }
				alwaystransparent = yes
				pdx_tooltip = "MUSICPLAYER_ADJUST_VOL"
			}
		}

		buttonType = {
			name = "shuffle_button"
			position = { x = 425 y = 20 }
			quadTextureSprite = "GFX_toggle_shuffle_buttons"
			buttonFont = "Main_14_black"
			Orientation = "LOWER_LEFT"
			clicksound = click_close
		}
	}

	containerWindowType={
		name = "${modName}_stations_entry"
		size = { width = 162 height = 130 }
		checkBoxType = {
			name = "select_station_button"
			position = { x = 0 y = 0 }
			quadTextureSprite = "GFX_${modName}_album_art"
			clicksound = decisions_ui_button
		}
	}
}
`
        await write(`${interfaceDir}/${modName}.gui`, guiContent)
        // .dds placeholder
        await write(`${gfxDir}/${modName}.dds`, '') // Placeholder, real DDS should be added later
        this.logger.ok(`Wrote interface files for ${yellow(modName)}`)

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
