---
description: "Raul Sakai explica qué es el e-commerce headless y la PWA en Magento, cuándo conviene adoptarlos y cuánto cuestan en desarrollo, caché e infraestructura."
keyPoints:
  - "Para Raul Sakai, headless significa un front-end que corre totalmente separado del back-end y se comunica con él solo por APIs (REST o GraphQL), no necesariamente React con GraphQL."
  - "En Magento, el camino headless más conocido es PWA Studio con el Venia storefront; la PWA engloba el headless y suma funciones como service workers y uso offline."
  - "El consejo de Raul es no empezar nunca un proyecto Magento en headless si puede respetar la estructura de caché de Varnish (grupo de cliente, store view y URL)."
  - "Según él, migrar a PWA cuando la tienda ya se estabilizó cuesta menos que empezar el proyecto desde cero en PWA."
  - "Raul estima que un Magento sin Varnish gasta entre un 40% y un 60% más de infraestructura, y que un Varnish bien configurado llega a un 70% de cache hit."
  - "En Adobe Commerce Cloud, el deploy de un front headless es solo un paso más, que compila el front al final del proceso."
faq:
  - question: "¿Cuál es la diferencia entre headless y PWA en Magento?"
    answer: "Según Raul Sakai, headless es la arquitectura en la que el front-end corre separado del back-end y consume todo por API. La PWA engloba el headless y añade funciones de app, como instalar el sitio en el celular, service workers y mantener el carrito offline. En Magento esto se traduce en PWA Studio y el Venia storefront."
  - question: "¿Conviene empezar una tienda Magento directamente en headless?"
    answer: "Para Raul Sakai, casi nunca: si el proyecto puede respetar la caché de Magento, recomienda empezar con el monolito. Indica headless desde el inicio en dos casos: cuando sobran dinero y tiempo, o cuando el negocio necesita una caché más granular, como un catálogo B2B con precios calculados fuera de Magento."
  - question: "¿Headless hace más lento el desarrollo en Magento?"
    answer: "Según Raul Sakai, la lógica de back-end cambia poco, pero el tiempo aumenta: hay que crear schema y resolvers GraphQL, documentar para el front e implementar los componentes en Apollo. Las pruebas también se complican, porque el back-end solo valida datos de entrada y salida. Él ya sacó a un cliente de la PWA y lo devolvió al monolito por la velocidad de desarrollo."
  - question: "¿Headless en Magento es mejor para rendimiento y SEO?"
    answer: "Raul Sakai dice que el front headless es naturalmente más rápido porque imprime menos HTML, CSS y JavaScript, pero que APIs y resolvers mal hechos vuelven lenta la tienda. Sobre SEO, afirma que ya no es un problema si se siguen las buenas prácticas, porque Google ejecuta el JavaScript de las páginas."
  - question: "¿Los módulos de terceros de Magento funcionan en PWA Studio?"
    answer: "Depende del módulo, según Raul Sakai. Algunos ya traen GraphQL y componentes de Venia, pero igual hay que integrarlos en el layout; los que no soportan headless obligan a estudiar el módulo y escribir tus propios resolvers y endpoints GraphQL."
---
Raul Sakai, que da clases gratuitas de Magento en el servidor The IT Nerd, conversa con Jonatan Machado y Maria Ferro sobre **e-commerce headless** y PWA en Magento. Separa los conceptos: headless es un front-end que corre aparte del back-end y se comunica solo por API; la PWA, como PWA Studio con el Venia storefront, engloba eso y añade funciones de app. Técnicamente, dice, es mejor que el monolito, pero se paga en proceso: schema y resolvers GraphQL, componentes en Apollo, pruebas más difíciles y la necesidad de que back y front trabajen como un solo equipo.

Su recomendación es directa: si el proyecto puede respetar la caché de Varnish, hay que empezar con el monolito y migrar a PWA solo cuando la tienda esté estable, lo que sale más barato que nacer en PWA. Las excepciones son quienes tienen dinero y tiempo de sobra y quienes necesitan una caché más granular, como un catálogo B2B con precios calculados fuera de Magento. Raul también habla de rendimiento, SEO, Page Builder, actualizaciones major de PWA Studio, la caché de Apollo, costo de infraestructura y un proyecto en el que la búsqueda se conectó directo a un servicio externo, con una cola en RabbitMQ, y mostraba precios equivocados en el catálogo.

En lo personal, cuenta que empezó a programar a los 12 años, estudió diseño en São Paulo, trabajó en Dufry en Río de Janeiro y abrió la unidad de Magento de Infobase, donde el equipo hizo 198 sitios para Dufry en un año con un único código. Además describe los módulos abiertos que desarrolla en sus clases (Core, Brasil, rendimiento y UX) y deja un consejo: **los devs necesitan entender más de negocio**, no solo de tecnología.
