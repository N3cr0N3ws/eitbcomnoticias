const fs = require('fs');
const path = require('path');
const { parse } = require('date-fns');
const { es } = require('date-fns/locale');

// Configuración
const DOMAIN = 'https://eitbnoticias.com';
const UPDATED_JSON_PATH = path.join(__dirname, '..', '_data', 'source.json'); // JSON de entrada
const OUTPUT_SITEMAP_PATH = path.join(__dirname, '..', 'sitemap.xml'); // Salida del sitemap

// Función para generar slugs de forma consistente con Jekyll
function slugify(string) {
    if (!string || string.trim() === '') return 'sin-titulo';
    return string
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-') // Reemplazar espacios por guiones
        .replace(/[^\w-]+/g, ''); // Eliminar caracteres no permitidos
}

// Función para convertir fechas
function parseDate(fecha) {
    try {
        return parse(fecha, 'd \'de\' MMMM \'de\' yyyy', new Date(), { locale: es });
    } catch (e) {
        console.error(`Error al parsear la fecha: ${fecha}`);
        return new Date(); // Fecha por defecto si no es válida
    }
}

// Función para generar el sitemap
function generateSitemapFromUpdatedJSON() {
    try {
        // Leer el archivo JSON
        const data = JSON.parse(fs.readFileSync(UPDATED_JSON_PATH, 'utf8'));
        const urls = [];

        // Iterar sobre los datos del JSON
        data.forEach(entry => {
            // Crear el slug desde el titular
            const slug = slugify(entry.titular);
            if (!slug) {
                console.warn(`Advertencia: No se pudo generar un slug para el artículo: ${JSON.stringify(entry)}`);
                return; // Ignora artículos sin slug válido
            }

            // Convertir la fecha de publicación
            const fechaPublicacion = entry.fecha_publicacion ? parseDate(entry.fecha_publicacion) : new Date();

            // Construir la URL
            urls.push({
                loc: `${DOMAIN}/pages/${slug}`, // URL basada en el slug
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

generateSitemapFromUpdatedJSON();
