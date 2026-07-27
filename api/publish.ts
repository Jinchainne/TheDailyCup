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
    let existingProductsById = new Map<string, { image?: string }>();
    if (getResp.ok) {
      const fileData = await getResp.json();
      sha = fileData.sha;
      try {
        const decoded = Buffer.from(fileData.content, 'base64').toString('utf8');
        const parsed = JSON.parse(decoded);
        if (Array.isArray(parsed?.products)) {
          existingProductsById = new Map(
            parsed.products.map((product: { id: string; image?: string }) => [product.id, product])
          );
        }
      } catch {
        // keep publishing even if the previous file cannot be parsed
      }
    }

    const normalizedProducts = products.map((product: { id: string; image?: string; [key: string]: unknown }) => {
      const existing = existingProductsById.get(product.id);
      const image = typeof product.image === 'string' ? product.image : '';
      const shouldReuseExistingImage =
        !image ||
        image === '(uploaded-image-needs-url)' ||
        image.startsWith('data:');

      return {
        ...product,
        image: shouldReuseExistingImage
          ? existing?.image || image || 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&h=400&fit=crop'
          : image,
      };
    });

    // Prepare the JSON content
    const content = JSON.stringify({
      version: '1.0',
      updatedAt,
      products: normalizedProducts,
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
