const fs = require('fs');
const path = require('path');
const axios = require('axios');
const cheerio = require('cheerio');

const DEFAULT_IMAGE_URL = 'https://picsum.photos/800/900';

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

const backupSourceFile = (sourcePath) => {
  try {
    console.log(`[BACKUP] Iniciando copia de seguridad de: ${sourcePath}`);
    const backupDir = path.resolve(__dirname, '_backup');
    console.log(`[BACKUP] Carpeta de destino: ${backupDir}`);

    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
      console.log('[BACKUP] Carpeta creada.');
    }

    const timestamp = new Date().toISOString().replace(/[:T]/g, '-').split('.')[0];
    const backupFileName = `source-${timestamp}.json`;
    const backupPath = path.join(backupDir, backupFileName);

    fs.copyFileSync(sourcePath, backupPath);
    console.log(`[BACKUP] Copia de seguridad completada: ${backupPath}`);
    return true;
  } catch (error) {
    console.error(`[BACKUP] Error al crear la copia de seguridad: ${error.message}`);
    return false;
  }
};

const mergeJsonFiles = (sourcePath, updatePath) => {
  try {
    console.log('[MERGE] Iniciando fusión...');
    console.log(`[MERGE] Archivo fuente: ${sourcePath}`);
    console.log(`[MERGE] Archivo de actualización: ${updatePath}`);

    const sourceData = JSON.parse(fs.readFileSync(sourcePath, 'utf-8'));
    const updateData = JSON.parse(fs.readFileSync(updatePath, 'utf-8'));

    if (!Object.keys(updateData).length) {
      console.warn('[MERGE] El archivo update.json está vacío. Proceso detenido.');
      return;
    }

    const mergedData = [...sourceData, updateData];
    console.log(`[MERGE] Datos fusionados: ${JSON.stringify(mergedData, null, 2)}`);

    fs.writeFileSync(sourcePath, JSON.stringify(mergedData, null, 4), 'utf-8');
    console.log(`[MERGE] Fusión completada. Archivo actualizado: ${sourcePath}`);

    fs.writeFileSync(updatePath, JSON.stringify({}, null, 4), 'utf-8');
    console.log(`[MERGE] Archivo de actualización limpiado: ${updatePath}`);
  } catch (error) {
    console.error(`[MERGE] Error durante la fusión: ${error.message}`);
  }
};

const main = async () => {
  const sourcePath = path.resolve(__dirname, '_data/source.json');
  const updatePath = path.resolve(__dirname, '_data/update.json');

  console.log(`[MAIN] Archivo fuente: ${sourcePath}`);
  console.log(`[MAIN] Archivo de actualización: ${updatePath}`);

  const task = process.argv[2];
  console.log(`[MAIN] Tarea seleccionada: ${task}`);

  switch (task) {
    case 'extract-og-image':
      await updateJsonWithImage(updatePath);
      break;
    case 'backup':
      backupSourceFile(sourcePath);
      break;
    case 'merge':
      mergeJsonFiles(sourcePath, updatePath);
      break;
    default:
      console.error('[MAIN] Tarea no reconocida. Usa "extract-og-image", "backup" o "merge".');
  }
};

main();
