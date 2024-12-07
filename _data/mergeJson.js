const fs = require('fs');
const axios = require('axios');
const cheerio = require('cheerio');

// URL por defecto en caso de que no se encuentre la imagen
const DEFAULT_IMAGE_URL = 'https://picsum.photos/800/900';

// Función para obtener la imagen desde el meta og:image
const fetchOgImage = async (url) => {
  try {
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);
    const ogImage = $('meta[property="og:image"]').attr('content');
    if (!ogImage) {
      throw new Error('No se encontró la etiqueta og:image en la URL proporcionada.');
    }
    return ogImage;
  } catch (error) {
    console.error(`Error al obtener la imagen desde ${url}: ${error.message}`);
    return null; // Devolvemos null para manejarlo después
  }
};

// Función para validar y limpiar el JSON
const validateAndCleanJson = (data) => {
  return data.filter((article) => {
    if (article && typeof article === 'object' && article.titular) {
      return true; // El artículo es válido si contiene el campo 'titular'
    }
    console.warn(`Artículo inválido encontrado y omitido: ${JSON.stringify(article)}`);
    return false; // Omite artículos inválidos
  });
};

// Función para actualizar el JSON con la imagen desde la canonical
const updateJsonWithImage = async (updatePath) => {
  try {
    const updateData = JSON.parse(fs.readFileSync(updatePath, 'utf-8'));

    // Verificar si contiene la URL canonical
    if (!updateData.url_canonical) {
      console.log(`El archivo '${updatePath}' no contiene una URL canonical. Proceso detenido.`);
      return;
    }

    // Intentar obtener la URL de la imagen desde la canonical
    const ogImage = await fetchOgImage(updateData.url_canonical);
    if (ogImage) {
      updateData.url_imagen = ogImage; // Usar la URL obtenida
      console.log(`Imagen obtenida correctamente: ${ogImage}`);
    } else {
      updateData.url_imagen = DEFAULT_IMAGE_URL; // Usar la URL por defecto
      console.log(`Fallo al obtener la imagen. Se usará la URL por defecto: ${DEFAULT_IMAGE_URL}`);
    }

    // Guardar el JSON actualizado
    fs.writeFileSync(updatePath, JSON.stringify(updateData, null, 4), 'utf-8');
    console.log(`La URL de la imagen fue actualizada en '${updatePath}'.`);
  } catch (error) {
    console.error(`Error al actualizar el archivo JSON con la imagen: ${error.message}`);
  }
};

// Función para fusionar los JSON
const mergeJsonFiles = async (sourcePath, updatePath) => {
  try {
    // Actualizar update.json con la imagen antes del merge
    await updateJsonWithImage(updatePath);

    // Leer ambos JSON
    const sourceData = JSON.parse(fs.readFileSync(sourcePath, 'utf-8'));
    const updateData = JSON.parse(fs.readFileSync(updatePath, 'utf-8'));

    // Validar y limpiar los datos
    const validatedSourceData = validateAndCleanJson(sourceData);
    const validatedUpdateData = validateAndCleanJson(updateData);

    // Verificar si update.json está vacío
    if (validatedUpdateData.length === 0) {
      console.log(`El archivo '${updatePath}' está vacío después de la validación. Proceso detenido.`);
      return;
    }

    // Realizar el merge
    const mergedData = [...validatedSourceData, ...validatedUpdateData];

    // Guardar el archivo mergeado
    fs.writeFileSync(sourcePath, JSON.stringify(mergedData, null, 4), 'utf-8');

    // Limpiar el archivo de actualización
    fs.writeFileSync(updatePath, JSON.stringify({}, null, 4), 'utf-8');

    console.log(`El merge entre '${updatePath}' y '${sourcePath}' se ha completado con éxito.`);
  } catch (error) {
    console.error(`Error al mergear los archivos JSON: ${error.message}`);
  }
};

// Ejecutar el proceso de merge con las rutas correctas
mergeJsonFiles('./_data/source.json', './_data/update.json');
