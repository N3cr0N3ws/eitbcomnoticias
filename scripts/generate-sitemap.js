const fs = require('fs');
const path = require('path');
const { parse } = require('date-fns');
const { es } = require('date-fns/locale');

// Configuración
const DOMAIN = 'https://eitbnoticias.com';
const PAGES_DIR = path.join(__dirname, '..', '_site', 'page');
const OUTPUT_SITEMAP_PATH = path.join(__dirname, '..', 'sitemap.xml');

// Función para convertir fechas
function parseDate(fecha) {
    try {
        return parse(fecha, 'd \'de\' MMMM \'de\' yyyy', new Date(), { locale: es });
    } catch (e) {
        console.error(`Error al parsear la fecha: ${fecha}`);
        return new Date(); // Fecha por defecto
    }
}

// Función para generar el sitemap
function generateSitemap() {
    try {
        const urls = [];

        // Leer todos los archivos dentro de `_site/page`
        const files = fs.readdirSync(PAGES_DIR);

        files.forEach(file => {
            const filePath = path.join(PAGES_DIR, file);

            // Verifica que sea un archivo HTML
            if (fs.statSync(filePath).isFile() && file.endsWith('.html')) {
                const slug = file.replace('.html', ''); // Remueve la extensión
                const fechaPublicacion = new Date(); // Puedes ajustar esto si tienes fechas asociadas

                urls.push({
                    loc: `${DOMAIN}/page/${slug}`,
                    lastmod: fechaPublicacion.toISOString().split('T')[0],
                    changefreq: 'monthly',
                    priority: '1.0'
                });
            }
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

generateSitemap();