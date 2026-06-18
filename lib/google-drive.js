import { google } from 'googleapis';
import https from 'https';
import http from 'http';
import { Readable } from 'stream';

const FOLDER_ROOT = 'PVB Estudio Creativo';

function getAuthClient() {
  const oauth2 = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );
  oauth2.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
  return oauth2;
}

function getDriveClient() {
  return google.drive({ version: 'v3', auth: getAuthClient() });
}

async function findOrCreateFolder(drive, name, parentId = null) {
  const q = [
    `name = '${name}'`,
    `mimeType = 'application/vnd.google-apps.folder'`,
    `trashed = false`,
    parentId ? `'${parentId}' in parents` : `'root' in parents`,
  ].join(' and ');

  const res = await drive.files.list({ q, fields: 'files(id, name)', spaces: 'drive' });
  if (res.data.files.length > 0) return res.data.files[0].id;

  const folder = await drive.files.create({
    requestBody: {
      name,
      mimeType: 'application/vnd.google-apps.folder',
      parents: parentId ? [parentId] : [],
    },
    fields: 'id',
  });
  return folder.data.id;
}

async function resolveFolder(drive, project, subfolder) {
  const rootId = await findOrCreateFolder(drive, FOLDER_ROOT);
  const projectId = project
    ? await findOrCreateFolder(drive, project, rootId)
    : await findOrCreateFolder(drive, 'General', rootId);
  return subfolder
    ? await findOrCreateFolder(drive, subfolder, projectId)
    : projectId;
}

function inferSubfolder(mimeType = '', filename = '') {
  if (mimeType.startsWith('image/') || /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(filename)) return 'Imágenes';
  if (mimeType === 'application/pdf' || /\.pdf$/i.test(filename)) return 'PDFs';
  if (mimeType.startsWith('video/') || /\.(mp4|mov|avi|webm)$/i.test(filename)) return 'Videos';
  return 'Diseños';
}

export async function uploadFile({ content, filename, mimeType, project = null, subfolder = null }) {
  const drive = getDriveClient();
  const targetFolder = subfolder || inferSubfolder(mimeType, filename);
  const folderId = await resolveFolder(drive, project, targetFolder);

  const res = await drive.files.create({
    requestBody: { name: filename, parents: [folderId] },
    media: { mimeType, body: content },
    fields: 'id, name, webViewLink, webContentLink',
  });

  await drive.permissions.create({
    fileId: res.data.id,
    requestBody: { role: 'reader', type: 'anyone' },
  });

  return res.data;
}

export async function uploadFromUrl({ url, filename, mimeType, project, subfolder }) {
  const content = await new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http;
    mod.get(url, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    }).on('error', reject);
  });

  return uploadFile({ content: Readable.from(content), filename, mimeType, project, subfolder });
}

export async function listFolderImages(folderId) {
  const drive = getDriveClient();
  const q = `'${folderId}' in parents and mimeType contains 'image/' and trashed = false`;
  const res = await drive.files.list({
    q,
    fields: 'files(id, name, mimeType)',
    spaces: 'drive',
    pageSize: 100,
    orderBy: 'name',
  });
  return (res.data.files || []).map(f => ({
    id: f.id,
    name: f.name,
    viewUrl: `https://drive.google.com/uc?id=${f.id}&export=view`,
    embedUrl: `https://lh3.googleusercontent.com/d/${f.id}=w1200`,
  }));
}

export async function saveToFolder(folderId, filename, content, mimeType = 'text/html') {
  const drive = getDriveClient();
  const body = typeof content === 'string' ? Readable.from(Buffer.from(content, 'utf8')) : content;
  const res = await drive.files.create({
    requestBody: { name: filename, parents: [folderId] },
    media: { mimeType, body },
    fields: 'id, name, webViewLink',
  });
  await drive.permissions.create({
    fileId: res.data.id,
    requestBody: { role: 'reader', type: 'anyone' },
  });
  return res.data;
}
