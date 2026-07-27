import type { VercelRequest, VercelResponse } from '@vercel/node';

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO_OWNER = 'Jinchainne';
const REPO_NAME = 'TheDailyCup';
const FILE_PATH = 'public/data/products.json';
const IMAGE_UPLOADS_DIR = 'public/uploads/products';

type PublishProduct = {
  id: string;
  image?: string;
  [key: string]: unknown;
};

function sanitizeName(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48) || 'product';
}

function parseDataUri(dataUri: string): { mime: string; content: string } | null {
  const match = dataUri.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return null;
  return { mime: match[1], content: match[2] };
}

function getExtensionFromMime(mime: string): string {
  if (mime === 'image/png') return 'png';
  if (mime === 'image/webp') return 'webp';
  if (mime === 'image/gif') return 'gif';
  return 'jpg';
}

async function githubJson(url: string, init?: RequestInit) {
  const resp = await fetch(url, {
    ...init,
    headers: {
      'Authorization': `token ${GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  });
  const data = await resp.json();
  return { resp, data };
}

async function fetchCurrentProductsFile() {
  const getUrl = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`;
  const { resp, data } = await githubJson(getUrl, { method: 'GET' });

  let sha: string | undefined;
  let productsById = new Map<string, { image?: string }>();

  if (resp.ok) {
    sha = data.sha;
    try {
      const decoded = Buffer.from(data.content, 'base64').toString('utf8');
      const parsed = JSON.parse(decoded);
      if (Array.isArray(parsed?.products)) {
        productsById = new Map(
          parsed.products.map((product: { id: string; image?: string }) => [product.id, product])
        );
      }
    } catch {
      // ignore parse errors and continue with empty map
    }
  }

  return { getUrl, sha, productsById };
}

async function uploadImageAsset(product: PublishProduct, updatedAt: string): Promise<string> {
  const rawImage = typeof product.image === 'string' ? product.image : '';
  const parsed = parseDataUri(rawImage);
  if (!parsed) return rawImage;

  const extension = getExtensionFromMime(parsed.mime);
  const stamp = updatedAt.replace(/[:.]/g, '-');
  const assetName = `${sanitizeName(product.id || 'product')}-${stamp}.${extension}`;
  const assetPath = `${IMAGE_UPLOADS_DIR}/${assetName}`;
  const assetUrl = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${assetPath}`;

  const uploadPayload = {
    message: `admin: upload image for ${product.id} - ${updatedAt}`,
    content: parsed.content,
  };

  const { resp, data } = await githubJson(assetUrl, {
    method: 'PUT',
    body: JSON.stringify(uploadPayload),
  });

  if (!resp.ok) {
    throw new Error(data.message || `Failed to upload image for ${product.id}`);
  }

  return `/uploads/products/${assetName}`;
}

async function updateProductsFile(
  getUrl: string,
  products: PublishProduct[],
  updatedAt: string,
  maxAttempts = 3
) {
  let lastError = 'Unknown GitHub API error';

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const { sha } = await fetchCurrentProductsFile();
    const content = JSON.stringify({
      version: '1.0',
      updatedAt,
      products,
    }, null, 2);

    const { resp, data } = await githubJson(getUrl, {
      method: 'PUT',
      body: JSON.stringify({
        message: `admin: update products (${products.length} items) - ${new Date().toISOString()}`,
        content: Buffer.from(content).toString('base64'),
        sha,
      }),
    });

    if (resp.ok) {
      return data;
    }

    lastError = data.message || 'GitHub API error';
    const shouldRetry =
      resp.status === 409 ||
      /expected/i.test(lastError) ||
      /sha/i.test(lastError);

    if (!shouldRetry || attempt === maxAttempts) {
      throw new Error(lastError);
    }

    await new Promise(resolve => setTimeout(resolve, 400 * attempt));
  }

  throw new Error(lastError);
}

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
    let { getUrl, sha, productsById: existingProductsById } = await fetchCurrentProductsFile();

    const normalizedProducts = await Promise.all(products.map(async (product: PublishProduct) => {
      const existing = existingProductsById.get(product.id);
      const image = typeof product.image === 'string' ? product.image : '';
      const shouldReuseExistingImage =
        !image ||
        image === '(uploaded-image-needs-url)' ||
        image.startsWith('data:') === false && image.startsWith('http') === false && image.startsWith('/') === false;

      let normalizedImage = image;

      if (image.startsWith('data:')) {
        normalizedImage = await uploadImageAsset(product, updatedAt);
      } else if (shouldReuseExistingImage) {
        normalizedImage = existing?.image || image || 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&h=400&fit=crop';
      }

      return {
        ...product,
        image: normalizedImage,
      };
    }));

    // Uploading image files creates repo commits, so fetch the latest products.json SHA again
    // before updating it to avoid "is at ... but expected ..." conflicts.
    ({ getUrl, sha } = await fetchCurrentProductsFile());

    const result = await updateProductsFile(getUrl, normalizedProducts, updatedAt);

    return res.status(200).json({
      success: true,
      message: `Published ${products.length} products. Vercel will auto-deploy in ~30 seconds.`,
      commit: result.commit?.sha?.slice(0, 7),
      updatedAt,
      products: normalizedProducts,
    });
  } catch (err) {
    return res.status(500).json({ error: (err as Error).message });
  }
}
