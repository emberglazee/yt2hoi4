import { green, Logger } from './logger'
const logger = new Logger('ScriptHandler')

import { $, write } from 'bun'
import { HOI4_VERSION } from './config'

import ModGenerator from './modGenerator'

export class ScriptHandler {

    private buildLocalization(tracks: { id: string, displayName: string }[]) {
        let localization = `l_english:\n  ${ModGenerator.normalizedModName}_TITLE: "${ModGenerator.modName} Radio"\n`
        for (const track of tracks) {
            localization += `  ${track.id}: "${track.displayName.replace(/：/g, ':').replace(/＂/g, '\\"')}"\n` // Make sure we're escaping the quotes in the name itself
        }
        return localization
    }
    public async createLocalization(tracks: { id: string, displayName: string }[]): Promise<Script<`${string}_l_english.yml`>> {
        const loc = this.buildLocalization(tracks)
        const locBuffer = Buffer.concat([Buffer.from([0xEF, 0xBB, 0xBF]), Buffer.from(loc)])
        const filePath = `${this.localisationDir}/${ModGenerator.normalizedModName}_l_english.yml`
        await write(filePath, locBuffer)
        logger.ok(`Wrote the localization to "${green(filePath)}"`)
        return {
            __fileName: `${ModGenerator.normalizedModName}_l_english.yml`
        }
    }

    private buildMusicDefinition(tracks: { id: string }[]) {
        // ${ModGenerator.modName}_music.txt
        let musicScript = `music_station = "${ModGenerator.normalizedModName}"\n`
        for (const track of tracks) {
            musicScript += `music = { song = "${track.id}" chance = { factor = 1 modifier = { factor = 1 } } }\n`
        }
        return musicScript
    }
    public async createMusicDefinition(tracks: { id: string }[]): Promise<Script<`${string}_music.txt`>> {
        const musicScript = this.buildMusicDefinition(tracks)
        const filePath = `${this.musicDir}/${ModGenerator.normalizedModName}_music.txt`
        await write(filePath, musicScript)
        logger.ok(`Wrote the music definition to "${green(filePath)}"`)
        return {
            __fileName: `${ModGenerator.normalizedModName}_music.txt`
        }
    }

    private buildMusicAsset(tracks: { id: string, fileName: string }[]) {
        // ${ModGenerator.modName}_music.asset
        let musicAsset = ''
        for (const track of tracks) {
            musicAsset += `music = { name = "${track.id}" file = "${track.fileName}" volume = 0.65 }\n`
        }
        return musicAsset
    }
    public async createMusicAsset(tracks: { id: string, fileName: string }[]): Promise<Script<`${string}_music.asset`>> {
        const musicAsset = this.buildMusicAsset(tracks)
        const filePath = `${this.musicDir}/${ModGenerator.normalizedModName}_music.asset`
        await write(filePath, musicAsset)
        logger.ok(`Wrote the music asset information to "${green(filePath)}"`)
        return {
            __fileName: `${ModGenerator.normalizedModName}_music.asset`
        }
    }

    private buildGFX() {
        // ${ModGenerator.normalizedModName}.gfx
        const gfxContent = `spriteTypes = {
    spriteType = {
        name = "GFX_${ModGenerator.normalizedModName}_faceplate"
        texturefile = "gfx/${ModGenerator.normalizedModName}_faceplate.dds"
        noOfFrames = 2
    }\n}` as const
        return gfxContent
    }
    public async createGFX(): Promise<Script<`${string}.gfx`>>    {
        const gfxContent = this.buildGFX()
        const filePath = `${this.interfaceDir}/${ModGenerator.normalizedModName}.gfx`
        await write(filePath, gfxContent)
        logger.ok(`Wrote the radio station GFX to "${green(filePath)}"`)
        return {
            __fileName: `${ModGenerator.normalizedModName}.gfx`
        }
    }

    private buildGUI() {
        // ${ModGenerator.modName}.gui
        const guiContent = `guiTypes = {
	containerWindowType = {
		name = "${ModGenerator.normalizedModName}_faceplate"
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
		name = "${ModGenerator.normalizedModName}_stations_entry"
		size = { width = 162 height = 130 }
		checkBoxType = {
			name = "select_station_button"
			position = { x = 0 y = 0 }
			quadTextureSprite = "GFX_${ModGenerator.normalizedModName}_faceplate"
			clicksound = decisions_ui_button
		}
	}\n}\n`
        return guiContent
    }
    public async createGUI(): Promise<Script<`${string}.gui`>> {
        const guiContent = this.buildGUI()
        const filePath = `${this.interfaceDir}/${ModGenerator.normalizedModName}.gui`
        await write(filePath, guiContent)
        logger.ok(`Wrote the radio station GUI to "${green(filePath)}"`)
        return {
            __fileName: `${ModGenerator.normalizedModName}.gui`
        }
    }

    private buildModDescriptor(hoi4Version: string) {
        // ${normalizedModName}.mod
        const modDescriptor = `name="${ModGenerator.modName}"
supported_version="${hoi4Version}"\n`
        return modDescriptor
    }
    public async createModDescriptor(hoi4Version: string): Promise<Script<`${string}.mod`>> {
        const modDescriptor = this.buildModDescriptor(hoi4Version)
        const filePath = `${this.modRoot}/${ModGenerator.normalizedModName}.mod`
        await write(filePath, modDescriptor)
        logger.ok(`Wrote the mod descriptor to "${green(filePath)}"`)
        return {
            __fileName: `${ModGenerator.normalizedModName}.mod`
        }
    }

    private buildLocalModDescriptor(modVersion: string) {
        // ${normalizedModName}.mod
        const localModDescriptor = `name = "${ModGenerator.modName}"
tags = { "Sound" }
path = "mod/${ModGenerator.normalizedModName}"
supported_version = "${HOI4_VERSION}"
version = "${modVersion}"\n`
        return localModDescriptor
    }
    public async createLocalModDescriptor(modVersion: string): Promise<Script<`${string}.mod`>> {
        const localModDescriptor = this.buildLocalModDescriptor(modVersion)
        const filePath = `${ScriptHandler.OUTPUT_ROOT}/${ModGenerator.normalizedModName}.mod`
        await write(filePath, localModDescriptor)
        logger.ok(`Wrote the local mod descriptor to "${green(filePath)}"`)
        return {
            __fileName: `${ModGenerator.normalizedModName}.mod`
        }
    }

    // Path helpers for mod structure
    public get modRoot(): `${typeof ScriptHandler.OUTPUT_ROOT}/${typeof ModGenerator.normalizedModName}` {
        return `${ScriptHandler.OUTPUT_ROOT}/${ModGenerator.normalizedModName}`
    }
    public get musicDir(): `${typeof this.modRoot}/music/${typeof ModGenerator.normalizedModName}` {
        return `${this.modRoot}/music/${ModGenerator.normalizedModName}`
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
    public static readonly OUTPUT_ROOT = './output'

    public async prepareModFolders() {
        await $`mkdir -p ${this.musicDir}`
        await $`mkdir -p ${this.localisationDir}`
        await $`mkdir -p ${this.interfaceDir}`
        await $`mkdir -p ${this.gfxDir}`
    }
}

// ts dev ergonomics asf 💅💅💅
type Script<FileName extends string> = {
    __fileName: FileName;
}
