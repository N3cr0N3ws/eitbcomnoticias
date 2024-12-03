module Jekyll
  class PageGenerator < Generator
    safe true

    def generate(site)
      # Leer los datos desde source.json
      articles = site.data['source']

      # Validar si hay datos
      if articles.nil?
        Jekyll.logger.warn "PageGenerator:", "No data found in '_data/source.json'. Skipping page generation."
        return
      end

      # Generar una página para cada artículo
      articles.each do |article|
        slug = slugify(article['titular']) # Generar un slug a partir del título
        site.pages << DataPage.new(site, site.source, article, slug)
      end
    end

    # Función para generar slugs
    def slugify(string)
      # Manejar casos donde el título sea nil o vacío
      return "sin-titulo" if string.nil? || string.strip.empty?

      # Generar el slug normalizado
      string.downcase.strip.gsub(' ', '-').gsub(/[^\w-]/, '')
    end
  end

  # Clase para crear las páginas
  class DataPage < Page
    def initialize(site, base, article, slug)
      @site = site
      @base = base
      @dir = "pages" # Directorio donde se guardarán las páginas
      @name = "#{slug}.html" # Nombre del archivo basado en el slug

      self.process(@name)
      self.data ||= {}

      # Metadatos
      self.data['layout'] = "page" # Layout que usará `page.html`
      self.data['slug'] = slug # Agregar el slug para que esté disponible en el layout
      self.data['titular'] = article['titular'] || "Sin título" # Titular del artículo o valor por defecto
      self.data['categoria_emocional'] = article['categoria_emocional'] || "Sin categoría emocional" # Categoría emocional
      self.data['date'] = article['fecha_publicacion'] || "Fecha no disponible" # Fecha de publicación
      self.data['url_canonical'] = article['url_canonical'] || "" # URL canonical
      self.data['url_imagen'] = article['url_imagen'] || "" # URL imagen noticia
      self.data['resumen'] = article['resumen'] || "Sin resumen disponible" # Resumen breve del artículo
      self.data['contexto'] = article['contexto'] || "Sin contexto disponible" # Contexto general
      self.data['linea_tiempo'] = article['linea_tiempo'] || [] # Línea de tiempo
      self.data['quien_es_quien'] = article['quien_es_quien'] || [] # Quien es quien
      self.data['glosario_terminos'] = article['glosario_terminos'] || [] # Glosario terminos
      self.data['impacto_esperado'] = article['impacto_esperado'] || [] # Impacto esperado
    end
  end
end