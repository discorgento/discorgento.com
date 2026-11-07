---
description: "Thiago Marquesini habla de los desafíos del e-commerce con Magento: escalabilidad, LGPD, SEO, código legado y el paso de frameworks PHP a Magento 2."
keyPoints:
  - "Entre 2015 y 2016, Thiago desaconsejó Magento 2 a una industria de productos de prótesis dental con presupuesto limitado y sin equipo de TI, y el proyecto se hizo en Loja Integrada."
  - "Para Ivan Augusto, el mayor desafío técnico del e-commerce es la escalabilidad, como evitar consultas N+1 al cargar el model de cada producto en un bucle del catálogo."
  - "Thiago aplica el principio de Pareto a los requerimientos: recortar parte de las reglas de negocio pedidas suele mantener el valor y reducir mucho el esfuerzo."
  - "A Thiago el XML de Magento le pareció burocrático al principio, pero elogia los plugins (before, after y around) porque permiten modificar clases sin tocar código de terceros, y dice que Knockout es difícil de depurar."
  - "En un proyecto para una institución nacional con una tienda por estado, Magento concentraba unas 78 integraciones."
  - "Thiago recomienda conocer los límites del lenguaje, como los números muy grandes en PHP y 0.1 + 0.2 en JavaScript, y menciona HackerRank como la herramienta que lo ayudó con eso."
faq:
  - question: "¿Cuál es el mayor desafío de un e-commerce en Magento?"
    answer: "Para Ivan Augusto, es la escalabilidad: sin algunas reglas básicas el código se vuelve un espagueti, como con las consultas N+1 al cargar productos uno por uno. Thiago Marquesini agrega que el volumen de producción es mucho mayor que el de las pruebas locales, así que no siempre se pueden usar models y hay que cuidar el rendimiento, la memoria y los patrones de diseño."
  - question: "¿Conviene usar Magento o un framework PHP como Laravel para e-commerce?"
    answer: "Según Thiago Marquesini, Magento está totalmente enfocado en e-commerce y ya trae una estructura para extender funcionalidades y escalar, por ejemplo con Varnish y Elasticsearch. En un framework como Laravel, la caché, la escala y la arquitectura hay que implementarlas a mano. En cambio, señala que los desarrolladores Magento son más difíciles de encontrar y más caros, lo que eleva el costo total de propiedad."
  - question: "¿Se puede actualizar de Magento 1 a Magento 2?"
    answer: "En el episodio, los anfitriones explican que no hay una actualización directa de Magento 1 a 2: hay que instalar una tienda nueva e importar los datos. Muchos conceptos de Magento 1, como los eventos y los atributos, se aprovechan, pero prácticamente solo se reutiliza la base de datos."
  - question: "¿Cómo afecta la LGPD de Brasil a los proyectos de e-commerce?"
    answer: "Thiago Marquesini cuenta que en los proyectos en los que participa la LGPD todavía se toma con poca preocupación, porque la ley tuvo un plazo de adaptación largo. Él cree que en uno o dos años se convertirá en una preocupación constante y empezará a afectar la operación de las tiendas, como ya ocurre en Europa."
  - question: "¿Cómo maneja Thiago Marquesini la ansiedad trabajando en tecnología?"
    answer: "Cuenta que la terapia lo ayudó a controlar la ansiedad, que es transparente con su equipo y el Scrum Master sobre lo que puede entregar y que intenta mantener un horario para empezar y terminar de trabajar. También dice que deportes como el jiu-jitsu lo ayudan a mantener la calma en situaciones incómodas."
---
En el séptimo episodio, Jonatan Machado, Maria Ferro e Ivan Augusto reciben a Thiago Marquesini, que trabaja como desarrollador y tiene varios años en TI, más recientemente en el mundo Magento. Su primer contacto con la plataforma fue entre 2015 y 2016, cuando desaconsejó el recién lanzado Magento 2 a una industria de prótesis dental y terminó personalizando una tienda en Loja Integrada con JavaScript en el pie de página. La experiencia más profunda llegó en una empresa en plena transformación digital, donde acompañó a la agencia asociada y armó un equipo interno de desarrollo.

Sobre los **desafíos del e-commerce**, Ivan señala la escalabilidad, y Thiago habla de equilibrar lo que quiere el negocio con el esfuerzo, usando el principio de Pareto y el MVP. La conversación pasa por la seguridad de datos y la LGPD, la accesibilidad (incluido un cliente canadiense que fue multado y un índice de accesibilidad exigido por el gobierno brasileño) y el SEO, con la mención de una charla del Meet Magento sobre cómo las reseñas de usuarios cuentan para el posicionamiento.

Thiago compara Magento con CodeIgniter, Laravel, Symfony, Slim y Phalcon: elogia los plugins y la organización, critica lo difícil que es depurar Knockout y defiende el perfil más conservador de la plataforma, citando el costo total de propiedad. También recuerda un proyecto con unas 78 integraciones, un checkout cuyo cálculo de sustitución tributaria estaba en dos archivos phtml de unas mil líneas cada uno, un sistema de exámenes en línea usado por 900 alumnos a la vez y una biblioteca en PHP que analizaba fotos de pasto por su promedio de RGB. Cierra hablando de ansiedad, terapia, jiu-jitsu y del consejo que le daría a su yo del pasado: **arriesgarse más**.
