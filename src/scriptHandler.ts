// Class dedicated to handling the HOI4 scripting syntax

import { write } from 'bun'
import { Logger, yellow } from './logger'

export class ScriptHandler {
    private static instance: ScriptHandler
    private logger = new Logger('ScriptHandler')
    private modName: string

    private constructor(modName: string) {
        this.modName = modName
    }

    public static getInstance(modName: string): ScriptHandler {
        if (!ScriptHandler.instance) {
            ScriptHandler.instance = new ScriptHandler(modName)
        }
        return ScriptHandler.instance
    }

    private buildLocalization(tracks: { [track: string]: string }) {
        let localization = `l_english:\n  ${this.modName}_TITLE: "${this.modName} Radio"\n` as const
        for (const [track, name] of Object.entries(tracks)) {
            const locKey = track.replace(/\..*$/, '').replace(/[^A-Za-z0-9_]/g, '_')
            localization += `  ${locKey}: "${name}"\n`
        }
        return localization
    }
    public async createLocalization(tracks: { [track: string]: string }): Promise<Script<`${string}_l_english.yml`>> {
        const loc = this.buildLocalization(tracks)
        const locBuffer = Buffer.concat([Buffer.from([0xEF, 0xBB, 0xBF]), Buffer.from(loc)])
        await write(`${this.localisationDir}/${this.modName}_l_english.yml`, locBuffer)
        this.logger.ok(`Wrote localization file ${yellow(this.modName)}`)
        return {
            __fileName: `${this.modName}_l_english.yml`
        }
    }

    private buildMusicDefinition(modName: string, tracks: { [track: string]: string }) {
        // ${modName}_music.txt
        let musicScript = `music_station = "${modName}"
` as const
        for (const [fileName, _] of Object.entries(tracks)) {
            const trackId = fileName.replace(/\..*$/, '').replace(/[^A-Za-z0-9_]/g, '_')
            musicScript += `music = { song = "${trackId}" chance = { factor = 1 modifier = { factor = 1 } } }
`
        }
        return musicScript
    }
    public async createMusicDefinition(tracks: { [track: string]: string }): Promise<Script<`${string}_music.txt`>> {
        const musicScript = this.buildMusicDefinition(this.modName, tracks)
        await write(`${this.musicDir}/${this.modName}_music.txt`, musicScript)
        this.logger.ok(`Wrote music definition file ${yellow(this.modName)}`)
        return {
            __fileName: `${this.modName}_music.txt`
        }
    }

    private buildMusicAsset(tracks: { [track: string]: string }) {
        // ${modName}_music.asset
        let musicAsset = ''
        for (const [fileName, _] of Object.entries(tracks)) {
            const trackId = fileName.replace(/\..*$/, '').replace(/[^A-Za-z0-9_]/g, '_')
            musicAsset += `music = { name = "${trackId}" file = "${fileName}" volume = 0.65 }
`
        }
        return musicAsset
    }
    public async createMusicAsset(tracks: { [track: string]: string }): Promise<Script<`${string}_music.asset`>> {
        const musicAsset = this.buildMusicAsset(tracks)
        await write(`${this.musicDir}/${this.modName}_music.asset`, musicAsset)
        this.logger.ok(`Wrote music asset file ${yellow(this.modName)}`)
        return {
            __fileName: `${this.modName}_music.asset`
        }
    }

    private buildGFX(modName: string) {
        // ${modName}.gfx
        const gfxContent = `spriteTypes = {
    spriteType = {
        name = "GFX_${modName}_faceplate"
        texturefile = "gfx/${modName}_faceplate.dds"
        noOfFrames = 2
    }
}` as const
        return gfxContent
    }
    public async createGFX(): Promise<Script<`${string}.gfx`>>    {
        const gfxContent = this.buildGFX(this.modName)
        await write(`${this.interfaceDir}/${this.modName}.gfx`, gfxContent)
        this.logger.ok(`Wrote .gfx file for ${yellow(this.modName)}`)
        return {
            __fileName: `${this.modName}.gfx`
        }
    }

    private buildGUI(modName: string) {
        // ${modName}.gui
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
			maxValue = 100
			minValue = 0
			stepSize = 1
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

	containerWindowType = {
		name = "${modName}_stations_entry"
		size = { width = 162 height = 130 }
		checkBoxType = {
			name = "select_station_button"
			position = { x = 0 y = 0 }
			quadTextureSprite = "GFX_${modName}_faceplate"
			clicksound = decisions_ui_button
		}
	}
}
`
        return guiContent
    }
    public async createGUI(): Promise<Script<`${string}.gui`>> {
        const guiContent = this.buildGUI(this.modName)
        await write(`${this.interfaceDir}/${this.modName}.gui`, guiContent)
        this.logger.ok(`Wrote .gui file for ${yellow(this.modName)}`)
        return {
            __fileName: `${this.modName}.gui`
        }
    }

    private buildModDescriptor(modName: string, hoi4Version: string) {
        // ${modName}.mod
        const modDescriptor = `name="${modName}"
supported_version="${hoi4Version}"
`
        return modDescriptor
    }
    public async createModDescriptor(hoi4Version: string): Promise<Script<`${string}.mod`>> {
        const modDescriptor = this.buildModDescriptor(this.modName, hoi4Version)
        await write(`${this.modRoot}/${this.modName}.mod`, modDescriptor)
        this.logger.ok(`Wrote .mod file for ${yellow(this.modName)}`)
        return {
            __fileName: `${this.modName}.mod`
        }
    }

    private buildUserModDescriptor(modName: string, hoi4Version: string, modVersion: string) {
        // ${modName}.mod
        const userModDescriptor = `name="${modName}"
tags={
    "Sound"
}
path="mod/${modName}"
supported_version="${hoi4Version}"
version="${modVersion}"
`
        return userModDescriptor
    }
    public async createUserModDescriptor(hoi4Version: string, modVersion: string): Promise<Script<`${string}.mod`>> {
        const userModDescriptor = this.buildUserModDescriptor(this.modName, hoi4Version, modVersion)
        await write(`${ScriptHandler.OUTPUT_ROOT}/${this.modName}.mod`, userModDescriptor)
        this.logger.ok(`Wrote .mod file for ${yellow(this.modName)}`)
        return {
            __fileName: `${this.modName}.mod`
        }
    }

    // Path helpers for mod structure
    public get modRoot(): `${typeof ScriptHandler.OUTPUT_ROOT}/${typeof this.modName}` {
        return `${ScriptHandler.OUTPUT_ROOT}/${this.modName}`
    }
    public get musicDir(): `${typeof this.modRoot}/music/${typeof this.modName}` {
        return `${this.modRoot}/music/${this.modName}`
    }
    public get localisationDir(): `${typeof this.modRoot}/localisation` {
        return `${this.modRoot}/localisation`
    }
    public get interfaceDir(): `${typeof this.modRoot}/interface` {
        return `${this.modRoot}/interface`
    }
    public get gfxDir(): `${typeof this.modRoot}/gfx` {
        return `${this.modRoot}/gfx`
    }
    public static readonly OUTPUT_ROOT = './output' as const
    public async prepareModFolders() {
        await Bun.$`mkdir -p ${this.musicDir}`
        await Bun.$`mkdir -p ${this.localisationDir}`
        await Bun.$`mkdir -p ${this.interfaceDir}`
        await Bun.$`mkdir -p ${this.gfxDir}`
    }
}

// ts dev ergonomics asf 💅💅💅
type Script<FileName extends string> = {
    __fileName: FileName;
}
