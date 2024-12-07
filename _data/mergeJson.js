const fs = require('fs');
const axios = require('axios');
const cheerio = require('cheerio');

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
    return null;
  }
};

const updateJsonWithImage = async (updatePath) => {
  try {
    // Leer el archivo update.json
    const updateData = JSON.parse(fs.readFileSync(updatePath, 'utf-8'));

    // Verificar si contiene la URL canonical
    if (!updateData.url_canonical) {
      console.log(`El archivo '${updatePath}' no contiene una URL canonical. Proceso detenido.`);
      return;
    }

    // Obtener la URL de la imagen desde la canonical
    const ogImage = await fetchOgImage(updateData.url_canonical);
    if (ogImage) {
      // Actualizar el campo url_imagen en update.json
      updateData.url_imagen = ogImage;
      fs.writeFileSync(updatePath, JSON.stringify(updateData, null, 4), 'utf-8');
      console.log(`La URL de la imagen fue actualizada en '${updatePath}'.`);
    } else {
      console.log('No se pudo actualizar la URL de la imagen.');
    }
  } catch (error) {
    console.error(`Error al actualizar el archivo JSON con la imagen: ${error.message}`);
  }
};

const mergeJsonFiles = async (sourcePath, updatePath) => {
  try {
    // Actualizar update.json con la imagen antes del merge
    await updateJsonWithImage(updatePath);

    // Leer los datos de ambos archivos
    const sourceData = JSON.parse(fs.readFileSync(sourcePath, 'utf-8'));
    const updateData = JSON.parse(fs.readFileSync(updatePath, 'utf-8'));

    // Verificar si update.json está vacío
    const isUpdateEmpty =
      (Array.isArray(updateData) && updateData.length === 0) ||
      (typeof updateData === 'object' && Object.keys(updateData).length === 0);

    if (isUpdateEmpty) {
      console.log(`El archivo '${updatePath}' está vacío. Proceso detenido.`);
      return;
    }

    // Realizar el merge
    let mergedData;
    if (Array.isArray(sourceData) && Array.isArray(updateData)) {
      mergedData = [...sourceData, ...updateData];
    } else if (typeof sourceData === 'object' && typeof updateData === 'object') {
      mergedData = { ...sourceData, ...updateData };
    } else {
      throw new Error('Los archivos JSON deben ser del mismo tipo (array o objeto).');
    }

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
