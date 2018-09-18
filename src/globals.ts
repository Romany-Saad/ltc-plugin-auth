import * as path from "path"

export const rootPath = (relativePath: string) => path.resolve(__dirname, "../", relativePath)
