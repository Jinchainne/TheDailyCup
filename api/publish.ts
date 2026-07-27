import type { VercelRequest, VercelResponse } from '@vercel/node';

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO_OWNER = 'Jinchainne';
const REPO_NAME = 'TheDailyCup';
const FILE_PATH = 'public/data/products.json';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!GITHUB_TOKEN) {
    return res.status(500).json({ error: 'GitHub token not configured' });
  }

  const { products } = req.body || {};
  if (!products || !Array.isArray(products)) {
    return res.status(400).json({ error: 'Products array required' });
  }

  try {
    const updatedAt = new Date().toISOString();
    // Get current file SHA (needed for update)
    const getUrl = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`;
    const getResp = await fetch(getUrl, {
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    });

    let sha: string | undefined;
    if (getResp.ok) {
      const fileData = await getResp.json();
      sha = fileData.sha;
    }

    // Prepare the JSON content
    const content = JSON.stringify({
      version: '1.0',
      updatedAt,
      products: products,
    }, null, 2);

    // Commit the file
    const putResp = await fetch(getUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: `admin: update products (${products.length} items) - ${new Date().toISOString()}`,
        content: Buffer.from(content).toString('base64'),
        sha,
      }),
    });

    if (!putResp.ok) {
      const err = await putResp.json();
      return res.status(putResp.status).json({ error: err.message || 'GitHub API error' });
    }

    const result = await putResp.json();
    return res.status(200).json({
      success: true,
      message: `Published ${products.length} products. Vercel will auto-deploy in ~30 seconds.`,
      commit: result.commit?.sha?.slice(0, 7),
      updatedAt,
    });
  } catch (err) {
    return res.status(500).json({ error: (err as Error).message });
  }
}
