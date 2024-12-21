const fs = require('fs');
const path = require('path');

// Configuración
const DOMAIN = 'https://eitbnoticias.com';
const UPDATED_JSON_PATH = path.join(__dirname, '_data', 'source.json'); // Ruta al JSON en main
const OUTPUT_SITEMAP_PATH = path.join(__dirname, 'sitemap.xml'); // Generar en la raíz de main

// Función para generar el sitemap
function generateSitemapFromUpdatedJSON() {
    try {
        const data = JSON.parse(fs.readFileSync(UPDATED_JSON_PATH, 'utf8'));
        const urls = [];

        // Construir URLs desde el JSON
        data.forEach(entry => {
            const slug = entry.slug || 'slug-no-disponible';
            const fecha = entry.fecha_publicacion || new Date().toISOString();

            urls.push({
                loc: `${DOMAIN}/${slug}`,
                lastmod: new Date(fecha).toISOString().split('T')[0],
                changefreq: 'yearly',
                priority: '1.0'
            });
        });

        // Generar contenido del sitemap
        const sitemapContent = `
        <?xml version="1.0" encoding="UTF-8"?>
        <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
            ${urls
                .map(
                    url => `
            <url>
                <loc>${url.loc}</loc>
                <lastmod>${url.lastmod}</lastmod>
                <changefreq>${url.changefreq}</changefreq>
                <priority>${url.priority}</priority>
            </url>`
                )
                .join('')}
        </urlset>
                `.trim();

                // Guardar el archivo sitemap.xml
                fs.writeFileSync(OUTPUT_SITEMAP_PATH, sitemapContent, 'utf8');
                console.log('Sitemap generado correctamente en la raíz:', OUTPUT_SITEMAP_PATH);
            } catch (error) {
                console.error('Error generando el sitemap:', error.message);
            }
    }

generateSitemapFromUpdatedJSON();