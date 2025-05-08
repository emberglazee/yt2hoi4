import { write, file } from 'bun'
import { Logger, yellow, red } from './logger'

export type TrackerStep =
| 'downloading'
| 'mod:setup'
| 'mod:copy_music'
| 'mod:descriptor'
| 'mod:localisation'
| 'mod:interface'
| 'mod:music_script'
| 'mod:done'
| null

export type DownloadStatus = 'pending' | 'success' | 'error'

export interface DownloadedVideo {
    id: string
    filename: string
    status: DownloadStatus
    error?: string
}

export interface TrackerState {
    downloaded: DownloadedVideo[]
    currentStep: TrackerStep
}

const TRACKER_PATH = './tracker.json'

class Tracker {
    private static instance: Tracker
    private state: TrackerState = { downloaded: [], currentStep: null }
    private logger = new Logger('Tracker')

    private constructor() {}

    public static async getInstance(): Promise<Tracker> {
        if (!Tracker.instance) {
            Tracker.instance = new Tracker()
            await Tracker.instance.load()
        }
        return Tracker.instance
    }

    private async load() {
        this.logger.info(`Loading tracker state from ${yellow(TRACKER_PATH)}`)
        try {
            const data = await file(TRACKER_PATH).text()
            this.state = JSON.parse(data)
            this.logger.ok(`Loaded tracker state from ${yellow(TRACKER_PATH)}`)
        } catch {
            this.logger.warn(`Could not load tracker state from ${yellow(TRACKER_PATH)}: ${red('file missing or invalid, starting fresh')}`)
            // If file doesn't exist or is invalid, start fresh
            this.state = { downloaded: [], currentStep: null }
            await this.save()
        }
    }

    private async save() {
        await write(TRACKER_PATH, JSON.stringify(this.state, null, 2))
    }

    public getDownloaded() {
        return this.state.downloaded
    }

    public async addDownloaded(video: DownloadedVideo) {
        if (!this.state.downloaded.find(v => v.id === video.id)) {
            this.state.downloaded.push(video)
            await this.save()
        }
    }

    public async updateDownloadedStatus(id: string, status: DownloadStatus, error?: string) {
        const vid = this.state.downloaded.find(v => v.id === id)
        if (vid) {
            vid.status = status
            if (error) vid.error = error
            await this.save()
            if (status === 'error') {
                this.logger.error(`Download ${yellow(id)} failed: ${red(error ?? 'unknown error')}`)
            }
        }
    }

    public getCurrentStep() {
        return this.state.currentStep
    }

    public async setCurrentStep(step: TrackerStep) {
        this.state.currentStep = step
        await this.save()
    }

    public async reset() {
        this.state = { downloaded: [], currentStep: null }
        await this.save()
        this.logger.ok('Tracker state reset')
    }
}

export default Tracker
