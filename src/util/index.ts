import { promises as fs } from 'fs';
import path from 'path';

export const IMAGE_ATTACHMENT_HOST = 'https://trello-attachments.s3.amazonaws.com/';

export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function iterateFolder(folderPath: string, callback: (filePath: string) => void | Promise<void>, extension = '.js') {
  const files = await fs.readdir(folderPath);
  await Promise.all(
    files.map(async (file) => {
      const filePath = path.join(folderPath, file);
      const stat = await fs.lstat(filePath);
      if (stat.isSymbolicLink()) {
        const realPath = await fs.readlink(filePath);
        if (stat.isFile() && file.endsWith(extension)) {
          await callback(realPath);
        } else if (stat.isDirectory()) {
          await iterateFolder(realPath, callback, extension);
        }
      } else if (stat.isFile() && file.endsWith(extension)) await callback(filePath);
      else if (stat.isDirectory()) await iterateFolder(filePath, callback, extension);
    })
  );
}

export function isEmpty(text: string) {
  if (!text) return false;
  if (text.length === 1 && text.charCodeAt(0) === 8203) return true;
  return text.trim().length === 0;
}

export function cutoffText(text: string, limit = 2000) {
  return text.length > limit ? text.slice(0, limit - 1) + '…' : text;
}

export function escapeRegex(s: string) {
  return s.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
}

export function formatTime(dateString: string) {
  const timestamp = Math.round(new Date(dateString).valueOf() / 1000);
  return `<t:${timestamp}:F> *(<t:${timestamp}:R>)*`;
}

export function escapeMarkdown(text: string) {
  function italic(text: string) {
    let i = 0;
    text = text.replace(/(?<=^|[^*])\*([^*]|\*\*|$)/g, (_, match) => {
      if (match === '**') return ++i % 2 ? `\\*${match}` : `${match}\\*`;
      return `\\*${match}`;
    });
    i = 0;
    return text.replace(/(?<=^|[^_])_([^_]|__|$)/g, (_, match) => {
      if (match === '__') return ++i % 2 ? `\\_${match}` : `${match}\\_`;
      return `\\_${match}`;
    });
  }

  function bold(text: string) {
    let i = 0;
    return text.replace(/\*\*(\*)?/g, (_, match) => {
      if (match) return ++i % 2 ? `${match}\\*\\*` : `\\*\\*${match}`;
      return '\\*\\*';
    });
  }

  function underline(text: string) {
    let i = 0;
    return text.replace(/__(_)?/g, (_, match) => {
      if (match) return ++i % 2 ? `${match}\\_\\_` : `\\_\\_${match}`;
      return '\\_\\_';
    });
  }

  text = text
    .replace(/(?<=^|[^`])`(?=[^`]|$)/g, '\\`') // inlineCode
    .replace(/```/g, '\\`\\`\\`'); // codeBlock
  text = underline(bold(italic(text)));
  return text
    .replace(/~~/g, '\\~\\~') // strikethrough
    .replace(/\|\|/g, '\\|\\|'); // spoiler
}
