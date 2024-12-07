const fs = require('fs');
const path = require('path');
const axios = require('axios');
const cheerio = require('cheerio');

// URL por defecto en caso de que no se encuentre la imagen
const DEFAULT_IMAGE_URL = 'https://picsum.photos/800/900';

// Función para obtener la imagen desde el meta og:image
const fetchOgImage = async (url) => {
  try {
    console.log(`Intentando obtener la imagen desde: ${url}`);
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);
    const ogImage = $('meta[property="og:image"]').attr('content');
    if (!ogImage) {
      console.warn(`No se encontró la etiqueta og:image en la URL: ${url}`);
      return DEFAULT_IMAGE_URL;
    }
    console.log(`Imagen obtenida: ${ogImage}`);
    return ogImage;
  } catch (error) {
    console.error(`Error al obtener la imagen desde ${url}: ${error.message}`);
    return DEFAULT_IMAGE_URL;
  }
};

// Función para validar y limpiar el JSON
const validateAndCleanJson = (data) => {
  return data.filter((article) => {
    if (article && typeof article === 'object' && article.titular) {
      return true;
    }
    console.warn(`Artículo inválido encontrado y omitido: ${JSON.stringify(article)}`);
    return false;
  });
};

// Función para crear una copia de seguridad del archivo source.json
const backupSourceFile = (sourcePath) => {
  try {
    const backupDir = './_backup';
    const timestamp = new Date().toISOString().replace(/[:T]/g, '-').split('.')[0];
    const backupFileName = `source-${timestamp}.json`;
    const backupPath = path.join(backupDir, backupFileName);

    fs.copyFileSync(sourcePath, backupPath);
    console.log(`Copia de seguridad creada en: ${backupPath}`);
    return true;
  } catch (error) {
    console.error(`Error al crear la copia de seguridad: ${error.message}`);
    return false;
  }
};

// Función para actualizar el JSON con la imagen desde la canonical
const updateJsonWithImage = async (updatePath) => {
  try {
    const updateData = JSON.parse(fs.readFileSync(updatePath, 'utf-8'));

    if (!updateData.url_canonical) {
      console.warn(`El archivo '${updatePath}' no contiene una URL canonical. Proceso detenido.`);
      return false;
    }

    const ogImage = await fetchOgImage(updateData.url_canonical);
    updateData.url_imagen = ogImage;

    fs.writeFileSync(updatePath, JSON.stringify(updateData, null, 4), 'utf-8');
    console.log(`La URL de la imagen fue actualizada en '${updatePath}'.`);
    return true;
  } catch (error) {
    console.error(`Error al actualizar el archivo JSON con la imagen: ${error.message}`);
    return false;
  }
};

// Función para fusionar los JSON
const mergeJsonFiles = async (sourcePath, updatePath) => {
  try {
    console.log('Iniciando el proceso de merge...');

    const backupSuccess = backupSourceFile(sourcePath);
    if (!backupSuccess) {
      console.error('No se pudo crear la copia de seguridad. Proceso detenido.');
      return;
    }

    const imageUpdated = await updateJsonWithImage(updatePath);
    if (!imageUpdated) {
      console.warn('No se pudo actualizar el JSON con la imagen. Proceso detenido.');
      return;
    }

    const sourceData = JSON.parse(fs.readFileSync(sourcePath, 'utf-8'));
    const updateData = JSON.parse(fs.readFileSync(updatePath, 'utf-8'));

    const validatedSourceData = validateAndCleanJson(sourceData);
    const validatedUpdateData = validateAndCleanJson([updateData]);

    if (validatedUpdateData.length === 0) {
      console.warn(`El archivo '${updatePath}' está vacío después de la validación. Proceso detenido.`);
      return;
    }

    const mergedData = [...validatedSourceData, ...validatedUpdateData];
    fs.writeFileSync(sourcePath, JSON.stringify(mergedData, null, 4), 'utf-8');
    console.log(`El merge entre '${updatePath}' y '${sourcePath}' se ha completado con éxito.`);

    fs.writeFileSync(updatePath, JSON.stringify({}, null, 4), 'utf-8');
    console.log(`El archivo '${updatePath}' ha sido limpiado.`);
  } catch (error) {
    console.error(`Error al mergear los archivos JSON: ${error.message}`);
  }
};

// Ejecutar el proceso
mergeJsonFiles('./_data/source.json', './_data/update.json');