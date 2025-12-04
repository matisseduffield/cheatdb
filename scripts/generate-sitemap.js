#!/usr/bin/env node

/**
 * Sitemap Generator for CheatDB (Web-based)
 * 
 * This script fetches games from your public Firestore database via the REST API
 * and generates a sitemap.xml. This avoids service account authentication issues.
 * 
 * Usage: node scripts/generate-sitemap.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const APP_ID = 'cheatdb-games-v2';
const PROJECT_ID = 'cheatsdatabase'; // Your Firebase project ID
const DOMAIN = 'https://cheatdb.org';

async function generateSitemap() {
  try {
    console.log('Generating sitemap from Firestore REST API...');
    
    // Fetch all games using Firestore REST API (no auth needed for public reads)
    const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/artifacts/${APP_ID}/public/data/games`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Firestore API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    const documents = data.documents || [];
    
    if (documents.length === 0) {
      console.warn('Warning: No games found in database');
      return;
    }

    // Sort by title
    documents.sort((a, b) => {
      const titleA = a.fields.title?.stringValue || '';
      const titleB = b.fields.title?.stringValue || '';
      return titleA.localeCompare(titleB);
    });

    // Build XML
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    documents.forEach(doc => {
      const fields = doc.fields || {};
      const gameTitle = fields.title?.stringValue 
        ? fields.title.stringValue.replace(/\s+/g, '-').toLowerCase() 
        : 'unknown';
      const gameId = doc.name.split('/').pop();
      const today = new Date().toISOString().split('T')[0];
      
      xml += `  <url>\n`;
      xml += `    <loc>${DOMAIN}/game/${gameTitle}/${gameId}</loc>\n`;
      xml += `    <lastmod>${today}</lastmod>\n`;
      xml += `    <changefreq>weekly</changefreq>\n`;
      xml += `    <priority>0.8</priority>\n`;
      xml += `  </url>\n`;
    });

    xml += '</urlset>';

    // Write to public folder (served by Vite/Cloudflare)
    const outputPath = path.join(__dirname, '../public/sitemap-games.xml');
    fs.writeFileSync(outputPath, xml);
    
    console.log(`✅ Sitemap generated successfully!`);
    console.log(`📁 Saved to: ${outputPath}`);
    console.log(`📊 Total URLs: ${documents.length}`);
    
    // Also update main sitemap.xml with current date
    updateMainSitemap();
    
  } catch (error) {
    console.error('Error generating sitemap:', error.message);
    globalThis.process.exit(1);
  }
}

function updateMainSitemap() {
  const today = new Date().toISOString().split('T')[0];
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  xml += `  <url>\n`;
  xml += `    <loc>https://cheatdb.org</loc>\n`;
  xml += `    <lastmod>${today}</lastmod>\n`;
  xml += `    <changefreq>daily</changefreq>\n`;
  xml += `    <priority>1.0</priority>\n`;
  xml += `  </url>\n`;
  xml += `  <url>\n`;
  xml += `    <loc>https://cheatdb.org/sitemap-games.xml</loc>\n`;
  xml += `    <lastmod>${today}</lastmod>\n`;
  xml += `  </url>\n`;
  xml += '</urlset>';

  const outputPath = path.join(__dirname, '../public/sitemap.xml');
  fs.writeFileSync(outputPath, xml);
}

// Run the generator
generateSitemap().then(() => globalThis.process.exit(0)).catch(err => {
  console.error(err);
  globalThis.process.exit(1);
});
