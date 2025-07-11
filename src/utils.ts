export const printStream = async (stream: ReadableStream<Uint8Array>, label: string) => {
    for await (const chunk of stream) {
        Bun.write(Bun.stdout, `[${label}] `)
        Bun.write(Bun.stdout, chunk)
    }
}
