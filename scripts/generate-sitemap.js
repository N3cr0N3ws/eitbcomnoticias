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
        return new Date(); // Fecha por defecto
    }
}

// Función para generar el sitemap
function generateSitemapFromJSON() {
    try {
        // Leer el archivo JSON
        const data = JSON.parse(fs.readFileSync(UPDATED_JSON_PATH, 'utf8'));
        const urls = [];

        // Iterar sobre los datos del JSON
        data.forEach(entry => {
            // Busca el slug en el JSON
            const slug = entry.slug; // Ajusta esto si el slug tiene otro nombre en el JSON
            if (!slug) {
                console.warn(`Advertencia: Falta el slug para un artículo: ${JSON.stringify(entry)}`);
                return; // Salta esta entrada si no tiene slug
            }

            // Convierte la fecha de publicación
            const fechaPublicacion = entry.fecha_publicacion ? parseDate(entry.fecha_publicacion) : new Date();

            // Construir la URL
            urls.push({
                loc: `${DOMAIN}/pages/${slug}`, // Ajusta la ruta si es necesario
                lastmod: fechaPublicacion.toISOString().split('T')[0],
                changefreq: 'monthly',
                priority: '1.0'
            });
        });

        // Generar el contenido del sitemap
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

generateSitemapFromJSON();