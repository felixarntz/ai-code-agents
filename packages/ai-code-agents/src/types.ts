import * as z from 'zod';

export const ReadFileResult = z.object({
  path: z.string().meta({
    description: 'The path to the file that was read.',
  }),
  content: z.string().meta({
    description: 'The content of the file that was read.',
  }),
});

export type ReadFileResult = z.infer<typeof ReadFileResult>;

export const WriteFileResult = z.object({
  path: z.string().meta({
    description: 'The path to the file that was written.',
  }),
  message: z.string().meta({
    description: 'A message indicating the result of the write operation.',
  }),
});

export type WriteFileResult = z.infer<typeof WriteFileResult>;

export const DeleteFileResult = z.object({
  path: z.string().meta({
    description: 'The path to the file that was deleted.',
  }),
  message: z.string().meta({
    description: 'A message indicating the result of the delete operation.',
  }),
});

export type DeleteFileResult = z.infer<typeof DeleteFileResult>;

export const MoveFileResult = z.object({
  sourcePath: z.string().meta({
    description: 'The original path of the file that was moved.',
  }),
  destinationPath: z.string().meta({
    description: 'The new path of the file that was moved to.',
  }),
  message: z.string().meta({
    description: 'A message indicating the result of the move operation.',
  }),
});

export type MoveFileResult = z.infer<typeof MoveFileResult>;

export const CopyFileResult = z.object({
  sourcePath: z.string().meta({
    description: 'The original path of the file that was copied.',
  }),
  destinationPath: z.string().meta({
    description: 'The new path of the file that was copied to.',
  }),
  message: z.string().meta({
    description: 'A message indicating the result of the copy operation.',
  }),
});

export type CopyFileResult = z.infer<typeof CopyFileResult>;

export const RunCommandResult = z.object({
  command: z.string().meta({
    description: 'The command that was executed.',
  }),
  exitCode: z.number().meta({
    description: 'The exit code of the command.',
  }),
  stdout: z.string().meta({
    description: 'The standard output of the command.',
  }),
  stderr: z.string().meta({
    description: 'The standard error output of the command.',
  }),
});

export type RunCommandResult = z.infer<typeof RunCommandResult>;

export interface FilesystemEnvironmentInterface {
  get name(): string;
  readFile(path: string): Promise<ReadFileResult>;
  writeFile(path: string, content: string): Promise<WriteFileResult>;
  deleteFile(path: string): Promise<DeleteFileResult>;
  moveFile(
    sourcePath: string,
    destinationPath: string,
  ): Promise<MoveFileResult>;
  copyFile(
    sourcePath: string,
    destinationPath: string,
  ): Promise<CopyFileResult>;
}

export interface CommandLineEnvironmentInterface
  extends FilesystemEnvironmentInterface {
  runCommand(command: string): Promise<RunCommandResult>;
}

export type Environment =
  | FilesystemEnvironmentInterface
  | CommandLineEnvironmentInterface;
