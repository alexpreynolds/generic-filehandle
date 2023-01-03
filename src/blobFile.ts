import { GenericFilehandle, FilehandleOptions, Stats } from './filehandle'

// Using this you can "await" the file like a normal promise
// https://blog.shovonhasan.com/using-promises-with-filereader/
function readBlobAsArrayBuffer(blob: Blob) {
  return blob.arrayBuffer()
}

function readBlobAsText(blob: Blob) {
  return blob.text()
}

/**
 * Blob of binary data fetched from a local file
 *
 * Adapted by Robert Buels and Garrett Stevens from the BlobFetchable object in
 * the Dalliance Genome Explorer, which is copyright Thomas Down 2006-2011.
 */
export default class BlobFile implements GenericFilehandle {
  private blob: Blob
  private size: number
  public constructor(blob: Blob) {
    this.blob = blob
    this.size = blob.size
  }

  public async read(
    buffer: Uint8Array,
    offset = 0,
    length: number,
    position = 0,
  ): Promise<{ bytesRead: number; buffer: Uint8Array }> {
    // short-circuit a read of 0 bytes here, because browsers actually
    // sometimes crash if you try to read 0 bytes from a local file!
    if (!length) {
      return { bytesRead: 0, buffer }
    }

    const start = position
    const end = start + length

    const result = await readBlobAsArrayBuffer(this.blob.slice(start, end))
    const uint8buf = new Uint8Array(result)
    for (let i = 0; i < uint8buf.byteLength; i++) {
      buffer[i + offset] = uint8buf[i]
    }

    return { bytesRead: result.byteLength, buffer }
  }

  public async read2(length: number, position: number): Promise<Uint8Array> {
    // short-circuit a read of 0 bytes here, because browsers actually
    // sometimes crash if you try to read 0 bytes from a local file!
    if (!length) {
      return new Uint8Array()
    }

    const start = position
    const end = position + length

    return new Uint8Array(
      await readBlobAsArrayBuffer(this.blob.slice(start, end)),
    )
  }

  public async readFile(): Promise<Uint8Array>
  public async readFile(options: BufferEncoding): Promise<string>
  public async readFile<T extends undefined>(
    options:
      | Omit<FilehandleOptions, 'encoding'>
      | (Omit<FilehandleOptions, 'encoding'> & { encoding: T }),
  ): Promise<Uint8Array>
  public async readFile<T extends BufferEncoding>(
    options: Omit<FilehandleOptions, 'encoding'> & { encoding: T },
  ): Promise<string>
  public async readFile(
    options?: FilehandleOptions | BufferEncoding,
  ): Promise<Uint8Array | string> {
    let encoding
    if (typeof options === 'string') {
      encoding = options
    } else {
      encoding = options?.encoding
    }
    if (encoding === 'utf8') {
      return readBlobAsText(this.blob)
    }
    if (encoding) {
      throw new Error(`unsupported encoding: ${encoding}`)
    }
    const res = await readBlobAsArrayBuffer(this.blob)
    return new Uint8Array(res)
  }

  public async stat(): Promise<Stats> {
    return { size: this.size }
  }

  public async close(): Promise<void> {
    return
  }
}
