#!/usr/bin/env node

/**
 * Sitemap Generator for CheatDB
 * 
 * This script generates a sitemap.xml for all games in the Firestore database.
 * Run this after adding/removing games to keep your sitemap up to date.
 * 
 * Usage: node scripts/generate-sitemap.js
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin (set GOOGLE_APPLICATION_CREDENTIALS env var first)
// Or use service account JSON if running locally
const serviceAccount = require('../firebase-service-account.json'); // Optional

if (!process.env.GOOGLE_APPLICATION_CREDENTIALS && !serviceAccount) {
  console.error('Error: Please set GOOGLE_APPLICATION_CREDENTIALS environment variable or add firebase-service-account.json');
  process.exit(1);
}

// Initialize Firebase if not already done
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount || require(process.env.GOOGLE_APPLICATION_CREDENTIALS))
  });
}

const db = admin.firestore();
const APP_ID = 'cheatdb-games-v2';
const DOMAIN = 'https://cheatdb.org';

async function generateSitemap() {
  try {
    console.log('Generating sitemap...');
    
    // Fetch all games from Firestore
    const snapshot = await db
      .collection('artifacts')
      .doc(APP_ID)
      .collection('public')
      .doc('data')
      .collection('games')
      .orderBy('title')
      .get();

    if (snapshot.empty) {
      console.warn('Warning: No games found in database');
      return;
    }

    // Build XML
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    snapshot.forEach(doc => {
      const game = doc.data();
      const gameTitle = game.title ? game.title.replace(/\s+/g, '-').toLowerCase() : 'unknown';
      const lastMod = game.updatedAt ? new Date(game.updatedAt.toDate()).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
      
      xml += `  <url>\n`;
      xml += `    <loc>${DOMAIN}/game/${gameTitle}/${doc.id}</loc>\n`;
      xml += `    <lastmod>${lastMod}</lastmod>\n`;
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
    console.log(`📊 Total URLs: ${snapshot.size}`);
    
    // Also update main sitemap.xml with current date
    updateMainSitemap();
    
  } catch (error) {
    console.error('Error generating sitemap:', error);
    process.exit(1);
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
generateSitemap().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
