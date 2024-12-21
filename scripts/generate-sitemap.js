const fs = require('fs');
const path = require('path');
const { parse } = require('date-fns');
const { es } = require('date-fns/locale');

// Configuración
const DOMAIN = 'https://eitbnoticias.com';
const UPDATED_JSON_PATH = path.join(__dirname, '..', '_data', 'source.json');
const OUTPUT_SITEMAP_PATH = path.join(__dirname, '..', 'sitemap.xml');

// Función para convertir fechas
function parseDate(fecha) {
    try {
        return parse(fecha, 'd \'de\' MMMM \'de\' yyyy', new Date(), { locale: es });
    } catch (e) {
        console.error(`Error al parsear la fecha: ${fecha}`);
        return null;
    }
}

// Función para generar el sitemap
function generateSitemapFromUpdatedJSON() {
    try {
        const data = JSON.parse(fs.readFileSync(UPDATED_JSON_PATH, 'utf8'));
        const urls = [];

        // Construir URLs desde el JSON
        data.forEach(entry => {
            const slug = entry.slug || 'slug-no-disponible';
            const fecha = parseDate(entry.fecha_publicacion) || new Date();

            urls.push({
                loc: `${DOMAIN}/${slug}`,
                lastmod: fecha.toISOString().split('T')[0],
                changefreq: 'monthly',
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