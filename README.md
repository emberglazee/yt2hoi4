# yt2hoi4

> This project is a proof of concept. Unless you have [yt-dlp](https://github.com/yt-dlp/yt-dlp), [FFmpeg](https://ffmpeg.org), and [Bun](https://bun.sh) installed and ready to go, you will probably be better off with an alternative project, like the [Music Mod Creation Tool for Paradox Interactive Games](https://runite-drill.github.io/music-mod-creation-tool)

Download a YouTube video or a playlist and generate a full Hearts of Iron 4 radio station (music) mod.

## Requirements

This project requires:
- Bun
- yt-dlp
- ffmpeg

And was tested on:
- Bun v1.2.12
- yt-dlp v2025.04.30
- ffmpeg v7.1
- Hearts of Iron IV v1.16.5
- Windows 11 24H2 (might personally test for Ubuntu)

## Installation

Install [yt-dlp](https://github.com/yt-dlp/yt-dlp?tab=readme-ov-file#installation), [FFmpeg](https://ffmpeg.org/download.html), and [Bun](https://bun.sh)

```bash
# Ensure yt-dlp is on PATH (optionally check if your current version works with YouTube right now; regular updates recommended)
$ yt-dlp -v
2025.04.30
# Do the same with FFmpeg
$ ffmpeg -version
ffmpeg version 7.1-full_build-www.gyan.dev Copyright (c) 2000-2024 the FFmpeg developers
built with gcc 14.2.0 (Rev1, Built by MSYS2 project)
# ...and Bun
$ bun -v
1.2.12

# Then install project dependencies
$ bun install
```

## Usage

```bash
$ bun start --url <yt-dlp_compatible_link> --modName <mod-name>
# Or use positionals:
$ bun start <yt-dlp_compatible_link> <mod-name>
# Then copy paste the contents of the `output` folder into the user mods folder (on Windows its `Documents\Paradox Interactive\Hearts of Iron IV\mods)
# Paradox Launcher will not tell you about a new user mod, go into the mod list yourself and select the mod for a playset

# Includes basic cleanup scripts; if nothing works for your shell, just delete the `output` and `downloads` folders, and the `tracker.json` file
$ pwsh clear.ps1 # for PowerShell
$ clear.cmd # for Command Prompt (or double click in Explorer)
```
## Screenshot

![screenshot](https://github.com/user-attachments/assets/e26f222a-966c-435c-a41b-cf78787fb7ed)

## Why?

i was bored

