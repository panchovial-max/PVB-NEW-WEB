const { uploadFile, uploadFromUrl } = require('../lib/google-drive');
const { Readable } = require('stream');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const authHeader = req.headers['authorization'];
  if (authHeader !== `Bearer ${process.env.PVB_ADMIN_KEY}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { url, base64, filename, mimeType, project, subfolder } = req.body;

    if (!filename || !mimeType) {
      return res.status(400).json({ error: 'filename and mimeType are required' });
    }

    let file;

    if (url) {
      // Agent passes a URL (Firefly, DALL-E, Higgsfield, etc.)
      file = await uploadFromUrl({ url, filename, mimeType, project, subfolder });
    } else if (base64) {
      // Agent passes base64-encoded content
      const content = Readable.from(Buffer.from(base64, 'base64'));
      file = await uploadFile({ content, filename, mimeType, project, subfolder });
    } else {
      return res.status(400).json({ error: 'Provide either url or base64' });
    }

    res.status(200).json({
      id: file.id,
      name: file.name,
      viewUrl: file.webViewLink,
      downloadUrl: file.webContentLink,
    });
  } catch (err) {
    console.error('[drive-upload]', err.message);
    res.status(500).json({ error: err.message });
  }
};
