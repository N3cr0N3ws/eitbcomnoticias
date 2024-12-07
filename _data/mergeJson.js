const fs = require('fs');
const path = require('path');
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
    return DEFAULT_IMAGE_URL; // Usar URL por defecto si hay un error
  }
};

// Función para validar y limpiar el JSON
const validateAndCleanJson = (data) => {
  return data.filter((article) => {
    if (article && typeof article === 'object' && article.titular) {
      return true; // Artículo válido
    }
    console.warn(`Artículo inválido encontrado y omitido: ${JSON.stringify(article)}`);
    return false; // Omitir artículos inválidos
  });
};

// Función para crear una copia de seguridad del archivo source.json
const backupSourceFile = (sourcePath) => {
  try {
    const backupDir = './_backup';
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir); // Crear la carpeta _backup si no existe
    }

    const timestamp = new Date().toISOString().replace(/[:T]/g, '-').split('.')[0]; // Formato: año-mes-día-hora
    const backupFileName = `source-${timestamp}.json`;
    const backupPath = path.join(backupDir, backupFileName);

    fs.copyFileSync(sourcePath, backupPath); // Crear la copia de seguridad
    console.log(`Copia de seguridad creada: ${backupPath}`);
  } catch (error) {
    console.error(`Error al crear la copia de seguridad: ${error.message}`);
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
    updateData.url_imagen = ogImage; // Actualizar con la URL obtenida o la por defecto

    // Guardar el JSON actualizado dentro de la carpeta _data
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
    // Crear copia de seguridad de source.json
    backupSourceFile(sourcePath);

    // Actualizar update.json con la imagen antes del merge
    const imageUpdated = await updateJsonWithImage(updatePath);
    if (!imageUpdated) {
      console.warn('No se pudo actualizar el JSON con la imagen. Proceso detenido.');
      return;
    }

    // Leer ambos JSON
    const sourceData = JSON.parse(fs.readFileSync(sourcePath, 'utf-8'));
    const updateData = JSON.parse(fs.readFileSync(updatePath, 'utf-8'));

    // Validar y limpiar los datos
    const validatedSourceData = validateAndCleanJson(sourceData);
    const validatedUpdateData = validateAndCleanJson([updateData]);

    if (validatedUpdateData.length === 0) {
      console.warn(`El archivo '${updatePath}' está vacío después de la validación. Proceso detenido.`);
      return;
    }

    // Realizar el merge
    const mergedData = [...validatedSourceData, ...validatedUpdateData];
    fs.writeFileSync(sourcePath, JSON.stringify(mergedData, null, 4), 'utf-8');
    console.log(`El merge entre '${updatePath}' y '${sourcePath}' se ha completado con éxito.`);

    // Limpiar el archivo de actualización dentro de la carpeta _data
    fs.writeFileSync(updatePath, JSON.stringify({}, null, 4), 'utf-8');
    console.log(`El archivo '${updatePath}' ha sido limpiado.`);
  } catch (error) {
    console.error(`Error al mergear los archivos JSON: ${error.message}`);
  }
};

// Rutas actualizadas para asegurar que se escriben en _data
mergeJsonFiles('./_data/source.json', './_data/update.json');
