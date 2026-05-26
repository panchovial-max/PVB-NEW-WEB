const { google } = require('googleapis');

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

// Returns the folder ID for: PVB Estudio Creativo / [project] / [subfolder]
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
  if (mimeType.startsWith('video/') || /\.(mp4|mov|avi|webm|gif)$/i.test(filename)) return 'Videos';
  return 'Diseños';
}

/**
 * Upload a file to Google Drive.
 * @param {object} opts
 * @param {Buffer|ReadableStream} opts.content - File content
 * @param {string} opts.filename - File name with extension
 * @param {string} opts.mimeType - MIME type
 * @param {string} [opts.project] - Project name (folder). Defaults to 'General'
 * @param {string} [opts.subfolder] - Override subfolder. Auto-detected from mimeType if omitted
 * @returns {{ id, name, webViewLink, webContentLink }}
 */
async function uploadFile({ content, filename, mimeType, project = null, subfolder = null }) {
  const drive = getDriveClient();
  const targetFolder = subfolder || inferSubfolder(mimeType, filename);
  const folderId = await resolveFolder(drive, project, targetFolder);

  const res = await drive.files.create({
    requestBody: { name: filename, parents: [folderId] },
    media: { mimeType, body: content },
    fields: 'id, name, webViewLink, webContentLink',
  });

  // Make file publicly readable so agents can share the link
  await drive.permissions.create({
    fileId: res.data.id,
    requestBody: { role: 'reader', type: 'anyone' },
  });

  return res.data;
}

/**
 * Upload from a URL (agents that receive an image URL from Firefly/DALL-E/Higgsfield).
 */
async function uploadFromUrl({ url, filename, mimeType, project, subfolder }) {
  const https = require('https');
  const http = require('http');
  const { Readable } = require('stream');

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

module.exports = { uploadFile, uploadFromUrl };
