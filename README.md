# yt2hoi4

> This project is a proof of concept. Unless you have [yt-dlp](https://github.com/yt-dlp/yt-dlp), [FFmpeg](https://ffmpeg.org), and [Bun](https://bun.sh) installed and ready to go, you will probably be better off with an alternative project, like the [Music Mod Creation Tool for Paradox Interactive Games](https://runite-drill.github.io/music-mod-creation-tool)

Download a YouTube video or a playlist and generate a full Hearts of Iron 4 radio station (music) mod.

## Requirements

This project requires:
- Bun
- yt-dlp
- ffmpeg

And was tested on:
- Bun v1.2.14
- yt-dlp v2025.05.22
- ffmpeg v7.1
- ImageMagick v7.1.1-47
- Hearts of Iron IV v1.16.8
- Windows 11 24H2 (might personally test for Ubuntu)

## Installation

Install [yt-dlp](https://github.com/yt-dlp/yt-dlp?tab=readme-ov-file#installation), [FFmpeg](https://ffmpeg.org/download.html), [Bun](https://bun.sh), and optionally [ImageMagick](https://imagemagick.org/script/download.php) for the --use-thumbnail option

```bash
# Ensure yt-dlp is on PATH (optionally check if your current version works with YouTube right now; regular updates recommended)
$ yt-dlp --version
2025.05.22
# Do the same with FFmpeg
$ ffmpeg -version
ffmpeg version 7.1-full_build-www.gyan.dev Copyright (c) 2000-2024 the FFmpeg developers
built with gcc 14.2.0 (Rev1, Built by MSYS2 project)
# ...and Bun
$ bun -v
1.2.14
# If you plan to use custom thumbnails, check ImageMagick too
$ magick --version
Version: ImageMagick 7.1.1-47 Q16-HDRI x64 82572af:20250329 https://imagemagick.org
...

# Clone the repository
$ git clone https://github.com/emberglazee/yt2hoi4
$ cd yt2hoi4

# Then install project dependencies
$ bun install
```

## Usage

```bash
# Basic usage with default radio station faceplate
$ bun start --url <yt-dlp_compatible_link> --mod-name <mod-name>

# Use the video/playlist thumbnail as the radio station faceplate (requires ImageMagick)
$ bun start --url <yt-dlp_compatible_link> --mod-name <mod-name> --use-thumbnail

# Optionally you can also pass your own yt-dlp args:
$ bun start --url ... --mod-name ... --ytdlp-args --cookies-from-browser firefox --proxy socks5://localhost:1080 ...

# Includes basic cleanup scripts; if nothing works for your shell, just delete the `output` and `downloads` folders
$ pwsh clear.ps1 # for PowerShell
$ clear.cmd # for Command Prompt (or double click in Explorer)

# To update:
$ git pull
```

## Screenshot

![screenshot](https://github.com/user-attachments/assets/e26f222a-966c-435c-a41b-cf78787fb7ed)

## Why?

i was bored

